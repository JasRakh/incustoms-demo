import {
  Box,
  Button,
  Card,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { History, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDateTime } from '@/lib/format';
import type { Declaration, DeclStatus } from '@/types';
import { fieldLabel } from '@/pages/declarant/gtd/schema';
import type { useGtd } from '@/pages/declarant/gtd/useGtd';

type Api = ReturnType<typeof useGtd>;

const LOCKED: DeclStatus[] = [
  'submitted',
  'accepted',
  'released',
  'completed',
  'export',
  'to_export',
];
export const isLocked = (s: DeclStatus) => LOCKED.includes(s);

export function VersionsSection({
  decl,
  api,
  readOnly,
}: {
  decl: Declaration;
  api: Api;
  readOnly: boolean;
}) {
  const versions = decl.versions ?? [];
  return (
    <Card>
      <Stack direction='row' alignItems='center' sx={{ px: 2.5, py: 2 }}>
        <Typography variant='h4' sx={{ flex: 1 }}>
          Версии
        </Typography>
        {!readOnly && (
          <Button size='small' variant='outlined' onClick={api.saveVersion}>
            Сохранить версию
          </Button>
        )}
      </Stack>
      {versions.length === 0 ? (
        <EmptyState
          icon={<History size={26} />}
          title='Версий пока нет'
          text='Сохраняйте версию перед крупными изменениями — к ней можно будет вернуться.'
        />
      ) : (
        <Stack sx={{ px: 2.5, pb: 2 }} spacing={1}>
          {versions.map((v) => (
            <Stack
              key={v.id}
              direction='row'
              alignItems='center'
              spacing={1.5}
              sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600}>{v.label}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {fmtDateTime(v.at)} · товаров: {v.items.length}
                </Typography>
              </Box>
              {!readOnly && (
                <Button
                  size='small'
                  startIcon={<RotateCcw size={14} />}
                  onClick={() => api.restoreVersion(v.id)}
                >
                  Восстановить
                </Button>
              )}
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}

export function JournalSection({
  decl,
  statusLabel,
}: {
  decl: Declaration;
  statusLabel: (s: DeclStatus) => ReactNodeLike;
}) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant='h4' sx={{ mb: 1.5 }}>
        Журнал статусов
      </Typography>
      {[...decl.history].reverse().map((h, i) => (
        <Stack
          key={i}
          direction='row'
          spacing={1.5}
          alignItems='center'
          sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
        >
          {statusLabel(h.status)}
          <Typography variant='body2' color='text.secondary'>
            {fmtDateTime(h.at)}
          </Typography>
        </Stack>
      ))}
    </Card>
  );
}

type ReactNodeLike = React.ReactNode;

export function EditsSection({ decl }: { decl: Declaration }) {
  const edits = decl.edits ?? [];
  return (
    <Card>
      <Typography variant='h4' sx={{ px: 2.5, py: 2 }}>
        История правок
      </Typography>
      {edits.length === 0 ? (
        <EmptyState
          icon={<History size={26} />}
          title='Правок пока нет'
          text='Здесь появится каждое изменение поля: было → стало.'
        />
      ) : (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Когда</TableCell>
                <TableCell>Поле</TableCell>
                <TableCell>Было</TableCell>
                <TableCell>Стало</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {edits.slice(0, 100).map((e, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                    {fmtDateTime(e.at)}
                  </TableCell>
                  <TableCell>
                    {e.field === '__version' ? 'Восстановлена версия' : fieldLabel(e.field)}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{e.from || '—'}</TableCell>
                  <TableCell>{e.to || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
