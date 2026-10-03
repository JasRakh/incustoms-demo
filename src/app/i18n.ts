import { useStore } from '@/app/store';

const ru = {
  nav_dashboard: 'Главная', nav_applications: 'Заявки', nav_tools: 'Инструменты', nav_aziza: 'Азиза', nav_finance: 'Финансы', nav_documents: 'Документы', nav_help: 'Помощь и обучение',
  nav_declarations: 'Декларации', nav_clients: 'Клиенты', nav_ais: 'АИС', nav_reports: 'Отчёты',
  menu: 'Меню', extra: 'Дополнительно', logout: 'Выйти', search: 'Поиск...', role_user: 'Физическое лицо', role_declarant: 'Декларант',
  reset_order: 'Сбросить порядок меню', toggle_sb: 'Свернуть меню', notifications: 'Уведомления', mark_all: 'Прочитать все', no_notifications: 'Нет уведомлений',
  profile: 'Профиль', theme_dark: 'Тёмная тема', theme_light: 'Светлая тема', switch_role: 'Сменить роль', tour: 'Обучающий тур', reset_demo: 'Сбросить демо-данные',
  lang_name: 'Русский', lang_other: "O'zbekcha", calculator: 'Калькулятор сделки', ocr: 'OCR → Excel', chat: 'Чат', tasks: 'Задачи', open_aziza: 'Открыть Азизу',
  menu_hint: 'Alt + ↑/↓ — изменить порядок', skip: 'Перейти к содержимому',
};
type Dict = typeof ru;
const uz: Dict = {
  nav_dashboard: 'Bosh sahifa', nav_applications: 'Arizalar', nav_tools: 'Vositalar', nav_aziza: 'Aziza', nav_finance: 'Moliya', nav_documents: 'Hujjatlar', nav_help: "Yordam va o'qitish",
  nav_declarations: 'Deklaratsiyalar', nav_clients: 'Mijozlar', nav_ais: 'AIS', nav_reports: 'Hisobotlar',
  menu: 'Menyu', extra: "Qo'shimcha", logout: 'Chiqish', search: 'Qidiruv...', role_user: 'Jismoniy shaxs', role_declarant: 'Deklarant',
  reset_order: 'Menyu tartibini tiklash', toggle_sb: "Menyuni yig'ish", notifications: 'Bildirishnomalar', mark_all: "Barchasini o'qish", no_notifications: "Bildirishnomalar yo'q",
  profile: 'Profil', theme_dark: "Qorong'i mavzu", theme_light: "Yorug' mavzu", switch_role: "Rolni o'zgartirish", tour: "O'quv turi", reset_demo: "Demo ma'lumotlarni tiklash",
  lang_name: "O'zbekcha", lang_other: 'Русский', calculator: 'Bitim kalkulyatori', ocr: 'OCR → Excel', chat: 'Chat', tasks: 'Vazifalar', open_aziza: 'Azizani ochish',
  menu_hint: "Alt + ↑/↓ — tartibni o'zgartirish", skip: "Asosiy qismga o'tish",
};

export type I18nKey = keyof Dict;

export function useT() {
  const { state } = useStore();
  const dict = state.lang === 'uz' ? uz : ru;
  return (k: I18nKey) => dict[k] ?? ru[k] ?? k;
}
