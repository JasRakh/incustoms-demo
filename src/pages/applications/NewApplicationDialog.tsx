import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Paperclip, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AppType } from '@/types';
import { TYPE_LABEL } from '@/components/common/StatusChip';

export interface NewAppPrefill {
  title?: string;
  description?: string;
  type?: AppType;
  attachment?: string;
}

export function NewApplicationDialog({
  open,
  onClose,
  onCreate,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (d: Required<Omit<NewAppPrefill, 'attachment'>> & { attachment?: string }) => void;
  prefill?: NewAppPrefill;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AppType>('customs');
  const [attachment, setAttachment] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(prefill?.title ?? '');
      setDescription(prefill?.description ?? '');
      setType(prefill?.type ?? 'customs');
      setAttachment(prefill?.attachment);
      setTouched(false);
    }
  }, [open, prefill]);

  const submit = () => {
    setTouched(true);
    if (!title.trim() || !description.trim()) return;
    onCreate({ title: title.trim(), description: description.trim(), type, attachment });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Новая заявка</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Декларант возьмёт заявку в работу в течение 15 минут и напишет вам в «Диалоги».
        </Typography>
        <Stack
          spacing={2}
          component='form'
          id='newAppForm'
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <TextField
            autoFocus
            required
            label='Тема заявки'
            placeholder='Например: растаможка посылки'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={touched && !title.trim()}
            helperText={touched && !title.trim() ? 'Заполните это поле' : ' '}
          />
          <TextField
            select
            label='Тип услуги'
            value={type}
            onChange={(e) => setType(e.target.value as AppType)}
          >
            {(Object.keys(TYPE_LABEL) as AppType[]).map((k) => (
              <MenuItem key={k} value={k}>
                {TYPE_LABEL[k]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            required
            multiline
            minRows={4}
            label='Описание'
            placeholder='Товар, страна отправления, вес и стоимость'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={touched && !description.trim()}
            helperText={
              touched && !description.trim()
                ? 'Заполните это поле'
                : 'Чем подробнее, тем быстрее декларант начнёт работу'
            }
          />
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Button
              component='label'
              variant='outlined'
              size='small'
              startIcon={<Paperclip size={15} />}
            >
              Прикрепить файл
              <input
                hidden
                type='file'
                onChange={(e) => setAttachment(e.target.files?.[0]?.name)}
              />
            </Button>
            <Typography variant='body2' color='text.secondary' noWrap>
              {attachment ?? 'Файл не выбран'}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant='outlined' color='inherit' onClick={onClose}>
          Отмена
        </Button>
        <Button variant='contained' type='submit' form='newAppForm' startIcon={<Send size={16} />}>
          Создать заявку
        </Button>
      </DialogActions>
    </Dialog>
  );
}
