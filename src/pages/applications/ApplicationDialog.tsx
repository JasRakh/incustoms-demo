import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { MessageSquare, Play, Trash2, Upload, X } from 'lucide-react';
import type { Application } from '@/types';
import { StatusChip, TypeChip } from '@/components/common/StatusChip';
import { NextHint, StageStepper } from '@/components/common/StageStepper';
import { fmtDateTime } from '@/lib/format';
import { useApplications } from '@/pages/applications/useApplications';

interface Props {
  app: Application | null;
  onClose: () => void;
  onChat: (app: Application) => void;
}

export function ApplicationDialog({ app, onClose, onChat }: Props) {
  const { setStatus, cancel, remove, uploadDocs } = useApplications();
  if (!app) return null;
  const next = app.status === 'pending' ? 'progress' : app.status === 'progress' ? 'done' : null;
  const row = (k: string, v: React.ReactNode) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' }, gap: { xs: 0.25, sm: 1.5 }, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{k}</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{v}</Typography>
    </Box>
  );
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="appTitle">
      <DialogTitle id="appTitle" sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 6 }}>
        Заявка №{app.id}
        <IconButton aria-label="Закрыть" onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Typography variant="h3">{app.title}</Typography><StatusChip status={app.status} /><TypeChip type={app.type} />
        </Stack>
        <StageStepper app={app} />
        <NextHint app={app} />
        <Box sx={{ mt: 2 }}>
          {row('Описание', app.description)}
          {row('Создана', fmtDateTime(app.createdAt))}
          {app.attachment && row('Вложение', app.attachment)}
        </Box>
        <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>История статусов</Typography>
        <Box component="ol" sx={{ pl: 0, m: 0, listStyle: 'none', position: 'relative', '&::before': { content: '""', position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, bgcolor: 'divider' } }}>
          {[...app.history].reverse().map((h, i) => (
            <Box component="li" key={i} sx={{ position: 'relative', pl: 3.5, pb: 1.5, '&::before': { content: '""', position: 'absolute', left: 0, top: 3, width: 14, height: 14, borderRadius: '50%', border: 2, borderColor: 'primary.main', bgcolor: 'background.paper' } }}>
              <Stack direction="row" spacing={1} alignItems="center"><StatusChip status={h.status} /><Typography variant="caption" color="text.secondary">{fmtDateTime(h.at)}</Typography></Stack>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Button color="error" startIcon={<Trash2 size={16} />} onClick={() => { remove(app.id); onClose(); }} sx={{ mr: 'auto' }}>Удалить</Button>
        {(app.status === 'pending' || app.status === 'progress') && <Button variant="outlined" color="inherit" onClick={() => { cancel(app.id); onClose(); }}>Отменить заявку</Button>}
        {next && <Button variant="outlined" startIcon={<Play size={14} />} onClick={() => setStatus(app.id, next)}>Следующий статус (демо)</Button>}
        {app.needDocs && app.status === 'progress' && (
          <Button variant="outlined" component="label" startIcon={<Upload size={16} />}>Загрузить документы<input hidden type="file" onChange={e => { const f = e.target.files?.[0]; if (f) uploadDocs(app.id, f.name); }} /></Button>
        )}
        <Button variant="contained" startIcon={<MessageSquare size={16} />} onClick={() => onChat(app)}>Написать декларанту</Button>
      </DialogActions>
    </Dialog>
  );
}
