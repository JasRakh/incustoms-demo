import {
  Box,
  Button,
  Card,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Calculator,
  FileSearch,
  Info,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { NumberInput } from '@/components/common/NumberInput';
import { Term } from '@/components/common/Term';
import { num } from '@/lib/format';
import { RATES, hsInfo, type Costs } from '@/pages/tools/calcModel';

type Direction = 'import' | 'export';

const KEYWORDS: { words: string[]; code: string }[] = [
  { words: ['iphone', 'смартфон', 'телефон', 'samsung'], code: '8517130000' },
  { words: ['наушник', 'airpods', 'колонк'], code: '8518300000' },
  { words: ['монитор', 'телевизор'], code: '8528521000' },
  { words: ['ноутбук', 'компьютер', 'macbook'], code: '8471300000' },
  { words: ['кроссовк', 'обувь', 'ботинк'], code: '6403999100' },
  { words: ['футболк', 'одежд', 'свитер'], code: '6109100000' },
  { words: ['косметик', 'крем', 'шампун'], code: '3304990000' },
  { words: ['вино'], code: '2204219800' },
  { words: ['шин', 'покрышк'], code: '4011100000' },
  { words: ['кофе'], code: '0901110000' },
  { words: ['чехол', 'сумк'], code: '4202320000' },
];

const formatHs = (digits: string) =>
  [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 9), digits.slice(9, 10)]
    .filter(Boolean)
    .join(' ');

interface Props {
  currency: keyof typeof RATES;
  customsValue: number;
  origin: Costs['origin'];
}

interface Found {
  code: string;
  label: string | null;
  duty: number;
  excise: number;
  direction: Direction;
}

export function DutiesStep({ currency, customsValue, origin }: Props) {
  const [direction, setDirection] = useState<Direction>('import');
  const [query, setQuery] = useState('');
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [valueOverride, setValueOverride] = useState<number | null>(null);
  const value = valueOverride ?? customsValue;

  const suggestions = (() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return KEYWORDS.filter((k) => k.words.some((w) => q.includes(w))).map((k) => k.code);
  })();

  const search = (digits = code) => {
    if (digits.length < 4) return;
    const info = hsInfo(digits);
    setFound({
      code: digits,
      label: info?.label ?? null,
      duty: info?.duty ?? 10,
      excise: info?.excise ?? 0,
      direction,
    });
  };

  const pick = (digits: string) => {
    setCode(digits);
    search(digits);
  };

  const result = (() => {
    if (!found) return null;
    const export_ = found.direction === 'export';
    let dutyRate = export_ ? 0 : found.duty;
    if (!export_ && origin === 'st1') dutyRate = 0;
    if (!export_ && origin === 'forma') dutyRate *= 0.75;
    const exciseRate = export_ ? 0 : found.excise;
    const duty = (value * dutyRate) / 100;
    const excise = (value * exciseRate) / 100;
    const vat = export_ ? 0 : (value + duty + excise) * 0.12;
    const fee = value * 0.002;
    return {
      dutyRate,
      exciseRate,
      duty,
      excise,
      vat,
      fee,
      total: duty + excise + vat + fee,
      export_,
    };
  })();

  const cur = (n: number) => `${num(n)} ${currency}`;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.5fr) minmax(0,1fr)' },
        gap: 2,
        alignItems: 'start',
      }}
    >
      <Card sx={{ overflow: 'hidden', boxShadow: '0 12px 32px rgba(47,111,237,.12)' }}>
        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            color: '#fff',
            background: 'linear-gradient(120deg,#3b82f6 0%,#6aa0f8 100%)',
          }}
        >
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={22} />
            </Box>
            <Box>
              <Typography variant='h2' sx={{ fontSize: 24, fontWeight: 700 }}>
                Поиск товара
              </Typography>
              <Typography sx={{ opacity: 0.92 }}>
                Опишите товар на русском — AI подберёт код автоматически
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <ToggleButtonGroup
            exclusive
            value={direction}
            onChange={(_, v: Direction | null) => v && setDirection(v)}
            aria-label='Направление'
            size='small'
            sx={{
              bgcolor: 'action.hover',
              p: 0.5,
              gap: 0.5,
              mb: 3,
              '& .MuiToggleButton-root': {
                border: 0,
                borderRadius: '8px !important',
                textTransform: 'none',
                gap: 1,
                px: 2,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              },
            }}
          >
            <ToggleButton value='import'>
              <ArrowDownToLine size={16} /> Импорт (ИМ 40)
            </ToggleButton>
            <ToggleButton value='export'>
              <ArrowUpFromLine size={16} /> Экспорт (ЭК 10)
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography fontWeight={700} sx={{ mb: 1 }} id='whatLabel'>
            Что вы ввозите?
          </Typography>
          <TextField
            placeholder='Например: iPhone 15 Pro, Кофе арабика, Зимние шины...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{ 'aria-labelledby': 'whatLabel' }}
            InputProps={{ sx: { height: 52 } }}
          />
          {suggestions.length > 0 ? (
            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}
            >
              <Typography variant='caption' color='text.secondary'>
                AI предлагает:
              </Typography>
              {suggestions.map((s) => (
                <Chip
                  key={s}
                  clickable
                  color='primary'
                  variant='outlined'
                  label={`${formatHs(s)}${hsInfo(s) ? ` · ${hsInfo(s)!.label}` : ''}`}
                  onClick={() => pick(s)}
                />
              ))}
            </Stack>
          ) : (
            <Stack
              direction='row'
              spacing={0.75}
              alignItems='center'
              sx={{ mt: 1, color: 'text.secondary' }}
            >
              <Sparkles size={14} />
              <Typography variant='caption'>AI найдёт правильный код ТН ВЭД за секунды</Typography>
            </Stack>
          )}

          <Stack direction='row' spacing={1} alignItems='center' sx={{ mt: 3, mb: 1 }}>
            <Typography fontWeight={700} id='hsLabel'>
              Код ТН ВЭД
            </Typography>
            <Term tip='10-значный код товара. По нему определяются ставки пошлины, акциза и НДС. Достаточно ввести первые 4 цифры.'>
              <Info size={15} />
            </Term>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              placeholder='0000000000'
              value={code}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').slice(0, 10);
                setCode(d);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  search();
                }
              }}
              inputProps={{
                'aria-labelledby': 'hsLabel',
                inputMode: 'numeric',
                style: { letterSpacing: '0.18em', fontFamily: 'ui-monospace, Menlo, monospace' },
              }}
              InputProps={{ sx: { height: 52 } }}
            />
            <Button
              variant='contained'
              startIcon={<FileSearch size={18} />}
              disabled={code.length < 4}
              onClick={() => search()}
              sx={{ height: 52, px: 4, flexShrink: 0 }}
            >
              Найти
            </Button>
          </Stack>
          {code.length > 0 && code.length < 4 && (
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ display: 'block', mt: 0.75 }}
            >
              Введите минимум 4 цифры кода
            </Typography>
          )}
        </Box>
      </Card>

      <Card sx={{ p: { xs: 2, md: 3 } }} component='section' aria-label='Результаты расчёта'>
        <Typography variant='h2' sx={{ fontSize: 24, mb: 2 }}>
          Результаты расчёта
        </Typography>
        {found && result ? (
          <>
            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              sx={{ flexWrap: 'wrap', rowGap: 0.5 }}
            >
              <Chip
                size='small'
                label={formatHs(found.code)}
                sx={{ fontFamily: 'ui-monospace, Menlo, monospace', height: 24 }}
              />
              <Chip
                size='small'
                label={found.direction === 'import' ? 'Импорт' : 'Экспорт'}
                color='primary'
                variant='outlined'
                sx={{ height: 24 }}
              />
            </Stack>
            <Typography fontWeight={600} sx={{ mt: 1 }}>
              {found.label ?? 'Код не найден в демо-базе'}
            </Typography>
            {!found.label && (
              <Typography variant='caption' sx={{ color: 'warning.main' }}>
                Применена базовая ставка пошлины 10%. Уточните код у Азизы.
              </Typography>
            )}

            <Box sx={{ mt: 2 }}>
              <NumberInput
                label={
                  <Term tip='Стоимость товаров + доставка и страховка до границы. Подставляется из шагов 0 и 1, можно изменить.'>
                    Таможенная стоимость
                  </Term>
                }
                value={value}
                onValueChange={(n) => setValueOverride(n)}
                InputProps={{
                  endAdornment: <InputAdornment position='end'>{currency}</InputAdornment>,
                }}
              />
              {valueOverride !== null && (
                <Button
                  size='small'
                  sx={{ mt: 0.5, ml: -1 }}
                  onClick={() => setValueOverride(null)}
                >
                  Вернуть из сделки ({num(customsValue)} {currency})
                </Button>
              )}
            </Box>

            <Box sx={{ mt: 1.5 }}>
              {(
                [
                  [`Пошлина ${num(result.dutyRate, 1)}%`, result.duty],
                  [`Акциз ${num(result.exciseRate, 0)}%`, result.excise],
                  [result.export_ ? 'НДС (экспорт — 0%)' : 'НДС 12%', result.vat],
                  ['Таможенный сбор 0,2%', result.fee],
                ] as const
              ).map(([k, v]) => (
                <Stack
                  key={k}
                  direction='row'
                  justifyContent='space-between'
                  sx={{ py: 0.9, borderBottom: '1px dashed', borderColor: 'divider' }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    {k}
                  </Typography>
                  <Typography
                    variant='body2'
                    fontWeight={600}
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {cur(v)}
                  </Typography>
                </Stack>
              ))}
            </Box>
            <Stack
              direction='row'
              justifyContent='space-between'
              alignItems='baseline'
              sx={{ mt: 1.5 }}
            >
              <Typography fontWeight={600}>Итого платежей</Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  sx={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                >
                  {cur(result.total)}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  ≈ {num(result.total * RATES[currency], 0)} сум
                </Typography>
              </Box>
            </Stack>
          </>
        ) : (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              minHeight: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmptyState
              icon={<Calculator size={34} />}
              title='Сначала введите код ТН ВЭД для поиска товара'
            />
          </Box>
        )}
      </Card>
    </Box>
  );
}
