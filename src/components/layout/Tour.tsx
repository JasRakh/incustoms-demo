import { Box, Button, Paper, Portal, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store';

const STEPS = [
  { sel: '[data-tour="nav"]', title: 'Меню', text: 'Шесть основных разделов. Порядок можно менять перетаскиванием или клавишами Alt + ↑/↓.', desktop: true },
  { sel: '[data-tour="bottom-nav"]', title: 'Нижнее меню', text: 'На телефоне основные разделы — в нижней панели.', mobile: true },
  { sel: '[data-tour="cta"]', title: 'Быстрые действия', text: 'С этого начинается любая задача: заявка, расчёт сделки, распознавание документа или вопрос Азизе.' },
  { sel: '[data-tour="attention"]', title: 'Требует внимания', text: 'Всё, что ждёт вашего действия: счета, запросы документов, просроченные задачи. Каждый пункт решается в один клик.' },
  { sel: '[data-tour="search"]', title: 'Поиск и команды', text: 'Ищите заявки, документы и разделы или запускайте действия. Быстрый вызов — ⌘K / Ctrl+K.', desktop: true },
  { sel: '[data-tour="aziza"]', title: 'Азиза всегда рядом', text: 'AI-эксперт по таможне отвечает на вопросы и выполняет задачи. Откройте её из любого раздела.' },
];

export const startTour = () => window.dispatchEvent(new Event('incustoms:tour'));

export function Tour() {
  const { state, update } = useStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const popRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const steps = STEPS.filter(s => (isMobile ? !s.desktop : !s.mobile));
  const step = steps[i];

  const begin = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement;
    if (pathname !== '/') nav('/');
    setI(0);
    setTimeout(() => setActive(true), 150);
  }, [nav, pathname]);

  useEffect(() => {
    window.addEventListener('incustoms:tour', begin);
    return () => window.removeEventListener('incustoms:tour', begin);
  }, [begin]);

  useEffect(() => {
    if (!state.onboarded && state.role === 'user') {
      const id = setTimeout(begin, 600);
      return () => clearTimeout(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(() => {
    setActive(false);
    update(d => { d.onboarded = true; });
    lastFocus.current?.focus?.();
  }, [update]);

  const measure = useCallback(() => {
    if (!active || !step) return;
    const el = document.querySelector(step.sel);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: 'nearest' });
    setRect(el.getBoundingClientRect());
  }, [active, step]);

  useLayoutEffect(() => { measure(); }, [measure, i]);
  useEffect(() => {
    if (!active) return undefined;
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, measure]);

  useLayoutEffect(() => {
    if (!rect || !popRef.current) return;
    const pw = popRef.current.offsetWidth, ph = popRef.current.offsetHeight;
    let top: number, left: number;
    if (step.sel.includes('nav"') && !isMobile) { left = rect.right + 18; top = rect.top; }
    else { top = rect.bottom + 14; left = rect.left; if (top + ph > innerHeight - 8) top = rect.top - ph - 14; if (step.sel.includes('aziza')) left = rect.right - pw; }
    setPos({ top: Math.min(Math.max(8, top), innerHeight - ph - 8), left: Math.min(Math.max(8, left), innerWidth - pw - 8) });
    nextRef.current?.focus();
  }, [rect, step, isMobile]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setI(v => Math.min(v + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setI(v => Math.max(v - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish, steps.length]);

  if (!active || !step || !rect) return null;
  const last = i === steps.length - 1;
  const pad = 6;
  return (
    <Portal>
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 1500 }} onClick={() => undefined} />
      <Box aria-hidden sx={{ position: 'fixed', zIndex: 1501, pointerEvents: 'none', borderRadius: 2.5, transition: 'all .25s', boxShadow: '0 0 0 9999px rgba(15,23,42,.6)', left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
      <Paper ref={popRef} role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourText" elevation={12}
        sx={{ position: 'fixed', zIndex: 1502, width: 330, maxWidth: 'calc(100vw - 32px)', p: 2.25, borderRadius: 3, top: pos.top, left: pos.left }}>
        <Typography variant="caption" color="text.secondary">Шаг {i + 1} из {steps.length}</Typography>
        <Typography id="tourTitle" variant="h4" sx={{ mt: 0.5 }}>{step.title}</Typography>
        <Typography id="tourText" variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>{step.text}</Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Stack direction="row" spacing={0.5} sx={{ mr: 'auto' }} aria-hidden>
            {steps.map((_, k) => <Box key={k} sx={{ width: k === i ? 16 : 6, height: 6, borderRadius: 3, bgcolor: k === i ? 'primary.main' : 'divider', transition: 'width .2s' }} />)}
          </Stack>
          {!last && <Button size="small" color="inherit" onClick={finish}>Пропустить</Button>}
          {i > 0 && <Button size="small" variant="outlined" onClick={() => setI(i - 1)}>Назад</Button>}
          <Button ref={nextRef} size="small" variant="contained" onClick={() => (last ? finish() : setI(i + 1))}>{last ? 'Начать работу' : 'Далее'}</Button>
        </Stack>
      </Paper>
    </Portal>
  );
}
