import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepButton,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  Bot,
  Calculator,
  FileSpreadsheet,
  FolderDown,
  Plus,
  Send,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nowIso, uid, useStore } from '@/app/store';
import { Dropzone } from '@/components/common/Dropzone';
import { Term } from '@/components/common/Term';
import { downloadText, num } from '@/lib/format';
import { PositionsEditor } from '@/pages/tools/PositionsEditor';
import {
  RATES,
  SAMPLE_POSITIONS,
  calculate,
  emptyCosts,
  type CalcState,
  type Costs,
  type Position,
} from '@/pages/tools/calcModel';

const KEY = 'incustoms-calc';
export const CALC_IMPORT_KEY = 'incustoms-calc-import';

function loadCalc(): CalcState {
  try {
    const imported = sessionStorage.getItem(CALC_IMPORT_KEY);
    if (imported) {
      sessionStorage.removeItem(CALC_IMPORT_KEY);
      const positions = JSON.parse(imported) as Position[];
      return {
        docType: 'invoice',
        currency: 'USD',
        fileName: 'OCR → Excel',
        positions,
        costs: { ...emptyCosts },
        step: 0,
      };
    }
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as CalcState;
  } catch {
    /* storage unavailable */
  }
  return { docType: 'invoice', currency: 'USD', positions: [], costs: { ...emptyCosts }, step: 0 };
}

const COST_FIELDS: { key: keyof Costs; label: string; tip: string; pct?: boolean }[] = [
  {
    key: 'freight',
    label: 'Фрахт до границы',
    tip: 'Входит в таможенную стоимость и облагается платежами',
  },
  { key: 'insurance', label: 'Страхование', tip: 'Входит в таможенную стоимость' },
  {
    key: 'broker',
    label: 'Брокер',
    tip: 'Услуги декларанта — в себестоимость, но не в таможенную стоимость',
  },
  { key: 'storage', label: 'СВХ / хранение', tip: 'Склад временного хранения' },
  {
    key: 'certification',
    label: 'Сертификация',
    tip: 'Сертификаты соответствия и разрешительные документы',
  },
  { key: 'delivery', label: 'Доставка по РУз', tip: 'Доставка после выпуска товара' },
  { key: 'other', label: 'Прочие', tip: 'Любые другие расходы по сделке' },
  { key: 'bankPct', label: 'Банковская комиссия', tip: 'Процент от стоимости товаров', pct: true },
  {
    key: 'financePct',
    label: 'Финансирование',
    tip: 'Стоимость денег (кредит, отсрочка), % от стоимости товаров',
    pct: true,
  },
];

export function DealCalculator() {
  const { update, toast } = useStore();
  const nav = useNavigate();
  const [s, setS] = useState<CalcState>(loadCalc);
  const [extracting, setExtracting] = useState(0);
  const res = useMemo(() => calculate(s), [s]);
  const cur = s.currency;
  const uzs = (n: number) => `${num(n * RATES[cur], 0)} сум`;
  const valid = s.positions.filter((p) => p.qty > 0 && p.unitPrice > 0);
  const unknownHs = res.lines.filter((l) => !l.hsKnown).length;

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable */
    }
  }, [s]);

  const set = (patch: Partial<CalcState>) => setS((v) => ({ ...v, ...patch }));
  const setCost = (k: keyof Costs, v: Costs[keyof Costs]) =>
    setS((x) => ({ ...x, costs: { ...x.costs, [k]: v } }));
  const setPos = (id: string, patch: Partial<Position>) =>
    setS((x) => ({
      ...x,
      positions: x.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  const addPos = () =>
    setS((x) => ({
      ...x,
      positions: [...x.positions, { id: uid(), name: '', hs: '', qty: 1, unitPrice: 0, weight: 0 }],
    }));
  const removePos = (id: string) => {
    const idx = s.positions.findIndex((p) => p.id === id);
    const removed = s.positions[idx];
    setS((x) => ({ ...x, positions: x.positions.filter((p) => p.id !== id) }));
    toast('Позиция удалена', {
      undo: () =>
        setS((x) => {
          const positions = [...x.positions];
          positions.splice(idx, 0, removed);
          return { ...x, positions };
        }),
    });
  };

  const extract = (files: File[]) => {
    set({ fileName: files[0].name });
    setExtracting(1);
    let v = 1;
    const id = setInterval(() => {
      v += 12;
      setExtracting(Math.min(v, 100));
      if (v >= 100) {
        clearInterval(id);
        setExtracting(0);
        setS((x) => ({
          ...x,
          positions: [...x.positions, ...SAMPLE_POSITIONS.map((p) => ({ ...p, id: uid() }))],
        }));
        toast(`Извлечено позиций: ${SAMPLE_POSITIONS.length}`);
      }
    }, 120);
  };

  const exportCsv = () => {
    const head = [
      'Товар',
      'ТН ВЭД',
      'Кол-во',
      `Цена, ${cur}`,
      `Таможенная стоимость, ${cur}`,
      'Пошлина %',
      `Пошлина, ${cur}`,
      `Акциз, ${cur}`,
      `НДС, ${cur}`,
      `Сбор, ${cur}`,
      `Себестоимость, ${cur}`,
      `За единицу, ${cur}`,
    ];
    const rows = res.lines.map((l) => [
      l.p.name,
      l.p.hs,
      l.p.qty,
      l.p.unitPrice,
      l.customsValue.toFixed(2),
      l.dutyRate,
      l.duty.toFixed(2),
      l.excise.toFixed(2),
      l.vat.toFixed(2),
      l.fee.toFixed(2),
      l.landed.toFixed(2),
      l.unitCost.toFixed(2),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    downloadText('Расчёт_сделки.csv', '﻿' + csv, 'text/csv;charset=utf-8');
  };

  const saveToDocs = () => {
    update((d) => {
      d.files.unshift({
        id: uid(),
        name: `Расчёт_сделки_${new Date().toLocaleDateString('ru-RU')}.xlsx`,
        ext: 'xlsx',
        size: 21000,
        at: nowIso(),
        source: 'Калькулятор сделки',
      });
    });
    toast('Расчёт сохранён в «Документы»');
  };

  const toApplication = () =>
    nav('/applications?new=1', {
      state: {
        prefill: {
          type: 'calc',
          title: `Оформление сделки: ${valid.length} поз., ${num(res.goods, 0)} ${cur}`,
          description: `Позиции:\n${res.lines.map((l) => `• ${l.p.name} (${l.p.hs || 'код не указан'}) — ${l.p.qty} шт.`).join('\n')}\n\nТаможенные платежи (предварительно): ${uzs(res.payments)}\nСебестоимость: ${uzs(res.landed)}`,
        },
      },
    });

  const money2 = (n: number) => `${num(n)} ${cur}`;

  return (
    <>
      <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: 'rgba(47,111,237,.1)',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Calculator size={24} />
        </Box>
        <Box>
          <Typography variant='h1' sx={{ fontSize: { xs: 22, md: 26 } }}>
            Калькулятор внешнеторговой сделки
          </Typography>
          <Typography color='text.secondary'>
            Сначала оцените себестоимость, затем рассчитайте таможенные платежи по кодам ТН ВЭД
          </Typography>
        </Box>
      </Stack>

      <Stepper nonLinear activeStep={s.step} sx={{ mb: 3, maxWidth: 560 }}>
        <Step completed={s.step > 0}>
          <StepButton onClick={() => set({ step: 0 })}>Документ и себестоимость</StepButton>
        </Step>
        <Step>
          <StepButton disabled={!valid.length} onClick={() => set({ step: 1 })}>
            Пошлины и налоги
          </StepButton>
        </Step>
      </Stepper>

      {s.step === 0 ? (
        <Stack spacing={2}>
          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant='h3' sx={{ mb: 2 }}>
              1. Документ сделки
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label='Тип документа'
                  value={s.docType}
                  onChange={(e) => set({ docType: e.target.value as CalcState['docType'] })}
                >
                  <MenuItem value='invoice'>Инвойс</MenuItem>
                  <MenuItem value='pricelist'>Прайс-лист</MenuItem>
                  <MenuItem value='order'>Заказ</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label='Валюта документа'
                  value={cur}
                  onChange={(e) => set({ currency: e.target.value as CalcState['currency'] })}
                  helperText={`1 ${cur} = ${num(RATES[cur], 0)} сум (демо-курс)`}
                >
                  {Object.keys(RATES).map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            {extracting ? (
              <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 3 }}>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                  Извлекаем позиции из «{s.fileName}»…
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={extracting}
                  aria-label='Прогресс распознавания'
                />
              </Box>
            ) : (
              <Dropzone
                compact
                title='Перетащите PDF, изображение или Excel — либо нажмите для выбора'
                hint={
                  s.fileName
                    ? `Последний файл: ${s.fileName}`
                    : 'Позиции извлекутся автоматически, расходы распределятся по товарам'
                }
                accept='.pdf,.png,.jpg,.jpeg,.xlsx,.xls'
                onFiles={extract}
              />
            )}
          </Card>

          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 2 }}>
              <Typography variant='h3'>2. Позиции</Typography>
              <Chip size='small' label={s.positions.length} sx={{ height: 22 }} />
              <Box sx={{ flex: 1 }} />
              {!s.positions.length && (
                <Button
                  size='small'
                  onClick={() =>
                    setS((x) => ({
                      ...x,
                      positions: SAMPLE_POSITIONS.map((p) => ({ ...p, id: uid() })),
                    }))
                  }
                >
                  Заполнить примером
                </Button>
              )}
              <Button
                variant='outlined'
                size='small'
                startIcon={<Plus size={15} />}
                onClick={addPos}
              >
                Добавить
              </Button>
            </Stack>
            {s.positions.length === 0 ? (
              <Typography color='text.secondary'>
                Загрузите документ или добавьте позицию вручную.
              </Typography>
            ) : (
              <PositionsEditor
                positions={s.positions}
                currency={cur}
                onChange={setPos}
                onRemove={removePos}
              />
            )}
          </Card>

          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant='h3'>3. Расходы сделки</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Суммы в {cur}. Наведите на название, чтобы узнать, как расход влияет на расчёт.
            </Typography>
            <Grid container spacing={2}>
              {COST_FIELDS.map((f) => (
                <Grid item xs={12} sm={6} md={4} key={f.key}>
                  <TextField
                    type='number'
                    label={<Term tip={f.tip}>{f.label}</Term>}
                    value={s.costs[f.key]}
                    onChange={(e) => setCost(f.key, Math.max(0, +e.target.value))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>{f.pct ? '%' : cur}</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label='База распределения'
                  value={s.costs.base}
                  onChange={(e) => setCost('base', e.target.value as Costs['base'])}
                >
                  <MenuItem value='value'>По стоимости</MenuItem>
                  <MenuItem value='weight'>По весу</MenuItem>
                  <MenuItem value='qty'>По количеству</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label={
                    <Term tip='СТ-1 — для стран СНГ (пошлина 0%), Form A — преференция для развивающихся стран (−25%)'>
                      Сертификат происхождения
                    </Term>
                  }
                  value={s.costs.origin}
                  onChange={(e) => setCost('origin', e.target.value as Costs['origin'])}
                >
                  <MenuItem value='none'>Нет</MenuItem>
                  <MenuItem value='st1'>СТ-1 (СНГ)</MenuItem>
                  <MenuItem value='forma'>Form A (−25%)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Card>

          <Paper
            elevation={0}
            aria-label='Предварительный итог'
            sx={{
              position: { sm: 'sticky' },
              bottom: { sm: 16 },
              width: { sm: 'calc(100% - 56px)' },
              boxSizing: 'border-box',
              zIndex: 5,
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              boxShadow: '0 -6px 24px rgba(15,23,42,.08)',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: { xs: 1.5, md: 3 },
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                columnGap: { xs: 2, md: 3 },
                rowGap: 1,
                flex: '1 1 520px',
                minWidth: 0,
              }}
            >
              {[
                ['Позиции', `${valid.length}`],
                ['Товары', money2(res.goods)],
                ['Расходы', money2(res.logistics)],
                ['Пошлины и НДС', money2(res.payments)],
              ].map(([k, v]) => (
                <Box key={k}>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    noWrap
                    sx={{ display: 'block' }}
                  >
                    {k}
                  </Typography>
                  <Typography
                    fontWeight={600}
                    sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
                  >
                    {v}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ flex: '1 0 auto', textAlign: 'right' }}>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                Себестоимость ≈ {uzs(res.landed)}
              </Typography>
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {money2(res.landed)}
              </Typography>
            </Box>
            <Tooltip
              title={valid.length ? '' : 'Добавьте хотя бы одну позицию с количеством и ценой'}
            >
              <Box component='span' sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
                <Button
                  fullWidth
                  variant='contained'
                  size='large'
                  startIcon={<Calculator size={18} />}
                  disabled={!valid.length}
                  onClick={() => {
                    set({ step: 1 });
                    window.scrollTo(0, 0);
                  }}
                >
                  Рассчитать сделку
                </Button>
              </Box>
            </Tooltip>
          </Paper>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {unknownHs > 0 && (
            <Alert
              severity='warning'
              icon={<TriangleAlert size={20} />}
              action={
                <Button
                  color='inherit'
                  size='small'
                  startIcon={<Bot size={15} />}
                  onClick={() => nav('/aziza')}
                >
                  Спросить Азизу
                </Button>
              }
            >
              Для {unknownHs} поз. код ТН ВЭД не найден — применена ставка 10%. Уточните код, чтобы
              расчёт был точнее.
            </Alert>
          )}
          <Grid container spacing={1.5}>
            {[
              { l: 'Стоимость товаров', v: res.goods, c: '#2f6fed' },
              { l: 'Логистика и расходы', v: res.logistics, c: '#0d9488' },
              { l: 'Таможенные платежи', v: res.payments, c: '#d97706' },
            ].map((x) => (
              <Grid item xs={12} sm={6} lg={3} key={x.l}>
                <Card sx={{ p: 2.25, height: '100%' }}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: x.c }} />
                    <Typography variant='body2' color='text.secondary'>
                      {x.l}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 1 }}>
                    {money2(x.v)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    ≈ {uzs(x.v)}
                  </Typography>
                </Card>
              </Grid>
            ))}
            <Grid item xs={12} sm={6} lg={3}>
              <Card
                sx={{
                  p: 2.25,
                  height: '100%',
                  background: 'linear-gradient(135deg,#2f6fed,#6d4af2)',
                  border: 0,
                  color: '#fff',
                }}
              >
                <Typography variant='body2' sx={{ opacity: 0.85 }}>
                  Себестоимость сделки
                </Typography>
                <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 1 }}>
                  {money2(res.landed)}
                </Typography>
                <Typography variant='caption' sx={{ opacity: 0.85 }}>
                  ≈ {uzs(res.landed)}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant='h3' sx={{ mb: 1.5 }}>
              Структура себестоимости
            </Typography>
            <Box
              role='img'
              aria-label='Структура себестоимости'
              sx={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', mb: 1.5 }}
            >
              {[
                [res.goods, '#2f6fed'],
                [res.logistics, '#0d9488'],
                [res.payments, '#d97706'],
              ].map(([v, c], i) => (
                <Box
                  key={i}
                  sx={{ width: `${(Number(v) / (res.landed || 1)) * 100}%`, bgcolor: String(c) }}
                />
              ))}
            </Box>
            <Stack direction='row' spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {[
                ['Пошлина', res.totals.duty],
                ['Акциз', res.totals.excise],
                ['НДС 12%', res.totals.vat],
                ['Таможенный сбор', res.totals.fee],
              ].map(([k, v]) => (
                <Typography key={String(k)} variant='body2'>
                  <Box component='span' sx={{ color: 'text.secondary' }}>
                    {k}:
                  </Box>{' '}
                  <b>{money2(Number(v))}</b>
                </Typography>
              ))}
            </Stack>
          </Card>

          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant='h3' sx={{ mb: 1.5 }}>
              Пошлины и налоги по позициям
            </Typography>
            <TableContainer>
              <Table size='small' sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Товар</TableCell>
                    <TableCell>ТН ВЭД</TableCell>
                    <TableCell align='right'>
                      <Term tip='Стоимость товара + фрахт и страхование до границы'>
                        Там. стоимость
                      </Term>
                    </TableCell>
                    <TableCell align='right'>Пошлина</TableCell>
                    <TableCell align='right'>Акциз</TableCell>
                    <TableCell align='right'>НДС</TableCell>
                    <TableCell align='right'>Себестоимость</TableCell>
                    <TableCell align='right'>За ед.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {res.lines.map((l) => (
                    <TableRow key={l.p.id} hover>
                      <TableCell>
                        {l.p.name || '—'}
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: 'block' }}
                        >
                          {l.p.qty} шт.
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {l.p.hs || '—'}{' '}
                        {!l.hsKnown && (
                          <Tooltip title='Код не найден — применена ставка 10%'>
                            <Chip
                              size='small'
                              color='warning'
                              label='проверьте'
                              sx={{ height: 18, ml: 0.5 }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align='right'>{num(l.customsValue)}</TableCell>
                      <TableCell align='right'>
                        {num(l.duty)}
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: 'block' }}
                        >
                          {num(l.dutyRate, 1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>{num(l.excise)}</TableCell>
                      <TableCell align='right'>{num(l.vat)}</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600 }}>
                        {num(l.landed)}
                      </TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {num(l.unitCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1.5 }}>
              Суммы в {cur}. Расчёт ознакомительный и выполнен по демо-ставкам; окончательные
              платежи определяет таможенный орган.
            </Typography>
          </Card>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant='outlined'
              color='inherit'
              startIcon={<ArrowLeft size={16} />}
              onClick={() => set({ step: 0 })}
            >
              Изменить данные
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant='outlined'
              startIcon={<FileSpreadsheet size={16} />}
              onClick={exportCsv}
            >
              Экспорт в Excel
            </Button>
            <Button variant='outlined' startIcon={<FolderDown size={16} />} onClick={saveToDocs}>
              Сохранить в документы
            </Button>
            <Button variant='contained' startIcon={<Send size={16} />} onClick={toApplication}>
              Оформить заявку
            </Button>
          </Stack>
        </Stack>
      )}
    </>
  );
}
