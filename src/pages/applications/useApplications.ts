import { useCallback } from 'react';
import { nowIso, uid, useStore } from '@/app/store';
import type { AppStatus, AppType } from '@/types';

export function useApplications() {
  const { state, update, toast, notify } = useStore();

  const create = useCallback((data: { title: string; description: string; type: AppType; attachment?: string }) => {
    const id = String(state.nextAppId);
    update(d => {
      d.nextAppId += 1;
      d.applications.unshift({ id, ...data, status: 'pending', createdAt: nowIso(), needDocs: false, history: [{ status: 'pending', at: nowIso() }] });
    });
    toast(`Заявка №${id} создана`);
    notify(`Заявка №${id} создана`, `/applications?open=${id}`);
    setTimeout(() => {
      update(d => {
        const a = d.applications.find(x => x.id === id);
        if (!a || a.status !== 'pending') return;
        a.status = 'progress';
        a.history.push({ status: 'progress', at: nowIso() });
        d.dialogs.unshift({
          id: `d-${id}`, channel: 'internal', title: `Заявка №${id} — декларант`, contact: 'Дилноза, декларант', archived: false, unread: 1,
          messages: [{ id: uid(), from: 'them', text: `Здравствуйте! Я взяла в работу заявку №${id} «${data.title}». Если есть документы — пришлите их сюда.`, at: nowIso() }],
        });
      });
      notify(`Заявка №${id} принята в работу`, `/applications?tab=dialogs&dialog=d-${id}`);
    }, 7000);
    return id;
  }, [state.nextAppId, update, toast, notify]);

  const setStatus = useCallback((id: string, status: AppStatus) => {
    update(d => {
      const a = d.applications.find(x => x.id === id);
      if (!a) return;
      a.status = status;
      a.history.push({ status, at: nowIso() });
      if (status === 'done') {
        a.needDocs = false;
        d.invoices.unshift({ id: `INV-${id}`, contract: `Д-2026/${id}`, title: `Услуги декларанта по заявке №${id}`, amount: 120000, dueDate: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10), paid: false });
      }
    });
    if (status === 'done') notify(`Выставлен счёт INV-${id} на 120 000 сум`, '/finance?tab=invoices');
  }, [update, notify]);

  const cancel = useCallback((id: string) => {
    const a = state.applications.find(x => x.id === id);
    if (!a) return;
    const prev = structuredClone(a);
    setStatus(id, 'cancelled');
    toast(`Заявка №${id} отменена`, { undo: () => update(d => { const i = d.applications.findIndex(x => x.id === id); if (i >= 0) d.applications[i] = prev; }) });
  }, [state.applications, setStatus, toast, update]);

  const remove = useCallback((id: string) => {
    const idx = state.applications.findIndex(x => x.id === id);
    if (idx < 0) return;
    const prev = state.applications[idx];
    update(d => { d.applications = d.applications.filter(x => x.id !== id); });
    toast(`Заявка №${id} удалена`, { undo: () => update(d => { d.applications.splice(idx, 0, prev); }) });
  }, [state.applications, update, toast]);

  const uploadDocs = useCallback((id: string, fileName: string) => {
    update(d => {
      const a = d.applications.find(x => x.id === id);
      if (a) { a.needDocs = false; a.attachment = fileName; }
      d.files.unshift({ id: uid(), name: fileName, ext: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt', size: 52000, at: nowIso(), source: `Заявка №${id}` });
      const dlg = d.dialogs.find(x => x.title.includes(`№${id}`));
      if (dlg) dlg.messages.push({ id: uid(), from: 'me', text: `Документ по заявке №${id}`, attachment: fileName, at: nowIso() });
    });
    toast(`Документ «${fileName}» отправлен декларанту`);
    setTimeout(() => update(d => {
      const dlg = d.dialogs.find(x => x.title.includes(`№${id}`));
      if (dlg) { dlg.messages.push({ id: uid(), from: 'them', text: 'Документ получила, спасибо! Продолжаю оформление.', at: nowIso() }); dlg.unread += 1; }
    }), 1500);
  }, [update, toast]);

  return { create, setStatus, cancel, remove, uploadDocs };
}
