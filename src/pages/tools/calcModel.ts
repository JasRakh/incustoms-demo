export interface Position {
  id: string;
  name: string;
  hs: string;
  qty: number;
  unitPrice: number;
  weight: number;
}

export interface Costs {
  freight: number;
  insurance: number;
  broker: number;
  storage: number;
  certification: number;
  delivery: number;
  other: number;
  bankPct: number;
  financePct: number;
  base: 'value' | 'weight' | 'qty';
  origin: 'none' | 'st1' | 'forma';
}

export interface CalcState {
  docType: 'invoice' | 'pricelist' | 'order';
  currency: 'USD' | 'EUR' | 'CNY' | 'RUB';
  fileName?: string;
  positions: Position[];
  costs: Costs;
  step: 0 | 1;
}

export const RATES: Record<CalcState['currency'], number> = { USD: 12800, EUR: 13900, CNY: 1780, RUB: 150 };

const HS_RATES: Record<string, { duty: number; excise: number; label: string }> = {
  '8517': { duty: 0, excise: 0, label: 'Телефоны и смартфоны' },
  '8471': { duty: 0, excise: 0, label: 'Компьютеры' },
  '8518': { duty: 5, excise: 0, label: 'Наушники, акустика' },
  '8528': { duty: 10, excise: 0, label: 'Мониторы и ТВ' },
  '6403': { duty: 20, excise: 0, label: 'Обувь' },
  '6109': { duty: 20, excise: 0, label: 'Одежда трикотажная' },
  '3304': { duty: 10, excise: 0, label: 'Косметика' },
  '2204': { duty: 30, excise: 20, label: 'Вино' },
  '8708': { duty: 5, excise: 0, label: 'Автозапчасти' },
};

export function hsInfo(hs: string) {
  const key = hs.replace(/\D/g, '').slice(0, 4);
  return HS_RATES[key] ?? null;
}

export const emptyCosts: Costs = { freight: 0, insurance: 0, broker: 0, storage: 0, certification: 0, delivery: 0, other: 0, bankPct: 0, financePct: 0, base: 'value', origin: 'none' };

export const SAMPLE_POSITIONS: Omit<Position, 'id'>[] = [
  { name: 'Смартфон, 128 ГБ', hs: '8517 13 000 0', qty: 20, unitPrice: 180, weight: 0.4 },
  { name: 'Беспроводные наушники', hs: '8518 30 000 0', qty: 50, unitPrice: 22, weight: 0.15 },
  { name: 'Монитор 27"', hs: '8528 52 100 0', qty: 10, unitPrice: 140, weight: 6.5 },
];

export interface LineResult {
  p: Position;
  goods: number;
  customsValue: number;
  dutyRate: number;
  exciseRate: number;
  duty: number;
  excise: number;
  vat: number;
  fee: number;
  logistics: number;
  extra: number;
  landed: number;
  unitCost: number;
  hsKnown: boolean;
}

export interface CalcResult {
  lines: LineResult[];
  goods: number;
  logistics: number;
  payments: number;
  landed: number;
  totals: { duty: number; excise: number; vat: number; fee: number; extra: number };
}

export function calculate(s: CalcState): CalcResult {
  const pos = s.positions.filter(p => p.qty > 0 && p.unitPrice > 0);
  const goodsOf = (p: Position) => p.qty * p.unitPrice;
  const baseOf = (p: Position) => (s.costs.base === 'value' ? goodsOf(p) : s.costs.base === 'weight' ? p.weight * p.qty : p.qty);
  const totalBase = pos.reduce((a, p) => a + baseOf(p), 0) || 1;
  const c = s.costs;
  const border = c.freight + c.insurance;
  const inner = c.broker + c.storage + c.certification + c.delivery + c.other;
  const lines = pos.map<LineResult>(p => {
    const share = baseOf(p) / totalBase;
    const goods = goodsOf(p);
    const info = hsInfo(p.hs);
    let dutyRate = info?.duty ?? 10;
    if (c.origin === 'st1') dutyRate = 0;
    if (c.origin === 'forma') dutyRate = dutyRate * 0.75;
    const exciseRate = info?.excise ?? 0;
    const customsValue = goods + border * share;
    const duty = customsValue * dutyRate / 100;
    const excise = customsValue * exciseRate / 100;
    const vat = (customsValue + duty + excise) * 0.12;
    const fee = customsValue * 0.002;
    const extra = inner * share + goods * (c.bankPct + c.financePct) / 100;
    const landed = customsValue + duty + excise + vat + fee + extra;
    return { p, goods, customsValue, dutyRate, exciseRate, duty, excise, vat, fee, logistics: border * share, extra, landed, unitCost: landed / p.qty, hsKnown: !!info };
  });
  const sum = (f: (l: LineResult) => number) => lines.reduce((a, l) => a + f(l), 0);
  return {
    lines,
    goods: sum(l => l.goods),
    logistics: sum(l => l.logistics) + sum(l => l.extra),
    payments: sum(l => l.duty + l.excise + l.vat + l.fee),
    landed: sum(l => l.landed),
    totals: { duty: sum(l => l.duty), excise: sum(l => l.excise), vat: sum(l => l.vat), fee: sum(l => l.fee), extra: sum(l => l.extra) },
  };
}
