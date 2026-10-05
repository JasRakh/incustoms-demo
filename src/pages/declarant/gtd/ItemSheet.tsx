import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Languages,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { uid, useStore } from '@/app/store';
import { NumberInput } from '@/components/common/NumberInput';
import { num } from '@/lib/format';
import { RATES, hsInfo } from '@/pages/tools/calcModel';
import type { GtdItem, GtdPayRow } from '@/types';
import { AiDot, Caption, Cell, Sheet, type BlankProps } from '@/pages/declarant/gtd/Blank';
import {
  G31,
  ITEM_COUNTRIES,
  MAKER,
  PAY_KINDS,
  PREF_FIELDS,
  PROC_FIELDS,
  PURPOSE,
  QTY_FIELDS,
  SP,
  aiFill,
  describe,
  guessHs,
  itemCharges,
  itemNet,
  preview31,
  xv,
  type ItemField,
} from '@/pages/declarant/gtd/itemSchema';
import { SAMPLE_ITEMS, itemsValue, itemsWeight } from '@/pages/declarant/gtd/schema';

const mono = { fontFamily: 'ui-monospace, Menlo, monospace' };
const inSx = { '& .MuiOutlinedInput-root': { fontSize: 14 } };
const BASE_KEY = 'incustoms-gtd-products';

type Product = Omit<GtdItem, 'id' | 'ai' | 'payRows'>;

const loadBase = (): Product[] => {
  try {
    return JSON.parse(localStorage.getItem(BASE_KEY) ?? '[]') as Product[];
  } catch {
    return [];
  }
};

export function ItemSheet({
  p,
  item,
  index,
  onNav,
}: {
  p: BlankProps;
  item: GtdItem;
  index: number;
  onNav: (i: number) => void;
}) {
  const { toast } = useStore();
  const [open, setOpen] = useState<string[]>([]);
  const [baseEl, setBaseEl] = useState<HTMLElement | null>(null);
  const form = p.ctx.form;
  const items = p.ctx.items;
  const cur = form.currency || 'USD';
  const rate = RATES[cur as keyof typeof RATES] ?? RATES.USD;
  const uzs = item.value * rate;
  const info = hsInfo(item.hs);
  const charges = itemCharges(item, form);
  const ai = item.ai ?? [];
  const id = (k: string) => `gtd-item-${item.id}-${k}`;
  const err = (k: string) =>
    p.showErrors
      ? (p.problems.find((x) => x.field === `item-${item.id}-${k}`)?.text ?? null)
      : null;

  const set = (patch: Partial<GtdItem>, keys: string[] = Object.keys(patch)) =>
    p.api.setItem(item.id, { ...patch, ai: ai.filter((k) => !keys.includes(k)) });
  const setX = (k: string, v: string) => set({ extra: { ...item.extra, [k]: v } }, [k]);

  const label = (text: string, k: string, required?: boolean, point?: string) => (
    <Caption htmlFor={id(k)}>
      {text}
      {point && (
        <Box component='span' sx={{ color: 'text.disabled' }}>
          {point}
        </Box>
      )}
      {required && (
        <Box component='span' sx={{ color: 'error.main' }} aria-hidden>
          *
        </Box>
      )}
      {ai.includes(k) && <AiDot />}
    </Caption>
  );

  const X = (f: ItemField) => {
    const v = xv(item, f.key, form);
    let input: ReactNode;
    if (f.type === 'computed')
      input = (
        <TextField
          id={id(f.key)}
          size='small'
          value={f.compute!(item)}
          disabled
          sx={{ ...inSx, '& .MuiInputBase-root': { bgcolor: 'action.hover' } }}
        />
      );
    else if (f.type === 'select')
      input = (
        <TextField
          id={id(f.key)}
          select
          size='small'
          value={v}
          disabled={p.readOnly}
          error={!!err(f.key)}
          onChange={(e) => setX(f.key, e.target.value)}
          sx={inSx}
          SelectProps={{
            displayEmpty: true,
            renderValue: (val) =>
              val ? (
                (f.options!.find((o) => o.value === val)?.label ?? String(val))
              ) : (
                <Typography component='span' color='text.disabled' fontSize={14}>
                  Не выбрано
                </Typography>
              ),
          }}
        >
          {f.options!.map((o) => (
            <MenuItem key={o.value || 'none'} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      );
    else
      input = (
        <TextField
          id={id(f.key)}
          size='small'
          type={f.type === 'date' ? 'date' : 'text'}
          value={v}
          disabled={p.readOnly}
          error={!!err(f.key)}
          multiline={f.type === 'textarea'}
          minRows={f.type === 'textarea' ? 2 : undefined}
          placeholder={f.placeholder}
          onChange={(e) =>
            setX(
              f.key,
              f.type === 'number' ? e.target.value.replace(/[^\d.,]/g, '') : e.target.value
            )
          }
          inputProps={{
            style: f.mono ? mono : undefined,
            inputMode: f.type === 'number' ? 'decimal' : undefined,
          }}
          sx={inSx}
        />
      );
    return (
      <Box key={f.key} sx={{ gridColumn: f.wide ? '1 / -1' : undefined, minWidth: 0 }}>
        {label(f.label, f.key, f.required, f.point)}
        {input}
        {(err(f.key) || f.hint) && (
          <Typography
            sx={{ fontSize: 11, mt: 0.4 }}
            color={err(f.key) ? 'error.main' : 'text.secondary'}
          >
            {err(f.key) ?? f.hint}
          </Typography>
        )}
      </Box>
    );
  };

  const grid = (cols: number, children: ReactNode) => (
    <Box
      sx={{
        gridColumn: '1 / -1',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: `repeat(${cols}, minmax(0, 1fr))`,
        },
        gap: 1,
      }}
    >
      {children}
    </Box>
  );

  const filled = (f: ItemField) => f.type !== 'computed' && !!item.extra?.[f.key]?.trim();
  const g31Fields = G31.flatMap((g) => g.fields).filter((f) => f.type !== 'computed');
  const g31Count = g31Fields.filter(filled).length + (item.name.trim() ? 1 : 0);

  const runAi = () => {
    const patch = aiFill(item, form);
    const keys = Object.keys(patch);
    const hs = !item.hs && guessHs(item.name);
    if (!keys.length && !hs)
      return toast('Пустых полей для дозаполнения нет', { severity: 'info' });
    p.api.setItem(item.id, {
      extra: { ...item.extra, ...patch },
      ...(hs ? { hs } : {}),
      ai: [...new Set([...ai, ...keys, ...(hs ? ['hs'] : [])])],
    });
    toast(`Азиза заполнила полей: ${keys.length + (hs ? 1 : 0)} — проверьте отмеченные`);
  };

  const runDescribe = () => {
    p.api.setItem(item.id, { name: describe(item, form), ai: [...new Set([...ai, 'name'])] });
    toast('Описание гр. 31 сформировано');
  };

  const pickHs = () => {
    const hs = guessHs(item.name);
    if (!hs) return toast('Не удалось подобрать код — уточните описание', { severity: 'info' });
    p.api.setItem(item.id, { hs, ai: [...new Set([...ai, 'hs'])] });
    toast(`Подобран код ${hs} — проверьте`);
  };

  const saveToBase = () => {
    const { id: _id, ai: _ai, payRows: _r, ...product } = item;
    void _id;
    void _ai;
    void _r;
    const list = loadBase().filter((x) => !(x.name === product.name && x.hs === product.hs));
    try {
      localStorage.setItem(BASE_KEY, JSON.stringify([product, ...list].slice(0, 30)));
      toast('Товар сохранён в базу');
    } catch {
      toast('Не удалось сохранить в базу', { severity: 'error' });
    }
  };

  const fromBase = (x: Product) => {
    setBaseEl(null);
    p.api.setItem(item.id, { ...x, ai: [] });
    toast('Товар подставлен из базы');
  };

  const setRow = (rowId: string, patch: Partial<GtdPayRow>) =>
    set(
      { payRows: (item.payRows ?? []).map((r) => (r.id === rowId ? { ...r, ...patch } : r)) },
      []
    );

  const preview = preview31(item, form);
  const net = itemNet(item);
  const perUnit = (v: number) =>
    item.qty > 0 && v > 0 ? `${num(v / item.qty, 3)} кг на ед.` : 'на ед.: —';
  const base = [...loadBase(), ...SAMPLE_ITEMS()];

  return (
    <Sheet>
      <Box
        sx={{
          gridColumn: 'span 24',
          borderRight: 1,
          borderBottom: 1,
          borderColor: 'divider',
          px: 1.5,
          py: 1.25,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: { xs: 1.5, md: 2.5 },
          bgcolor: 'action.hover',
        }}
      >
        <Stack direction='row' alignItems='center' spacing={0.5}>
          <IconButton
            size='small'
            aria-label='Предыдущий товар'
            disabled={index === 0}
            onClick={() => onNav(index - 1)}
          >
            <ChevronLeft size={16} />
          </IconButton>
          <Typography fontWeight={700}>
            Товар {index + 1} из {items.length}
          </Typography>
          <IconButton
            size='small'
            aria-label='Следующий товар'
            disabled={index === items.length - 1}
            onClick={() => onNav(index + 1)}
          >
            <ChevronRight size={16} />
          </IconButton>
        </Stack>
        {(
          [
            ['Вес брутто', `${num(itemsWeight(items), 2)} кг`],
            ['Факт. стоимость', `${num(itemsValue(items), 2)} ${cur}`],
            ['Там. стоимость', `${num(itemsValue(items) * rate, 0)} сум`],
          ] as const
        ).map(([k, v]) => (
          <Box key={k}>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Всего · {k}</Typography>
            <Typography
              variant='body2'
              fontWeight={600}
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {v}
            </Typography>
          </Box>
        ))}
        <Box sx={{ flex: 1 }} />
        {!p.readOnly && (
          <Stack direction='row' spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
            <Button
              size='small'
              color='inherit'
              startIcon={<Database size={14} />}
              onClick={(e) => setBaseEl(e.currentTarget)}
            >
              Из базы
            </Button>
            <Button
              size='small'
              color='inherit'
              startIcon={<Save size={14} />}
              onClick={saveToBase}
            >
              В базу
            </Button>
            <Button
              size='small'
              color='secondary'
              startIcon={<Sparkles size={14} />}
              onClick={runAi}
            >
              Дозаполнить (ИИ)
            </Button>
            <Button
              size='small'
              color='secondary'
              startIcon={<Languages size={14} />}
              onClick={runDescribe}
              disabled={item.name.trim().length < 3}
            >
              Описать гр. 31 (ИИ)
            </Button>
            <IconButton
              size='small'
              aria-label='Удалить товар'
              onClick={() => {
                p.api.removeItem(item.id);
                onNav(Math.max(0, index - 1));
              }}
            >
              <Trash2 size={15} />
            </IconButton>
          </Stack>
        )}
        <Menu anchorEl={baseEl} open={!!baseEl} onClose={() => setBaseEl(null)}>
          <Typography variant='overline' color='text.secondary' sx={{ px: 2, display: 'block' }}>
            Товарная база
          </Typography>
          {base.map((x, n) => (
            <MenuItem key={`${x.name}-${n}`} onClick={() => fromBase(x)}>
              <ListItemText
                primary={x.name}
                secondary={`${x.hs} · ${num(x.value, 0)} ${cur}`}
                secondaryTypographyProps={{ sx: mono }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Cell no='32' title='Товар №' span={3}>
        <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{index + 1}</Typography>
      </Cell>
      <Cell no='33' title='Код товара (ТН ВЭД)' span={11} ai={ai.includes('hs')}>
        <Box>
          <Stack direction='row' spacing={1}>
            <TextField
              id={id('hs')}
              size='small'
              value={item.hs}
              disabled={p.readOnly}
              error={!!err('hs')}
              placeholder='0000000000'
              onChange={(e) => set({ hs: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              inputProps={{
                'aria-label': 'Код ТН ВЭД',
                inputMode: 'numeric',
                style: { ...mono, letterSpacing: '.06em' },
              }}
              sx={inSx}
            />
            {!p.readOnly && (
              <Button
                size='small'
                variant='outlined'
                color='secondary'
                startIcon={<Sparkles size={14} />}
                disabled={item.name.trim().length < 3}
                onClick={pickHs}
                sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Подобрать по описанию
              </Button>
            )}
          </Stack>
          <Typography
            sx={{ fontSize: 12, mt: 0.75 }}
            color={err('hs') ? 'error.main' : 'text.secondary'}
          >
            {err('hs') ??
              (info
                ? `${info.label} · пошлина ${info.duty}%${info.excise ? ` · акциз ${info.excise}%` : ''}`
                : item.hs.length >= 4
                  ? 'Нет в справочнике — ставка пошлины 10%'
                  : 'Формат: 10 цифр. После 4 цифр появится подсказка')}
          </Typography>
        </Box>
      </Cell>
      <Cell no='34' title='Страна происхождения' span={10}>
        <Box>
          <TextField
            id={id('origin')}
            select
            size='small'
            value={item.origin}
            disabled={p.readOnly}
            error={!!err('origin')}
            onChange={(e) => set({ origin: e.target.value })}
            inputProps={{ 'aria-label': 'Страна происхождения' }}
            sx={inSx}
          >
            {ITEM_COUNTRIES.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Cell>

      <Cell
        no='31'
        title='Грузовые места и описание товаров'
        span={24}
        aside={
          <Typography sx={{ fontSize: 12, color: 'text.secondary', ...mono }}>
            {g31Count}/{g31Fields.length + 1}
          </Typography>
        }
      >
        <Box sx={{ gridColumn: '1 / -1' }}>
          {label('Описание товара', 'name', true, 'п.1')}
          <TextField
            id={id('name')}
            size='small'
            multiline
            minRows={3}
            value={item.name}
            disabled={p.readOnly}
            error={!!err('name')}
            helperText={err('name') ?? undefined}
            placeholder='Полное коммерческое наименование'
            onChange={(e) => set({ name: e.target.value })}
            sx={inSx}
          />
        </Box>
        {G31.map((g) => {
          const has = g.fields.some(filled);
          const shown = !g.folded || has || open.includes(g.key);
          return (
            <Box
              key={g.key}
              sx={{ gridColumn: '1 / -1', pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}
            >
              <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: shown ? 1 : 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
                  <Box component='span' sx={{ color: 'text.secondary', fontWeight: 500, mr: 0.75 }}>
                    {g.points}
                  </Box>
                  {g.title}
                </Typography>
                {g.folded && !has && (
                  <Button
                    size='small'
                    color='inherit'
                    onClick={() =>
                      setOpen((o) =>
                        o.includes(g.key) ? o.filter((k) => k !== g.key) : [...o, g.key]
                      )
                    }
                    aria-expanded={shown}
                    endIcon={
                      <Box sx={{ display: 'flex', transform: shown ? 'rotate(180deg)' : 'none' }}>
                        <ChevronDown size={14} />
                      </Box>
                    }
                    sx={{ py: 0, color: 'text.secondary' }}
                  >
                    {shown ? 'Скрыть' : 'Заполнить'}
                  </Button>
                )}
              </Stack>
              {shown && grid(g.fields.length > 4 ? 4 : 3, g.fields.map(X))}
            </Box>
          );
        })}
      </Cell>

      <Cell no='31' title='Производитель (блок Т41)' span={24}>
        {grid(4, MAKER.map(X))}
        <Typography sx={{ gridColumn: '1 / -1', fontSize: 11, color: 'text.secondary' }}>
          Марка и товарный знак указываются один раз — в п.1 графы 31.
        </Typography>
      </Cell>

      <Cell no='35' title='Вес брутто, кг' span={5}>
        <Box>
          <NumberInput
            id={id('weight')}
            size='small'
            align='right'
            value={item.weight}
            disabled={p.readOnly}
            error={!!err('weight')}
            onValueChange={(v) => set({ weight: v })}
            inputProps={{ 'aria-label': 'Вес брутто' }}
            sx={inSx}
          />
          <Typography sx={{ fontSize: 11, mt: 0.5, color: 'text.secondary' }}>
            {perUnit(item.weight)}
          </Typography>
        </Box>
      </Cell>
      <Cell no='38' title='Вес нетто, кг' span={5} ai={ai.includes('net')}>
        <Box>
          <NumberInput
            id={id('net')}
            size='small'
            align='right'
            value={net}
            disabled={p.readOnly}
            error={!!err('net')}
            onValueChange={(v) => setX('net', String(v))}
            inputProps={{ 'aria-label': 'Вес нетто' }}
            sx={inSx}
          />
          <Typography
            sx={{ fontSize: 11, mt: 0.5 }}
            color={err('net') ? 'error.main' : 'text.secondary'}
          >
            {err('net') ?? perUnit(net)}
          </Typography>
        </Box>
      </Cell>
      <Cell no='41' title='Количество и единицы измерения' span={14}>
        {grid(
          4,
          <>
            <Box>
              {label('Количество', 'qty', true)}
              <NumberInput
                id={id('qty')}
                size='small'
                value={item.qty}
                disabled={p.readOnly}
                error={!!err('qty')}
                onValueChange={(v) => set({ qty: v })}
                sx={inSx}
              />
            </Box>
            {QTY_FIELDS.map(X)}
          </>
        )}
      </Cell>

      <Cell no='37' title='Процедура' span={24}>
        {grid(3, PROC_FIELDS.map(X))}
      </Cell>
      <Cell no='42' title='Фактурная стоимость' span={6}>
        <NumberInput
          id={id('value')}
          size='small'
          align='right'
          value={item.value}
          disabled={p.readOnly}
          error={!!err('value')}
          onValueChange={(v) => set({ value: v })}
          inputProps={{ 'aria-label': 'Фактурная стоимость' }}
          InputProps={{ endAdornment: <InputAdornment position='end'>{cur}</InputAdornment> }}
          sx={inSx}
        />
      </Cell>
      <Cell no='45' title='Таможенная стоимость' span={6}>
        <Box sx={{ py: 0.75, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {num(uzs, 2)} сум
        </Box>
      </Cell>
      <Cell no='46' title='Статистическая стоимость' span={6}>
        <Box sx={{ py: 0.75, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {num(uzs / RATES.USD, 2)} USD
        </Box>
      </Cell>
      <Cell no='43' title='Назначение' span={6}>
        {X({ ...PURPOSE, label: 'Признак (0/1)' })}
      </Cell>
      <Cell no='36' title='Преференции' span={18}>
        {grid(4, PREF_FIELDS.map(X))}
      </Cell>
      <Cell no='39' title='Квота' span={6}>
        {X({ key: 'quota', label: 'Номер квоты / разрешения', type: 'text' })}
      </Cell>
      <Cell
        no='47'
        title='Исчисление таможенных пошлин и сборов'
        span={24}
        aside={
          !p.readOnly && (
            <Button
              size='small'
              startIcon={<Plus size={14} />}
              sx={{ py: 0 }}
              onClick={() =>
                set(
                  {
                    payRows: [
                      ...(item.payRows ?? []),
                      { id: uid(), kind: '50', base: uzs, rate: 0, sp: 'БН' },
                    ],
                  },
                  []
                )
              }
            >
              Строка
            </Button>
          )
        }
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Box
            component='table'
            sx={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr>
                {['Вид', 'Основа начисления', 'Ставка, %', 'Сумма', 'СП', ''].map((h, i) => (
                  <Box
                    component='th'
                    key={i}
                    sx={{
                      textAlign: i === 0 || i === 4 ? 'left' : 'right',
                      fontWeight: 500,
                      color: 'text.secondary',
                      fontSize: 12,
                      py: 0.5,
                      px: 0.5,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    {h}
                  </Box>
                ))}
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => {
                const row = item.payRows?.find((r) => r.id === c.id);
                const td = { py: 0.5, px: 0.5, borderBottom: 1, borderColor: 'divider' };
                return (
                  <tr key={c.id}>
                    <Box component='td' sx={{ ...td, width: 190 }}>
                      {row && !p.readOnly ? (
                        <TextField
                          select
                          size='small'
                          value={row.kind}
                          onChange={(e) => setRow(row.id, { kind: e.target.value })}
                          sx={inSx}
                        >
                          {PAY_KINDS.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        `${c.kind} ${PAY_KINDS.find((o) => o.value === c.kind)?.label.split(' — ')[1] ?? ''}`
                      )}
                    </Box>
                    <Box
                      component='td'
                      sx={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {row && !p.readOnly ? (
                        <NumberInput
                          size='small'
                          align='right'
                          value={row.base}
                          onValueChange={(v) => setRow(row.id, { base: v })}
                          sx={inSx}
                        />
                      ) : (
                        num(c.base, 2)
                      )}
                    </Box>
                    <Box component='td' sx={{ ...td, textAlign: 'right', width: 100 }}>
                      {row && !p.readOnly ? (
                        <NumberInput
                          size='small'
                          align='right'
                          value={row.rate}
                          onValueChange={(v) => setRow(row.id, { rate: v })}
                          sx={inSx}
                        />
                      ) : (
                        num(c.rate, 2)
                      )}
                    </Box>
                    <Box
                      component='td'
                      sx={{
                        ...td,
                        textAlign: 'right',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {num(c.sum, 2)}
                    </Box>
                    <Box component='td' sx={{ ...td, width: 110 }}>
                      {row && !p.readOnly ? (
                        <TextField
                          select
                          size='small'
                          value={row.sp}
                          onChange={(e) => setRow(row.id, { sp: e.target.value })}
                          sx={inSx}
                        >
                          {SP.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.value}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        c.sp
                      )}
                    </Box>
                    <Box component='td' sx={{ ...td, width: 36 }}>
                      {row && !p.readOnly && (
                        <IconButton
                          size='small'
                          aria-label='Удалить строку'
                          onClick={() =>
                            set(
                              { payRows: (item.payRows ?? []).filter((r) => r.id !== row.id) },
                              []
                            )
                          }
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      )}
                    </Box>
                  </tr>
                );
              })}
              <tr>
                <Box component='td' colSpan={3} sx={{ py: 0.75, px: 0.5, fontWeight: 700 }}>
                  Итого по товару
                </Box>
                <Box
                  component='td'
                  sx={{
                    py: 0.75,
                    px: 0.5,
                    textAlign: 'right',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {num(
                    charges.reduce((s, c) => s + c.sum, 0),
                    2
                  )}
                </Box>
                <td colSpan={2} />
              </tr>
            </tbody>
          </Box>
        </Box>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Ставки берутся по коду ТН ВЭД и преференциям гр. 36 автоматически. Демо-ставки.
        </Typography>
      </Cell>

      <Cell title='Предпросмотр графы 31 / графы 41' span={24}>
        <Box
          sx={{
            p: 1.25,
            borderRadius: 1.5,
            bgcolor: 'action.hover',
            fontSize: 13,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {preview.g31.length
            ? preview.g31.join('\n')
            : 'Заполните описание товара — здесь появится текст графы 31.'}
          <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider', color: 'text.secondary' }}>
            Гр. 41: {preview.g41}
          </Box>
        </Box>
      </Cell>
    </Sheet>
  );
}
