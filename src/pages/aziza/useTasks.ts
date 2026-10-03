import { useCallback } from 'react';
import { nowIso, uid, useStore } from '@/app/store';
import type { Task } from '@/types';

const RESULTS = [
  'Проверила — всё готово, дополнительных действий не требуется.',
  'Подготовила чек-лист и сохранила его в «Документы».',
  'Уточнила информацию у декларанта, ответ придёт в диалог.',
  'Задача выполнена, напоминание отправлено.',
];

export function useTasks() {
  const { state, update, toast, notify } = useStore();

  const complete = useCallback((id: string, title: string) => {
    setTimeout(() => {
      update(d => {
        const x = d.tasks.find(z => z.id === id);
        if (!x || x.status !== 'aziza') return;
        x.status = 'done';
        x.result = RESULTS[Math.floor(Math.random() * RESULTS.length)];
        if (x.result.includes('чек-лист')) d.files.unshift({ id: uid(), name: `Чек-лист_${id}.pdf`, ext: 'pdf', size: 12800, at: nowIso(), source: 'Азиза' });
      });
      notify(`Азиза выполнила задачу: «${title}»`, '/aziza?tab=tasks');
      toast(`Азиза выполнила: «${title}»`);
    }, 4000);
  }, [update, notify, toast]);

  const delegate = useCallback((id: string) => {
    const x = state.tasks.find(z => z.id === id);
    if (!x) return;
    update(d => { const y = d.tasks.find(z => z.id === id); if (y) y.status = 'aziza'; });
    complete(id, x.title);
  }, [state.tasks, update, complete]);

  const toggle = useCallback((id: string) => {
    update(d => {
      const x = d.tasks.find(z => z.id === id);
      if (!x || x.status === 'aziza') return;
      x.status = x.status === 'done' ? 'todo' : 'done';
      if (x.status === 'todo') x.result = undefined;
    });
  }, [update]);

  const add = useCallback((t: Omit<Task, 'id' | 'status'>, byAziza: boolean) => {
    const id = uid();
    update(d => { d.tasks.unshift({ ...t, id, status: byAziza ? 'aziza' : 'todo' }); });
    toast('Задача добавлена');
    if (byAziza) complete(id, t.title);
  }, [update, toast, complete]);

  const remove = useCallback((id: string) => {
    const idx = state.tasks.findIndex(z => z.id === id);
    if (idx < 0) return;
    const removed = state.tasks[idx];
    update(d => { d.tasks = d.tasks.filter(z => z.id !== id); });
    toast('Задача удалена', { undo: () => update(d => { d.tasks.splice(idx, 0, removed); }) });
  }, [state.tasks, update, toast]);

  return { tasks: state.tasks, delegate, toggle, add, remove };
}
