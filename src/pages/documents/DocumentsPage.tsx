import { Box, Button, Card, Chip, IconButton, InputAdornment, List, ListItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Download, FileSpreadsheet, FileText, FolderOpen, Search, Trash2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nowIso, uid, useStore } from '@/app/store';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { downloadText, fmtDateTime, fmtSize } from '@/lib/format';
import type { FileExt, FileItem } from '@/types';

const FILTERS: { key: 'all' | 'pdf' | 'excel' | 'other'; label: string; match: (e: FileExt) => boolean }[] = [
  { key: 'all', label: 'Все', match: () => true },
  { key: 'pdf', label: 'PDF', match: e => e === 'pdf' },
  { key: 'excel', label: 'Excel', match: e => e === 'xlsx' || e === 'csv' },
  { key: 'other', label: 'Другое', match: e => !['pdf', 'xlsx', 'csv'].includes(e) },
];

const extOf = (name: string): FileExt => {
  const e = name.split('.').pop()?.toLowerCase();
  return e === 'pdf' ? 'pdf' : e === 'xlsx' || e === 'xls' ? 'xlsx' : e === 'csv' ? 'csv' : e === 'json' ? 'json' : 'txt';
};

export function DocumentsPage() {
  const { state, update, toast } = useStore();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const q = params.get('q') ?? '';
  const f = FILTERS.find(x => x.key === filter)!;
  const list = useMemo(() => state.files.filter(x => f.match(x.ext) && x.name.toLowerCase().includes(q.toLowerCase())), [state.files, f, q]);

  const remove = (file: FileItem) => {
    const idx = state.files.findIndex(x => x.id === file.id);
    update(d => { d.files = d.files.filter(x => x.id !== file.id); });
    toast(`Файл «${file.name}» удалён`, { undo: () => update(d => { d.files.splice(idx, 0, file); }) });
  };

  const upload = (files: File[]) => {
    update(d => { files.forEach(file => d.files.unshift({ id: uid(), name: file.name, ext: extOf(file.name), size: file.size, at: nowIso(), source: 'Загружен вручную' })); });
    toast(files.length > 1 ? `Загружено файлов: ${files.length}` : `Файл «${files[0].name}» загружен`);
  };

  return (
    <>
      <PageHeader title="Документы" subtitle="Расчёты, распознанные документы, квитанции и экспорт диалогов"
        actions={<Button variant="contained" component="label" startIcon={<Upload size={16} />}>Загрузить<input hidden multiple type="file" onChange={e => { const fl = Array.from(e.target.files ?? []); if (fl.length) upload(fl); e.target.value = ''; }} /></Button>} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField placeholder="Поиск по названию файла" value={q} onChange={e => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          inputProps={{ 'aria-label': 'Поиск по названию файла' }} InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }} />
        <Stack direction="row" spacing={0.75} role="group" aria-label="Тип файла">
          {FILTERS.map(x => <Chip key={x.key} clickable aria-pressed={filter === x.key} label={x.label} color={filter === x.key ? 'primary' : 'default'} variant={filter === x.key ? 'filled' : 'outlined'} onClick={() => setFilter(x.key)} sx={{ height: 40, borderRadius: 2, px: 0.5 }} />)}
        </Stack>
      </Stack>
      <Card>
        {list.length ? (
          <List disablePadding>
            {list.map((file, i) => (
              <ListItem key={file.id} divider={i < list.length - 1} sx={{ py: 1.5, gap: 1.5 }}
                secondaryAction={
                  <Stack direction="row">
                    <Tooltip title="Скачать"><IconButton aria-label={`Скачать ${file.name}`} onClick={() => downloadText(file.name.replace(/\.(pdf|xlsx)$/, '.txt'), file.content ?? `${file.name}\nИсточник: ${file.source}\n(демо-файл)`)}><Download size={18} /></IconButton></Tooltip>
                    <Tooltip title="Удалить"><IconButton aria-label={`Удалить ${file.name}`} onClick={() => remove(file)}><Trash2 size={18} /></IconButton></Tooltip>
                  </Stack>
                }>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: file.ext === 'pdf' ? '#fee2e2' : file.ext === 'xlsx' || file.ext === 'csv' ? '#dcfce7' : 'action.hover', color: file.ext === 'pdf' ? '#dc2626' : file.ext === 'xlsx' || file.ext === 'csv' ? '#16a34a' : 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {file.ext === 'xlsx' || file.ext === 'csv' ? <FileSpreadsheet size={19} /> : <FileText size={19} />}
                </Box>
                <Box sx={{ minWidth: 0, pr: 10 }}>
                  <Stack direction="row" spacing={1} alignItems="center"><Typography noWrap fontWeight={500}>{file.name}</Typography><Chip size="small" label={file.ext.toUpperCase()} sx={{ height: 20 }} /></Stack>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{fmtDateTime(file.at)} · {fmtSize(file.size)} · {file.source}</Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : state.files.length ? (
          <EmptyState icon={<Search size={28} />} title="Ничего не найдено" text="Измените запрос или фильтр" action={<Button variant="outlined" onClick={() => { setFilter('all'); setParams({}); }}>Сбросить фильтры</Button>} />
        ) : (
          <EmptyState icon={<FolderOpen size={28} />} title="Документов пока нет" text="Сюда попадут расчёты, распознанные документы, квитанции и экспорт диалогов" />
        )}
      </Card>
    </>
  );
}
