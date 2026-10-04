import {
  AlarmClock,
  BadgeCheck,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CircleHelp,
  ClipboardList,
  FileText,
  FilePen,
  FolderOpen,
  Home,
  Layers,
  MessageSquare,
  ScanText,
  Calculator,
  ShieldCheck,
  UserSearch,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { I18nKey } from '@/app/i18n';

export interface NavItem {
  key: string;
  path: string;
  icon: LucideIcon;
  label?: I18nKey;
  text?: string;
}

export const USER_NAV: Record<string, NavItem> = {
  dashboard: { key: 'dashboard', path: '/', icon: Home, label: 'nav_dashboard' },
  applications: {
    key: 'applications',
    path: '/applications',
    icon: FileText,
    label: 'nav_applications',
  },
  tools: { key: 'tools', path: '/tools/calculator', icon: Wrench, label: 'nav_tools' },
  aziza: { key: 'aziza', path: '/aziza', icon: Bot, label: 'nav_aziza' },
  finance: { key: 'finance', path: '/finance', icon: Wallet, label: 'nav_finance' },
  documents: { key: 'documents', path: '/documents', icon: FolderOpen, label: 'nav_documents' },
};

export const USER_EXTRA: NavItem[] = [
  { key: 'help', path: '/help', icon: CircleHelp, label: 'nav_help' },
];

const d = (slug: string, text: string, icon: LucideIcon): NavItem => ({
  key: `d-${slug || 'workspace'}`,
  path: slug ? `/declarant/${slug}` : '/declarant',
  icon,
  text,
});

export const DECLARANT_MAIN: NavItem[] = [
  d('', 'Рабочее место', ClipboardList),
  d('applications', 'Заявки', ClipboardList),
  d('declarations', 'Мои декларации', FileText),
  d('ocr', 'OCR Модуль', ScanText),
  d('communications', 'Коммуникации', MessageSquare),
  d('finance', 'Финансы', Wallet),
];

export const DECLARANT_EXTRA: NavItem[] = [
  d('learning', 'Обучение', CircleHelp),
  d('help', 'Помощь', CircleHelp),
];

export interface NavGroup {
  key: string;
  text: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const DECLARANT_GROUPS: NavGroup[] = [
  {
    key: 'support',
    text: 'Сопровождение',
    icon: Briefcase,
    items: [
      d('proposals', 'Предложения', AlarmClock),
      d('assigned', 'Назначенные контракты', FilePen),
      d('data-check', 'Проверка данных', ShieldCheck),
      d('inspections', 'Досмотры', UserSearch),
      d('certification', 'Сертификация', BadgeCheck),
    ],
  },
  {
    key: 'data',
    text: 'Данные и инструменты',
    icon: BookOpen,
    items: [
      d('overview', 'Обзор', Home),
      d('companies', 'Компании', Building2),
      d('goods', 'Товары', Layers),
      d('references', 'Справочники', BookOpen),
      d('calculator', 'Калькулятор', Calculator),
    ],
  },
  {
    key: 'aziza',
    text: 'Азиза',
    icon: Bot,
    items: [d('ai', 'AI-ассистент', Bot), d('tasks', 'Задачи Азизы', AlarmClock)],
  },
];

export const DECLARANT_ALL: NavItem[] = [
  ...DECLARANT_MAIN,
  ...DECLARANT_GROUPS.flatMap((g) => g.items),
  ...DECLARANT_EXTRA,
];

export function sectionOf(pathname: string): string {
  const seg = pathname.split('/')[1] ?? '';
  return seg === '' ? 'dashboard' : seg;
}
