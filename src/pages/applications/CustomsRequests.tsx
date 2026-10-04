import {
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Landmark, Plus } from 'lucide-react';
import { useState } from 'react';
import { nowIso, useStore } from '@/app/store';
import { ToneChip } from '@/components/common/StatusChip';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtShort } from '@/lib/format';

const ST = {
  draft: { l: 'Черновик', t: 'gray' as const },
  sent: { l: 'Отправлен', t: 'blue' as const },
  answered: { l: 'Получен ответ', t: 'green' as const },
};
const POSTS = ['Ташкент-Авиа', 'Ташкент-ЖД', 'Яллама', 'Алат', 'Термез'];

export function CustomsRequests() {
  const { state, update, toast, notify } = useStore();
  const [open, setOpen] = useState(false);
  const [post, setPost] = useState(POSTS[0]);
  const [subject, setSubject] = useState('');
  const [touched, setTouched] = useState(false);

  const submit = () => {
    setTouched(true);
    if (!subject.trim()) return;
    const id = `R-${2058 + state.customsRequests.length}`;
    update((d) => {
      d.customsRequests.unshift({
        id,
        post,
        subject: subject.trim(),
        status: 'sent',
        at: nowIso(),
      });
    });
    toast(`Запрос ${id} отправлен`);
    setOpen(false);
    setSubject('');
    setTouched(false);
    setTimeout(() => {
      update((d) => {
        const r = d.customsRequests.find((x) => x.id === id);
        if (r) r.status = 'answered';
      });
      notify(`Получен ответ таможни на запрос ${id}`, '/applications?tab=requests');
    }, 6000);
  };

  return (
    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}
      >
        <div>
          <Typography variant='h2'>Запросы в таможню</Typography>
          <Typography variant='body2' color='text.secondary'>
            Официальные запросы на таможенные посты и ответы на них
          </Typography>
        </div>
        <Button variant='contained' startIcon={<Plus size={16} />} onClick={() => setOpen(true)}>
          Новый запрос
        </Button>
      </Stack>
      {state.customsRequests.length ? (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Номер</TableCell>
                <TableCell>Тема</TableCell>
                <TableCell>Пост</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {state.customsRequests.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.id}</TableCell>
                  <TableCell>{r.subject}</TableCell>
                  <TableCell>{r.post}</TableCell>
                  <TableCell>{fmtShort(r.at)}</TableCell>
                  <TableCell>
                    <ToneChip label={ST[r.status].l} tone={ST[r.status].t} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          icon={<Landmark size={28} />}
          title='Запросов пока нет'
          text='Задайте вопрос таможенному посту — ответ придёт сюда и в уведомления'
        />
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Новый запрос в таможню</DialogTitle>
        <DialogContent>
          <Stack
            spacing={2}
            sx={{ mt: 1 }}
            component='form'
            id='reqForm'
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <TextField
              select
              label='Таможенный пост'
              value={post}
              onChange={(e) => setPost(e.target.value)}
            >
              {POSTS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              autoFocus
              required
              label='Тема запроса'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              error={touched && !subject.trim()}
              helperText={
                touched && !subject.trim()
                  ? 'Заполните это поле'
                  : 'Например: «Уточнение кода ТН ВЭД»'
              }
            />
            <TextField multiline minRows={4} label='Текст запроса' />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant='outlined' color='inherit' onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button variant='contained' type='submit' form='reqForm'>
            Отправить
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
