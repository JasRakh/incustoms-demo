import { Chip } from '@mui/material';
import type { DeclStatus } from '@/types';

const TONES = {
  gray: { bg: '#f1f5f9', fg: '#334155' },
  blue: { bg: '#dbeafe', fg: '#1e40af' },
  indigo: { bg: '#e0e7ff', fg: '#3730a3' },
  amber: { bg: '#fef3c7', fg: '#854d0e' },
  green: { bg: '#dcfce7', fg: '#166534' },
  red: { bg: '#fee2e2', fg: '#991b1b' },
  purple: { bg: '#f3e8ff', fg: '#6b21a8' },
};

export const STATUS_BASE: Record<DeclStatus, { label: string; bg: string; fg: string }> = {
  new: { label: 'Новая', ...TONES.blue },
  draft: { label: 'Черновик', ...TONES.gray },
  in_work: { label: 'В работе', ...TONES.amber },
  validation: { label: 'Валидация', ...TONES.amber },
  checked: { label: 'Проверено', ...TONES.indigo },
  to_export: { label: 'К экспорту', ...TONES.purple },
  export: { label: 'Экспорт', ...TONES.purple },
  submitted: { label: 'Подано', ...TONES.blue },
  accepted: { label: 'Принято', ...TONES.indigo },
  released: { label: 'Выпущено', ...TONES.green },
  completed: { label: 'Завершено', ...TONES.green },
  rejected: { label: 'Отклонено', ...TONES.red },
  error: { label: 'Ошибка', ...TONES.red },
  ktd: { label: 'КТД', ...TONES.gray },
};

export const STATUS = new Proxy(STATUS_BASE, {
  get: (t, k: string) => t[k as DeclStatus] ?? t.draft,
}) as typeof STATUS_BASE;

export function StatusChip({ status }: { status: DeclStatus }) {
  const s = STATUS[status];
  return (
    <Chip
      size='small'
      label={s.label}
      sx={{ bgcolor: s.bg, color: s.fg, height: 24, fontWeight: 600 }}
    />
  );
}
