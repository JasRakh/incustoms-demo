import { Box, Button, ButtonBase, Card, Stack, Typography } from '@mui/material';
import {
  AlarmClock,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  FileText,
  Inbox,
  MessageSquare,
  Plus,
  UserSearch,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store';
import { PageHeader } from '@/components/common/PageHeader';
import { fmtDateTime, num } from '@/lib/format';
import type { DeclStatus } from '@/types';
import { STATUS, StatusChip } from '@/pages/declarant/gtd/status';
import { buildDeclaration } from '@/pages/declarant/gtd/useGtd';

const QUEUE = 64;
const IN_WORK = 0;

const FINALIZE: DeclStatus[] = [
  'new',
  'draft',
  'in_work',
  'validation',
  'checked',
  'to_export',
  'error',
];
const GROUPS: { label: string; statuses: DeclStatus[] }[] = [
  { label: 'Черновики', statuses: ['new', 'draft', 'in_work'] },
  { label: 'На проверке', statuses: ['validation'] },
  { label: 'Готовы к отправке', statuses: ['checked', 'to_export'] },
  { label: 'С ошибками', statuses: ['error', 'rejected'] },
  { label: 'Поданы', statuses: ['submitted', 'accepted'] },
];

const DAY = 86_400_000;

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  onClick: () => void;
}) {
  const zero = value === 0;
  return (
    <Card
      component={ButtonBase}
      onClick={onClick}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        textAlign: 'left',
        borderRadius: 3,
        transition: 'border-color .15s',
        '&:hover': { borderColor: 'primary.main' },
        '&:hover .go': { color: 'primary.main', transform: 'translateX(2px)' },
        '&.Mui-focusVisible': { outline: '2px solid #2f6fed', outlineOffset: 2 },
      }}
    >
      <Stack direction='row' spacing={1} alignItems='center' sx={{ color: 'text.secondary' }}>
        <Icon size={16} />
        <Typography variant='body2' sx={{ flex: 1, fontWeight: 500 }}>
          {label}
        </Typography>
        <Box className='go' sx={{ display: 'flex', transition: 'transform .15s, color .15s' }}>
          <ArrowRight size={16} />
        </Box>
      </Stack>
      <Typography
        sx={{
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1.2,
          mt: 1,
          color: zero ? 'text.disabled' : 'text.primary',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      <Typography variant='caption' color='text.secondary'>
        {hint}
      </Typography>
    </Card>
  );
}

function Quiet({
  icon: Icon,
  label,
  text,
  action,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <Card sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction='row' spacing={1.5} alignItems='center'>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'action.hover',
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={17} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant='body2' fontWeight={600}>
            {label}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {text}
          </Typography>
        </Box>
        <Button
          size='small'
          endIcon={<ArrowRight size={14} />}
          onClick={onClick}
          sx={{ flexShrink: 0 }}
        >
          {action}
        </Button>
      </Stack>
    </Card>
  );
}

export function WorkspacePage() {
  const { state, update } = useStore();
  const nav = useNavigate();
  const decls = state.declarations;
  const toFinalize = decls.filter((d) => FINALIZE.includes(d.status)).length;
  const unread = state.dialogs.reduce((s, d) => s + (d.unread ?? 0), 0);
  const recent = [...decls].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const now = Date.now();
  const events = decls
    .filter((d) => FINALIZE.includes(d.status))
    .map((d) => ({ d, at: new Date(d.createdAt).getTime() + 7 * DAY }))
    .filter((e) => e.at >= now - DAY && e.at <= now + 7 * DAY)
    .sort((a, b) => a.at - b.at)
    .slice(0, 5);

  const go = (to: string) => nav(`/declarant${to}`);
  const create = () => {
    const d = buildDeclaration('blank');
    update((s) => {
      s.declarations.unshift(d);
    });
    go(`/declarations/${d.id}`);
  };

  return (
    <>
      <PageHeader
        title='Рабочее место'
        subtitle='Заявки, декларации, досмотры, сертификация и переписка'
        actions={
          <Stack direction='row' spacing={1}>
            <Button variant='outlined' startIcon={<Plus size={16} />} onClick={create}>
              Новая ГТД
            </Button>
            <Button
              variant='contained'
              endIcon={<ArrowRight size={16} />}
              onClick={() => go('/declarations')}
            >
              Мои декларации
            </Button>
          </Stack>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
          mb: 2,
        }}
      >
        <Tile
          icon={FileText}
          label='Декларации'
          value={toFinalize}
          hint='к финализации'
          onClick={() => go('/declarations')}
        />
        <Tile
          icon={Inbox}
          label='Очередь заявок'
          value={QUEUE}
          hint='свободные заявки — можно взять'
          onClick={() => go('/applications')}
        />
        <Tile
          icon={Briefcase}
          label='Заявки в работе'
          value={IN_WORK}
          hint='возьмите заявку из очереди'
          onClick={() => go('/applications')}
        />
        <Tile
          icon={MessageSquare}
          label='Переписка'
          value={unread}
          hint='непрочитанные сообщения'
          onClick={() => go('/communications')}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
          gap: 2,
          mb: 2,
          alignItems: 'start',
        }}
      >
        <Card sx={{ borderRadius: 3 }}>
          <Stack direction='row' alignItems='center' sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
            <Typography variant='h4' sx={{ flex: 1 }}>
              Последние декларации
            </Typography>
            <Button
              size='small'
              endIcon={<ArrowRight size={14} />}
              onClick={() => go('/declarations')}
            >
              Все декларации
            </Button>
          </Stack>
          <Stack direction='row' sx={{ px: 2.5, pb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            {GROUPS.map((g) => {
              const n = decls.filter((d) => g.statuses.includes(d.status)).length;
              return (
                <Box
                  key={g.label}
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    fontSize: 13,
                    color: n ? 'text.primary' : 'text.disabled',
                  }}
                >
                  {g.label}{' '}
                  <Box component='span' sx={{ fontWeight: 700 }}>
                    {n}
                  </Box>
                </Box>
              );
            })}
          </Stack>
          {recent.length === 0 ? (
            <Stack
              alignItems='center'
              spacing={1.5}
              sx={{ py: 5, borderTop: 1, borderColor: 'divider' }}
            >
              <Typography color='text.secondary'>Деклараций пока нет</Typography>
              <Button variant='outlined' startIcon={<Plus size={16} />} onClick={create}>
                Создать ГТД
              </Button>
            </Stack>
          ) : (
            recent.map((d) => (
              <ButtonBase
                key={d.id}
                onClick={() => go(`/declarations/${d.id}`)}
                sx={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr) auto',
                    sm: 'minmax(0, 1.4fr) minmax(0, 1fr) auto',
                  },
                  gap: 2,
                  alignItems: 'center',
                  textAlign: 'left',
                  px: 2.5,
                  py: 1.25,
                  borderTop: 1,
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant='body2' fontWeight={600} noWrap>
                    {d.orderNo ? `ГТД ${d.orderNo}` : 'Новая декларация'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' noWrap component='div'>
                    {[d.exporter, d.importer].filter(Boolean).join(' → ') || 'Участники не указаны'}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant='body2' sx={{ fontVariantNumeric: 'tabular-nums' }} noWrap>
                    {d.goods} поз. · {num(d.amount, 0)} USD
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {fmtDateTime(d.updatedAt)}
                  </Typography>
                </Box>
                <StatusChip status={d.status} />
              </ButtonBase>
            ))
          )}
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <Stack direction='row' spacing={1} alignItems='center' sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
            <Box sx={{ color: 'text.secondary', display: 'flex' }}>
              <CalendarDays size={17} />
            </Box>
            <Typography variant='h4'>Ближайшие 7 дней</Typography>
          </Stack>
          {events.length === 0 ? (
            <Typography variant='body2' color='text.secondary' sx={{ px: 2.5, pb: 2.5 }}>
              Событий нет
            </Typography>
          ) : (
            events.map(({ d, at }) => {
              const days = Math.ceil((at - now) / DAY);
              return (
                <ButtonBase
                  key={d.id}
                  onClick={() => go(`/declarations/${d.id}`)}
                  sx={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    px: 2.5,
                    py: 1.25,
                    borderTop: 1,
                    borderColor: 'divider',
                    textAlign: 'left',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      flexShrink: 0,
                      textAlign: 'center',
                      py: 0.5,
                      borderRadius: 1.5,
                      bgcolor: days <= 2 ? 'rgba(239,68,68,.08)' : 'action.hover',
                      color: days <= 2 ? 'error.main' : 'text.secondary',
                    }}
                  >
                    <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                      {new Date(at).getDate()}
                    </Typography>
                    <Typography sx={{ fontSize: 10 }}>
                      {new Date(at).toLocaleDateString('ru-RU', { month: 'short' })}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='body2' fontWeight={500} noWrap>
                      Подать {d.orderNo ? `ГТД ${d.orderNo}` : 'новую ГТД'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {days <= 0 ? 'сегодня' : `через ${days} дн.`} · {STATUS[d.status].label}
                    </Typography>
                  </Box>
                </ButtonBase>
              );
            })
          )}
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <Quiet
          icon={AlarmClock}
          label='Предложения с дедлайном'
          text='Предложений нет'
          action='Открыть'
          onClick={() => go('/proposals')}
        />
        <Quiet
          icon={UserSearch}
          label='Досмотры'
          text='Активных досмотров нет'
          action='Открыть'
          onClick={() => go('/inspections')}
        />
        <Quiet
          icon={BadgeCheck}
          label='Сертификация'
          text='Заявок на решении нет'
          action='Открыть'
          onClick={() => go('/certification')}
        />
      </Box>
    </>
  );
}
