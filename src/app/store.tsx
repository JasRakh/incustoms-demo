import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { State } from '@/types';
import { initialState, MENU_DEFAULT } from '@/data/mock';

const KEY = 'incustoms-demo-state-v1';

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = { ...initialState(), ...JSON.parse(raw) } as State;
      if (!Array.isArray(s.menuOrder) || s.menuOrder.length !== MENU_DEFAULT.length || !s.menuOrder.every(k => MENU_DEFAULT.includes(k))) {
        s.menuOrder = [...MENU_DEFAULT];
      }
      s.aziza = s.aziza.filter(m => !m.typing);
      s.tasks = s.tasks.map(x => (x.status === 'aziza' ? { ...x, status: 'todo' } : x));
      return s;
    }
  } catch {
    /* storage unavailable */
  }
  return initialState();
}

export interface Toast {
  id: string;
  text: string;
  severity: 'success' | 'error' | 'info';
  undo?: () => void;
}

interface StoreValue {
  state: State;
  update: (fn: (draft: State) => void) => void;
  reset: () => void;
  toast: (text: string, opts?: { severity?: Toast['severity']; undo?: () => void }) => void;
  notify: (text: string, to: string) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10);
export const nowIso = () => new Date().toISOString();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state]);

  const update = useCallback((fn: (draft: State) => void) => {
    setState(prev => {
      const draft = structuredClone(prev);
      fn(draft);
      return draft;
    });
  }, []);

  const dismissToast = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), []);

  const toast = useCallback<StoreValue['toast']>((text, opts) => {
    const id = uid();
    setToasts(t => [...t, { id, text, severity: opts?.severity ?? 'success', undo: opts?.undo }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts?.undo ? 6000 : 3200);
  }, []);

  const notify = useCallback((text: string, to: string) => {
    update(d => {
      d.notifications.unshift({ id: uid(), text, at: nowIso(), read: false, to });
    });
  }, [update]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
    setState(initialState());
  }, []);

  const value = useMemo(
    () => ({ state, update, reset, toast, notify, toasts, dismissToast }),
    [state, update, reset, toast, notify, toasts, dismissToast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
