import { Bot, FileText, FolderOpen, CircleHelp, Home, Wallet, Wrench, FileCheck2, Users, Database, BarChart3, type LucideIcon } from 'lucide-react';
import type { I18nKey } from '@/app/i18n';

export interface NavItem {
  key: string;
  path: string;
  icon: LucideIcon;
  label: I18nKey;
}

export const USER_NAV: Record<string, NavItem> = {
  dashboard: { key: 'dashboard', path: '/', icon: Home, label: 'nav_dashboard' },
  applications: { key: 'applications', path: '/applications', icon: FileText, label: 'nav_applications' },
  tools: { key: 'tools', path: '/tools/calculator', icon: Wrench, label: 'nav_tools' },
  aziza: { key: 'aziza', path: '/aziza', icon: Bot, label: 'nav_aziza' },
  finance: { key: 'finance', path: '/finance', icon: Wallet, label: 'nav_finance' },
  documents: { key: 'documents', path: '/documents', icon: FolderOpen, label: 'nav_documents' },
};

export const USER_EXTRA: NavItem[] = [{ key: 'help', path: '/help', icon: CircleHelp, label: 'nav_help' }];

export const DECLARANT_NAV: NavItem[] = [
  { key: 'd-dashboard', path: '/declarant', icon: Home, label: 'nav_dashboard' },
  { key: 'd-declarations', path: '/declarant/declarations', icon: FileCheck2, label: 'nav_declarations' },
  { key: 'd-clients', path: '/declarant/clients', icon: Users, label: 'nav_clients' },
  { key: 'd-ais', path: '/declarant/ais', icon: Database, label: 'nav_ais' },
  { key: 'd-reports', path: '/declarant/reports', icon: BarChart3, label: 'nav_reports' },
];

export function sectionOf(pathname: string): string {
  const seg = pathname.split('/')[1] ?? '';
  return seg === '' ? 'dashboard' : seg;
}
