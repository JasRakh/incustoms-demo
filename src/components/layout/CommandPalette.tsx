import {
  Box,
  Dialog,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Typography,
} from '@mui/material';
import {
  Bot,
  Calculator,
  FileText,
  FolderOpen,
  Home,
  Moon,
  Plus,
  ScanText,
  Search,
  Wallet,
  Zap,
  AlarmClock,
  MessageSquare,
  CircleHelp,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store';

interface Item {
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, update } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  const all = useMemo<Item[]>(() => {
    const go = (to: string) => () => nav(to);
    return [
      { group: 'Действия', label: 'Новая заявка', icon: Plus, run: go('/applications?new=1') },
      {
        group: 'Действия',
        label: 'Рассчитать сделку',
        icon: Calculator,
        run: go('/tools/calculator'),
      },
      {
        group: 'Действия',
        label: 'Распознать документ',
        icon: ScanText,
        run: go('/tools/ocr?new=1'),
      },
      { group: 'Действия', label: 'Спросить Азизу', icon: Bot, run: go('/aziza') },
      { group: 'Действия', label: 'Купить энергию', icon: Zap, run: go('/finance?tab=energy') },
      {
        group: 'Действия',
        label: state.mode === 'dark' ? 'Светлая тема' : 'Тёмная тема',
        icon: Moon,
        run: () =>
          update((d) => {
            d.mode = d.mode === 'dark' ? 'light' : 'dark';
          }),
      },
      { group: 'Разделы', label: 'Главная', icon: Home, run: go('/') },
      { group: 'Разделы', label: 'Заявки', icon: FileText, run: go('/applications') },
      {
        group: 'Разделы',
        label: 'Диалоги и запросы в таможню',
        icon: MessageSquare,
        run: go('/applications?tab=dialogs'),
      },
      {
        group: 'Разделы',
        label: 'Калькулятор сделки',
        icon: Calculator,
        run: go('/tools/calculator'),
      },
      { group: 'Разделы', label: 'OCR → Excel', icon: ScanText, run: go('/tools/ocr') },
      { group: 'Разделы', label: 'Задачи Азизы', icon: AlarmClock, run: go('/aziza?tab=tasks') },
      { group: 'Разделы', label: 'Финансы', icon: Wallet, run: go('/finance') },
      { group: 'Разделы', label: 'Документы', icon: FolderOpen, run: go('/documents') },
      { group: 'Разделы', label: 'Помощь и обучение', icon: CircleHelp, run: go('/help') },
      ...state.applications.map((a) => ({
        group: 'Заявки',
        label: `№${a.id} · ${a.title}`,
        hint: a.description,
        icon: FileText,
        run: go(`/applications?open=${a.id}`),
      })),
      ...state.files.map((f) => ({
        group: 'Документы',
        label: f.name,
        hint: f.source,
        icon: FolderOpen,
        run: go(`/documents?q=${encodeURIComponent(f.name)}`),
      })),
      ...state.tasks.map((x) => ({
        group: 'Задачи',
        label: x.title,
        icon: AlarmClock,
        run: go('/aziza?tab=tasks'),
      })),
    ];
  }, [state.applications, state.files, state.tasks, state.mode, nav, update]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? all.filter((i) => `${i.label} ${i.hint ?? ''}`.toLowerCase().includes(s))
      : all.filter((i) => i.group === 'Действия' || i.group === 'Разделы');
    return list.slice(0, 30);
  }, [all, q]);

  const close = () => {
    setQ('');
    setSel(0);
    onClose();
  };
  const run = (i: Item) => {
    close();
    i.run();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((v) => Math.min(v + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((v) => Math.max(v - 1, 0));
    }
    if (e.key === 'Enter' && results[sel]) {
      e.preventDefault();
      run(results[sel]);
    }
  };

  let lastGroup = '';
  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          position: 'fixed',
          top: { xs: 16, sm: 80 },
          m: { xs: 1.5, sm: 4 },
          width: { xs: 'calc(100% - 24px)', sm: '100%' },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Search size={18} />
        <InputBase
          autoFocus
          fullWidth
          placeholder='Поиск заявок, документов, разделов и действий…'
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={onKey}
          inputProps={{
            'aria-label': 'Поиск',
            role: 'combobox',
            'aria-expanded': true,
            'aria-controls': 'cmdList',
            'aria-activedescendant': `cmd-${sel}`,
          }}
        />
        <Typography
          variant='caption'
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            px: 0.75,
            color: 'text.secondary',
          }}
        >
          Esc
        </Typography>
      </Box>
      <List id='cmdList' role='listbox' dense sx={{ maxHeight: 420, overflow: 'auto', py: 1 }}>
        {results.length === 0 && (
          <Typography sx={{ p: 3, textAlign: 'center' }} color='text.secondary'>
            Ничего не найдено
          </Typography>
        )}
        {results.map((it, idx) => {
          const header =
            it.group !== lastGroup ? (
              <ListSubheader
                key={`h-${it.group}`}
                sx={{
                  lineHeight: '32px',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                {it.group}
              </ListSubheader>
            ) : null;
          lastGroup = it.group;
          const Icon = it.icon;
          return [
            header,
            <ListItemButton
              key={`${it.group}-${idx}`}
              id={`cmd-${idx}`}
              role='option'
              aria-selected={idx === sel}
              selected={idx === sel}
              onMouseEnter={() => setSel(idx)}
              onClick={() => run(it)}
              sx={{ mx: 1, borderRadius: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>
                <Icon size={17} />
              </ListItemIcon>
              <ListItemText
                primary={it.label}
                secondary={it.hint}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>,
          ];
        })}
      </List>
    </Dialog>
  );
}
