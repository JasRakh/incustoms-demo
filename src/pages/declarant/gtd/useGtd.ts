import { useCallback } from 'react';
import { nowIso, uid, useStore } from '@/app/store';
import type { Declaration, DeclStatus, GtdDoc, GtdItem, State } from '@/types';
import {
  EMPTY_FORM,
  SAMPLE_DOCS,
  SAMPLE_FORM,
  SAMPLE_ITEMS,
  itemsValue,
  regNumber,
  smartPatch,
  type Form,
} from '@/pages/declarant/gtd/schema';

export type CreateMode = 'blank' | 'ai' | 'template';

function sync(d: Declaration) {
  const f = d.form ?? {};
  d.exporter = f.exporterName ?? '';
  d.importer = f.importerName ?? '';
  d.goods = d.items?.length ?? 0;
  d.amount = itemsValue(d.items ?? []);
  d.orderNo =
    d.orderNo || (f.contractNo ? `ЗК-${f.contractNo.replace(/\D/g, '').slice(-4) || '0001'}` : '');
  d.updatedAt = nowIso();
}

export function buildDeclaration(mode: CreateMode): Declaration {
  const now = nowIso();
  const filled = mode !== 'blank';
  const form = filled ? SAMPLE_FORM() : EMPTY_FORM();
  if (mode === 'template') {
    delete form.seq;
    delete form.regDate;
    delete form.acceptDate;
    delete form.vehicleNo;
  }
  const d: Declaration = {
    id: uid(),
    orderNo: '',
    gtdNo: '',
    status: 'draft',
    exporter: '',
    importer: '',
    goods: 0,
    amount: 0,
    createdAt: now,
    updatedAt: now,
    verified: false,
    history: [{ status: 'draft', at: now }],
    form,
    items: filled ? SAMPLE_ITEMS().map((i) => ({ ...i, id: uid() })) : [],
    docs: filled ? SAMPLE_DOCS().map((x) => ({ ...x, id: uid() })) : [],
    edits: [],
    versions: [],
    aiFields: mode === 'ai' ? Object.keys(SAMPLE_FORM()).filter((k) => !(k in EMPTY_FORM())) : [],
  };
  sync(d);
  return d;
}

export function useGtd(id: string) {
  const { state, update, toast, notify } = useStore();
  const decl = state.declarations.find((d) => d.id === id) ?? null;

  const mutate = useCallback(
    (fn: (d: Declaration, s: State) => void) =>
      update((s) => {
        const d = s.declarations.find((x) => x.id === id);
        if (!d) return;
        d.form ??= EMPTY_FORM();
        d.items ??= [];
        d.docs ??= [];
        d.edits ??= [];
        d.versions ??= [];
        d.aiFields ??= [];
        fn(d, s);
        if (d.status === 'checked' || d.status === 'validation') {
          d.status = 'draft';
          d.verified = false;
          d.history.push({ status: 'draft', at: nowIso() });
        }
        sync(d);
      }),
    [id, update]
  );

  const setFields = useCallback(
    (patch: Form) => {
      const base = { ...(decl?.form ?? {}), ...patch };
      const auto: Form = {};
      Object.entries(patch).forEach(([k, v]) => Object.assign(auto, smartPatch(k, v, base)));
      Object.keys(patch).forEach((k) => delete auto[k]);
      mutate((d) => {
        Object.entries({ ...patch, ...auto }).forEach(([key, value]) => {
          const from = d.form![key] ?? '';
          if (from === value) return;
          d.form![key] = value;
          d.aiFields = d.aiFields!.filter((k) => k !== key);
          const last = d.edits![0];
          if (last && last.field === key && Date.now() - new Date(last.at).getTime() < 8000) {
            last.to = value;
            last.at = nowIso();
          } else {
            d.edits!.unshift({ at: nowIso(), field: key, from, to: value });
          }
        });
      });
      return Object.keys(auto);
    },
    [decl?.form, mutate]
  );

  const setField = useCallback(
    (key: string, value: string) => setFields({ [key]: value }),
    [setFields]
  );

  const confirmAi = useCallback(
    (keys: string[]) =>
      update((s) => {
        const d = s.declarations.find((x) => x.id === id);
        if (d) d.aiFields = (d.aiFields ?? []).filter((k) => !keys.includes(k));
      }),
    [id, update]
  );

  const addItem = useCallback(
    (item?: Partial<GtdItem>) =>
      mutate((d) => {
        d.items!.push({
          id: uid(),
          name: '',
          hs: '',
          origin: d.form!.originCountry ?? '',
          qty: 1,
          weight: 0,
          value: 0,
          ...item,
        });
      }),
    [mutate]
  );
  const setItem = useCallback(
    (itemId: string, patch: Partial<GtdItem>) =>
      mutate((d) => {
        const i = d.items!.find((x) => x.id === itemId);
        if (i) Object.assign(i, patch);
      }),
    [mutate]
  );
  const removeItem = useCallback(
    (itemId: string) => {
      const items = decl?.items ?? [];
      const idx = items.findIndex((x) => x.id === itemId);
      const removed = items[idx];
      mutate((d) => {
        d.items = d.items!.filter((x) => x.id !== itemId);
      });
      toast('Товар удалён', { undo: () => mutate((d) => void d.items!.splice(idx, 0, removed)) });
    },
    [decl, mutate, toast]
  );

  const addDoc = useCallback(
    (doc?: Partial<GtdDoc>) =>
      mutate((d) => {
        d.docs!.push({ id: uid(), code: '02', number: '', date: '', ...doc });
      }),
    [mutate]
  );
  const setDoc = useCallback(
    (docId: string, patch: Partial<GtdDoc>) =>
      mutate((d) => {
        const x = d.docs!.find((y) => y.id === docId);
        if (x) Object.assign(x, patch);
      }),
    [mutate]
  );
  const removeDoc = useCallback(
    (docId: string) =>
      mutate((d) => {
        d.docs = d.docs!.filter((x) => x.id !== docId);
      }),
    [mutate]
  );

  const saveVersion = useCallback(() => {
    mutate((d) => {
      d.versions!.unshift({
        id: uid(),
        at: nowIso(),
        label: `Версия ${d.versions!.length + 1}`,
        form: { ...d.form! },
        items: structuredClone(d.items!),
        docs: structuredClone(d.docs!),
      });
    });
    toast('Версия сохранена');
  }, [mutate, toast]);

  const restoreVersion = useCallback(
    (versionId: string) => {
      mutate((d) => {
        const v = d.versions!.find((x) => x.id === versionId);
        if (!v) return;
        d.form = { ...v.form };
        d.items = structuredClone(v.items);
        d.docs = structuredClone(v.docs);
        d.edits!.unshift({ at: nowIso(), field: '__version', from: '', to: v.label });
      });
      toast('Версия восстановлена');
    },
    [mutate, toast]
  );

  const setStatus = useCallback(
    (status: DeclStatus) =>
      update((s) => {
        const d = s.declarations.find((x) => x.id === id);
        if (!d) return;
        d.status = status;
        d.verified = status !== 'draft' && status !== 'error' && status !== 'rejected';
        d.history.push({ status, at: nowIso() });
        if (status === 'submitted' && d.form) d.gtdNo = regNumber(d.form) || d.gtdNo;
        d.updatedAt = nowIso();
      }),
    [id, update]
  );

  const submit = useCallback(() => {
    setStatus('submitted');
    toast('ГТД отправлена в АИС');
    setTimeout(() => {
      setStatus('accepted');
      notify(
        `ГТД ${decl?.orderNo || ''} принята таможенным постом`.replace('  ', ' '),
        `/declarant/declarations/${id}`
      );
    }, 5000);
  }, [setStatus, toast, notify, decl?.orderNo, id]);

  return {
    decl,
    setField,
    setFields,
    confirmAi,
    addItem,
    setItem,
    removeItem,
    addDoc,
    setDoc,
    removeDoc,
    saveVersion,
    restoreVersion,
    setStatus,
    submit,
  };
}
