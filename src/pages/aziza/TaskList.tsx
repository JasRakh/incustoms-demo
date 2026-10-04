import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Sparkles, Trash2, AlarmClock } from 'lucide-react';
import type { Task } from '@/types';
import { fmtShort, today } from '@/lib/format';
import { useTasks } from '@/pages/aziza/useTasks';
import { EmptyState } from '@/components/common/EmptyState';

const PRIO = {
  high: { l: 'Высокий', bg: '#fee2e2', fg: '#991b1b' },
  mid: { l: 'Средний', bg: '#fef3c7', fg: '#854d0e' },
  low: { l: 'Низкий', bg: '#f3f4f6', fg: '#4b5563' },
};

export function TaskRow({ x, compact }: { x: Task; compact?: boolean }) {
  const { toggle, delegate, remove } = useTasks();
  const overdue = x.status !== 'done' && x.due < today();
  return (
    <Box
      component='li'
      sx={{
        listStyle: 'none',
        display: 'flex',
        gap: 1.25,
        alignItems: 'flex-start',
        p: compact ? 1.25 : 1.75,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        mb: 1,
        bgcolor: 'background.paper',
      }}
    >
      <Checkbox
        checked={x.status === 'done'}
        disabled={x.status === 'aziza'}
        onChange={() => toggle(x.id)}
        inputProps={{ 'aria-label': `Выполнено: ${x.title}` }}
        color='success'
        sx={{ p: 0.25, mt: '-2px' }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 500,
            textDecoration: x.status === 'done' ? 'line-through' : 'none',
            color: x.status === 'done' ? 'text.secondary' : 'text.primary',
          }}
        >
          {x.title}
        </Typography>
        <Stack
          direction='row'
          spacing={1}
          alignItems='center'
          sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}
        >
          {!compact && (
            <Chip
              size='small'
              label={PRIO[x.priority].l}
              sx={{ height: 20, bgcolor: PRIO[x.priority].bg, color: PRIO[x.priority].fg }}
            />
          )}
          <Typography variant='caption' color='text.secondary'>
            Срок: {fmtShort(x.due)}
          </Typography>
          {overdue && (
            <Typography variant='caption' sx={{ color: 'error.main', fontWeight: 600 }}>
              просрочено
            </Typography>
          )}
        </Stack>
        {x.result && !compact && (
          <Box
            sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: 'rgba(47,111,237,.08)', fontSize: 13 }}
          >
            Азиза: {x.result}
          </Box>
        )}
        {x.status === 'aziza' && (
          <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            sx={{ mt: 1, color: 'primary.main' }}
          >
            <CircularProgress size={14} />
            <Typography variant='caption'>Азиза выполняет…</Typography>
          </Stack>
        )}
        {compact && x.status === 'todo' && (
          <Button
            size='small'
            startIcon={<Sparkles size={14} />}
            onClick={() => delegate(x.id)}
            sx={{ mt: 0.5, ml: -1 }}
          >
            Поручить Азизе
          </Button>
        )}
      </Box>
      {!compact && (
        <Stack direction='row' spacing={0.5} alignItems='center'>
          {x.status === 'todo' && (
            <Button
              size='small'
              variant='outlined'
              startIcon={<Sparkles size={14} />}
              onClick={() => delegate(x.id)}
            >
              Поручить Азизе
            </Button>
          )}
          <Tooltip title='Удалить'>
            <IconButton
              size='small'
              aria-label={`Удалить: ${x.title}`}
              onClick={() => remove(x.id)}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
}

export function TaskList({ items, compact }: { items: Task[]; compact?: boolean }) {
  if (!items.length)
    return (
      <EmptyState
        icon={<AlarmClock size={28} />}
        title='Задач нет'
        text='Поручите Азизе рутину: проверить статус, собрать документы, напомнить о сроках.'
      />
    );
  return (
    <Box component='ul' sx={{ p: 0, m: 0 }}>
      {items.map((x) => (
        <TaskRow key={x.id} x={x} compact={compact} />
      ))}
    </Box>
  );
}
