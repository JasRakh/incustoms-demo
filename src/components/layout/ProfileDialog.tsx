import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useStore } from '@/app/store';
import { initials } from '@/lib/format';

export function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, update, toast } = useStore();
  const [form, setForm] = useState(state.profile);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setForm(state.profile); setTouched(false); } }, [open, state.profile]);
  const err = touched && !form.name.trim();

  const save = () => {
    setTouched(true);
    if (!form.name.trim()) return;
    update(d => { d.profile = { ...form, name: form.name.trim() }; });
    toast('Профиль сохранён');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Профиль</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', my: 1.5 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>{initials(form.name || 'U')}</Avatar>
          <Box><Typography fontWeight={600}>{form.name || '—'}</Typography><Typography variant="body2" color="text.secondary">{state.role === 'user' ? 'Физическое лицо' : 'Декларант'}</Typography></Box>
        </Box>
        <Stack spacing={2} component="form" id="profileForm" noValidate onSubmit={e => { e.preventDefault(); save(); }}>
          <TextField label="ФИО" required autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={err} helperText={err ? 'Заполните это поле' : ' '} />
          <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <TextField label="Телефон" type="tel" autoComplete="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Отмена</Button>
        <Button variant="contained" type="submit" form="profileForm">Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
}
