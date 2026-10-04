import {
  Box,
  Button,
  Fab,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { Maximize2, Plus, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AzizaAvatar } from '@/components/common/AzizaAvatar';
import { ChatBubble } from '@/components/common/ChatBubble';
import { AZIZA_SUGGESTIONS, useAziza } from '@/pages/aziza/useAziza';
import { useTasks } from '@/pages/aziza/useTasks';
import { TaskList } from '@/pages/aziza/TaskList';
import { NewTaskDialog } from '@/pages/aziza/NewTaskDialog';
import { useT } from '@/app/i18n';

export function AzizaWidget() {
  const t = useT();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'chat' | 'tasks'>('chat');
  const [text, setText] = useState('');
  const [newTask, setNewTask] = useState(false);
  const { messages, send, busy } = useAziza();
  const { tasks } = useTasks();
  const listRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const active = tasks.filter((x) => x.status !== 'done');

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open, tab]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (pathname.startsWith('/aziza') || pathname.startsWith('/declarant')) return null;

  const submit = () => {
    send(text);
    setText('');
  };

  return (
    <>
      {open && (
        <Paper
          role='dialog'
          aria-label='Азиза'
          elevation={16}
          sx={{
            position: 'fixed',
            right: { xs: 12, sm: 20 },
            bottom: { xs: 150, sm: 100 },
            width: 390,
            maxWidth: 'calc(100vw - 24px)',
            height: 580,
            maxHeight: { xs: 'calc(100vh - 220px)', sm: 'calc(100vh - 130px)' },
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1200,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2,
              py: 1.5,
              background: 'linear-gradient(135deg,#2f6fed,#6d4af2)',
              color: '#fff',
            }}
          >
            <AzizaAvatar size={38} online />
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={600}>Азиза</Typography>
              <Typography variant='caption' sx={{ opacity: 0.9 }}>
                AI-эксперт по таможне · онлайн
              </Typography>
            </Box>
            <Tooltip title='Открыть на всю страницу'>
              <IconButton
                aria-label='Открыть на всю страницу'
                sx={{ color: '#fff' }}
                onClick={() => {
                  setOpen(false);
                  nav(`/aziza?tab=${tab}`);
                }}
              >
                <Maximize2 size={17} />
              </IconButton>
            </Tooltip>
            <IconButton
              aria-label='Закрыть'
              sx={{ color: '#fff' }}
              onClick={() => {
                setOpen(false);
                fabRef.current?.focus();
              }}
            >
              <X size={18} />
            </IconButton>
          </Box>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              px: 1.5,
              minHeight: 42,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { minHeight: 42, textTransform: 'none' },
            }}
          >
            <Tab value='chat' label={t('chat')} />
            <Tab value='tasks' label={`${t('tasks')} · ${active.length}`} />
          </Tabs>
          {tab === 'chat' ? (
            <>
              <Box
                ref={listRef}
                role='log'
                aria-live='polite'
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                }}
              >
                {messages.map((m) => (
                  <ChatBubble key={m.id} m={m} avatar={<AzizaAvatar size={26} />} />
                ))}
              </Box>
              <Stack direction='row' spacing={0.75} sx={{ px: 1.5, pb: 1, overflowX: 'auto' }}>
                {AZIZA_SUGGESTIONS.slice(0, 3).map((q) => (
                  <Button
                    key={q}
                    size='small'
                    variant='outlined'
                    onClick={() => send(q)}
                    sx={{
                      whiteSpace: 'nowrap',
                      borderRadius: 5,
                      flexShrink: 0,
                      fontSize: 12,
                      minHeight: 28,
                    }}
                  >
                    {q}
                  </Button>
                ))}
              </Stack>
              <Box
                component='form'
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: 1, borderColor: 'divider' }}
              >
                <InputBase
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder='Спросите Азизу о таможне…'
                  inputProps={{ 'aria-label': 'Сообщение Азизе' }}
                  sx={{ flex: 1, px: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}
                />
                <IconButton
                  type='submit'
                  aria-label='Отправить'
                  disabled={busy || !text.trim()}
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#fff',
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <Send size={17} />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
              <Button
                fullWidth
                variant='outlined'
                startIcon={<Plus size={16} />}
                onClick={() => setNewTask(true)}
                sx={{ mb: 1.5 }}
              >
                Новая задача
              </Button>
              <TaskList items={active} compact />
            </Box>
          )}
        </Paper>
      )}
      <Fab
        ref={fabRef}
        data-tour='aziza'
        aria-label={t('open_aziza')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        sx={{
          position: 'fixed',
          right: { xs: 14, sm: 20 },
          bottom: { xs: 80, sm: 20 },
          width: 60,
          height: 60,
          p: 0,
          bgcolor: '#dbeafe',
          border: '3px solid #fff',
          boxShadow: '0 8px 24px rgba(37,99,235,.35)',
          zIndex: 1200,
          '&:hover': { bgcolor: '#dbeafe', transform: 'scale(1.04)' },
        }}
      >
        <AzizaAvatar size={54} />
        <Box
          sx={{
            position: 'absolute',
            right: -4,
            bottom: -2,
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #fff',
          }}
        >
          <Sparkles size={11} />
        </Box>
      </Fab>
      <NewTaskDialog open={newTask} onClose={() => setNewTask(false)} />
    </>
  );
}
