import { Chip } from '@mui/material';
import type { AppStatus, AppType } from '@/types';

export const STATUS_LABEL: Record<AppStatus, string> = {
  pending: 'Ожидает',
  progress: 'В работе',
  done: 'Завершена',
  cancelled: 'Отменена',
};
export const TYPE_LABEL: Record<AppType, string> = {
  customs: 'Таможенное оформление',
  consult: 'Консультация',
  cert: 'Сертификация',
  calc: 'Расчёт платежей',
  delivery: 'Доставка груза',
};

const COLORS: Record<AppStatus, { bg: string; fg: string }> = {
  pending: { bg: '#fef3c7', fg: '#854d0e' },
  progress: { bg: '#dbeafe', fg: '#1e40af' },
  done: { bg: '#dcfce7', fg: '#166534' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b' },
};

export function StatusChip({ status }: { status: AppStatus }) {
  return (
    <Chip
      size='small'
      label={STATUS_LABEL[status]}
      sx={{ bgcolor: COLORS[status].bg, color: COLORS[status].fg, height: 22 }}
    />
  );
}

export function TypeChip({ type }: { type: AppType }) {
  return <Chip size='small' variant='outlined' label={TYPE_LABEL[type]} sx={{ height: 22 }} />;
}

export function ToneChip({
  label,
  tone,
}: {
  label: string;
  tone: 'green' | 'yellow' | 'blue' | 'red' | 'gray';
}) {
  const map = {
    green: COLORS.done,
    yellow: COLORS.pending,
    blue: COLORS.progress,
    red: COLORS.cancelled,
    gray: { bg: '#f3f4f6', fg: '#4b5563' },
  };
  return (
    <Chip
      size='small'
      label={label}
      sx={{ bgcolor: map[tone].bg, color: map[tone].fg, height: 22 }}
    />
  );
}
