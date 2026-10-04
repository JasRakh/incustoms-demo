import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  BookOpen,
  Car,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Mail,
  Package,
  Phone,
  RotateCcw,
  ScanText,
  Send,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/app/store';
import { PageHeader } from '@/components/common/PageHeader';
import { SegTabs } from '@/components/common/SegTabs';
import { startTour } from '@/components/layout/Tour';

const FAQ = [
  [
    'Как создать заявку декларанту?',
    'На главной нажмите «Новая заявка». Укажите тему, тип услуги и описание — декларант ответит в «Диалогах», а этапы заявки будут видны на шкале.',
  ],
  [
    'Как работает калькулятор сделки?',
    'Шаг 1 — загрузите инвойс или добавьте позиции и расходы. Шаг 2 — калькулятор рассчитает пошлины, акциз, НДС и себестоимость каждой позиции.',
  ],
  [
    'Что такое энергия?',
    'Внутренняя валюта сервисов: запрос к Азизе стоит 1 энергию, распознавание документа — 2. Пополнить можно в «Финансах».',
  ],
  [
    'Какие документы распознаёт OCR?',
    'Инвойсы, упаковочные листы, накладные в PDF, JPG и PNG. Результат выгружается в Excel или передаётся в калькулятор.',
  ],
  [
    'Что значит блок «Требует внимания»?',
    'Там собрано всё, что ждёт вашего действия: счета, запросы документов, новые сообщения и просроченные задачи.',
  ],
  [
    'Можно ли доверять ответам Азизы?',
    'Азиза опирается на НПА с lex.uz и показывает источники, но может ошибаться. Перед подачей официальных документов проверьте информацию у специалиста.',
  ],
];
const COURSES = [
  {
    id: 'basics',
    icon: BookOpen,
    color: '#2f6fed',
    title: 'Основы таможни для физлиц',
    desc: 'Как устроено оформление и что знать перед ввозом',
    lessons: [
      'Что такое таможенное оформление',
      'Беспошлинные нормы ввоза',
      'Из чего складываются платежи',
      'Типичные ошибки',
    ],
  },
  {
    id: 'parcels',
    icon: Package,
    color: '#d97706',
    title: 'Посылки из-за рубежа',
    desc: 'Маркетплейсы, лимиты и отслеживание',
    lessons: ['Лимиты для посылок', 'Подтверждение стоимости', 'Если посылку задержали'],
  },
  {
    id: 'auto',
    icon: Car,
    color: '#db2777',
    title: 'Ввоз автомобиля',
    desc: 'Платежи, документы и сертификация',
    lessons: ['Расчёт платежей за авто', 'Документы', 'Сертификация', 'Льготы и ограничения'],
  },
  {
    id: 'docs',
    icon: ScanText,
    color: '#0d9488',
    title: 'Документы и OCR',
    desc: 'Быстрая подготовка документов',
    lessons: ['Что распознаётся', 'Проверка данных', 'Отправка декларанту'],
  },
];

export function HelpPage() {
  const { state, update, toast, notify } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as 'faq' | 'courses') || 'faq';
  const [course, setCourse] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const c = COURSES.find((x) => x.id === course);

  const toggleLesson = (cid: string, i: number) => {
    const total = COURSES.find((x) => x.id === cid)!.lessons.length;
    const done = state.courses[cid] ?? [];
    const adding = !done.includes(i);
    update((d) => {
      const a = d.courses[cid] ?? [];
      d.courses[cid] = adding ? [...a, i] : a.filter((x) => x !== i);
    });
    if (adding && done.length + 1 === total) toast('Курс пройден! 🎉');
  };

  const send = () => {
    setTouched(true);
    if (!subject.trim() || !message.trim()) return;
    toast('Сообщение отправлено в поддержку');
    notify(`Обращение «${subject.trim()}» принято поддержкой`, '/help');
    setSubject('');
    setMessage('');
    setTouched(false);
  };

  return (
    <>
      <PageHeader
        title='Помощь и обучение'
        subtitle='Ответы на вопросы, курсы и связь с поддержкой'
      />
      <SegTabs
        ariaLabel='Помощь'
        value={tab}
        onChange={(v) => setParams({ tab: v })}
        items={[
          { value: 'faq', label: 'Частые вопросы' },
          { value: 'courses', label: 'Курсы' },
        ]}
      />
      {tab === 'faq' ? (
        <>
          <Card sx={{ p: 2, mb: 2.5, bgcolor: 'rgba(47,111,237,.07)', borderColor: 'transparent' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'center' }}
            >
              <Compass size={22} />
              <Typography sx={{ flex: 1 }}>
                Впервые здесь? Пройдите тур по кабинету — это займёт меньше минуты.
              </Typography>
              <Button variant='contained' onClick={startTour}>
                Пройти тур
              </Button>
            </Stack>
          </Card>
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              {FAQ.map(([q, a]) => (
                <Accordion
                  key={q}
                  disableGutters
                  variant='outlined'
                  sx={{ mb: 1, borderRadius: '10px !important', '&::before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                    <Typography fontWeight={500}>{q}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color='text.secondary'>{a}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3, mb: 2 }}>
                <Typography variant='h3' sx={{ mb: 2 }}>
                  Написать в поддержку
                </Typography>
                <Stack
                  spacing={2}
                  component='form'
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <TextField
                    required
                    label='Тема'
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    error={touched && !subject.trim()}
                    helperText={touched && !subject.trim() ? 'Заполните это поле' : ' '}
                  />
                  <TextField
                    required
                    multiline
                    minRows={4}
                    label='Сообщение'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    error={touched && !message.trim()}
                    helperText={touched && !message.trim() ? 'Заполните это поле' : ' '}
                  />
                  <Button type='submit' variant='contained' startIcon={<Send size={16} />}>
                    Отправить
                  </Button>
                </Stack>
              </Card>
              <Card sx={{ p: 3 }}>
                <Typography variant='h3' sx={{ mb: 1.5 }}>
                  Контакты
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction='row' spacing={1.25} alignItems='center'>
                    <Phone size={16} />
                    <span>+998 XX XXX XX XX</span>
                  </Stack>
                  <Stack direction='row' spacing={1.25} alignItems='center'>
                    <Mail size={16} />
                    <span>support@example.com</span>
                  </Stack>
                  <Stack
                    direction='row'
                    spacing={1.25}
                    alignItems='center'
                    sx={{ color: 'text.secondary' }}
                  >
                    <Clock size={16} />
                    <span>Пн–Пт, 9:00–18:00</span>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <Grid container spacing={1.5}>
          {COURSES.map((x) => {
            const done = (state.courses[x.id] ?? []).length;
            const pct = Math.round((done / x.lessons.length) * 100);
            const Icon = x.icon;
            return (
              <Grid item xs={12} sm={6} key={x.id}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => setCourse(x.id)} sx={{ p: 2.5, height: '100%' }}>
                    <Stack direction='row' justifyContent='space-between'>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          bgcolor: x.color,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} />
                      </Box>
                      {pct === 100 && (
                        <Chip
                          size='small'
                          icon={<Check size={13} />}
                          label='Пройдено'
                          color='success'
                        />
                      )}
                    </Stack>
                    <Typography variant='h3' sx={{ mt: 1.75 }}>
                      {x.title}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1.75 }}>
                      {x.desc}
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={pct}
                      color={pct === 100 ? 'success' : 'primary'}
                      aria-label={`Прогресс курса ${x.title}`}
                    />
                    <Stack direction='row' justifyContent='space-between' sx={{ mt: 1 }}>
                      <Typography variant='caption' color='text.secondary'>
                        {done}/{x.lessons.length} уроков
                      </Typography>
                      <Typography variant='caption' color='primary' fontWeight={600}>
                        {pct === 0 ? 'Начать' : pct === 100 ? 'Повторить' : 'Продолжить'} →
                      </Typography>
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      <Dialog open={!!c} onClose={() => setCourse(null)} fullWidth maxWidth='sm'>
        {c && (
          <>
            <DialogTitle>{c.title}</DialogTitle>
            <DialogContent>
              <Typography color='text.secondary' sx={{ mb: 2 }}>
                {c.desc}
              </Typography>
              {c.lessons.map((l, i) => {
                const ok = (state.courses[c.id] ?? []).includes(i);
                return (
                  <Stack
                    key={l}
                    direction='row'
                    spacing={1.5}
                    alignItems='center'
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      border: 1,
                      borderColor: ok ? 'transparent' : 'divider',
                      bgcolor: ok ? 'rgba(22,163,74,.1)' : undefined,
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: ok ? 'success.main' : 'transparent',
                        border: ok ? 0 : 2,
                        borderColor: 'divider',
                        color: '#fff',
                      }}
                    >
                      {ok && <Check size={14} />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={500}>
                        {i + 1}. {l}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Демо-урок · ~5 минут
                      </Typography>
                    </Box>
                    <Button
                      size='small'
                      variant={ok ? 'text' : 'outlined'}
                      aria-pressed={ok}
                      onClick={() => toggleLesson(c.id, i)}
                      startIcon={ok ? <RotateCcw size={14} /> : <Check size={14} />}
                    >
                      {ok ? 'Сбросить' : 'Пройдено'}
                    </Button>
                  </Stack>
                );
              })}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant='contained' onClick={() => setCourse(null)}>
                Закрыть
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
