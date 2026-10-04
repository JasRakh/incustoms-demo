import {
  Box,
  Button,
  Card,
  CardActionArea,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CircleCheck,
  FileSpreadsheet,
  FileText,
  History,
  Plus,
  RefreshCw,
  ScanText,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { nowIso, uid, useStore } from '@/app/store';
import { Dropzone } from '@/components/common/Dropzone';
import { EmptyState } from '@/components/common/EmptyState';
import { ToneChip } from '@/components/common/StatusChip';
import { downloadText, fmtDateTime, relative } from '@/lib/format';
import { CALC_IMPORT_KEY } from '@/pages/tools/DealCalculator';
import { SAMPLE_POSITIONS } from '@/pages/tools/calcModel';
import type { OcrOrder } from '@/types';

const ROWS = [
  ...SAMPLE_POSITIONS.map((p) => ({ ...p, conf: 0 })),
  { name: 'Чехол для смартфона', hs: '4202 32 000 0', qty: 100, unitPrice: 2.5, weight: 0.05 },
  { name: 'Зарядное устройство USB-C', hs: '8504 40 300 0', qty: 40, unitPrice: 6, weight: 0.1 },
].map((r, i) => ({ ...r, conf: [98, 96, 93, 81, 95][i] }));

const ORDER_STATUS: Record<OcrOrder['status'], { l: string; t: 'gray' | 'blue' | 'green' }> = {
  created: { l: 'Создан', t: 'gray' },
  processing: { l: 'В обработке', t: 'blue' },
  done: { l: 'Готов', t: 'green' },
};

export function OcrExcel() {
  const { state, update, toast } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const orderId = params.get('order');
  const order = state.ocrOrders.find((o) => o.id === orderId) ?? null;
  const totalDocs = 4200 + state.ocrOrders.reduce((a, o) => a + o.docs.length, 0);
  const doneDocs =
    4100 +
    state.ocrOrders.reduce((a, o) => a + o.docs.filter((d) => d.status === 'done').length, 0);

  const newOrder = () => {
    const id = uid();
    update((d) => {
      d.ocrOrders.unshift({ id, createdAt: nowIso(), status: 'created', docs: [] });
    });
    setParams({ order: id });
  };

  useEffect(() => {
    if (params.get('new')) newOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const process = (oid: string, names: string[]) => {
    const docs = names.map((name) => ({
      id: uid(),
      name,
      progress: 0,
      status: 'processing' as const,
      rows: 0,
    }));
    update((d) => {
      const o = d.ocrOrders.find((x) => x.id === oid);
      if (o) {
        o.docs.push(...docs);
        o.status = 'processing';
      }
    });
    const prog: Record<string, number> = Object.fromEntries(docs.map((x) => [x.id, 0]));
    const t = window.setInterval(() => {
      docs.forEach((x) => {
        prog[x.id] = Math.min(100, prog[x.id] + 8 + Math.random() * 10);
      });
      const all = docs.every((x) => prog[x.id] >= 100);
      update((d) => {
        const o = d.ocrOrders.find((x) => x.id === oid);
        if (!o) return;
        o.docs.forEach((doc) => {
          if (prog[doc.id] === undefined) return;
          doc.progress = prog[doc.id];
          if (doc.progress >= 100) {
            doc.status = 'done';
            doc.rows = ROWS.length;
          }
        });
        if (all && o.docs.every((x) => x.status === 'done')) {
          o.status = 'done';
          d.energy.unshift({
            id: uid(),
            type: 'out',
            title: 'OCR: распознавание документов',
            amount: 2 * docs.length,
            at: nowIso(),
          });
          d.services.unshift({
            id: uid(),
            service: 'OCR → Excel',
            energy: 2 * docs.length,
            at: nowIso(),
          });
        }
      });
      if (all) {
        clearInterval(t);
        toast('Документы распознаны');
      }
    }, 300);
  };

  const exportExcel = (o: OcrOrder) => {
    const csv = [
      ['Товар', 'ТН ВЭД', 'Кол-во', 'Цена', 'Вес ед., кг', 'Точность, %'],
      ...ROWS.map((r) => [r.name, r.hs, r.qty, r.unitPrice, r.weight, r.conf]),
    ]
      .map((r) => r.map((c) => `"${String(c)}"`).join(';'))
      .join('\n');
    downloadText(`OCR_${o.id}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
    update((d) => {
      d.files.unshift({
        id: uid(),
        name: `OCR_${new Date().toLocaleDateString('ru-RU')}.xlsx`,
        ext: 'xlsx',
        size: 23800,
        at: nowIso(),
        source: 'OCR → Excel',
      });
    });
    toast('Таблица выгружена и сохранена в «Документы»');
  };

  const toCalc = () => {
    sessionStorage.setItem(
      CALC_IMPORT_KEY,
      JSON.stringify(ROWS.map(({ conf: _c, ...p }) => ({ ...p, id: uid() })))
    );
    sessionStorage.removeItem('incustoms-calc');
    nav('/tools/calculator');
  };

  const removeOrder = (id: string) => {
    const idx = state.ocrOrders.findIndex((o) => o.id === id);
    const prev = state.ocrOrders[idx];
    update((d) => {
      d.ocrOrders = d.ocrOrders.filter((o) => o.id !== id);
    });
    toast('Заказ удалён', {
      undo: () =>
        update((d) => {
          d.ocrOrders.splice(idx, 0, prev);
        }),
    });
  };

  if (order) {
    const done = order.docs.length > 0 && order.status === 'done';
    return (
      <>
        <Button
          startIcon={<ArrowLeft size={16} />}
          color='inherit'
          onClick={() => setParams({})}
          sx={{ mb: 2 }}
        >
          Все заказы
        </Button>
        <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 3, flexWrap: 'wrap' }}>
          <Typography variant='h1' sx={{ fontSize: { xs: 22, md: 26 } }}>
            Заказ от {fmtDateTime(order.createdAt)}
          </Typography>
          <ToneChip label={ORDER_STATUS[order.status].l} tone={ORDER_STATUS[order.status].t} />
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={done ? 4 : 12}>
            <Card sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant='h3' sx={{ mb: 1.5 }}>
                Документы
              </Typography>
              <Dropzone
                compact
                multiple
                accept='.pdf,.png,.jpg,.jpeg'
                title='Перетащите файлы или нажмите для выбора'
                hint='Инвойсы, упаковочные листы, накладные · PDF, JPG, PNG'
                onFiles={(f) =>
                  process(
                    order.id,
                    f.map((x) => x.name)
                  )
                }
              />
              {!order.docs.length && (
                <Button
                  fullWidth
                  sx={{ mt: 1.5 }}
                  startIcon={<Sparkles size={16} />}
                  onClick={() => process(order.id, ['invoice_sample.pdf'])}
                >
                  Попробовать на примере
                </Button>
              )}
              <Stack spacing={1.25} sx={{ mt: 2 }}>
                {order.docs.map((doc) => (
                  <Box
                    key={doc.id}
                    sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}
                  >
                    <Stack direction='row' spacing={1} alignItems='center'>
                      {doc.status === 'done' ? (
                        <Box sx={{ color: 'success.main', display: 'flex' }}>
                          <CircleCheck size={18} />
                        </Box>
                      ) : (
                        <FileText size={18} />
                      )}
                      <Typography noWrap sx={{ flex: 1, fontWeight: 500 }}>
                        {doc.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {doc.status === 'done'
                          ? `${doc.rows} строк`
                          : `${Math.round(doc.progress)}%`}
                      </Typography>
                    </Stack>
                    {doc.status !== 'done' && (
                      <LinearProgress
                        variant='determinate'
                        value={doc.progress}
                        sx={{ mt: 1 }}
                        aria-label={`Распознавание ${doc.name}`}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
          {done && (
            <Grid item xs={12} lg={8}>
              <Card sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent='space-between'
                  spacing={1.5}
                  sx={{ mb: 2 }}
                >
                  <div>
                    <Typography variant='h3'>Предпросмотр таблицы</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Строки с точностью ниже 90% отмечены — проверьте их перед выгрузкой
                    </Typography>
                  </div>
                  <Stack direction='row' spacing={1} sx={{ flexShrink: 0 }}>
                    <Button
                      variant='outlined'
                      startIcon={<Calculator size={16} />}
                      onClick={toCalc}
                    >
                      В калькулятор
                    </Button>
                    <Button
                      variant='contained'
                      startIcon={<FileSpreadsheet size={16} />}
                      onClick={() => exportExcel(order)}
                    >
                      Выгрузить в Excel
                    </Button>
                  </Stack>
                </Stack>
                <TableContainer>
                  <Table size='small' sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Товар</TableCell>
                        <TableCell>ТН ВЭД</TableCell>
                        <TableCell align='right'>Кол-во</TableCell>
                        <TableCell align='right'>Цена, USD</TableCell>
                        <TableCell align='right'>Точность</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ROWS.map((r) => (
                        <TableRow
                          key={r.name}
                          sx={{ bgcolor: r.conf < 90 ? 'rgba(217,119,6,.08)' : undefined }}
                        >
                          <TableCell>{r.name}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.hs}</TableCell>
                          <TableCell align='right'>{r.qty}</TableCell>
                          <TableCell align='right'>{r.unitPrice}</TableCell>
                          <TableCell align='right'>
                            <ToneChip
                              label={`${r.conf}%`}
                              tone={r.conf < 90 ? 'yellow' : 'green'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          )}
        </Grid>
      </>
    );
  }

  return (
    <>
      <Card
        sx={{
          p: { xs: 2.5, md: 4 },
          mb: 3,
          border: 0,
          color: '#fff',
          background: 'linear-gradient(120deg,#2f6fed 0%,#4338ca 100%)',
          boxShadow: '0 12px 32px rgba(47,111,237,.25)',
        }}
      >
        <Stack direction='row' spacing={2} alignItems='center'>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ScanText size={26} />
          </Box>
          <div>
            <Typography
              variant='h1'
              sx={{ fontSize: { xs: 24, md: 28 }, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              OCR → Excel <Sparkles size={20} />
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              Распознавание документов и выгрузка в Excel
            </Typography>
          </div>
        </Stack>
        <Grid container spacing={1.5} sx={{ mt: 2.5, maxWidth: 560 }}>
          {[
            ['Документы', totalDocs, FileText],
            ['Обработано', doneDocs, CircleCheck],
          ].map(([l, v, Icon]) => {
            const I = Icon as typeof FileText;
            return (
              <Grid item xs={6} key={String(l)}>
                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,.14)' }}>
                  <Stack
                    direction='row'
                    spacing={0.75}
                    alignItems='center'
                    sx={{ opacity: 0.85, fontSize: 13 }}
                  >
                    <I size={14} />
                    <span>{String(l)}</span>
                  </Stack>
                  <Typography sx={{ fontSize: 26, fontWeight: 700, mt: 0.5 }}>
                    {Number(v).toLocaleString('ru-RU')}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Card>

      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 2 }}>
        <Typography variant='h2'>Мои заказы</Typography>
        <Button variant='contained' startIcon={<Plus size={16} />} onClick={newOrder}>
          Новый заказ
        </Button>
      </Stack>
      <Card sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-between'
          sx={{ px: 1, mb: 1 }}
        >
          <Stack direction='row' spacing={1} alignItems='center'>
            <History size={17} />
            <Typography variant='body2' color='text.secondary'>
              Открытые и завершённые сессии распознавания
            </Typography>
          </Stack>
          <Tooltip title='Обновить'>
            <IconButton
              aria-label='Обновить'
              onClick={() => toast('Список обновлён', { severity: 'info' })}
            >
              <RefreshCw size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
        {state.ocrOrders.length === 0 ? (
          <EmptyState
            icon={<ScanText size={28} />}
            title='Заказов пока нет'
            text='Создайте заказ и загрузите документы — таблица будет готова через минуту'
            action={
              <Button variant='contained' startIcon={<Plus size={16} />} onClick={newOrder}>
                Новый заказ
              </Button>
            }
          />
        ) : (
          state.ocrOrders.map((o) => (
            <Card key={o.id} sx={{ mb: 1, '&:hover': { borderColor: 'primary.main' } }}>
              <Stack direction='row' alignItems='center'>
                <CardActionArea onClick={() => setParams({ order: o.id })} sx={{ p: 2, flex: 1 }}>
                  <Stack direction='row' spacing={1} alignItems='center' sx={{ flexWrap: 'wrap' }}>
                    <FileText size={17} />
                    <Typography fontWeight={500}>Заказ от {fmtDateTime(o.createdAt)}</Typography>
                    <ToneChip label={ORDER_STATUS[o.status].l} tone={ORDER_STATUS[o.status].t} />
                  </Stack>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                    {o.docs.length} док. · {relative(o.createdAt)}
                  </Typography>
                </CardActionArea>
                <Tooltip title='Удалить'>
                  <IconButton aria-label='Удалить заказ' onClick={() => removeOrder(o.id)}>
                    <Trash2 size={17} />
                  </IconButton>
                </Tooltip>
                <Button
                  endIcon={<ArrowRight size={15} />}
                  onClick={() => setParams({ order: o.id })}
                  sx={{ mr: 1, display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Открыть
                </Button>
              </Stack>
            </Card>
          ))
        )}
      </Card>
    </>
  );
}
