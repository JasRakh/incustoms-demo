import { useCallback } from 'react';
import { nowIso, uid, useStore } from '@/app/store';
import type { AzizaSettings, Message, Source } from '@/types';

const LEX: Source[] = [
  {
    id: 1,
    site: 'lex.uz',
    title:
      '2868-сон 14.03.2017. Об утверждении Инструкции о порядке заполнения декларации таможенной стоимости товаров',
    score: 50,
  },
  {
    id: 2,
    site: 'lex.uz',
    title: 'Инструкция о порядке заполнения грузовой таможенной декларации (ГТД)',
    score: 48,
  },
  { id: 3, site: 'lex.uz', title: 'Таможенный кодекс Республики Узбекистан', score: 46 },
  {
    id: 4,
    site: 'lex.uz',
    title: 'Постановление о ставках таможенных пошлин (демо-источник)',
    score: 44,
  },
];

const RULES: [RegExp, (s: AzizaSettings) => Omit<Message, 'id' | 'from' | 'at'>][] = [
  [
    /привет|здравств|салом|hello/i,
    () => ({
      text: 'Здравствуйте! Чем могу помочь? Могу подсказать по пошлинам, кодам ТН ВЭД, графам ГТД и лимитам.',
    }),
  ],
  [
    /тн ?вэд|код|85\d\d|84\d\d/i,
    (s) => ({
      text:
        s.style === 'short'
          ? 'Для кода **8517 13 000 0** (смартфоны) в демо-базе: пошлина **0%**, НДС **12%**, акциз не применяется.\nПеред подачей ГТД сверьте ставку с актуальной редакцией постановления.'
          : 'Код **8517 13 000 0** относится к смартфонам.\n\n**Платежи (демо-данные):**\n• таможенная пошлина — 0%\n• НДС — 12% от (таможенная стоимость + пошлина + акциз)\n• таможенный сбор — по шкале от стоимости\n\n**Документы:** инвойс, транспортные документы, сертификат соответствия (при необходимости).\n\nПеред подачей ГТД сверьте ставку с актуальной редакцией постановления.',
      sources: LEX,
      link: { label: 'Рассчитать сделку', to: '/tools/calculator' },
    }),
  ],
  [
    /пошлин|ставк|duty|boj/i,
    () => ({
      text: 'Ставка пошлины зависит от кода ТН ВЭД и страны происхождения. При наличии сертификата СТ-1 для стран СНГ пошлина может не взиматься.\nУкажите код товара — подскажу точнее.',
      sources: LEX.slice(2),
      link: { label: 'Открыть калькулятор', to: '/tools/calculator' },
    }),
  ],
  [
    /ндс|qqs|vat/i,
    () => ({
      text: '**НДС при импорте — 12%.** База: таможенная стоимость + пошлина + акциз.',
      sources: LEX.slice(0, 2),
    }),
  ],
  [
    /гтд|граф/i,
    () => ({
      text: 'ГТД содержит 54 графы. Чаще всего вопросы вызывают:\n• графа 33 — код товара\n• графа 45 — таможенная стоимость\n• графа 47 — исчисление платежей',
      sources: LEX.slice(1, 3),
    }),
  ],
  [
    /лимит|льгот|беспошлин|imtiyoz/i,
    () => ({
      text: 'Для товаров **личного пользования** в демо-данных действует льгота до **$1000** и **30 кг**. Сверх лимита платежи начисляются на превышение.',
      sources: [LEX[2]],
    }),
  ],
  [
    /excel|pdf|инвойс|документ/i,
    () => ({
      text: 'Загрузите инвойс в **OCR → Excel** — позиции извлекутся автоматически, а таблицу можно сразу передать в калькулятор сделки.',
      link: { label: 'Открыть OCR → Excel', to: '/tools/ocr' },
    }),
  ],
  [/спасиб|rahmat|thank/i, () => ({ text: 'Пожалуйста! Обращайтесь 😊' })],
];

export const AZIZA_SUGGESTIONS = [
  'Ставка пошлины на ТН ВЭД 8517 13 000 0?',
  'Как считается НДС при импорте?',
  'Что указывать в графе 45 ГТД?',
  'Какие лимиты на беспошлинный ввоз?',
];

function answer(q: string, s: AzizaSettings): Omit<Message, 'id' | 'from' | 'at'> {
  for (const [re, fn] of RULES) if (re.test(q)) return fn(s);
  return {
    text: 'В базе знаний по этому вопросу ничего не найдено. Уточните формулировку или укажите код ТН ВЭД.\nДля сложных случаев лучше создать заявку декларанту.',
    link: { label: 'Создать заявку', to: '/applications?new=1' },
  };
}

export function useAziza() {
  const { state, update } = useStore();
  const busy = state.aziza.some((m) => m.typing);

  const reply = useCallback(
    (q: string) => {
      setTimeout(
        () => {
          update((d) => {
            d.aziza = d.aziza.filter((m) => !m.typing);
            d.aziza.push({ ...answer(q, d.azizaSettings), id: uid(), from: 'bot', at: nowIso() });
            d.energy.unshift({
              id: uid(),
              type: 'out',
              title: 'AI-ассистент: запрос',
              amount: 1,
              at: nowIso(),
            });
            d.services.unshift({ id: uid(), service: 'AI-ассистент', energy: 1, at: nowIso() });
          });
        },
        1200 + Math.random() * 600
      );
    },
    [update]
  );

  const send = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      update((d) => {
        d.aziza.push({ id: uid(), from: 'me', text: q, at: nowIso() });
        d.aziza.push({ id: 'typing', from: 'bot', text: '', typing: true, at: nowIso() });
      });
      reply(q);
    },
    [busy, update, reply]
  );

  const regenerate = useCallback(() => {
    const lastQ = [...state.aziza].reverse().find((m) => m.from === 'me');
    if (!lastQ || busy) return;
    update((d) => {
      const i = d.aziza.length - 1;
      if (d.aziza[i]?.from === 'bot') d.aziza.pop();
      d.aziza.push({ id: 'typing', from: 'bot', text: '', typing: true, at: nowIso() });
    });
    reply(lastQ.text);
  }, [state.aziza, busy, update, reply]);

  return { messages: state.aziza, busy, send, regenerate };
}
