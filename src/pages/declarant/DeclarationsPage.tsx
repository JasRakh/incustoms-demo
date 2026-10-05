import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Download,
  FileText,
  FileUp,
  Check,
  Columns3,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  MoreHorizontal,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { nowIso, uid, useStore } from '@/app/store';
import { EmptyState } from '@/components/common/EmptyState';
import { downloadText, fmtCompact, fmtDateTime } from '@/lib/format';
import type { DeclStatus, Declaration } from '@/types';
import { STATUS } from '@/pages/declarant/gtd/status';
import { buildDeclaration, type CreateMode } from '@/pages/declarant/gtd/useGtd';
import { Dropzone } from '@/components/common/Dropzone';

interface Column {
  key: string;
  label: string;
  align?: 'right' | 'center';
  width?: number;
  defaultVisible: boolean;
  render: (d: Declaration, ctx: { onHistory: (d: Declaration) => void }) => ReactNode;
}

const dash = (
  <Box component='span' sx={{ color: 'text.secondary' }}>
    –
  </Box>
);

const COLUMNS: Column[] = [
  { key: 'orderNo', label: '№ Заказа', defaultVisible: true, render: (d) => d.orderNo || dash },
  {
    key: 'gtdNo',
    label: 'Номер ГТД',
    defaultVisible: true,
    render: (d) => (
      <Box>
        <Box>{d.gtdNo || dash}</Box>
        <Typography variant='caption' color='text.secondary'>
          {d.gtdNo ? 'Присвоен' : 'Ожидает'}
        </Typography>
      </Box>
    ),
  },
  {
    key: 'history',
    label: 'Ист.',
    defaultVisible: true,
    render: (d, { onHistory }) => (
      <Tooltip title='Открыть декларацию'>
        <IconButton
          size='small'
          color='primary'
          aria-label={`Открыть ГТД ${d.orderNo || d.id}`}
          onClick={() => onHistory(d)}
        >
          <PenLine size={17} />
        </IconButton>
      </Tooltip>
    ),
  },
  {
    key: 'status',
    label: 'Статус',
    defaultVisible: true,
    render: (d) => (
      <Chip
        size='small'
        label={STATUS[d.status].label}
        sx={{
          bgcolor: STATUS[d.status].bg,
          color: STATUS[d.status].fg,
          height: 24,
          fontWeight: 600,
        }}
      />
    ),
  },
  { key: 'exporter', label: 'Экспортер', defaultVisible: true, render: (d) => d.exporter || dash },
  { key: 'importer', label: 'Импортер', defaultVisible: true, render: (d) => d.importer || dash },
  { key: 'goods', label: 'Товаров', align: 'right', defaultVisible: true, render: (d) => d.goods },
  {
    key: 'amount',
    label: 'Стоимость',
    align: 'right',
    defaultVisible: false,
    render: (d) =>
      d.amount ? (
        <Box component='span' sx={{ whiteSpace: 'nowrap' }}>
          {d.amount.toLocaleString('ru-RU')} USD
        </Box>
      ) : (
        dash
      ),
  },
  {
    key: 'createdAt',
    label: 'Создано',
    defaultVisible: true,
    render: (d) => (
      <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
        {fmtCompact(d.createdAt)}
      </Typography>
    ),
  },
  {
    key: 'verified',
    label: '✓',
    align: 'center',
    defaultVisible: true,
    render: (d) =>
      d.verified ? (
        <Tooltip title='Проверена'>
          <Box
            component='span'
            sx={{ color: 'success.main', display: 'inline-flex' }}
            aria-label='Проверена'
          >
            <Check size={18} />
          </Box>
        </Tooltip>
      ) : (
        dash
      ),
  },
];

const CREATE_ACTIONS: {
  key: string;
  title: string;
  hint: string;
  icon: typeof Plus;
  accent?: boolean;
}[] = [
  {
    key: 'aziza',
    title: 'Заполнить с Азизой (ИИ)',
    hint: 'Загрузите документы — ассистент создаст и заполнит ГТД',
    icon: Sparkles,
    accent: true,
  },
  { key: 'new', title: 'Новая ГТД', hint: 'Упрощённый редактор', icon: FileText },
  { key: 'template', title: 'Из шаблона поставки', hint: 'На основе сохранённой ГТД', icon: Copy },
  { key: 'kts', title: 'Создать КТС', hint: 'Корректировка таможенной стоимости', icon: FileText },
  { key: 'ktd', title: 'Создать КТД', hint: 'Корректировка таможенной декларации', icon: FileText },
];

const STORAGE = 'incustoms-decl-columns-v2';

interface ColumnConfig {
  order: string[];
  visible: string[];
}

const defaultConfig = (): ColumnConfig => ({
  order: COLUMNS.map((c) => c.key),
  visible: COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
});

function loadColumns(): ColumnConfig {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const c = JSON.parse(raw) as ColumnConfig;
      if (COLUMNS.every((x) => c.order.includes(x.key))) return c;
    }
  } catch {
    /* storage unavailable */
  }
  return defaultConfig();
}

function ColumnSettings({
  config,
  onChange,
}: {
  config: ColumnConfig;
  onChange: (c: ColumnConfig) => void;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const byKey = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));

  const toggle = (key: string) => {
    const on = config.visible.includes(key);
    if (on && config.visible.length === 1) return;
    onChange({
      ...config,
      visible: on ? config.visible.filter((k) => k !== key) : [...config.visible, key],
    });
  };

  const move = (from: string, to: string) => {
    if (from === to) return;
    const order = config.order.filter((k) => k !== from);
    order.splice(config.order.indexOf(to), 0, from);
    onChange({ ...config, order });
  };

  return (
    <Box sx={{ width: 300, maxWidth: '100%' }}>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ px: 2, pt: 1.5 }}
      >
        <Typography fontWeight={600}>Настройка столбцов</Typography>
        <Button
          size='small'
          color='inherit'
          startIcon={<RotateCcw size={15} />}
          onClick={() => onChange(defaultConfig())}
        >
          Сброс
        </Button>
      </Stack>
      <Typography variant='caption' color='text.secondary' sx={{ px: 2, display: 'block', mb: 1 }}>
        Перетащите для изменения порядка
      </Typography>
      <Box
        component='ul'
        sx={{ listStyle: 'none', m: 0, p: 0, px: 1, pb: 1, maxHeight: 360, overflowY: 'auto' }}
      >
        {config.order.map((key) => {
          const c = byKey[key];
          const on = config.visible.includes(key);
          return (
            <Box
              component='li'
              key={key}
              draggable
              onDragStart={() => setDragKey(key)}
              onDragOver={(e: React.DragEvent) => {
                if (dragKey) {
                  e.preventDefault();
                  setOverKey(key);
                }
              }}
              onDrop={(e: React.DragEvent) => {
                e.preventDefault();
                if (dragKey) move(dragKey, key);
                setDragKey(null);
                setOverKey(null);
              }}
              onDragEnd={() => {
                setDragKey(null);
                setOverKey(null);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (!e.altKey) return;
                const i = config.order.indexOf(key);
                const target =
                  config.order[i + (e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0)];
                if (target && target !== key) {
                  e.preventDefault();
                  move(key, target);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                py: 0.25,
                pr: 0.5,
                borderRadius: 1.5,
                border: '1px dashed',
                borderColor: overKey === key && dragKey !== key ? 'primary.main' : 'transparent',
                opacity: dragKey === key ? 0.4 : 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box
                aria-hidden
                sx={{ display: 'flex', color: 'text.secondary', cursor: 'grab', pl: 0.5 }}
              >
                <GripVertical size={15} />
              </Box>
              <FormControlLabel
                sx={{ flex: 1, m: 0, color: on ? 'text.primary' : 'text.secondary' }}
                control={
                  <Checkbox
                    size='small'
                    checked={on}
                    disabled={on && config.visible.length === 1}
                    onChange={() => toggle(key)}
                  />
                }
                label={c.label === '✓' ? '✓' : c.label}
              />
              <Tooltip title={on ? 'Скрыть' : 'Показать'}>
                <span>
                  <IconButton
                    size='small'
                    aria-label={`${on ? 'Скрыть' : 'Показать'} столбец ${c.label}`}
                    disabled={on && config.visible.length === 1}
                    onClick={() => toggle(key)}
                    sx={{ color: on ? 'text.secondary' : 'text.disabled' }}
                  >
                    {on ? <Eye size={16} /> : <EyeOff size={16} />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function DeclarationsPage() {
  const { state, update, toast } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | DeclStatus>('all');
  const [colConfig, setColConfig] = useState<ColumnConfig>(loadColumns);
  const visible = colConfig.visible;
  const [selected, setSelected] = useState<string[]>([]);
  const [colsEl, setColsEl] = useState<HTMLElement | null>(null);
  const [createEl, setCreateEl] = useState<HTMLElement | null>(null);
  const [importEl, setImportEl] = useState<HTMLElement | null>(null);
  const [rowMenu, setRowMenu] = useState<{ el: HTMLElement; d: Declaration } | null>(null);
  const [history, setHistory] = useState<Declaration | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cols = colConfig.order
    .filter((k) => visible.includes(k))
    .map((k) => COLUMNS.find((c) => c.key === k)!);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return state.declarations
      .filter((d) => status === 'all' || d.status === status)
      .filter(
        (d) => !s || `${d.orderNo} ${d.gtdNo} ${d.exporter} ${d.importer}`.toLowerCase().includes(s)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.declarations, q, status]);

  const allSelected = list.length > 0 && list.every((d) => selected.includes(d.id));
  const someSelected = selected.length > 0 && !allSelected;

  const saveColumns = (c: ColumnConfig) => {
    setColConfig(c);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(c));
    } catch {
      /* storage unavailable */
    }
  };

  const createDraft = (extra?: Partial<Declaration>) => {
    const now = nowIso();
    const d: Declaration = {
      id: uid(),
      orderNo: '',
      gtdNo: '',
      status: 'draft',
      exporter: '',
      importer: '',
      goods: 0,
      amount: 0,
      createdAt: now,
      updatedAt: now,
      verified: false,
      history: [{ status: 'draft', at: now }],
      ...extra,
    };
    update((s) => {
      s.declarations.unshift(d);
    });
    return d;
  };

  const removeMany = (ids: string[]) => {
    const removed = state.declarations
      .map((d, index) => ({ d, index }))
      .filter((x) => ids.includes(x.d.id));
    update((s) => {
      s.declarations = s.declarations.filter((d) => !ids.includes(d.id));
    });
    setSelected((cur) => cur.filter((id) => !ids.includes(id)));
    toast(ids.length > 1 ? `Удалено ГТД: ${ids.length}` : 'ГТД удалена', {
      undo: () =>
        update((s) => {
          removed.forEach(({ d, index }) => s.declarations.splice(index, 0, d));
        }),
    });
  };

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast('Список обновлён', { severity: 'info' });
    }, 600);
  };

  const xml = (d: Declaration) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<gtd id="${d.id}" status="${d.status}">\n  <orderNo>${d.orderNo}</orderNo>\n  <exporter>${d.exporter}</exporter>\n  <importer>${d.importer}</importer>\n  <goods>${d.goods}</goods>\n</gtd>\n`;

  const openGtd = (d: Declaration) => nav(`/declarant/declarations/${d.id}`);

  const createFrom = (mode: CreateMode) => {
    const d = buildDeclaration(mode);
    update((s) => {
      s.declarations.unshift(d);
    });
    nav(`/declarant/declarations/${d.id}`);
  };

  const startCreate = (key: string) => {
    if (key === 'new') createFrom('blank');
    else if (key === 'template') {
      createFrom('template');
      toast('Создано по шаблону поставки — проверьте даты и транспорт');
    } else if (key === 'aziza') setAiOpen(true);
    else
      toast(
        key === 'kts'
          ? 'КТС создаётся из поданной ГТД — откройте её и выберите «Корректировка»'
          : 'КТД создаётся из поданной ГТД — откройте её и выберите «Корректировка»',
        {
          severity: 'info',
        }
      );
  };

  const rowCtx = { onHistory: openGtd };

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        sx={{ mb: 3, pb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Stack direction='row' spacing={2} alignItems='center' sx={{ flex: 1, minWidth: 0 }}>
          <Button
            color='inherit'
            startIcon={<ArrowLeft size={17} />}
            onClick={() => nav('/declarant')}
          >
            Назад
          </Button>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(47,111,237,.1)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={20} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='h1' sx={{ fontSize: 24 }}>
              Мои ГТД
            </Typography>
            <Typography color='text.secondary' variant='body2'>
              Управление грузовыми таможенными декларациями
            </Typography>
          </Box>
        </Stack>
        <Stack direction='row' spacing={1.5}>
          <Button
            variant='outlined'
            color='inherit'
            startIcon={<Upload size={17} />}
            endIcon={<ChevronDown size={15} />}
            onClick={(e) => setImportEl(e.currentTarget)}
            aria-haspopup='true'
          >
            Импорт XML
          </Button>
          <Button
            variant='contained'
            startIcon={<Plus size={17} />}
            endIcon={<ChevronDown size={15} />}
            onClick={(e) => setCreateEl(e.currentTarget)}
            aria-haspopup='true'
          >
            Создать
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
        <TextField
          placeholder='Поиск по номеру, экспортеру, импортеру...'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ maxWidth: { md: 450 } }}
          inputProps={{ 'aria-label': 'Поиск по ГТД' }}
          InputProps={{
            sx: { height: 40 },
            startAdornment: (
              <InputAdornment position='start'>
                <Search size={16} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          sx={{ width: { xs: '100%', md: 180 } }}
          inputProps={{ 'aria-label': 'Статус' }}
          InputProps={{ sx: { height: 40 } }}
        >
          <MenuItem value='all'>Все статусы</MenuItem>
          {(Object.keys(STATUS) as DeclStatus[]).map((k) => (
            <MenuItem key={k} value={k}>
              {STATUS[k].label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button
          variant='outlined'
          color='inherit'
          startIcon={<Columns3 size={16} />}
          onClick={(e) => setColsEl(e.currentTarget)}
        >
          Столбцы{' '}
          <Box component='span' sx={{ ml: 1, color: 'text.secondary' }}>
            ({visible.length}/{COLUMNS.length})
          </Box>
        </Button>
        <Button
          variant='outlined'
          color='inherit'
          startIcon={
            <Box
              sx={{
                display: 'flex',
                animation: refreshing ? 'spin .8s linear infinite' : 'none',
                '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
              }}
            >
              <RefreshCw size={16} />
            </Box>
          }
          onClick={refresh}
        >
          Обновить
        </Button>
      </Stack>

      <Stack direction='row' spacing={2} alignItems='center' sx={{ mb: 2, minHeight: 32 }}>
        <Typography variant='body2' color='text.secondary'>
          Всего: <b style={{ color: 'inherit' }}>{state.declarations.length}</b>
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Показано: <b>{list.length}</b>
        </Typography>
        {selected.length > 0 && (
          <>
            <Typography variant='body2' sx={{ color: 'primary.main', fontWeight: 600 }}>
              Выбрано: {selected.length}
            </Typography>
            <Button
              size='small'
              color='error'
              startIcon={<Trash2 size={15} />}
              onClick={() => removeMany(selected)}
            >
              Удалить выбранные
            </Button>
            <Button size='small' color='inherit' onClick={() => setSelected([])}>
              Снять выделение
            </Button>
          </>
        )}
      </Stack>

      <Card>
        {list.length ? (
          <TableContainer>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell padding='checkbox' sx={{ pl: 1 }}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={() => setSelected(allSelected ? [] : list.map((d) => d.id))}
                      inputProps={{ 'aria-label': 'Выбрать все' }}
                    />
                  </TableCell>
                  {cols.map((c) => (
                    <TableCell key={c.key} align={c.align} sx={{ fontSize: 14 }}>
                      {c.label}
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((d) => (
                  <TableRow
                    key={d.id}
                    hover
                    selected={selected.includes(d.id)}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, input, a, [role=checkbox]'))
                        return;
                      openGtd(d);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding='checkbox' sx={{ pl: 1 }}>
                      <Checkbox
                        checked={selected.includes(d.id)}
                        onChange={() =>
                          setSelected((cur) =>
                            cur.includes(d.id) ? cur.filter((x) => x !== d.id) : [...cur, d.id]
                          )
                        }
                        inputProps={{ 'aria-label': `Выбрать ГТД ${d.orderNo || d.id}` }}
                      />
                    </TableCell>
                    {cols.map((c) => (
                      <TableCell key={c.key} align={c.align} sx={{ py: 2 }}>
                        {c.render(d, rowCtx)}
                      </TableCell>
                    ))}
                    <TableCell align='right' sx={{ width: 56 }}>
                      <IconButton
                        aria-label='Действия'
                        aria-haspopup='true'
                        onClick={(e) => setRowMenu({ el: e.currentTarget, d })}
                      >
                        <MoreHorizontal size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState
            icon={<FileText size={30} />}
            title={state.declarations.length ? 'Ничего не найдено' : 'Деклараций пока нет'}
            text={
              state.declarations.length
                ? 'Измените поиск или фильтр по статусу'
                : 'Создайте первую ГТД или импортируйте её из XML'
            }
            action={
              state.declarations.length ? (
                <Button
                  variant='outlined'
                  onClick={() => {
                    setQ('');
                    setStatus('all');
                  }}
                >
                  Сбросить фильтры
                </Button>
              ) : undefined
            }
          />
        )}
      </Card>

      <Menu
        anchorEl={createEl}
        open={!!createEl}
        onClose={() => setCreateEl(null)}
        PaperProps={{ sx: { mt: 1, borderRadius: 3, minWidth: 340 } }}
        MenuListProps={{ sx: { py: 1 } }}
      >
        {CREATE_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <MenuItem
              key={a.key}
              sx={{ alignItems: 'flex-start', gap: 1.5, py: 1, whiteSpace: 'normal' }}
              onClick={() => {
                setCreateEl(null);
                startCreate(a.key);
              }}
            >
              <Box
                sx={{
                  mt: 0.25,
                  display: 'flex',
                  color: a.accent ? 'primary.main' : 'text.primary',
                }}
              >
                <Icon size={18} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>
                  {a.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {a.hint}
                </Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Menu>

      <Menu anchorEl={importEl} open={!!importEl} onClose={() => setImportEl(null)}>
        <MenuItem
          onClick={() => {
            setImportEl(null);
            fileRef.current?.click();
          }}
        >
          <ListItemIcon>
            <FileUp size={17} />
          </ListItemIcon>
          Загрузить XML-файл
        </MenuItem>
        <MenuItem
          onClick={() => {
            setImportEl(null);
            toast('Импорт из АИС будет доступен после подключения интеграции', {
              severity: 'info',
            });
          }}
        >
          <ListItemIcon>
            <Download size={17} />
          </ListItemIcon>
          Импорт из АИС
        </MenuItem>
      </Menu>
      <input
        ref={fileRef}
        type='file'
        accept='.xml'
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            createDraft({ orderNo: f.name.replace(/\.xml$/i, ''), exporter: 'Импорт из XML' });
            toast(`ГТД создана из файла «${f.name}»`);
          }
          e.target.value = '';
        }}
      />

      <Popover
        open={!!colsEl}
        anchorEl={colsEl}
        onClose={() => setColsEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { mt: 1, borderRadius: 3 } }}
      >
        <ColumnSettings config={colConfig} onChange={saveColumns} />
      </Popover>

      <Menu anchorEl={rowMenu?.el} open={!!rowMenu} onClose={() => setRowMenu(null)}>
        <MenuItem
          onClick={() => {
            openGtd(rowMenu!.d);
            setRowMenu(null);
          }}
        >
          <ListItemIcon>
            <PenLine size={17} />
          </ListItemIcon>
          Открыть
        </MenuItem>
        <MenuItem
          onClick={() => {
            setHistory(rowMenu!.d);
            setRowMenu(null);
          }}
        >
          <ListItemIcon>
            <FileText size={17} />
          </ListItemIcon>
          История статусов
        </MenuItem>
        <MenuItem
          onClick={() => {
            const src = rowMenu!.d;
            setRowMenu(null);
            createDraft({
              orderNo: src.orderNo ? `${src.orderNo} (копия)` : '',
              exporter: src.exporter,
              importer: src.importer,
              goods: src.goods,
            });
            toast('Создана копия ГТД');
          }}
        >
          <ListItemIcon>
            <Copy size={17} />
          </ListItemIcon>
          Дублировать
        </MenuItem>
        <MenuItem
          onClick={() => {
            const d = rowMenu!.d;
            setRowMenu(null);
            downloadText(`GTD_${d.orderNo || d.id}.xml`, xml(d), 'application/xml;charset=utf-8');
          }}
        >
          <ListItemIcon>
            <Download size={17} />
          </ListItemIcon>
          Скачать XML
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            const d = rowMenu!.d;
            setRowMenu(null);
            removeMany([d.id]);
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Trash2 size={17} />
          </ListItemIcon>
          Удалить
        </MenuItem>
      </Menu>

      <Dialog open={aiOpen} onClose={() => !aiProgress && setAiOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: 'secondary.main', display: 'flex' }}>
            <Sparkles size={20} />
          </Box>
          Заполнить ГТД с Азизой
        </DialogTitle>
        <DialogContent>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            Загрузите инвойс, контракт, упаковочный лист и транспортные документы — Азиза распознает
            их и заполнит декларацию. Заполненные поля будут отмечены, чтобы вы их проверили.
          </Typography>
          {aiProgress ? (
            <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 3 }}>
              <Typography fontWeight={600} sx={{ mb: 1 }}>
                {aiProgress < 40
                  ? 'Распознаём документы…'
                  : aiProgress < 80
                    ? 'Сопоставляем с графами ГТД…'
                    : 'Подбираем коды ТН ВЭД…'}
              </Typography>
              <LinearProgress
                variant='determinate'
                value={aiProgress}
                aria-label='Прогресс заполнения'
              />
            </Box>
          ) : (
            <Dropzone
              title='Перетащите документы или нажмите для выбора'
              hint='PDF, JPG, PNG, XLSX — можно несколько файлов'
              multiple
              onFiles={() => {
                let v = 0;
                setAiProgress(1);
                const t = setInterval(() => {
                  v += 9;
                  setAiProgress(Math.min(v, 100));
                  if (v >= 100) {
                    clearInterval(t);
                    setAiProgress(0);
                    setAiOpen(false);
                    createFrom('ai');
                    toast('Азиза заполнила декларацию — проверьте отмеченные поля');
                  }
                }, 160);
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color='inherit' disabled={!!aiProgress} onClick={() => setAiOpen(false)}>
            Отмена
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!history} onClose={() => setHistory(null)} fullWidth maxWidth='xs'>
        <DialogTitle>История ГТД {history?.orderNo || ''}</DialogTitle>
        <DialogContent>
          <Box component='ol' sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {history &&
              [...history.history].reverse().map((h, i) => (
                <Stack
                  component='li'
                  key={i}
                  direction='row'
                  spacing={1.5}
                  alignItems='center'
                  sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Chip
                    size='small'
                    label={STATUS[h.status].label}
                    sx={{
                      bgcolor: STATUS[h.status].bg,
                      color: STATUS[h.status].fg,
                      fontWeight: 600,
                    }}
                  />
                  <Typography variant='body2' color='text.secondary'>
                    {fmtDateTime(h.at)}
                  </Typography>
                </Stack>
              ))}
          </Box>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1.5 }}>
            Редактирование ГТД будет добавлено вместе с мастером создания.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant='contained' onClick={() => setHistory(null)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
