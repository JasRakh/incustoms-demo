import { Box, Typography } from '@mui/material';
import { Check, Info, TriangleAlert } from 'lucide-react';
import type { Application } from '@/types';

const STEPS = ['Подана', 'В работе', 'Завершена'];

export function StageStepper({ app }: { app: Application }) {
  if (app.status === 'cancelled') return null;
  const idx = { pending: 0, progress: 1, done: 2 }[app.status];
  return (
    <Box component="ol" aria-label="Этапы заявки" sx={{ display: 'flex', alignItems: 'center', listStyle: 'none', p: 0, my: 1.5 }}>
      {STEPS.map((s, i) => {
        const done = i < idx || app.status === 'done';
        const cur = i === idx && app.status !== 'done';
        return (
          <Box component="li" key={s} sx={{ display: 'flex', alignItems: 'center', flex: i ? 1 : 'none' }} aria-current={cur ? 'step' : undefined}>
            {i > 0 && <Box aria-hidden sx={{ flex: 1, height: 2, mx: 1, minWidth: 12, bgcolor: i <= idx ? 'success.main' : 'divider' }} />}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%', border: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                borderColor: done ? 'success.main' : cur ? 'primary.main' : 'divider', bgcolor: done ? 'success.main' : cur ? 'rgba(47,111,237,.12)' : 'transparent',
              }}>
                {done && <Check size={12} />}
              </Box>
              <Typography variant="caption" sx={{ fontWeight: cur ? 600 : 400, color: cur ? 'text.primary' : 'text.secondary', whiteSpace: 'nowrap' }}>{s}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

const HINTS: Record<string, string> = {
  pending: 'ждём, пока декларант возьмёт заявку — обычно до 15 минут.',
  progress: 'декларант оформляет заявку. Новые сообщения появятся в диалогах.',
  docs: 'загрузите документы, чтобы не задерживать оформление.',
  done: 'заявка завершена. Документы — в разделе «Документы».',
  cancelled: 'заявка отменена. Можно создать новую.',
};

export function NextHint({ app }: { app: Application }) {
  const docs = app.status === 'progress' && app.needDocs;
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: 1, px: 1.25, borderRadius: 2, border: 1, borderColor: docs ? 'warning.light' : 'divider', bgcolor: docs ? 'rgba(217,119,6,.06)' : 'action.hover', color: 'text.secondary' }}>
      <Box sx={{ mt: '2px', color: docs ? 'warning.main' : 'text.secondary' }}>{docs ? <TriangleAlert size={15} /> : <Info size={15} />}</Box>
      <Typography variant="body2"><Box component="b" sx={{ color: 'text.primary' }}>Что дальше:</Box> {HINTS[docs ? 'docs' : app.status]}</Typography>
    </Box>
  );
}
