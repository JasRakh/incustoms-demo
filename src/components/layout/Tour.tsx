import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store';

interface TourStep {
  sel: string;
  title: string;
  text: string;
  align?: 'end';
}

const STEPS: TourStep[] = [
  {
    sel: '[data-tour="nav"]',
    title: 'Меню',
    text: 'Шесть основных разделов. Порядок можно менять перетаскиванием или клавишами Alt + ↑/↓.',
  },
  {
    sel: '[data-tour="bottom-nav"]',
    title: 'Нижнее меню',
    text: 'На телефоне основные разделы — в нижней панели.',
  },
  {
    sel: '[data-tour="cta"]',
    title: 'Быстрые действия',
    text: 'С этого начинается любая задача: заявка, расчёт сделки, распознавание документа или вопрос Азизе.',
  },
  {
    sel: '[data-tour="attention"]',
    title: 'Требует внимания',
    text: 'Всё, что ждёт вашего действия: счета, запросы документов, просроченные задачи. Каждый пункт решается в один клик.',
  },
  {
    sel: '[data-tour="search"]',
    title: 'Поиск и команды',
    text: 'Ищите заявки, документы и разделы или запускайте действия. Быстрый вызов — ⌘K / Ctrl+K.',
  },
  {
    sel: '[data-tour="aziza"]',
    title: 'Азиза всегда рядом',
    text: 'AI-эксперт по таможне отвечает на вопросы и выполняет задачи. Откройте её из любого раздела.',
    align: 'end',
  },
];

const GAP = 12;
const PAD = 6;

export const TOUR_EVENT = 'incustoms:tour';
export const startTour = () => window.dispatchEvent(new Event(TOUR_EVENT));

function isVisible(sel: string) {
  const el = document.querySelector(sel);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return (
    r.width > 0 &&
    r.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    r.right > 0 &&
    r.left < window.innerWidth
  );
}

function place(target: DOMRect, pw: number, ph: number, align?: 'end') {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = {
    top: Math.max(target.top, 0),
    bottom: Math.min(target.bottom, vh),
    left: Math.max(target.left, 0),
    right: Math.min(target.right, vw),
  };
  const alignLeft = align === 'end' ? r.right - pw : r.left;
  let top: number;
  let left: number;
  if (vw - r.right >= pw + GAP * 2) {
    left = r.right + GAP;
    top = r.top;
  } else if (vh - r.bottom >= ph + GAP * 2) {
    top = r.bottom + GAP;
    left = alignLeft;
  } else if (r.top >= ph + GAP * 2) {
    top = r.top - ph - GAP;
    left = alignLeft;
  } else if (r.left >= pw + GAP * 2) {
    left = r.left - pw - GAP;
    top = r.top;
  } else {
    top = vh - ph - GAP;
    left = (vw - pw) / 2;
  }
  return {
    top: Math.min(Math.max(GAP, top), vh - ph - GAP),
    left: Math.min(Math.max(GAP, left), vw - pw - GAP),
  };
}

export function Tour() {
  const { state, update } = useStore();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const popRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const active = steps.length > 0;
  const step = steps[i];

  const begin = useCallback(() => {
    lastFocus.current = document.activeElement as HTMLElement;
    if (pathname !== '/') nav('/');
    setTimeout(() => {
      const visible = STEPS.filter((s) => isVisible(s.sel));
      setI(0);
      setSteps(visible);
    }, 400);
  }, [nav, pathname]);

  useEffect(() => {
    window.addEventListener(TOUR_EVENT, begin);
    return () => window.removeEventListener(TOUR_EVENT, begin);
  }, [begin]);

  useEffect(() => {
    if (!state.onboarded && state.role === 'user') {
      const id = setTimeout(startTour, 500);
      return () => clearTimeout(id);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(() => {
    setSteps([]);
    setRect(null);
    update((d) => {
      d.onboarded = true;
    });
    lastFocus.current?.focus?.();
  }, [update]);

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.sel);
    if (!el) {
      setRect(null);
      return;
    }
    const pw = popRef.current?.offsetWidth ?? 330;
    const room = window.innerHeight - (popRef.current?.offsetHeight ?? 200) - GAP * 3;
    const r0 = el.getBoundingClientRect();
    const sideRoom = window.innerWidth - r0.right >= pw + GAP * 2 || r0.left >= pw + GAP * 2;
    const tall = r0.height > room && !sideRoom;
    el.scrollIntoView({ block: tall ? 'start' : 'nearest' });
    const r = el.getBoundingClientRect();
    setRect(
      tall
        ? new DOMRect(
            r.left,
            Math.max(r.top, GAP),
            r.width,
            Math.max(room - Math.max(r.top, GAP), 80)
          )
        : r
    );
  }, [step]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!active) return undefined;
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, measure]);

  useLayoutEffect(() => {
    if (!rect || !popRef.current || !step) return;
    setPos(place(rect, popRef.current.offsetWidth, popRef.current.offsetHeight, step.align));
    nextRef.current?.focus();
  }, [rect, step]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setI((v) => Math.min(v + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish, steps.length]);

  if (!active || !step || !rect) return null;
  const last = i === steps.length - 1;
  const hl = {
    left: Math.max(rect.left, 0) - PAD,
    top: Math.max(rect.top, 0) - PAD,
    width: Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0) + PAD * 2,
    height: Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0) + PAD * 2,
  };
  return createPortal(
    <>
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 1500 }} />
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          zIndex: 1501,
          pointerEvents: 'none',
          borderRadius: 2.5,
          transition: 'all .25s',
          boxShadow: '0 0 0 9999px rgba(15,23,42,.6)',
          ...hl,
        }}
      />
      <Paper
        ref={popRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='tourTitle'
        aria-describedby='tourText'
        elevation={12}
        sx={{
          position: 'fixed',
          zIndex: 1502,
          width: 330,
          maxWidth: 'calc(100vw - 24px)',
          p: 2.25,
          borderRadius: 3,
          top: pos.top,
          left: pos.left,
          transition: 'top .2s, left .2s',
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          Шаг {i + 1} из {steps.length}
        </Typography>
        <Typography id='tourTitle' variant='h4' sx={{ mt: 0.5 }}>
          {step.title}
        </Typography>
        <Typography id='tourText' variant='body2' color='text.secondary' sx={{ mt: 0.75, mb: 2 }}>
          {step.text}
        </Typography>
        <Stack direction='row' alignItems='center' spacing={1}>
          <Stack direction='row' spacing={0.5} sx={{ mr: 'auto' }} aria-hidden>
            {steps.map((_, k) => (
              <Box
                key={k}
                sx={{
                  width: k === i ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: k === i ? 'primary.main' : 'divider',
                  transition: 'width .2s',
                }}
              />
            ))}
          </Stack>
          {!last && (
            <Button size='small' color='inherit' onClick={finish}>
              Пропустить
            </Button>
          )}
          {i > 0 && (
            <Button size='small' variant='outlined' onClick={() => setI(i - 1)}>
              Назад
            </Button>
          )}
          <Button
            ref={nextRef}
            size='small'
            variant='contained'
            onClick={() => (last ? finish() : setI(i + 1))}
          >
            {last ? 'Начать работу' : 'Далее'}
          </Button>
        </Stack>
      </Paper>
    </>,
    document.body
  );
}
