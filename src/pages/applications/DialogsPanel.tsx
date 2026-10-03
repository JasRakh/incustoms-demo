import { Badge, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment, InputBase, List, ListItemButton, MenuItem, Select, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Archive, ArchiveRestore, ArrowLeft, CheckCheck, Inbox, Mail, MessageSquare, Paperclip, Search, Send, Settings } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { nowIso, uid, useStore } from '@/app/store';
import type { Channel } from '@/types';
import { ChatBubble } from '@/components/common/ChatBubble';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtTime, relative } from '@/lib/format';

const CH: Record<Channel, { label: string; color: string; icon: React.ReactNode }> = {
  internal: { label: 'Декларант', color: '#0d9488', icon: <MessageSquare size={13} /> },
  email: { label: 'Email', color: '#2f6fed', icon: <Mail size={13} /> },
  telegram: { label: 'Telegram', color: '#0ea5e9', icon: <Send size={13} /> },
};

export function DialogsPanel({ selected, onSelect }: { selected: string | null; onSelect: (id: string | null) => void }) {
  const { state, update, toast } = useStore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [channel, setChannel] = useState<'all' | Channel>('all');
  const [archived, setArchived] = useState(false);
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [settings, setSettings] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => state.dialogs
    .filter(d => d.archived === archived && (channel === 'all' || d.channel === channel))
    .filter(d => !q.trim() || `${d.title} ${d.contact} ${d.messages.map(m => m.text).join(' ')}`.toLowerCase().includes(q.toLowerCase())),
  [state.dialogs, archived, channel, q]);
  const current = state.dialogs.find(d => d.id === selected) ?? null;

  useEffect(() => {
    if (current?.unread) update(d => { const x = d.dialogs.find(z => z.id === current.id); if (x) x.unread = 0; });
  }, [current?.id, current?.unread, update]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [current?.messages.length, current?.id]);

  const send = (attachment?: string) => {
    if (!current || (!text.trim() && !attachment)) return;
    const id = current.id;
    update(d => { d.dialogs.find(z => z.id === id)?.messages.push({ id: uid(), from: 'me', text: text.trim() || 'Файл', attachment, at: nowIso() }); });
    setText('');
    setTimeout(() => update(d => {
      const x = d.dialogs.find(z => z.id === id);
      if (!x) return;
      x.messages.push({ id: uid(), from: 'them', text: attachment ? 'Файл получен, спасибо!' : 'Спасибо, принято. Отвечу в ближайшее время.', at: nowIso() });
      if (selected !== id) x.unread += 1;
    }), 1600);
  };

  const showList = !isMobile || !current;
  const showChat = !isMobile || !!current;

  return (
    <Card sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, height: { xs: 'calc(100vh - 300px)', md: 'calc(100vh - 290px)' }, minHeight: 480, overflow: 'hidden' }}>
      {showList && (
        <Box sx={{ borderRight: { md: 1 }, borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
              <Typography fontWeight={600}>Диалоги <Typography component="span" color="text.secondary">{list.length}</Typography></Typography>
              <Stack direction="row">
                <Tooltip title="Отметить все как прочитанные"><IconButton size="small" aria-label="Отметить все как прочитанные" onClick={() => { update(d => d.dialogs.forEach(x => { x.unread = 0; })); toast('Все диалоги прочитаны'); }}><CheckCheck size={17} /></IconButton></Tooltip>
                <Tooltip title="Настройки подключений"><IconButton size="small" aria-label="Настройки подключений" onClick={() => setSettings(true)}><Settings size={17} /></IconButton></Tooltip>
              </Stack>
            </Stack>
            <Select fullWidth value={channel} onChange={e => setChannel(e.target.value as typeof channel)} inputProps={{ 'aria-label': 'Канал' }} sx={{ mb: 1 }}>
              <MenuItem value="all">Все каналы</MenuItem>
              {(Object.keys(CH) as Channel[]).map(c => <MenuItem key={c} value={c}>{CH[c].label}</MenuItem>)}
            </Select>
            <ToggleButtonGroup exclusive fullWidth size="small" value={archived ? 'arch' : 'act'} onChange={(_, v) => v && setArchived(v === 'arch')} sx={{ mb: 1, '& .MuiToggleButton-root': { textTransform: 'none', py: 0.5 } }}>
              <ToggleButton value="act">Активные</ToggleButton>
              <ToggleButton value="arch">Архив</ToggleButton>
            </ToggleButtonGroup>
            <InputBase fullWidth value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по теме, имени, тексту…" inputProps={{ 'aria-label': 'Поиск по диалогам' }}
              startAdornment={<InputAdornment position="start"><Search size={15} /></InputAdornment>} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, px: 1.25, py: 0.5, fontSize: 14 }} />
          </Box>
          <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {list.length === 0 && <EmptyState icon={<Inbox size={26} />} title="Ничего не найдено" text={archived ? 'В архиве пусто' : 'Измените фильтр или поиск'} />}
            {list.map(d => {
              const last = d.messages[d.messages.length - 1];
              return (
                <ListItemButton key={d.id} selected={d.id === selected} onClick={() => onSelect(d.id)} sx={{ alignItems: 'flex-start', gap: 1.25, mb: 0.5, py: 1.25 }}>
                  <Badge color="error" badgeContent={d.unread} overlap="circular">
                    <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: CH[d.channel].color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CH[d.channel].icon}</Box>
                  </Badge>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography noWrap sx={{ fontWeight: d.unread ? 700 : 500, fontSize: 14 }}>{d.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{last ? relative(last.at) : ''}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>{last?.text}</Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}
      {showChat && (
        current ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              {isMobile && <IconButton aria-label="Назад к списку" onClick={() => onSelect(null)}><ArrowLeft size={18} /></IconButton>}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={600} noWrap>{current.title}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" icon={<Box sx={{ display: 'flex', color: '#fff !important', pl: 0.5 }}>{CH[current.channel].icon}</Box>} label={CH[current.channel].label} sx={{ height: 20, bgcolor: CH[current.channel].color, color: '#fff' }} />
                  <Typography variant="caption" color="text.secondary" noWrap>{current.contact}</Typography>
                </Stack>
              </Box>
              <Tooltip title={current.archived ? 'Вернуть из архива' : 'В архив'}>
                <IconButton aria-label={current.archived ? 'Вернуть из архива' : 'В архив'} onClick={() => { const id = current.id; const was = current.archived; update(d => { const x = d.dialogs.find(z => z.id === id); if (x) x.archived = !was; }); onSelect(null); toast(was ? 'Диалог возвращён' : 'Диалог перемещён в архив', { undo: () => update(d => { const x = d.dialogs.find(z => z.id === id); if (x) x.archived = was; }) }); }}>
                  {current.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                </IconButton>
              </Tooltip>
            </Stack>
            <Box ref={listRef} role="log" aria-live="polite" sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {current.messages.map(m => <ChatBubble key={m.id} m={m} avatar={<Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: CH[current.channel].color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{CH[current.channel].icon}</Box>} />)}
            </Box>
            <Box component="form" onSubmit={e => { e.preventDefault(); send(); }} sx={{ display: 'flex', gap: 1, p: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <IconButton component="label" aria-label="Прикрепить файл"><Paperclip size={18} /><input hidden type="file" onChange={e => { const f = e.target.files?.[0]; if (f) send(f.name); }} /></IconButton>
              <InputBase fullWidth value={text} onChange={e => setText(e.target.value)} placeholder={`Сообщение (${CH[current.channel].label})…`} inputProps={{ 'aria-label': 'Сообщение' }} sx={{ px: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }} />
              <Button type="submit" variant="contained" disabled={!text.trim()} aria-label="Отправить" sx={{ minWidth: 44 }}><Send size={17} /></Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState icon={<MessageSquare size={28} />} title="Выберите диалог" text={`Переписка с декларантом, Email и Telegram в одном месте. Сейчас: ${fmtTime(new Date().toISOString())}`} />
          </Box>
        )
      )}
      <Dialog open={settings} onClose={() => setSettings(false)} fullWidth maxWidth="xs">
        <DialogTitle>Настройки подключений</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControlLabel control={<Switch defaultChecked />} label="Email" />
            <TextField label="Адрес для входящих" defaultValue="<YOUR_EMAIL>" helperText="Демо: подключение не выполняется" />
            <FormControlLabel control={<Switch defaultChecked />} label="Telegram" />
            <FormControlLabel control={<Switch defaultChecked disabled />} label="Внутренние диалоги с декларантом" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button variant="contained" onClick={() => { setSettings(false); toast('Настройки сохранены'); }}>Сохранить</Button></DialogActions>
      </Dialog>
    </Card>
  );
}
