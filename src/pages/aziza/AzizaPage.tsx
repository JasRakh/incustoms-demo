import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputBase,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AlarmClock,
  BookOpen,
  Check,
  Copy,
  FileDown,
  MessageSquare,
  Mic,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nowIso, uid, useStore } from '@/app/store';
import { AzizaAvatar } from '@/components/common/AzizaAvatar';
import { ChatBubble } from '@/components/common/ChatBubble';
import { SegTabs } from '@/components/common/SegTabs';
import type { Message } from '@/types';
import { AZIZA_SUGGESTIONS, useAziza } from '@/pages/aziza/useAziza';
import { useTasks } from '@/pages/aziza/useTasks';
import { TaskList } from '@/pages/aziza/TaskList';
import { NewTaskDialog } from '@/pages/aziza/NewTaskDialog';

type TabKey = 'chat' | 'tasks';

function Sources({ m }: { m: Message }) {
  if (!m.sources?.length) return null;
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant='overline' color='text.secondary' sx={{ letterSpacing: '.08em' }}>
        Источники
      </Typography>
      <Grid container spacing={1}>
        {m.sources.map((s) => (
          <Grid item xs={12} sm={6} key={s.id}>
            <Card
              component='a'
              href='#'
              onClick={(e) => e.preventDefault()}
              sx={{
                display: 'block',
                p: 1.25,
                textDecoration: 'none',
                color: 'inherit',
                height: '100%',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.5 }}>
                <Chip size='small' label={s.id} sx={{ height: 18, minWidth: 18 }} />
                <Chip
                  size='small'
                  label={`${s.site} · первоисточник`}
                  sx={{ height: 18, bgcolor: '#dcfce7', color: '#166534' }}
                />
              </Stack>
              <Typography
                variant='body2'
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {s.title}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function BotActions({
  m,
  last,
  onRegenerate,
}: {
  m: Message;
  last: boolean;
  onRegenerate: () => void;
}) {
  const { update, toast } = useStore();
  const [copied, setCopied] = useState(false);
  return (
    <Stack direction='row' spacing={0.5} sx={{ mt: 0.75 }}>
      <Button
        size='small'
        color='inherit'
        startIcon={copied ? <Check size={14} /> : <Copy size={14} />}
        sx={{ color: 'text.secondary', minHeight: 28 }}
        onClick={() => {
          navigator.clipboard?.writeText(m.text.replace(/\*\*/g, ''));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Скопировано' : 'Копировать'}
      </Button>
      {last && (
        <Button
          size='small'
          color='inherit'
          startIcon={<RotateCcw size={14} />}
          sx={{ color: 'text.secondary', minHeight: 28 }}
          onClick={onRegenerate}
        >
          Пересоздать
        </Button>
      )}
      <Button
        size='small'
        color='inherit'
        startIcon={<FileDown size={14} />}
        sx={{ color: 'text.secondary', minHeight: 28 }}
        onClick={() => {
          update((d) => {
            d.files.unshift({
              id: uid(),
              name: `aziza-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.pdf`,
              ext: 'pdf',
              size: 41100,
              at: nowIso(),
              source: 'AI-ассистент',
            });
          });
          toast('Ответ сохранён в PDF — смотрите «Документы»');
        }}
      >
        PDF
      </Button>
    </Stack>
  );
}

function SettingsPanel() {
  const { state, update, toast } = useStore();
  const s = state.azizaSettings;
  const set = (patch: Partial<typeof s>) =>
    update((d) => {
      d.azizaSettings = { ...d.azizaSettings, ...patch };
    });
  return (
    <Stack spacing={2}>
      <Box sx={{ textAlign: 'center', pt: 1 }}>
        <Box sx={{ display: 'inline-block' }}>
          <AzizaAvatar size={84} ring online />
        </Box>
        <Typography variant='h3' sx={{ mt: 1.5 }}>
          Азиза
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          AI-эксперт по таможне РУз
        </Typography>
        <Stack
          direction='row'
          spacing={0.75}
          alignItems='center'
          justifyContent='center'
          sx={{ mt: 0.5 }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main' }} />
          <Typography variant='caption' color='text.secondary'>
            На связи
          </Typography>
        </Stack>
      </Box>
      <TextField
        select
        label='Модель'
        value={s.model}
        onChange={(e) => set({ model: e.target.value })}
        helperText={
          s.model === 'fast'
            ? 'Быстрые ответы, 1 энергия за запрос'
            : 'Глубокий анализ, 3 энергии за запрос'
        }
      >
        <MenuItem value='fast'>Быстрая</MenuItem>
        <MenuItem value='pro'>Точная (Pro)</MenuItem>
      </TextField>
      <Paper variant='outlined' sx={{ p: 1.5, borderRadius: 2.5 }}>
        <FormControlLabel
          sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
          labelPlacement='start'
          control={
            <Switch
              checked={s.knowledgeBase}
              onChange={(e) => set({ knowledgeBase: e.target.checked })}
            />
          }
          label={
            <Stack direction='row' spacing={1} alignItems='center'>
              <BookOpen size={17} />
              <Box>
                <Typography variant='body2' fontWeight={600}>
                  База знаний
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  НПА с lex.uz
                </Typography>
              </Box>
            </Stack>
          }
        />
      </Paper>
      <TextField
        select
        label='Стиль ответа'
        value={s.style}
        onChange={(e) => set({ style: e.target.value as typeof s.style })}
        helperText='Для длинных статей НПА выбирайте «Подробно» или «Юридический»'
      >
        <MenuItem value='short'>Кратко · сжатое резюме</MenuItem>
        <MenuItem value='detailed'>Подробно · с разбором</MenuItem>
        <MenuItem value='legal'>Юридический · со ссылками</MenuItem>
      </TextField>
      <TextField
        select
        label='Страна назначения экспорта'
        value={s.country}
        onChange={(e) => set({ country: e.target.value })}
        helperText='Фильтрует НПА в поиске (СТ-1, GSP+, ПТА и т. п.)'
        SelectProps={{ displayEmpty: true }}
        InputLabelProps={{ shrink: true }}
      >
        <MenuItem value=''>Не указана</MenuItem>
        <MenuItem value='ru'>Россия</MenuItem>
        <MenuItem value='kz'>Казахстан</MenuItem>
        <MenuItem value='eu'>Европейский союз</MenuItem>
        <MenuItem value='cn'>Китай</MenuItem>
      </TextField>
      <TextField
        select
        label='Экспорт диалога'
        value=''
        SelectProps={{ displayEmpty: true }}
        InputLabelProps={{ shrink: true }}
        onChange={(e) => {
          update((d) => {
            d.files.unshift({
              id: uid(),
              name: `aziza-thread.${e.target.value}`,
              ext: e.target.value === 'pdf' ? 'pdf' : 'txt',
              size: 38000,
              at: nowIso(),
              source: 'AI-ассистент',
            });
          });
          toast('Диалог экспортирован в «Документы»');
        }}
      >
        <MenuItem value='' disabled>
          Выберите формат
        </MenuItem>
        <MenuItem value='pdf'>PDF</MenuItem>
        <MenuItem value='txt'>Текст</MenuItem>
      </TextField>
      <Divider />
      <Box>
        <Typography variant='overline' color='text.secondary'>
          Что я умею
        </Typography>
        {[
          'Расчёт пошлин, НДС, акциза',
          'Подбор кода ТН ВЭД',
          'Обработка Excel / PDF / инвойсов',
          'Разъяснение граф ГТД',
          'Ссылки на действующие НПА',
        ].map((x) => (
          <Stack key={x} direction='row' spacing={1} alignItems='center' sx={{ py: 0.4 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant='body2'>{x}</Typography>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
}

export function AzizaPage() {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'chat';
  const { messages, send, busy, regenerate } = useAziza();
  const { tasks } = useTasks();
  const [text, setText] = useState('');
  const [panel, setPanel] = useState(true);
  const [notice, setNotice] = useState(true);
  const [filter, setFilter] = useState<'active' | 'done' | 'all'>('active');
  const [newTask, setNewTask] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastBot = [...messages].reverse().find((m) => m.from === 'bot' && !m.typing)?.id;
  const activeCount = tasks.filter((x) => x.status !== 'done').length;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const submit = () => {
    send(text);
    setText('');
  };
  const shown = tasks.filter(
    (x) => filter === 'all' || (filter === 'active' ? x.status !== 'done' : x.status === 'done')
  );

  return (
    <>
      <SegTabs<TabKey>
        ariaLabel='Азиза'
        value={tab}
        onChange={(v) => setParams({ tab: v })}
        items={[
          { value: 'chat', label: 'Чат', icon: <MessageSquare size={16} /> },
          { value: 'tasks', label: `Задачи · ${activeCount}`, icon: <AlarmClock size={16} /> },
        ]}
      />

      {tab === 'chat' ? (
        <Card
          sx={{
            display: 'flex',
            height: { xs: 'calc(100vh - 250px)', md: 'calc(100vh - 230px)' },
            minHeight: 520,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : 'background.paper',
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Stack direction='row' alignItems='center' sx={{ px: 2, py: 1 }}>
              {!wide && (
                <Stack direction='row' spacing={1} alignItems='center'>
                  <AzizaAvatar size={32} online />
                  <Typography fontWeight={600}>Азиза</Typography>
                </Stack>
              )}
              <Box sx={{ flex: 1 }} />
              {wide && (
                <Tooltip title={panel ? 'Скрыть настройки' : 'Показать настройки'}>
                  <IconButton
                    aria-label={panel ? 'Скрыть настройки' : 'Показать настройки'}
                    onClick={() => setPanel((p) => !p)}
                  >
                    {panel ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            <Box
              ref={listRef}
              role='log'
              aria-live='polite'
              sx={{ flex: 1, overflowY: 'auto', px: { xs: 1.5, md: 3 }, pb: 2 }}
            >
              <Box
                sx={{ maxWidth: 820, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <Collapse in={notice}>
                  <Alert
                    severity='warning'
                    icon={<Sparkles size={18} />}
                    action={
                      <IconButton
                        size='small'
                        aria-label='Скрыть предупреждение'
                        onClick={() => setNotice(false)}
                      >
                        <X size={15} />
                      </IconButton>
                    }
                  >
                    <b>Помощник на основе ИИ.</b> Ответы могут содержать ошибки. Перед
                    использованием в официальных документах (декларациях, контрактах) проверьте
                    информацию у специалиста.
                  </Alert>
                </Collapse>
                {messages.map((m) => (
                  <ChatBubble
                    key={m.id}
                    m={m}
                    avatar={<AzizaAvatar size={32} ring />}
                    footer={
                      m.from === 'bot' && !m.typing && m.id !== 'a0' ? (
                        <>
                          <BotActions m={m} last={m.id === lastBot} onRegenerate={regenerate} />
                          <Sources m={m} />
                        </>
                      ) : undefined
                    }
                  />
                ))}
                {messages.length <= 1 && (
                  <Box>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                      Попробуйте спросить:
                    </Typography>
                    <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      {AZIZA_SUGGESTIONS.map((q) => (
                        <Chip
                          key={q}
                          label={q}
                          clickable
                          variant='outlined'
                          onClick={() => send(q)}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Box>
            <Box sx={{ px: { xs: 1.5, md: 3 }, pb: 2 }}>
              <Paper
                component='form'
                elevation={0}
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                sx={{
                  maxWidth: 820,
                  mx: 'auto',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(15,23,42,.06)',
                }}
              >
                <InputBase
                  fullWidth
                  multiline
                  maxRows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder='Спросите Азизу о таможне, ГТД, ТН ВЭД…'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  inputProps={{ 'aria-label': 'Сообщение Азизе' }}
                  sx={{ px: 2.5, pt: 2, pb: 1 }}
                />
                <Stack direction='row' alignItems='center' spacing={0.5} sx={{ px: 1.5, pb: 1.25 }}>
                  <Button
                    component='label'
                    size='small'
                    color='inherit'
                    startIcon={<Paperclip size={15} />}
                    sx={{ color: 'text.secondary' }}
                  >
                    Файл
                    <input
                      hidden
                      type='file'
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) send(`Проанализируй документ: ${f.name}`);
                      }}
                    />
                  </Button>
                  <Tooltip title='Голосовой ввод (скоро)'>
                    <span>
                      <Button size='small' color='inherit' disabled startIcon={<Mic size={15} />}>
                        Голос
                      </Button>
                    </span>
                  </Tooltip>
                  <Box sx={{ flex: 1 }} />
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}
                  >
                    Enter — отправить, Shift+Enter — новая строка
                  </Typography>
                  <IconButton
                    type='submit'
                    aria-label='Отправить'
                    disabled={busy || !text.trim()}
                    sx={{
                      bgcolor: 'primary.main',
                      color: '#fff',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                    }}
                  >
                    <Send size={17} />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>
          </Box>
          {wide && panel && (
            <Box
              component='aside'
              aria-label='Настройки Азизы'
              sx={{
                width: 300,
                borderLeft: 1,
                borderColor: 'divider',
                p: 2.5,
                overflowY: 'auto',
                bgcolor: 'background.paper',
              }}
            >
              <SettingsPanel />
            </Box>
          )}
        </Card>
      ) : (
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ mb: 2, gap: 1, flexWrap: 'wrap' }}
          >
            <Stack direction='row' spacing={0.75}>
              {(
                [
                  ['active', 'Активные'],
                  ['done', 'Выполненные'],
                  ['all', 'Все'],
                ] as const
              ).map(([k, l]) => (
                <Chip
                  key={k}
                  clickable
                  aria-pressed={filter === k}
                  label={`${l} · ${tasks.filter((x) => k === 'all' || (k === 'active' ? x.status !== 'done' : x.status === 'done')).length}`}
                  color={filter === k ? 'primary' : 'default'}
                  variant={filter === k ? 'filled' : 'outlined'}
                  onClick={() => setFilter(k)}
                />
              ))}
            </Stack>
            <Button
              variant='contained'
              startIcon={<Plus size={16} />}
              onClick={() => setNewTask(true)}
            >
              Новая задача
            </Button>
          </Stack>
          <TaskList items={shown} />
          <NewTaskDialog open={newTask} onClose={() => setNewTask(false)} />
        </Card>
      )}
    </>
  );
}
