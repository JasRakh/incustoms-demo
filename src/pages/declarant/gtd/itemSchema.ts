import type { GtdItem, GtdPayRow } from '@/types';
import { RATES, hsInfo } from '@/pages/tools/calcModel';
import type { Form, Option } from '@/pages/declarant/gtd/schema';

export type ItemFieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'computed';

export interface ItemField {
  key: string;
  label: string;
  type: ItemFieldType;
  point?: string;
  options?: Option[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  wide?: boolean;
  mono?: boolean;
  compute?: (i: GtdItem) => string;
}

export interface ItemGroup {
  key: string;
  title: string;
  points?: string;
  folded?: boolean;
  fields: ItemField[];
}

const opts = (list: string[]): Option[] =>
  list.map((x) => {
    const [value, ...rest] = x.split(' ');
    return { value, label: rest.length ? `${value} — ${rest.join(' ')}` : value };
  });

const COUNTRY_LIST = [
  'Китай',
  'Турция',
  'ОАЭ',
  'Россия',
  'Казахстан',
  'Корея',
  'Германия',
  'США',
  'Узбекистан',
];
export const ITEM_COUNTRIES: Option[] = COUNTRY_LIST.map((c) => ({ value: c, label: c }));

export const UNITS = opts([
  '796 шт',
  '166 кг',
  '006 м',
  '055 м²',
  '113 м³',
  '112 л',
  '715 пар',
  '778 упак',
]);
const PACK_CODES = opts([
  'CT Картонная коробка',
  'BX Ящик',
  'PL Паллета',
  'BG Мешок',
  'DR Бочка',
  'PK Упаковка',
]);
const NO_PACK: Option[] = [
  { value: '', label: '— не применимо (есть упаковка) —' },
  ...opts(['NE Насыпь', 'NF Навал', 'NG Налив']),
];
const ENERGY = ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((v) => ({
  value: v,
  label: v,
}));
const YES_NO = opts(['0 нет', '1 да']);
const INVEST = opts(['001 Проект модернизации производства (демо)', '002 Проект в СЭЗ (демо)']);
const TECH = opts(['01 Технологическое оборудование', '02 Комплектующие к оборудованию']);
const GOV = opts(['01 Не госзакупка', '02 Госзакупка']);
const DISTRICTS = opts([
  '1726 г. Ташкент',
  '1703 Андижанская обл.',
  '1706 Бухарская обл.',
  '1718 Самаркандская обл.',
  '1730 Ферганская обл.',
  '1735 Респ. Каракалпакстан',
]);
export const PROCEDURES = opts([
  '40 Выпуск для свободного обращения',
  '10 Экспорт',
  '31 Реэкспорт',
  '51 Переработка на таможенной территории',
  '70 Временный ввоз',
  '74 Таможенный склад',
]);
const PREV_PROC = [
  { value: '00', label: '00 — нет' },
  ...PROCEDURES.filter((o) => o.value !== '10'),
];
const FEATURES = opts([
  '000 Без особенностей',
  '001 Выпуск до подачи ГТД',
  '002 Периодическое декларирование',
]);
export const PREFS = opts(['0 нет', '1 освобождение', '2 снижение 50%']);
export const PAY_KINDS = opts([
  '10 Таможенный сбор',
  '20 Таможенная пошлина',
  '27 Акциз',
  '29 НДС',
  '50 Утильсбор',
]);
export const SP = opts(['БН безналичный', 'ОО освобождение', 'УН условное начисление']);

const num = (s: string | undefined) => {
  const n = parseFloat((s ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export const ITEM_DEFAULTS = (form: Form): Record<string, string> => ({
  proc: form.regime || '40',
  prevProc: '00',
  feature: '000',
  unit: '796',
  container: '0',
  pref1: '0',
  pref2: '0',
  pref3: '0',
  pref4: '0',
});

export const xv = (i: GtdItem, key: string, form: Form) =>
  i.extra?.[key] ?? ITEM_DEFAULTS(form)[key] ?? '';

export const G31: ItemGroup[] = [
  {
    key: 'desc',
    title: 'Описание товара',
    points: 'п.1',
    fields: [
      { key: 'brand', label: 'Марка / бренд', type: 'text', placeholder: 'Samsung / без марки' },
      { key: 'trademark', label: 'Товарный знак', type: 'text', placeholder: 'Galaxy' },
      { key: 'gost', label: 'ГОСТ / стандарт', type: 'text', placeholder: 'ГОСТ 30804.3.2-2013' },
      { key: 'energy', label: 'Класс энергоэффективности', type: 'select', options: ENERGY },
      { key: 'serial', label: 'Серийный номер', type: 'text', placeholder: 'SN0001' },
      { key: 'madeDate', label: 'Дата выпуска', type: 'date' },
    ],
  },
  {
    key: 'pack',
    title: 'Грузовые места и упаковка',
    points: 'п.2',
    fields: [
      { key: 'places', label: 'Количество мест', type: 'number', placeholder: '10' },
      { key: 'packCode', label: 'Код упаковки', type: 'select', options: PACK_CODES },
      { key: 'packKind', label: 'Вид упаковки', type: 'text', placeholder: 'Коробки картонные' },
      {
        key: 'packMark',
        label: 'Маркировка упаковки',
        type: 'text',
        placeholder: 'Маркировка с коробки',
      },
      {
        key: 'noPack',
        label: 'Без упаковки',
        type: 'select',
        options: NO_PACK,
        hint: 'Только для товаров насыпью, навалом или наливом',
      },
      { key: 'boxes', label: 'Количество коробок', type: 'number' },
      { key: 'perBox', label: 'Единиц в коробке', type: 'number' },
      {
        key: 'totalUnits',
        label: 'Всего единиц',
        type: 'computed',
        compute: (i) => {
          const n = num(i.extra?.boxes) * num(i.extra?.perBox);
          return n ? String(n) : '—';
        },
      },
    ],
  },
  {
    key: 'container',
    title: 'Контейнер',
    points: 'п.3',
    folded: true,
    fields: [
      { key: 'container', label: 'Перевозка в контейнере', type: 'select', options: YES_NO },
    ],
  },
  {
    key: 'excise',
    title: 'Акцизные марки',
    points: 'п.4',
    folded: true,
    fields: [
      { key: 'exSeries', label: 'Серия', type: 'text', placeholder: 'AA', mono: true },
      { key: 'exFrom', label: 'С №', type: 'text', placeholder: '0000001', mono: true },
      { key: 'exTo', label: 'По №', type: 'text', placeholder: '0000100', mono: true },
      {
        key: 'exCount',
        label: 'Количество марок',
        type: 'computed',
        compute: (i) => {
          const a = num(i.extra?.exFrom);
          const b = num(i.extra?.exTo);
          return b >= a && b ? String(b - a + 1) : '—';
        },
      },
    ],
  },
  {
    key: 'period',
    title: 'Период поставки (ЛЭП, трубопровод)',
    points: 'п.5',
    folded: true,
    fields: [
      { key: 'periodFrom', label: 'С', type: 'date' },
      { key: 'periodTo', label: 'По', type: 'date' },
    ],
  },
  {
    key: 'codes',
    title: 'Коды и сроки',
    points: 'п.6–9',
    folded: true,
    fields: [
      {
        key: 'aggCode',
        label: 'Агрегированный код импортёра',
        point: 'п.6',
        type: 'text',
        placeholder: '15-значный код',
        mono: true,
      },
      { key: 'expiry', label: 'Срок годности', point: 'п.7', type: 'date' },
      { key: 'invest', label: 'Код инвестпроекта', point: 'п.8', type: 'select', options: INVEST },
      { key: 'tech', label: 'Код тех. оборудования', point: 'п.9', type: 'select', options: TECH },
    ],
  },
  {
    key: 'params',
    title: 'Производство и параметры',
    points: 'п.10',
    fields: [
      { key: 'year', label: 'Год изготовления', type: 'text', placeholder: '2026', mono: true },
      {
        key: 'techParams',
        label: 'Технические параметры',
        type: 'textarea',
        wide: true,
        placeholder: 'Мощность, производительность, габариты',
      },
    ],
  },
  {
    key: 'gov',
    title: 'Госзакупки и потребитель',
    points: 'п.11',
    fields: [
      { key: 'gov', label: 'Госзакупки', type: 'select', options: GOV, required: true },
      {
        key: 'consumerInn',
        label: 'ИНН / ОКПО потребителя',
        type: 'text',
        mono: true,
        placeholder: '000000000',
      },
      {
        key: 'district',
        label: 'Район потребителя',
        type: 'select',
        options: DISTRICTS,
        hint: 'Классификатор районов и городов РУз',
      },
    ],
  },
];

export const MAKER: ItemField[] = [
  {
    key: 'maker',
    label: 'Производитель',
    type: 'text',
    required: true,
    placeholder: 'Наименование компании',
  },
  { key: 'makerInn', label: 'ИНН / ПИНФЛ производителя', type: 'text', mono: true },
  { key: 'makerCountry', label: 'Страна производства', type: 'select', options: ITEM_COUNTRIES },
  { key: 'model', label: 'Модель', type: 'text', placeholder: 'S24 Ultra' },
  { key: 'makerAddress', label: 'Адрес производителя', type: 'text', wide: true },
];

export const PROC_FIELDS: ItemField[] = [
  { key: 'proc', label: 'Заявляемый режим', type: 'select', options: PROCEDURES, required: true },
  { key: 'prevProc', label: 'Предшествующий режим', type: 'select', options: PREV_PROC },
  { key: 'feature', label: 'Особенность перемещения', type: 'select', options: FEATURES },
];

export const QTY_FIELDS: ItemField[] = [
  { key: 'unit', label: 'Ед. изм.', type: 'select', options: UNITS, required: true },
  { key: 'addCode', label: 'Код доп. единицы', type: 'text', mono: true },
  { key: 'addQty', label: 'Кол-во в доп. ед.', type: 'number' },
];

export const PURPOSE: ItemField = {
  key: 'purpose',
  label: 'Признак',
  type: 'select',
  options: opts(['0 нет', '1 да']),
  required: true,
};

export const PREF_FIELDS: ItemField[] = [
  { key: 'pref1', label: '1. Сборы за оформление', type: 'select', options: PREFS },
  { key: 'pref2', label: '2. Таможенная пошлина', type: 'select', options: PREFS },
  { key: 'pref3', label: '3. Акциз', type: 'select', options: PREFS },
  { key: 'pref4', label: '4. НДС', type: 'select', options: PREFS },
];

export const ALL_ITEM_FIELDS: ItemField[] = [
  ...G31.flatMap((g) => g.fields),
  ...MAKER,
  ...PROC_FIELDS,
  ...QTY_FIELDS,
  PURPOSE,
  ...PREF_FIELDS,
  { key: 'net', label: 'Вес нетто', type: 'number', required: true },
  { key: 'quota', label: 'Преференции / квота', type: 'text' },
];

export const itemFieldLabel = (key: string) =>
  ({
    name: 'Описание товара',
    hs: 'Код ТН ВЭД',
    origin: 'Страна происхождения',
    value: 'Фактурная стоимость',
    weight: 'Вес брутто',
    qty: 'Количество',
  })[key] ??
  ALL_ITEM_FIELDS.find((f) => f.key === key)?.label ??
  key;

export interface Charge {
  id: string;
  kind: string;
  base: number;
  rate: number;
  sum: number;
  sp: string;
  manual?: boolean;
}

const prefFactor = (p: string) => (p === '1' ? 0 : p === '2' ? 0.5 : 1);

export function itemCharges(i: GtdItem, form: Form): Charge[] {
  const rate = RATES[(form.currency as keyof typeof RATES) || 'USD'] ?? RATES.USD;
  const exportMode = form.direction === 'EK';
  const uzs = i.value * rate;
  const info = hsInfo(i.hs);
  const p = (n: number) => xv(i, `pref${n}`, form);
  const row = (kind: string, base: number, r: number, pref: string): Charge => {
    const eff = r * prefFactor(pref);
    return {
      id: kind,
      kind,
      base,
      rate: eff,
      sum: (base * eff) / 100,
      sp: pref === '1' ? 'ОО' : 'БН',
    };
  };
  const fee = row('10', uzs, 0.2, p(1));
  const out: Charge[] = [fee];
  if (!exportMode) {
    const duty = row('20', uzs, info?.duty ?? 10, p(2));
    out.push(duty);
    let excise = 0;
    if (info?.excise) {
      const ex = row('27', uzs + duty.sum, info.excise, p(3));
      excise = ex.sum;
      out.push(ex);
    }
    out.push(row('29', uzs + duty.sum + excise, 12, p(4)));
  }
  (i.payRows ?? []).forEach((r: GtdPayRow) =>
    out.push({
      id: r.id,
      kind: r.kind,
      base: r.base,
      rate: r.rate,
      sum: (r.base * r.rate) / 100,
      sp: r.sp,
      manual: true,
    })
  );
  return out;
}

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d ? `${d}.${m}.${y}` : iso;
};

export function preview31(i: GtdItem, form: Form) {
  const x = (k: string) => (xv(i, k, form) ?? '').trim();
  const lab = (opt: Option[] | undefined, v: string) =>
    opt?.find((o) => o.value === v)?.label.split(' — ')[1] ?? v;
  const lines: string[] = [];
  const p1 = [
    i.name.trim(),
    x('brand') && `марка ${x('brand')}`,
    x('trademark') && `товарный знак ${x('trademark')}`,
    x('model') && `модель ${x('model')}`,
    x('gost'),
    x('energy') && `класс энергоэффективности ${x('energy')}`,
    x('serial') && `сер. № ${x('serial')}`,
    x('madeDate') && `дата выпуска ${fmtDate(x('madeDate'))}`,
    x('maker') && `производитель ${x('maker')}${x('makerCountry') ? `, ${x('makerCountry')}` : ''}`,
  ].filter(Boolean);
  if (p1.length) lines.push(`1. ${p1.join(', ')}`);
  if (x('noPack')) lines.push(`2. ${lab(NO_PACK, x('noPack'))}`);
  else if (x('places') || x('packKind'))
    lines.push(
      `2. мест ${x('places') || '—'}${x('packCode') ? `, ${x('packCode')}` : ''}${x('packKind') ? ` ${x('packKind')}` : ''}${x('packMark') ? `, маркировка ${x('packMark')}` : ''}`
    );
  if (x('container') === '1') lines.push('3. в контейнере');
  if (x('exFrom')) lines.push(`4. акц. марки ${x('exSeries')} № ${x('exFrom')}–${x('exTo')}`);
  if (x('periodFrom')) lines.push(`5. ${fmtDate(x('periodFrom'))}–${fmtDate(x('periodTo'))}`);
  if (x('aggCode')) lines.push(`6. ${x('aggCode')}`);
  if (x('expiry')) lines.push(`7. ${fmtDate(x('expiry'))}`);
  if (x('invest')) lines.push(`8. ${x('invest')}`);
  if (x('tech')) lines.push(`9. ${x('tech')}`);
  if (x('year') || x('techParams'))
    lines.push(`10. ${[x('year'), x('techParams')].filter(Boolean).join(', ')}`);
  if (x('gov')) lines.push(`11. ${x('gov')}`);
  const unit = UNITS.find((u) => u.value === x('unit'))?.label.split(' — ')[1] ?? '';
  const g41 = `${i.qty} ${unit}${x('addQty') ? ` / ${x('addQty')} (${x('addCode') || 'доп. ед.'})` : ''}`;
  return { g31: lines, g41 };
}

const HS_GUESS: [RegExp, string][] = [
  [/смартфон|телефон|phone/i, '8517130000'],
  [/ноутбук|компьютер|laptop/i, '8471300000'],
  [/наушник|колонк|акустик/i, '8518300000'],
  [/монитор|телевизор/i, '8528521000'],
  [/шин/i, '4011100000'],
  [/кофе/i, '0901210000'],
  [/чехол|сумк/i, '4202920000'],
  [/зарядн|адаптер/i, '8504403000'],
  [/обув|кроссов/i, '6403990000'],
  [/футболк|трикотаж/i, '6109100000'],
];

export const guessHs = (text: string) => HS_GUESS.find(([re]) => re.test(text))?.[1] ?? null;

export function aiFill(i: GtdItem, form: Form): Record<string, string> {
  const x = (k: string) => (i.extra?.[k] ?? '').trim();
  const latin = i.name.match(/[A-Za-z][\w-]{2,}/)?.[0];
  const out: Record<string, string> = {};
  const put = (k: string, v: string) => {
    if (!x(k) && v) out[k] = v;
  };
  put('brand', latin ?? 'без марки');
  put('places', '1');
  put('packCode', 'CT');
  put('packKind', 'Коробки картонные');
  put('year', String(new Date().getFullYear()));
  put('gov', '01');
  put('purpose', '0');
  put('maker', form.exporterName ?? '');
  put('makerCountry', i.origin || form.exporterCountry || '');
  put('makerAddress', form.exporterAddress ?? '');
  put('net', i.weight ? String(Math.round(i.weight * 0.9 * 100) / 100) : '');
  return out;
}

export function describe(i: GtdItem, form: Form) {
  const x = (k: string) => (i.extra?.[k] ?? '').trim();
  const base = i.name.trim() || 'Товар';
  const parts = [
    base.charAt(0).toUpperCase() + base.slice(1),
    x('brand') && `марки «${x('brand')}»`,
    x('model') && `модель ${x('model')}`,
    `страна производства — ${x('makerCountry') || i.origin || form.exporterCountry || 'не указана'}`,
  ].filter(Boolean);
  return `${parts.join(', ')}. Новый, не бывший в употреблении, в заводской упаковке.`;
}

export const itemNet = (i: GtdItem) => num(i.extra?.net);

const REQ_TEXT: Record<string, string> = {
  proc: 'режим процедуры (гр. 37)',
  unit: 'единица измерения (гр. 41)',
  purpose: 'признак назначения (гр. 43)',
  gov: 'госзакупки (гр. 31, п.11)',
  maker: 'производитель (гр. 31, Т41)',
};

export function validateItem(i: GtdItem, n: number, form: Form) {
  const out: { field: string; text: string }[] = [];
  const t = (k: string, text: string) =>
    out.push({ field: `item-${i.id}-${k}`, text: `Товар ${n}: ${text}` });
  if (!i.name.trim()) t('name', 'укажите описание (гр. 31)');
  if (!/^\d{10}$/.test(i.hs)) t('hs', 'код ТН ВЭД — 10 цифр (гр. 33)');
  if (!i.origin) t('origin', 'страна происхождения (гр. 34)');
  if (!(i.weight > 0)) t('weight', 'вес брутто (гр. 35)');
  const net = itemNet(i);
  if (!(net > 0)) t('net', 'вес нетто (гр. 38)');
  else if (i.weight > 0 && net > i.weight) t('net', 'вес нетто больше брутто');
  if (!(i.qty > 0)) t('qty', 'количество (гр. 41)');
  if (!(i.value > 0)) t('value', 'фактурная стоимость (гр. 42)');
  [...PROC_FIELDS, ...QTY_FIELDS, PURPOSE, ...G31.flatMap((g) => g.fields), ...MAKER]
    .filter((f) => f.required && !xv(i, f.key, form).trim())
    .forEach((f) => t(f.key, REQ_TEXT[f.key] ?? f.label.toLowerCase()));
  return out;
}
