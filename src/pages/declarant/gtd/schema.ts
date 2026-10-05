import type { GtdDoc, GtdItem } from '@/types';
import { RATES } from '@/pages/tools/calcModel';
import { itemCharges, validateItem } from '@/pages/declarant/gtd/itemSchema';

export type Form = Record<string, string>;

export interface Ctx {
  form: Form;
  items: GtdItem[];
}

export interface Option {
  value: string;
  label: string;
  badge?: string;
}

export type FieldType =
  'text' | 'number' | 'date' | 'select' | 'segmented' | 'textarea' | 'switch' | 'computed';

export interface FieldDef {
  key: string;
  label: string;
  graph?: string;
  type: FieldType;
  options?: Option[];
  required?: boolean;
  advanced?: boolean;
  hint?: string;
  placeholder?: string;
  cols?: 3 | 4 | 6 | 12;
  mono?: boolean;
  lookup?: 'company' | 'exporter';
  compute?: (ctx: Ctx) => string;
  validate?: (value: string, ctx: Ctx) => string | null;
}

export interface GroupDef {
  key: string;
  title: string;
  graphs?: string;
  advanced?: boolean;
  fields: FieldDef[];
}

export interface FormSection {
  key: string;
  title: string;
  graphs: string;
  groups: GroupDef[];
}

const COUNTRIES: Option[] = [
  'Китай',
  'Турция',
  'ОАЭ',
  'Россия',
  'Казахстан',
  'Корея',
  'Германия',
  'Узбекистан',
].map((c) => ({ value: c, label: c }));

const POSTS: Option[] = [
  { value: '26002', label: '26002 · Ташкент-Авиа' },
  { value: '26003', label: '26003 · Ташкент-ЖД' },
  { value: '27001', label: '27001 · Яллама' },
  { value: '22001', label: '22001 · Алат' },
  { value: '24001', label: '24001 · Термез' },
];

const digits = (n: number, label: string) => (v: string) =>
  v && !new RegExp(`^\\d{${n}}$`).test(v) ? `${label}: ${n} цифр` : null;

const ddmmyy = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}${m}${y.slice(2)}` : '';
};

export const itemsWeight = (items: GtdItem[]) => items.reduce((s, i) => s + i.weight, 0);
export const itemsValue = (items: GtdItem[]) => items.reduce((s, i) => s + i.value, 0);

export const regNumber = (f: Form) =>
  f.post && f.regDate && f.seq ? `${f.post}/${ddmmyy(f.regDate)}/${f.seq.padStart(7, '0')}` : '';

export const FORM_SECTIONS: FormSection[] = [
  {
    key: 'basic',
    title: 'Основные данные',
    graphs: 'Гр. 1, 3, 5, 6, 7',
    groups: [
      {
        key: 'direction',
        title: 'Направление и режим',
        graphs: 'Гр. 1',
        fields: [
          {
            key: 'direction',
            label: 'Направление перемещения',
            graph: 'Гр. 1',
            type: 'segmented',
            required: true,
            cols: 12,
            options: [
              { value: 'IM', label: 'Импорт', badge: 'ИМ' },
              { value: 'EK', label: 'Экспорт', badge: 'ЭК' },
              { value: 'TR', label: 'Транзит', badge: 'ТР' },
            ],
          },
          {
            key: 'regime',
            label: 'Таможенный режим',
            graph: 'Гр. 1',
            type: 'select',
            required: true,
            cols: 6,
            mono: true,
            options: [
              { value: '40', label: '40 Выпуск для свободного обращения (импорт)' },
              { value: '10', label: '10 Экспорт' },
              { value: '80', label: '80 Транзит' },
              { value: '31', label: '31 Реэкспорт' },
              { value: '51', label: '51 Переработка на таможенной территории' },
              { value: '70', label: '70 Временный ввоз' },
              { value: '74', label: '74 Таможенный склад' },
            ],
          },
          {
            key: 'grossWeight',
            label: 'Вес брутто, кг',
            graph: 'Гр. 35',
            type: 'computed',
            cols: 6,
            mono: true,
            hint: 'Сумма Гр. 35 по товарам. Меняется в разделе «Товары».',
            compute: ({ items }) => itemsWeight(items).toFixed(3),
          },
          {
            key: 'p3t1',
            label: 'Значение P3T1 в XML',
            type: 'select',
            advanced: true,
            cols: 6,
            hint: 'ЕАИС принимает оба варианта — уходит то, что выбрано.',
            options: [
              { value: 'auto', label: 'Авто — по направлению' },
              { value: 'explicit', label: 'Явно указанный код' },
            ],
          },
          {
            key: 'incomplete',
            label: 'Неполная декларация (НД/ПНД, гл. 19)',
            type: 'switch',
            advanced: true,
            cols: 6,
          },
        ],
      },
      {
        key: 'counts',
        title: 'Количества и листы',
        graphs: 'Гр. 3, 5, 6',
        fields: [
          {
            key: 'goodsCount',
            label: 'Товаров',
            graph: 'Гр. 5',
            type: 'computed',
            cols: 4,
            hint: 'Автоподсчёт',
            compute: ({ items }) => String(items.length),
          },
          {
            key: 'places',
            label: 'Грузовых мест',
            graph: 'Гр. 6',
            type: 'number',
            required: true,
            cols: 4,
            validate: (v) => (v && !(Number(v) > 0) ? 'Должно быть больше 0' : null),
          },
          {
            key: 'extraSheets',
            label: 'Доп. листов',
            graph: 'Гр. 3',
            type: 'computed',
            cols: 4,
            hint: 'Рассчитывается из количества товаров',
            compute: ({ items }) => String(Math.max(0, Math.ceil((items.length - 1) / 3))),
          },
        ],
      },
      {
        key: 'service',
        title: 'Служебные поля совместимости (P16/P18)',
        advanced: true,
        fields: [
          { key: 'p16', label: 'P16', type: 'text', cols: 6, advanced: true },
          { key: 'p18', label: 'P18', type: 'text', cols: 6, advanced: true },
        ],
      },
      {
        key: 'reg',
        title: 'Регистрация ГТД',
        graphs: 'Гр. 7',
        fields: [
          {
            key: 'post',
            label: 'Таможенный пост',
            type: 'select',
            required: true,
            cols: 6,
            options: POSTS,
          },
          {
            key: 'seq',
            label: 'Порядковый №',
            type: 'text',
            cols: 6,
            placeholder: '0000001',
            mono: true,
            validate: (v) => (v && !/^\d{1,7}$/.test(v) ? 'До 7 цифр' : null),
          },
          { key: 'regDate', label: 'Дата регистрации', type: 'date', required: true, cols: 6 },
          {
            key: 'acceptDate',
            label: 'Дата принятия к оформлению',
            type: 'date',
            cols: 6,
            hint: 'Определяет версию справочников для граф 31, 25/26, 47.',
            validate: (v, { form }) =>
              v && form.regDate && v < form.regDate ? 'Не раньше даты регистрации' : null,
          },
          {
            key: 'regNo',
            label: 'Рег. номер ГТД',
            graph: 'Гр. 7',
            type: 'computed',
            cols: 12,
            mono: true,
            hint: 'Формат: Код поста / Дата / Порядковый номер. Собирается автоматически.',
            compute: ({ form }) => regNumber(form) || 'ККККК/ДДММГГ/ННННННН',
          },
        ],
      },
    ],
  },
  {
    key: 'parties',
    title: 'Участники ВЭД',
    graphs: 'Гр. 2, 8, 9, 14',
    groups: [
      {
        key: 'exporter',
        title: 'Отправитель / экспортёр',
        graphs: 'Гр. 2',
        fields: [
          { key: 'exporterName', label: 'Наименование', type: 'text', required: true, cols: 6 },
          {
            key: 'exporterCountry',
            label: 'Страна',
            type: 'select',
            required: true,
            cols: 6,
            options: COUNTRIES,
          },
          { key: 'exporterAddress', label: 'Адрес', type: 'textarea', cols: 12 },
        ],
      },
      {
        key: 'importer',
        title: 'Получатель / импортёр',
        graphs: 'Гр. 8',
        fields: [
          { key: 'importerName', label: 'Наименование', type: 'text', required: true, cols: 6 },
          {
            key: 'importerInn',
            label: 'ИНН',
            type: 'text',
            required: true,
            cols: 6,
            mono: true,
            placeholder: '000000000',
            validate: digits(9, 'ИНН'),
          },
          { key: 'importerAddress', label: 'Адрес', type: 'textarea', cols: 12 },
        ],
      },
      {
        key: 'finance',
        title: 'Ответственный за финансовое урегулирование',
        graphs: 'Гр. 9',
        advanced: true,
        fields: [
          { key: 'finName', label: 'Наименование', type: 'text', cols: 6, advanced: true },
          {
            key: 'finInn',
            label: 'ИНН',
            type: 'text',
            cols: 6,
            mono: true,
            advanced: true,
            validate: digits(9, 'ИНН'),
          },
        ],
      },
      {
        key: 'declarant',
        title: 'Декларант',
        graphs: 'Гр. 14',
        fields: [
          {
            key: 'declarantName',
            label: 'Наименование / ФИО',
            type: 'text',
            required: true,
            cols: 6,
          },
          {
            key: 'declarantInn',
            label: 'ИНН',
            type: 'text',
            cols: 6,
            mono: true,
            validate: digits(9, 'ИНН'),
          },
        ],
      },
    ],
  },
  {
    key: 'geo',
    title: 'География и транспорт',
    graphs: 'Гр. 15–21, 25–30',
    groups: [
      {
        key: 'countries',
        title: 'Страны',
        graphs: 'Гр. 11, 15, 17',
        fields: [
          {
            key: 'originCountry',
            label: 'Страна отправления',
            graph: 'Гр. 15',
            type: 'select',
            required: true,
            cols: 6,
            options: COUNTRIES,
          },
          {
            key: 'destCountry',
            label: 'Страна назначения',
            graph: 'Гр. 17',
            type: 'select',
            required: true,
            cols: 6,
            options: COUNTRIES,
          },
          {
            key: 'tradeCountry',
            label: 'Торгующая страна',
            graph: 'Гр. 11',
            type: 'select',
            cols: 6,
            advanced: true,
            options: COUNTRIES,
          },
        ],
      },
      {
        key: 'transport',
        title: 'Транспорт',
        graphs: 'Гр. 18, 19, 21, 25, 26',
        fields: [
          {
            key: 'borderMode',
            label: 'Вид транспорта на границе',
            graph: 'Гр. 25',
            type: 'select',
            required: true,
            cols: 6,
            options: [
              { value: '10', label: '10 Морской' },
              { value: '20', label: '20 Железнодорожный' },
              { value: '30', label: '30 Автомобильный' },
              { value: '40', label: '40 Воздушный' },
              { value: '71', label: '71 Трубопровод' },
            ],
          },
          {
            key: 'vehicleNo',
            label: 'Номер транспортного средства',
            graph: 'Гр. 18',
            type: 'text',
            required: true,
            cols: 6,
            placeholder: 'Например: 01A123BC',
          },
          {
            key: 'innerMode',
            label: 'Вид транспорта внутри страны',
            graph: 'Гр. 26',
            type: 'select',
            cols: 6,
            advanced: true,
            options: [
              { value: '20', label: '20 Железнодорожный' },
              { value: '30', label: '30 Автомобильный' },
              { value: '40', label: '40 Воздушный' },
            ],
          },
          {
            key: 'container',
            label: 'Перевозка в контейнере',
            graph: 'Гр. 19',
            type: 'switch',
            cols: 6,
            advanced: true,
          },
        ],
      },
      {
        key: 'delivery',
        title: 'Условия поставки',
        graphs: 'Гр. 20, 30',
        fields: [
          {
            key: 'incoterms',
            label: 'Условия поставки (Incoterms)',
            graph: 'Гр. 20',
            type: 'select',
            required: true,
            cols: 6,
            options: ['EXW', 'FCA', 'FOB', 'CPT', 'CIF', 'DAP', 'DDP'].map((v) => ({
              value: v,
              label: v,
            })),
          },
          {
            key: 'deliveryPlace',
            label: 'Пункт поставки',
            graph: 'Гр. 20',
            type: 'text',
            required: true,
            cols: 6,
          },
          {
            key: 'goodsLocation',
            label: 'Местонахождение товаров',
            graph: 'Гр. 30',
            type: 'text',
            cols: 12,
            advanced: true,
          },
        ],
      },
    ],
  },
  {
    key: 'finance',
    title: 'Финансовые условия',
    graphs: 'Гр. 22–24',
    groups: [
      {
        key: 'invoice',
        title: 'Валюта и стоимость',
        graphs: 'Гр. 22, 23',
        fields: [
          {
            key: 'currency',
            label: 'Валюта контракта',
            graph: 'Гр. 22',
            type: 'select',
            required: true,
            cols: 4,
            options: Object.keys(RATES).map((c) => ({ value: c, label: c })),
          },
          {
            key: 'invoiceTotal',
            label: 'Общая фактурная стоимость',
            graph: 'Гр. 22',
            type: 'computed',
            cols: 4,
            mono: true,
            hint: 'Сумма стоимостей товаров',
            compute: ({ items, form }) =>
              `${itemsValue(items).toLocaleString('ru-RU')} ${form.currency || ''}`.trim(),
          },
          {
            key: 'rate',
            label: 'Курс валюты',
            graph: 'Гр. 23',
            type: 'computed',
            cols: 4,
            mono: true,
            hint: 'Демо-курс ЦБ на дату принятия',
            compute: ({ form }) =>
              form.currency ? String(RATES[form.currency as keyof typeof RATES] ?? '') : '—',
          },
        ],
      },
      {
        key: 'deal',
        title: 'Сделка',
        graphs: 'Гр. 24',
        fields: [
          {
            key: 'dealNature',
            label: 'Характер сделки',
            graph: 'Гр. 24',
            type: 'select',
            required: true,
            cols: 6,
            options: [
              { value: '01', label: '01 Купля-продажа' },
              { value: '02', label: '02 Бартер' },
              { value: '03', label: '03 Безвозмездная поставка' },
              { value: '06', label: '06 Возврат товара' },
            ],
          },
          {
            key: 'paymentForm',
            label: 'Форма расчётов',
            type: 'select',
            cols: 6,
            advanced: true,
            options: [
              { value: 'prepay', label: 'Предоплата' },
              { value: 'postpay', label: 'Постоплата' },
              { value: 'lc', label: 'Аккредитив' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'bank',
    title: 'Банковские реквизиты',
    graphs: 'Гр. 28',
    groups: [
      {
        key: 'bank',
        title: 'Банк импортёра',
        graphs: 'Гр. 28',
        fields: [
          { key: 'bankName', label: 'Наименование банка', type: 'text', required: true, cols: 6 },
          {
            key: 'mfo',
            label: 'МФО',
            type: 'text',
            required: true,
            cols: 6,
            mono: true,
            validate: digits(5, 'МФО'),
          },
          {
            key: 'account',
            label: 'Расчётный счёт',
            type: 'text',
            required: true,
            cols: 12,
            mono: true,
            validate: digits(20, 'Счёт'),
          },
          { key: 'swift', label: 'SWIFT', type: 'text', cols: 6, mono: true, advanced: true },
        ],
      },
    ],
  },
  {
    key: 'contract',
    title: 'Контракт и паспорт',
    graphs: 'Гр. 44',
    groups: [
      {
        key: 'contract',
        title: 'Внешнеторговый контракт',
        fields: [
          { key: 'contractNo', label: 'Номер контракта', type: 'text', required: true, cols: 6 },
          { key: 'contractDate', label: 'Дата контракта', type: 'date', required: true, cols: 6 },
          { key: 'passportNo', label: 'Номер паспорта сделки', type: 'text', cols: 6, mono: true },
          { key: 'invoiceNo', label: 'Номер инвойса', type: 'text', required: true, cols: 6 },
        ],
      },
    ],
  },
  {
    key: 'signs',
    title: 'Подписи',
    graphs: 'Гр. 54',
    groups: [
      {
        key: 'signer',
        title: 'Лицо, заполнившее декларацию',
        graphs: 'Гр. 54',
        fields: [
          { key: 'signerName', label: 'ФИО', type: 'text', required: true, cols: 6 },
          { key: 'signerPosition', label: 'Должность', type: 'text', cols: 6 },
          { key: 'signerPhone', label: 'Телефон', type: 'text', cols: 6 },
          {
            key: 'certNo',
            label: 'Номер сертификата ЭЦП',
            type: 'text',
            cols: 6,
            mono: true,
            advanced: true,
          },
        ],
      },
    ],
  },
];

const LOOKUP: Record<string, FieldDef['lookup']> = {
  importerInn: 'company',
  declarantInn: 'company',
  exporterName: 'exporter',
};

FORM_SECTIONS.forEach((s) =>
  s.groups.forEach((g) =>
    g.fields.forEach((f) => {
      f.lookup ??= LOOKUP[f.key];
    })
  )
);

export interface Company {
  name: string;
  address: string;
  bankName: string;
  mfo: string;
  account: string;
}

export const COMPANIES: Record<string, Company> = {
  '305123456': {
    name: 'ООО «Демо Импорт»',
    address: 'г. Ташкент, Юнусабадский р-н, ул. Амира Темура, 1',
    bankName: 'АКБ «Демо Банк»',
    mfo: '00440',
    account: '20208000900123456001',
  },
  '302555777': {
    name: 'ООО «Текстиль Трейд»',
    address: 'г. Самарканд, ул. Регистан, 15',
    bankName: 'АКБ «Пример Банк»',
    mfo: '00873',
    account: '20208000500777555002',
  },
  '306987654': {
    name: 'ООО «Демо Брокер»',
    address: 'г. Ташкент, ул. Шота Руставели, 8',
    bankName: 'АКБ «Демо Банк»',
    mfo: '00440',
    account: '20208000100987654003',
  },
};

export const RECENT_EXPORTERS = [
  {
    name: 'Shenzhen Tech Co., Ltd',
    country: 'Китай',
    address: 'Shenzhen, Nanshan District, Keji Rd 12',
  },
  { name: 'Istanbul Tekstil A.Ş.', country: 'Турция', address: 'Istanbul, Bağcılar, Mahmutbey 4' },
  { name: 'Dubai Parts FZE', country: 'ОАЭ', address: 'Dubai, Jebel Ali Free Zone, LOB 15' },
];

export function companyPatch(key: string, c: Company): Form {
  if (key === 'declarantInn') return { declarantName: c.name };
  return {
    importerName: c.name,
    importerAddress: c.address,
    bankName: c.bankName,
    mfo: c.mfo,
    account: c.account,
  };
}

const REGIME_BY_DIRECTION: Record<string, string> = { IM: '40', EK: '10', TR: '80' };
const INNER_MODES = ['20', '30', '40'];

export function smartPatch(key: string, value: string, form: Form): Form {
  const p: Form = {};
  const empty = (k: string) => !(form[k] ?? '').trim();
  if (key === 'direction') {
    if (REGIME_BY_DIRECTION[value]) p.regime = REGIME_BY_DIRECTION[value];
    if (value === 'EK') {
      if (form.originCountry !== 'Узбекистан') p.originCountry = 'Узбекистан';
      if (form.destCountry === 'Узбекистан') p.destCountry = '';
    }
    if (value === 'IM') {
      if (empty('destCountry')) p.destCountry = 'Узбекистан';
      if (form.originCountry === 'Узбекистан') p.originCountry = '';
    }
  }
  if (key === 'borderMode' && empty('innerMode'))
    p.innerMode = INNER_MODES.includes(value) ? value : '30';
  if (key === 'exporterCountry') {
    if (empty('originCountry')) p.originCountry = value;
    if (empty('tradeCountry')) p.tradeCountry = value;
  }
  if (key === 'regDate' && empty('acceptDate')) p.acceptDate = value;
  if (key === 'contractNo' && empty('passportNo') && value)
    p.passportNo = `PS-${value.replace(/\W/g, '')}`;
  Object.keys(p).forEach((k) => (form[k] ?? '') === p[k] && delete p[k]);
  return p;
}

export const SECTION_TITLES: Record<string, string> = {
  ...Object.fromEntries(FORM_SECTIONS.map((s) => [s.key, s.title])),
  goods: 'Товары',
  payments: 'Платежи',
  docs: 'Документы',
};

export const sectionTitle = (key: string) => SECTION_TITLES[key] ?? key;

export const ALL_FIELDS = FORM_SECTIONS.flatMap((s) =>
  s.groups.flatMap((g) => g.fields.map((f) => ({ ...f, section: s.key, group: g })))
);

export const fieldDef = (key: string) => ALL_FIELDS.find((f) => f.key === key);

export const fieldLabel = (key: string) => fieldDef(key)?.label ?? key;

export interface Problem {
  section: string;
  field?: string;
  text: string;
}

export function validateAll(ctx: Ctx, docs: GtdDoc[]): Problem[] {
  const out: Problem[] = [];
  ALL_FIELDS.forEach((f) => {
    if (f.type === 'computed') return;
    const v = (ctx.form[f.key] ?? '').trim();
    if (f.required && !v)
      out.push({ section: f.section, field: f.key, text: `Заполните «${f.label}»` });
    else if (v && f.validate) {
      const e = f.validate(v, ctx);
      if (e) out.push({ section: f.section, field: f.key, text: e });
    }
  });
  if (!ctx.items.length) out.push({ section: 'goods', text: 'Добавьте хотя бы один товар' });
  ctx.items.forEach((i, n) =>
    validateItem(i, n + 1, ctx.form).forEach((x) => out.push({ section: 'goods', ...x }))
  );
  if (!docs.some((d) => d.code === '02'))
    out.push({ section: 'docs', text: 'Приложите инвойс (код 02)' });
  return out;
}

export function payments(ctx: Ctx) {
  const rate = RATES[(ctx.form.currency as keyof typeof RATES) || 'USD'] ?? RATES.USD;
  const all = ctx.items.flatMap((i) => itemCharges(i, ctx.form));
  const by = (k: string) => all.filter((c) => c.kind === k).reduce((s, c) => s + c.sum, 0);
  const fee = by('10');
  const duty = by('20');
  const excise = by('27');
  const vat = by('29');
  const total = all.reduce((s, c) => s + c.sum, 0);
  return {
    base: itemsValue(ctx.items) * rate,
    fee,
    duty,
    excise,
    vat,
    other: total - fee - duty - excise - vat,
    total,
  };
}

export const DOC_CODES: Option[] = [
  { value: '01', label: '01 Контракт' },
  { value: '02', label: '02 Инвойс' },
  { value: '03', label: '03 Транспортная накладная' },
  { value: '04', label: '04 Сертификат происхождения' },
  { value: '05', label: '05 Сертификат соответствия' },
  { value: '06', label: '06 Упаковочный лист' },
];

const today = () => new Date().toISOString().slice(0, 10);

export const EMPTY_FORM = (): Form => ({
  direction: 'IM',
  regime: '40',
  p3t1: 'auto',
  destCountry: 'Узбекистан',
  currency: 'USD',
  dealNature: '01',
});

export const SAMPLE_FORM = (): Form => ({
  ...EMPTY_FORM(),
  places: '3',
  post: '26002',
  regDate: today(),
  acceptDate: today(),
  seq: '0000418',
  exporterName: 'Shenzhen Tech Co., Ltd',
  exporterCountry: 'Китай',
  exporterAddress: 'Shenzhen, Nanshan District, Keji Rd 12',
  importerName: 'ООО «Демо Импорт»',
  importerInn: '305123456',
  importerAddress: 'г. Ташкент, Юнусабадский р-н, ул. Амира Темура, 1',
  declarantName: 'ООО «Демо Брокер»',
  declarantInn: '306987654',
  originCountry: 'Китай',
  borderMode: '40',
  vehicleNo: 'HY-7731',
  incoterms: 'CPT',
  deliveryPlace: 'Ташкент',
  bankName: 'АКБ «Демо Банк»',
  mfo: '00440',
  account: '20208000900123456001',
  contractNo: 'SZ-2026/118',
  contractDate: '2026-08-20',
  invoiceNo: 'INV-2026-0451',
  signerName: 'Демо Пользователь',
  signerPosition: 'Декларант',
});

const ITEM_EXTRA = (net: string, extra: Record<string, string> = {}) => ({
  net,
  unit: '796',
  proc: '40',
  purpose: '0',
  gov: '01',
  places: '1',
  packCode: 'CT',
  packKind: 'Коробки картонные',
  maker: 'Shenzhen Tech Co., Ltd',
  makerCountry: 'Китай',
  year: '2026',
  ...extra,
});

export const SAMPLE_ITEMS = (): Omit<GtdItem, 'id'>[] => [
  {
    name: 'Смартфон, 128 ГБ',
    hs: '8517130000',
    origin: 'Китай',
    qty: 20,
    weight: 8.4,
    value: 3600,
    extra: ITEM_EXTRA('7.6', { brand: 'Demo', model: 'X1', energy: 'A' }),
  },
  {
    name: 'Беспроводные наушники',
    hs: '8518300000',
    origin: 'Китай',
    qty: 50,
    weight: 7.5,
    value: 1100,
    extra: ITEM_EXTRA('6.2', { brand: 'Demo', model: 'Buds 2' }),
  },
  {
    name: 'Монитор 27"',
    hs: '8528521000',
    origin: 'Китай',
    qty: 10,
    weight: 65,
    value: 1400,
    extra: ITEM_EXTRA('58', { brand: 'Demo', model: 'M27', energy: 'B' }),
  },
];

export const SAMPLE_DOCS = (): Omit<GtdDoc, 'id'>[] => [
  { code: '01', number: 'SZ-2026/118', date: '2026-08-20' },
  { code: '02', number: 'INV-2026-0451', date: '2026-09-28' },
  { code: '03', number: 'AWB 784-11223344', date: '2026-09-30' },
];
