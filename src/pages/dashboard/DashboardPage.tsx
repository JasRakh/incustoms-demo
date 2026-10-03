import { Box, Button, Card, CardActionArea, Chip, Grid, Stack, Typography } from '@mui/material';
import { AlarmClock, ArrowRight, Bot, Calculator, CircleCheck, Clock, FileText, FolderOpen, MessageSquare, Plus, ScanText, Sparkles, Upload, Wallet, Zap } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store';
import { money, today } from '@/lib/format';
import { ApplicationCard } from '@/pages/applications/ApplicationCard';
import { useApplications } from '@/pages/applications/useApplications';
import { useTasks } from '@/pages/aziza/useTasks';
import { TaskList } from '@/pages/aziza/TaskList';
import { NewTaskDialog } from '@/pages/aziza/NewTaskDialog';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';

interface Attn {
  key: string;
  tone: 'red' | 'yellow' | 'blue';
  icon: ReactNode;
  title: string;
  sub: ReactNode;
  action: ReactNode;
}

const TONE = { red: { bg: '#fee2e2', fg: '#dc2626' }, yellow: { bg: '#fef3c7', fg: '#b45309' }, blue: { bg: '#dbeafe', fg: '#1e40af' } };

function QuickCard({ icon, color, title, text, onClick, primary }: { icon: ReactNode; color: string; title: string; text: string; onClick: () => void; primary?: boolean }) {
  return (
    <Card sx={{ height: '100%', ...(primary && { bgcolor: 'primary.main', borderColor: 'primary.main', color: '#fff' }), transition: 'box-shadow .15s, transform .15s', '&:hover': { boxShadow: '0 8px 24px rgba(15,23,42,.08)', transform: 'translateY(-1px)' } }}>
      <CardActionArea onClick={onClick} sx={{ p: { xs: 1.75, md: 2.5 }, height: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', justifyContent: 'flex-start', gap: { xs: 1.25, md: 2 } }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: primary ? 'rgba(255,255,255,.2)' : color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography variant="h3" sx={{ fontSize: 16 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: primary ? 'rgba(255,255,255,.85)' : 'text.secondary', mt: 0.5, display: { xs: 'none', md: 'block' } }}>{text}</Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export function DashboardPage() {
  const { state, update, toast, notify } = useStore();
  const nav = useNavigate();
  const { uploadDocs } = useApplications();
  const { tasks, delegate } = useTasks();
  const [newTask, setNewTask] = useState(false);
  const h = new Date().getHours();
  const hello = h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  const active = state.applications.filter(a => a.status === 'pending' || a.status === 'progress').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const energy = state.energy.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0);

  const pay = (id: string) => {
    update(d => {
      const inv = d.invoices.find(i => i.id === id);
      if (!inv) return;
      inv.paid = true;
      d.payments.unshift({ id: `P-${Math.floor(Math.random() * 900 + 100)}`, title: `Оплата счёта ${inv.id}`, amount: inv.amount, at: new Date().toISOString(), method: 'Банковская карта' });
      d.files.unshift({ id: Math.random().toString(36).slice(2), name: `Квитанция_${inv.id}.pdf`, ext: 'pdf', size: 18400, at: new Date().toISOString(), source: 'Финансы' });
    });
    toast(`Счёт ${id} оплачен`);
    notify(`Счёт ${id} оплачен`, '/finance?tab=payments');
  };

  const items: Attn[] = [
    ...state.invoices.filter(i => !i.paid).map<Attn>(i => ({
      key: i.id, tone: 'red', icon: <Wallet size={18} />, title: `Оплатите счёт ${i.id}`, sub: <>{i.title} · <b>{money(i.amount)}</b></>,
      action: <Button size="small" variant="contained" onClick={() => pay(i.id)}>Оплатить</Button>,
    })),
    ...state.applications.filter(a => a.needDocs && a.status === 'progress').map<Attn>(a => ({
      key: `docs-${a.id}`, tone: 'yellow', icon: <Upload size={18} />, title: `Декларант ждёт документы по заявке №${a.id}`, sub: 'Загрузите инвойс или чек, чтобы продолжить оформление',
      action: <Button size="small" variant="outlined" component="label" startIcon={<Upload size={14} />}>Загрузить<input hidden type="file" onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocs(a.id, f.name); }} /></Button>,
    })),
    ...state.dialogs.filter(d => !d.archived && d.unread > 0).map<Attn>(d => ({
      key: `dlg-${d.id}`, tone: 'blue', icon: <MessageSquare size={18} />, title: `Новые сообщения: ${d.title}`, sub: `${d.contact} · ${d.unread} непрочитанных`,
      action: <Button size="small" onClick={() => nav(`/applications?tab=dialogs&dialog=${d.id}`)}>Открыть</Button>,
    })),
    ...tasks.filter(x => x.status === 'todo' && x.due < today()).map<Attn>(x => ({
      key: `task-${x.id}`, tone: 'yellow', icon: <AlarmClock size={18} />, title: `Просрочена задача «${x.title}»`, sub: 'Азиза может выполнить её за вас',
      action: <Button size="small" variant="outlined" startIcon={<Sparkles size={14} />} onClick={() => delegate(x.id)}>Поручить Азизе</Button>,
    })),
    ...state.applications.filter(a => a.status === 'pending').map<Attn>(a => ({
      key: `pend-${a.id}`, tone: 'blue', icon: <Clock size={18} />, title: `Заявка №${a.id} ожидает декларанта`, sub: 'Обычно декларант берёт заявку в течение 15 минут',
      action: <Button size="small" onClick={() => nav(`/applications?open=${a.id}`)}>Открыть</Button>,
    })),
  ];

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: 24, md: 30 } }}>{hello}, {state.profile.name}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: 14, md: 16 } }}>Вот что сейчас важно по вашим заявкам</Typography>
      </Box>

      <Grid container spacing={1.5} sx={{ mb: 3 }} data-tour="cta" component="section" aria-label="Быстрые действия">
        <Grid item xs={6} lg={3}><QuickCard primary icon={<Plus size={22} />} color="" title="Новая заявка" text="Декларант оформит всё за вас" onClick={() => nav('/applications?new=1')} /></Grid>
        <Grid item xs={6} lg={3}><QuickCard icon={<Calculator size={22} />} color="#2f6fed" title="Рассчитать сделку" text="Себестоимость, пошлины и налоги" onClick={() => nav('/tools/calculator')} /></Grid>
        <Grid item xs={6} lg={3}><QuickCard icon={<ScanText size={22} />} color="#0d9488" title="Распознать документ" text="Инвойс → таблица Excel" onClick={() => nav('/tools/ocr?new=1')} /></Grid>
        <Grid item xs={6} lg={3}><QuickCard icon={<Bot size={22} />} color="#9333ea" title="Спросить Азизу" text="AI-эксперт по таможне 24/7" onClick={() => nav('/aziza')} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7.5}>
          <Stack spacing={2}>
            <Card component="section" aria-labelledby="attnTitle" sx={{ p: { xs: 2, md: 3 } }} data-tour="attention">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Typography id="attnTitle" variant="h2">Требует внимания</Typography>
                {items.length > 0 && <Chip size="small" label={items.length} sx={{ bgcolor: '#fee2e2', color: '#991b1b', height: 22 }} />}
              </Stack>
              {items.length ? (
                <Box component="ul" sx={{ p: 0, m: 0 }}>
                  {items.map(it => (
                    <Box component="li" key={it.key} sx={{ listStyle: 'none', display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2.5, mb: 1 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: TONE[it.tone].bg, color: TONE[it.tone].fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{it.icon}</Box>
                      <Box sx={{ flex: '1 1 200px', minWidth: 0 }}>
                        <Typography fontWeight={600} sx={{ fontSize: 14 }}>{it.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{it.sub}</Typography>
                      </Box>
                      <Box sx={{ ml: { xs: 6, sm: 0 } }}>{it.action}</Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#dcfce7', color: '#166534', fontWeight: 500 }}>
                  <CircleCheck size={20} /><span>Всё в порядке — срочных дел нет</span>
                </Stack>
              )}
            </Card>

            <Card component="section" aria-labelledby="activeTitle" sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography id="activeTitle" variant="h2">Активные заявки</Typography>
                <Button endIcon={<ArrowRight size={15} />} onClick={() => nav('/applications')}>Все заявки</Button>
              </Stack>
              {active.length
                ? active.slice(0, 3).map(a => <ApplicationCard key={a.id} app={a} onOpen={() => nav(`/applications?open=${a.id}`)} />)
                : <EmptyState icon={<FileText size={28} />} title="Активных заявок нет" text="Создайте заявку — декларант оформит всё за вас" action={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => nav('/applications?new=1')}>Новая заявка</Button>} />}
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={4.5}>
          <Stack spacing={2}>
            <Grid container spacing={1.25}>
              <Grid item xs={6}><StatCard label="Активные заявки" icon={<FileText size={15} />} value={active.length} onClick={() => nav('/applications')} /></Grid>
              <Grid item xs={6}><StatCard label="Энергия" icon={<Zap size={15} />} value={energy.toLocaleString('ru-RU')} hint="Хватит примерно на 1 000 запросов" onClick={() => nav('/finance?tab=energy')} /></Grid>
              <Grid item xs={6}><StatCard label="К оплате" icon={<Wallet size={15} />} value={money(state.invoices.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0))} tone={state.invoices.some(i => !i.paid) ? 'red' : 'default'} onClick={() => nav('/finance?tab=invoices')} /></Grid>
              <Grid item xs={6}><StatCard label="Документы" icon={<FolderOpen size={15} />} value={state.files.length} onClick={() => nav('/documents')} /></Grid>
            </Grid>
            <Card component="section" aria-labelledby="tasksTitle" sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography id="tasksTitle" variant="h2" sx={{ fontSize: 18 }}>Задачи Азизы</Typography>
                <Button size="small" startIcon={<Plus size={15} />} onClick={() => setNewTask(true)}>Добавить</Button>
              </Stack>
              <TaskList items={tasks.filter(x => x.status !== 'done').slice(0, 3)} compact />
              <Button endIcon={<ArrowRight size={15} />} onClick={() => nav('/aziza?tab=tasks')} sx={{ mt: 0.5 }}>Все задачи</Button>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      <NewTaskDialog open={newTask} onClose={() => setNewTask(false)} />
    </>
  );
}
