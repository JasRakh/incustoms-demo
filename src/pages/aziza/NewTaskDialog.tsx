import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';
import { useState } from 'react';
import { useTasks } from '@/pages/aziza/useTasks';
import type { Task } from '@/types';

const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export function NewTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add } = useTasks();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(plusDays(2));
  const [priority, setPriority] = useState<Task['priority']>('mid');
  const [byAziza, setByAziza] = useState(true);
  const [touched, setTouched] = useState(false);
  const error = touched && !title.trim();

  const submit = () => {
    setTouched(true);
    if (!title.trim()) return;
    add({ title: title.trim(), due, priority }, byAziza);
    setTitle(''); setTouched(false); onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Новая задача</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }} component="form" id="taskForm" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
          <TextField autoFocus label="Что нужно сделать" required value={title} onChange={e => setTitle(e.target.value)} error={error} helperText={error ? 'Заполните это поле' : 'Например: «Проверить статус заявки №118»'} />
          <Stack direction="row" spacing={1.5}>
            <TextField type="date" label="Срок" value={due} onChange={e => setDue(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField select label="Приоритет" value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}>
              <MenuItem value="high">Высокий</MenuItem>
              <MenuItem value="mid">Средний</MenuItem>
              <MenuItem value="low">Низкий</MenuItem>
            </TextField>
          </Stack>
          <FormControlLabel control={<Switch checked={byAziza} onChange={e => setByAziza(e.target.checked)} />} label="Поручить Азизе сразу" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>Отмена</Button>
        <Button variant="contained" type="submit" form="taskForm">Создать</Button>
      </DialogActions>
    </Dialog>
  );
}
