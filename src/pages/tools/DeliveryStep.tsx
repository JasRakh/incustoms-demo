import {
  Box,
  Button,
  Card,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Calculator,
  CircleAlert,
  History,
  MapPin,
  Package,
  Plane,
  Ship,
  Trash2,
  TramFront,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/app/store';
import { EmptyState } from '@/components/common/EmptyState';
import { NumberInput } from '@/components/common/NumberInput';
import { fmtShort, fmtTime, num } from '@/lib/format';
import { RATES } from '@/pages/tools/calcModel';

type Mode = 'auto' | 'rail' | 'air' | 'sea' | 'multi';

interface Form {
  mode: Mode;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  description: string;
  weight: number;
  volume: number;
  value: number;
  incoterms: string;
  insurance: boolean;
  customs: boolean;
  reefer: boolean;
  danger: boolean;
}

interface Result {
  freight: number;
  insurance: number;
  customs: number;
  total: number;
  days: number;
  km: number;
  chargeable: number;
}

interface HistoryItem {
  id: string;
  at: string;
  form: Form;
  result: Result;
}

const MODES: { value: Mode; label: string; icon: LucideIcon }[] = [
  { value: 'auto', label: 'Авто', icon: Truck },
  { value: 'rail', label: 'Ж/Д', icon: TramFront },
  { value: 'air', label: 'Авиа', icon: Plane },
  { value: 'sea', label: 'Море', icon: Ship },
  { value: 'multi', label: 'Мульти', icon: Package },
];

const CITIES: Record<string, { cities: string[]; km: number }> = {
  Китай: { cities: ['Урумчи', 'Гуанчжоу', 'Шанхай', 'Иу', 'Шэньчжэнь'], km: 4200 },
  Турция: { cities: ['Стамбул', 'Анкара', 'Измир'], km: 3800 },
  ОАЭ: { cities: ['Дубай', 'Шарджа'], km: 3500 },
  Россия: { cities: ['Москва', 'Новосибирск', 'Казань'], km: 3300 },
  Казахстан: { cities: ['Алматы', 'Астана'], km: 1200 },
  Корея: { cities: ['Сеул', 'Пусан'], km: 5200 },
  Германия: { cities: ['Гамбург', 'Берлин'], km: 5600 },
  Узбекистан: { cities: ['Ташкент', 'Самарканд', 'Навои', 'Андижан'], km: 0 },
};
const FROM_COUNTRIES = Object.keys(CITIES).filter((c) => c !== 'Узбекистан');

const MODE_CFG: Record<
  Mode,
  { rate: number; min: number; volFactor: number; speed: number; base: number }
> = {
  auto: { rate: 0.075, min: 350, volFactor: 250, speed: 600, base: 2 },
  rail: { rate: 0.045, min: 300, volFactor: 300, speed: 900, base: 3 },
  air: { rate: 0.55, min: 120, volFactor: 167, speed: 8000, base: 2 },
  sea: { rate: 0.02, min: 250, volFactor: 1000, speed: 400, base: 10 },
  multi: { rate: 0.06, min: 400, volFactor: 400, speed: 500, base: 6 },
};
const INCOTERMS: Record<string, number> = {
  EXW: 1.1,
  FCA: 1.05,
  FOB: 1.0,
  CPT: 0.95,
  CIF: 0.9,
  DAP: 0.85,
  DDP: 0.8,
};

const KEY = 'incustoms-delivery';

const emptyForm = (): Form => ({
  mode: 'auto',
  fromCountry: 'Китай',
  fromCity: '',
  toCountry: 'Узбекистан',
  toCity: 'Ташкент',
  description: '',
  weight: 0,
  volume: 0,
  value: 0,
  incoterms: 'FCA',
  insurance: false,
  customs: true,
  reefer: false,
  danger: false,
});

function load(): { form: Form; result: Result | null; history: HistoryItem[] } {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable */
  }
  return { form: emptyForm(), result: null, history: [] };
}

function validate(f: Form) {
  const errors: { text: string; hint?: string }[] = [];
  if (!f.fromCity) errors.push({ text: 'Укажите город отправления' });
  if (!f.toCity) errors.push({ text: 'Укажите город назначения' });
  if (!(f.weight > 0) && !(f.volume > 0)) {
    errors.push({
      text: 'Укажите вес или объём груза',
      hint: 'Без веса и объёма нельзя посчитать фрахт по тарифу справочника.',
    });
  }
  return errors;
}

function estimate(f: Form): Result {
  const cfg = MODE_CFG[f.mode];
  const idx = Math.max(0, CITIES[f.fromCountry].cities.indexOf(f.fromCity));
  const toIdx = Math.max(0, CITIES['Узбекистан'].cities.indexOf(f.toCity));
  const km = CITIES[f.fromCountry].km + idx * 140 + toIdx * 90;
  const chargeable = Math.max(f.weight, f.volume * cfg.volFactor);
  let freight = Math.max(cfg.min, (chargeable / 1000) * km * cfg.rate);
  freight *= INCOTERMS[f.incoterms] ?? 1;
  if (f.reefer) freight *= 1.35;
  if (f.danger) freight *= 1.3;
  const insurance = f.insurance ? Math.max(15, f.value * 0.003) : 0;
  const customs = f.customs ? 120 : 0;
  return {
    freight,
    insurance,
    customs,
    total: freight + insurance + customs,
    days: Math.ceil(km / cfg.speed) + cfg.base,
    km,
    chargeable,
  };
}

export interface DeliveryApply {
  freightUsd: number;
  insuranceUsd: number;
  customsUsd: number;
  weight: number;
  value: number;
}

interface Props {
  currency: keyof typeof RATES;
  suggest: { weight: number; value: number };
  onApply: (r: DeliveryApply) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant='body2' fontWeight={600} sx={{ mb: 0.75 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export function DeliveryStep({ suggest, onApply }: Props) {
  const { toast } = useStore();
  const [{ form, result, history }, setData] = useState(load);
  const errors = useMemo(() => validate(form), [form]);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ form, result, history }));
    } catch {
      /* storage unavailable */
    }
  }, [form, result, history]);

  const setForm = (patch: Partial<Form>) =>
    setData((d) => ({ ...d, form: { ...d.form, ...patch }, result: null }));

  const calc = () => {
    if (errors.length) return;
    const r = estimate(form);
    const item: HistoryItem = {
      id: Math.random().toString(36).slice(2, 9),
      at: new Date().toISOString(),
      form,
      result: r,
    };
    setData((d) => ({ ...d, result: r, history: [item, ...d.history].slice(0, 10) }));
  };

  const modeLabel = (m: Mode) => MODES.find((x) => x.value === m)!.label;
  const usd = (n: number) => `${num(n)} USD`;
  const hasSuggest = suggest.weight > 0 || suggest.value > 0;

  const cityField = (
    country: string,
    city: string,
    onCity: (v: string) => void,
    placeholder: string,
    required: boolean
  ) => (
    <TextField
      select
      value={city}
      onChange={(e) => onCity(e.target.value)}
      SelectProps={{
        displayEmpty: true,
        renderValue: (v) =>
          v ? (
            <Stack direction='row' spacing={1} alignItems='center'>
              <MapPin size={15} />
              <span>{String(v)}</span>
            </Stack>
          ) : (
            <Typography color='text.disabled'>{placeholder}</Typography>
          ),
      }}
      inputProps={{ 'aria-label': placeholder, 'aria-required': required }}
    >
      {CITIES[country].cities.map((c) => (
        <MenuItem key={c} value={c}>
          {c}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'minmax(0,1.1fr) minmax(0,1fr)',
          xl: '1.1fr 1fr 0.9fr',
        },
        gap: 2,
        alignItems: 'start',
      }}
    >
      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant='h3' sx={{ mb: 2.5 }}>
          Параметры перевозки
        </Typography>

        <Typography variant='body2' fontWeight={600} sx={{ mb: 0.75 }} id='modeLabel'>
          Вид транспорта
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={form.mode}
          onChange={(_, v: Mode | null) => v && setForm({ mode: v })}
          aria-labelledby='modeLabel'
          sx={{
            gap: 1,
            '& .MuiToggleButton-root': {
              flexDirection: 'column',
              gap: 0.5,
              py: 1.25,
              textTransform: 'none',
              border: 1,
              borderColor: 'divider',
              borderRadius: '10px !important',
              '&.Mui-selected': {
                bgcolor: 'rgba(47,111,237,.1)',
                borderColor: 'primary.main',
                color: 'primary.main',
              },
            },
          }}
        >
          {MODES.map(({ value, label, icon: Icon }) => (
            <ToggleButton key={value} value={value} aria-label={label}>
              <Icon size={19} />
              <Typography variant='caption' fontWeight={500}>
                {label}
              </Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Divider sx={{ my: 2.5 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Field label='Страна отправления'>
            <TextField
              select
              value={form.fromCountry}
              onChange={(e) => setForm({ fromCountry: e.target.value, fromCity: '' })}
              inputProps={{ 'aria-label': 'Страна отправления' }}
            >
              {FROM_COUNTRIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Field>
          <Field label='Город отправления *'>
            {cityField(
              form.fromCountry,
              form.fromCity,
              (v) => setForm({ fromCity: v }),
              'Город',
              true
            )}
          </Field>
          <Field label='Страна назначения'>
            <TextField
              value='Узбекистан'
              disabled
              inputProps={{ 'aria-label': 'Страна назначения' }}
            />
          </Field>
          <Field label='Город назначения *'>
            {cityField('Узбекистан', form.toCity, (v) => setForm({ toCity: v }), 'Город', true)}
          </Field>
        </Box>

        <Divider sx={{ my: 2.5 }} />
        <Field label='Описание груза'>
          <TextField
            multiline
            minRows={3}
            placeholder='Например: текстильные изделия в коробках'
            value={form.description}
            onChange={(e) => setForm({ description: e.target.value })}
          />
        </Field>

        <Box
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 1.5, mt: 2 }}
        >
          <Field label='Вес, кг'>
            <NumberInput
              value={form.weight}
              onValueChange={(n) => setForm({ weight: n })}
              inputProps={{ 'aria-label': 'Вес, кг' }}
            />
          </Field>
          <Field label='Объём, м³'>
            <NumberInput
              value={form.volume}
              onValueChange={(n) => setForm({ volume: n })}
              inputProps={{ 'aria-label': 'Объём, м³' }}
            />
          </Field>
          <Field label='Стоимость, $'>
            <NumberInput
              value={form.value}
              onValueChange={(n) => setForm({ value: n })}
              inputProps={{ 'aria-label': 'Стоимость, $' }}
            />
          </Field>
        </Box>
        {hasSuggest && (
          <Button
            size='small'
            sx={{ mt: 0.75, ml: -1 }}
            onClick={() => setForm({ weight: suggest.weight, value: suggest.value })}
          >
            Взять из позиций сделки ({num(suggest.weight, 1)} кг · {num(suggest.value, 0)} USD)
          </Button>
        )}

        <Box sx={{ mt: 2 }}>
          <Field label='Incoterms'>
            <TextField
              select
              value={form.incoterms}
              onChange={(e) => setForm({ incoterms: e.target.value })}
              inputProps={{ 'aria-label': 'Incoterms' }}
            >
              {Object.keys(INCOTERMS).map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Field>
        </Box>

        <Divider sx={{ my: 2.5 }} />
        <Stack spacing={0.25}>
          {(
            [
              ['insurance', 'Нужна страховка'],
              ['customs', 'Таможенное оформление'],
              ['reefer', 'Рефрижератор'],
              ['danger', 'Опасный груз'],
            ] as const
          ).map(([k, l]) => (
            <FormControlLabel
              key={k}
              labelPlacement='start'
              sx={{ m: 0, justifyContent: 'space-between', py: 0.5 }}
              control={
                <Switch checked={form[k]} onChange={(e) => setForm({ [k]: e.target.checked })} />
              }
              label={<Typography fontWeight={500}>{l}</Typography>}
            />
          ))}
        </Stack>

        {errors.length > 0 && (
          <Box
            role='alert'
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              border: 1,
              borderColor: 'error.light',
              color: 'error.main',
            }}
          >
            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.75 }}>
              <CircleAlert size={18} />
              <Typography fontWeight={600} color='text.primary'>
                Проверьте данные для расчёта ({errors.length})
              </Typography>
            </Stack>
            {errors.map((e) => (
              <Box key={e.text} sx={{ mb: 0.5 }}>
                <Typography fontWeight={500}>{e.text}</Typography>
                {e.hint && (
                  <Typography variant='caption' sx={{ display: 'block', opacity: 0.9 }}>
                    {e.hint}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}

        <Button
          fullWidth
          variant='contained'
          size='large'
          startIcon={<Calculator size={18} />}
          disabled={errors.length > 0}
          onClick={calc}
          sx={{ mt: 2 }}
        >
          Рассчитать стоимость
        </Button>
      </Card>

      <Card sx={{ p: { xs: 2, md: 3 } }} component='section' aria-label='Результат расчёта'>
        <Typography variant='h3' sx={{ mb: 2 }}>
          Результат расчёта
        </Typography>
        {result ? (
          <>
            <Typography variant='body2' color='text.secondary'>
              {form.fromCity}, {form.fromCountry} → {form.toCity} · {modeLabel(form.mode)} ·{' '}
              {form.incoterms}
            </Typography>
            <Typography sx={{ fontSize: 30, fontWeight: 700, mt: 1.5, letterSpacing: '-0.5px' }}>
              {usd(result.total)}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              ≈ {num(result.total * RATES.USD, 0)} сум · срок ~{result.days} дн. ·{' '}
              {num(result.km, 0)} км
            </Typography>
            <Box sx={{ mt: 2 }}>
              {(
                [
                  ['Фрахт', result.freight],
                  ['Страхование', result.insurance],
                  ['Таможенное оформление', result.customs],
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
                    {usd(v)}
                  </Typography>
                </Stack>
              ))}
            </Box>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1.5 }}>
              Расчётный вес: {num(result.chargeable, 1)} кг. Ставки демонстрационные.
            </Typography>
            <Button
              fullWidth
              variant='contained'
              sx={{ mt: 2 }}
              onClick={() =>
                onApply({
                  freightUsd: result.freight,
                  insuranceUsd: result.insurance,
                  customsUsd: result.customs,
                  weight: form.weight,
                  value: form.value,
                })
              }
            >
              Перенести в расчёт платежей
            </Button>
          </>
        ) : (
          <EmptyState
            icon={<Calculator size={34} />}
            title='Заполните параметры и нажмите «Рассчитать стоимость»'
            text='Если для маршрута есть тариф в справочнике, расчёт появится сразу.'
          />
        )}
      </Card>

      <Card
        sx={{ p: { xs: 2, md: 3 }, gridColumn: { md: '1 / -1', xl: 'auto' } }}
        component='section'
        aria-label='История расчётов'
      >
        <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 2 }}>
          <Box sx={{ color: 'primary.main', display: 'flex' }}>
            <History size={19} />
          </Box>
          <Typography variant='h3'>История расчётов</Typography>
        </Stack>
        {history.length === 0 ? (
          <Typography color='text.secondary' sx={{ textAlign: 'center', py: 3 }}>
            Пока нет сохранённых расчётов
          </Typography>
        ) : (
          <Stack spacing={1}>
            {history.map((h) => (
              <Box
                key={h.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.25,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box
                  component='button'
                  type='button'
                  onClick={() => setData((d) => ({ ...d, form: h.form, result: h.result }))}
                  sx={{
                    all: 'unset',
                    flex: 1,
                    minWidth: 0,
                    cursor: 'pointer',
                    '&:focus-visible': {
                      outline: '2px solid #2f6fed',
                      outlineOffset: 2,
                      borderRadius: 1,
                    },
                  }}
                >
                  <Typography variant='body2' fontWeight={600} noWrap>
                    {h.form.fromCity} → {h.form.toCity} · {modeLabel(h.form.mode)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {fmtShort(h.at)} {fmtTime(h.at)} · {num(h.result.total)} USD
                  </Typography>
                </Box>
                <Tooltip title='Удалить'>
                  <IconButton
                    size='small'
                    aria-label='Удалить расчёт'
                    onClick={() => {
                      const prev = history;
                      setData((d) => ({ ...d, history: d.history.filter((x) => x.id !== h.id) }));
                      toast('Расчёт удалён', {
                        undo: () => setData((d) => ({ ...d, history: prev })),
                      });
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
}

export const clearDelivery = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};
