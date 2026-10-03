import type { State } from '@/types';

const day = (offset: number, time = '10:00') => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.toISOString().slice(0, 10)}T${time}:00`;
};

export const MENU_DEFAULT = ['dashboard', 'applications', 'tools', 'aziza', 'finance', 'documents'];

export function initialState(): State {
  return {
    lang: 'ru',
    mode: 'light',
    role: 'user',
    loggedIn: true,
    onboarded: false,
    collapsed: false,
    menuOrder: [...MENU_DEFAULT],
    profile: { name: 'Демо Пользователь', email: 'demo@example.com', phone: '+998 90 000 00 00' },
    nextAppId: 124,
    applications: [
      {
        id: '123', title: 'Растаможка посылки с электроникой', description: 'Ноутбук и наушники, 2 места, 3,1 кг, $1 240',
        type: 'customs', status: 'pending', createdAt: day(0, '12:58'), needDocs: false,
        history: [{ status: 'pending', at: day(0, '12:58') }],
      },
      {
        id: '118', title: 'Растаможка посылки из Китая', description: 'Электроника, 2 места, общий вес 3,4 кг, стоимость $640',
        type: 'customs', status: 'progress', createdAt: day(-4, '16:40'), needDocs: true,
        history: [{ status: 'pending', at: day(-4, '16:40') }, { status: 'progress', at: day(-4, '17:05') }],
      },
      {
        id: '112', title: 'Консультация по ввозу автомобиля', description: 'Расчёт платежей для автомобиля 2022 г.в., двигатель 2.0',
        type: 'consult', status: 'done', createdAt: day(-12, '10:15'), needDocs: false,
        history: [{ status: 'pending', at: day(-12, '10:15') }, { status: 'progress', at: day(-12, '10:40') }, { status: 'done', at: day(-11, '15:20') }],
      },
    ],
    dialogs: [
      {
        id: 'd1', channel: 'internal', title: 'Заявка №118 — декларант', contact: 'Дилноза, декларант', archived: false, unread: 1,
        messages: [
          { id: 'm1', from: 'them', text: 'Здравствуйте! Я ваш декларант Дилноза.', at: day(-4, '17:05') },
          { id: 'm2', from: 'them', text: 'По заявке №118 нужен инвойс или чек о покупке. Загрузите его, пожалуйста, — и я продолжу оформление.', at: day(-4, '17:06') },
        ],
      },
      {
        id: 'd2', channel: 'email', title: 'Подтверждение стоимости товара', contact: 'seller@example.com', archived: false, unread: 0,
        messages: [
          { id: 'm3', from: 'me', text: 'Добрый день! Пришлите, пожалуйста, инвойс по заказу #4471.', at: day(-3, '09:12') },
          { id: 'm4', from: 'them', text: 'Инвойс во вложении.', at: day(-3, '11:40'), attachment: 'invoice_4471.pdf' },
        ],
      },
      {
        id: 'd3', channel: 'telegram', title: 'Доставка груза до Ташкента', contact: '@logistics_demo', archived: false, unread: 2,
        messages: [
          { id: 'm5', from: 'them', text: 'Груз прибыл на СВХ, ожидаем оформления.', at: day(-1, '18:02') },
          { id: 'm6', from: 'them', text: 'Нужна информация о получателе для пропуска.', at: day(-1, '18:03') },
        ],
      },
      {
        id: 'd4', channel: 'email', title: 'Сертификат происхождения', contact: 'cert@example.com', archived: true, unread: 0,
        messages: [{ id: 'm7', from: 'them', text: 'Сертификат СТ-1 выдан, оригинал отправлен курьером.', at: day(-20, '14:00') }],
      },
    ],
    customsRequests: [
      { id: 'R-2041', post: 'Ташкент-Авиа', subject: 'Уточнение кода ТН ВЭД для наушников', status: 'answered', at: day(-6) },
      { id: 'R-2057', post: 'Ташкент-ЖД', subject: 'Предварительное решение о классификации', status: 'sent', at: day(-1) },
    ],
    aziza: [
      { id: 'a0', from: 'bot', text: 'Здравствуйте! Я **Азиза** — AI-эксперт по таможне РУз.\nСпросите о ставках пошлин, кодах ТН ВЭД, графах ГТД или беспошлинных лимитах.', at: day(0, '09:00') },
    ],
    azizaSettings: { model: 'fast', knowledgeBase: true, style: 'short', country: '' },
    tasks: [
      { id: 't1', title: 'Проверить статус заявки №118', due: day(1).slice(0, 10), priority: 'high', status: 'todo' },
      { id: 't2', title: 'Подготовить список документов для ввоза авто', due: day(-1).slice(0, 10), priority: 'mid', status: 'todo' },
      { id: 't3', title: 'Рассчитать платежи по посылке из Китая', due: day(-2).slice(0, 10), priority: 'low', status: 'done', result: 'Платежи ≈ 0 сум — посылка в пределах льготы.' },
    ],
    invoices: [
      { id: 'INV-118', contract: 'Д-2026/118', title: 'Услуги декларанта по заявке №118', amount: 150000, dueDate: day(3).slice(0, 10), paid: false },
      { id: 'INV-112', contract: 'Д-2026/112', title: 'Консультация по ввозу автомобиля', amount: 90000, dueDate: day(-9).slice(0, 10), paid: true },
    ],
    payments: [
      { id: 'P-301', title: 'Оплата счёта INV-112', amount: 90000, at: day(-10, '15:30'), method: 'Банковская карта' },
    ],
    energy: [
      { id: 'e1', type: 'in', title: 'Пакет «Корпоративный»', amount: 3000, at: day(-14, '11:20') },
      { id: 'e2', type: 'out', title: 'AI-ассистент: запрос', amount: 1, at: day(-1, '13:21') },
      { id: 'e3', type: 'out', title: 'OCR: распознавание документа', amount: 2, at: day(-1, '12:56') },
    ],
    services: [
      { id: 's1', service: 'AI-ассистент', energy: 1, at: day(-1, '13:21') },
      { id: 's2', service: 'OCR → Excel', energy: 2, at: day(-1, '12:56') },
    ],
    files: [
      { id: 'f1', name: 'aziza-thread-export.pdf', ext: 'pdf', size: 42100, at: day(0, '08:21'), source: 'AI-ассистент' },
      { id: 'f2', name: 'Квитанция_INV-112.pdf', ext: 'pdf', size: 18400, at: day(-10, '15:31'), source: 'Финансы' },
      { id: 'f3', name: 'OCR_invoice_4471.xlsx', ext: 'xlsx', size: 23800, at: day(-3, '11:52'), source: 'OCR → Excel' },
    ],
    ocrOrders: [
      { id: 'o1', createdAt: day(-1, '12:56'), status: 'created', docs: [] },
    ],
    notifications: [
      { id: 'n1', text: 'Декларант запросил документы по заявке №118', at: day(-4, '17:06'), read: false, to: '/applications' },
      { id: 'n2', text: 'Выставлен счёт INV-118 на 150 000 сум', at: day(-4, '17:07'), read: false, to: '/finance?tab=invoices' },
      { id: 'n3', text: 'Заявка №112 завершена', at: day(-11, '15:20'), read: true, to: '/applications' },
    ],
    courses: { basics: [0, 1] },
  };
}
