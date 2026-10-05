import { Landmark, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/app/store';
import { PageHeader } from '@/components/common/PageHeader';
import { SegTabs } from '@/components/common/SegTabs';
import { CustomsRequests } from '@/pages/applications/CustomsRequests';
import { DialogsPanel } from '@/pages/applications/DialogsPanel';

type TabKey = 'dialogs' | 'requests';

export function CommunicationsPage() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'dialogs';
  const dialogId = params.get('dialog');
  const unread = state.dialogs.filter((d) => !d.archived && d.unread > 0).length;

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p);
  };

  return (
    <>
      <PageHeader
        title='Коммуникации'
        subtitle='Переписка (Email, Telegram, внутренние диалоги) и запросы в таможню в одном разделе'
      />
      <SegTabs<TabKey>
        ariaLabel='Коммуникации'
        value={tab}
        onChange={(v) => setParams({ tab: v })}
        items={[
          { value: 'dialogs', label: 'Диалоги', icon: <MessageSquare size={16} />, badge: unread },
          { value: 'requests', label: 'Запросы в таможню', icon: <Landmark size={16} /> },
        ]}
      />
      {tab === 'dialogs' ? (
        <DialogsPanel selected={dialogId} onSelect={(id) => setParam('dialog', id)} />
      ) : (
        <CustomsRequests />
      )}
    </>
  );
}
