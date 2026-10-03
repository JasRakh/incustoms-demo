import { Button, Card, Chip, Stack } from '@mui/material';
import { FileText, Landmark, MessageSquare, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { NewAppPrefill } from '@/pages/applications/NewApplicationDialog';
import { useStore } from '@/app/store';
import type { AppStatus, Application } from '@/types';
import { PageHeader } from '@/components/common/PageHeader';
import { SegTabs } from '@/components/common/SegTabs';
import { EmptyState } from '@/components/common/EmptyState';
import { STATUS_LABEL } from '@/components/common/StatusChip';
import { ApplicationCard } from '@/pages/applications/ApplicationCard';
import { ApplicationDialog } from '@/pages/applications/ApplicationDialog';
import { NewApplicationDialog } from '@/pages/applications/NewApplicationDialog';
import { DialogsPanel } from '@/pages/applications/DialogsPanel';
import { CustomsRequests } from '@/pages/applications/CustomsRequests';
import { useApplications } from '@/pages/applications/useApplications';

type TabKey = 'list' | 'dialogs' | 'requests';

export function ApplicationsPage() {
  const { state } = useStore();
  const { create } = useApplications();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const prefill = (location.state as { prefill?: NewAppPrefill } | null)?.prefill;
  const tab = (params.get('tab') as TabKey) || 'list';
  const openId = params.get('open');
  const dialogId = params.get('dialog');
  const [filter, setFilter] = useState<'all' | AppStatus>('all');
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    if (params.get('new')) { setNewOpen(true); const p = new URLSearchParams(params); p.delete('new'); setParams(p, { replace: true, state: location.state }); }
  }, [params, setParams, location.state]);

  const setParam = (k: string, v: string | null) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p); };
  const list = useMemo(() => state.applications.filter(a => filter === 'all' || a.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state.applications, filter]);
  const count = (s: 'all' | AppStatus) => state.applications.filter(a => s === 'all' || a.status === s).length;
  const unreadDialogs = state.dialogs.filter(d => !d.archived && d.unread > 0).length;
  const openApp = state.applications.find(a => a.id === openId) ?? null;

  const chatWith = (a: Application) => {
    const d = state.dialogs.find(x => x.title.includes(`№${a.id}`));
    setParams({ tab: 'dialogs', ...(d ? { dialog: d.id } : {}) });
  };

  return (
    <>
      <PageHeader title="Заявки" subtitle="Обращения к декларантам, переписка и запросы в таможню" actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setNewOpen(true)}>Новая заявка</Button>} />
      <SegTabs<TabKey>
        ariaLabel="Разделы заявок"
        value={tab}
        onChange={v => setParams({ tab: v })}
        items={[
          { value: 'list', label: 'Мои заявки', icon: <FileText size={16} /> },
          { value: 'dialogs', label: 'Диалоги', icon: <MessageSquare size={16} />, badge: unreadDialogs },
          { value: 'requests', label: 'Запросы в таможню', icon: <Landmark size={16} /> },
        ]}
      />
      {tab === 'list' && (
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 0.75 }} role="group" aria-label="Фильтр по статусу">
            {(['all', 'pending', 'progress', 'done', 'cancelled'] as const).map(s => (
              <Chip key={s} clickable aria-pressed={filter === s} label={`${s === 'all' ? 'Все' : STATUS_LABEL[s]} · ${count(s)}`} onClick={() => setFilter(s)} variant={filter === s ? 'filled' : 'outlined'} color={filter === s ? 'primary' : 'default'} />
            ))}
          </Stack>
          {list.length
            ? list.map(a => <ApplicationCard key={a.id} app={a} onOpen={() => setParam('open', a.id)} />)
            : state.applications.length
              ? <EmptyState icon={<FileText size={28} />} title="Нет заявок с таким статусом" action={<Button variant="outlined" onClick={() => setFilter('all')}>Показать все</Button>} />
              : <EmptyState icon={<FileText size={28} />} title="Заявок пока нет" text="Создайте заявку — декларант оформит всё за вас" action={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setNewOpen(true)}>Новая заявка</Button>} />}
        </Card>
      )}
      {tab === 'dialogs' && <DialogsPanel selected={dialogId} onSelect={id => setParam('dialog', id)} />}
      {tab === 'requests' && <CustomsRequests />}

      <ApplicationDialog app={openApp} onClose={() => setParam('open', null)} onChat={chatWith} />
      <NewApplicationDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        prefill={prefill}
        onCreate={d => { create(d); setNewOpen(false); setParams({ tab: 'list' }); setFilter('all'); }}
      />
    </>
  );
}
