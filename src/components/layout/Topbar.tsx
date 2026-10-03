import { Avatar, Badge, Box, Breadcrumbs, Button, Divider, IconButton, Link, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Popover, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Bell, ChevronDown, ChevronRight, Compass, Globe, Home, LogOut, Moon, PanelLeft, RotateCcw, Search, Sun, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/app/store';
import { useT } from '@/app/i18n';
import { fmtDateTime, initials } from '@/lib/format';
import { startTour } from '@/components/layout/Tour';
import { ProfileDialog } from '@/components/layout/ProfileDialog';

const SECTION: Record<string, string> = { applications: 'Заявки', tools: 'Инструменты', aziza: 'Азиза', finance: 'Финансы', documents: 'Документы', help: 'Помощь и обучение', declarant: 'АИС Декларант' };
const SUB: Record<string, string> = { calculator: 'Калькулятор сделки', ocr: 'OCR → Excel', list: 'Мои заявки', dialogs: 'Диалоги', requests: 'Запросы в таможню', chat: 'Чат', tasks: 'Задачи', energy: 'Энергия', invoices: 'Счета по договорам', payments: 'Платежи', services: 'Использованные сервисы', faq: 'Частые вопросы', courses: 'Курсы', declarations: 'Декларации', clients: 'Клиенты', ais: 'АИС', reports: 'Отчёты' };

function useCrumbs() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const segs = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [];
  if (!segs.length) return crumbs;
  crumbs.push({ label: SECTION[segs[0]] ?? segs[0], to: `/${segs[0]}` });
  const sub = segs[1] ?? params.get('tab');
  if (sub && SUB[sub]) crumbs.push({ label: SUB[sub] });
  return crumbs;
}

export function Topbar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { state, update, reset } = useStore();
  const t = useT();
  const nav = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const crumbs = useCrumbs();
  const [notifEl, setNotifEl] = useState<HTMLElement | null>(null);
  const [userEl, setUserEl] = useState<HTMLElement | null>(null);
  const [profile, setProfile] = useState(false);
  const unread = state.notifications.filter(n => !n.read).length;
  const home = state.role === 'user' ? '/' : '/declarant';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onSearch(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSearch]);

  const closeUser = () => setUserEl(null);

  return (
    <Box component="header" sx={{ height: 64, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, px: { xs: 1.5, md: 3 }, position: 'sticky', top: 0, zIndex: 20, bgcolor: theme => theme.palette.mode === 'light' ? 'rgba(255,255,255,.9)' : 'rgba(11,17,32,.9)', backdropFilter: 'blur(8px)' }}>
      <Tooltip title={t('toggle_sb')}>
        <IconButton aria-label={t('toggle_sb')} onClick={isMobile ? onMenu : () => update(d => { d.collapsed = !d.collapsed; })}><PanelLeft size={19} /></IconButton>
      </Tooltip>
      <Breadcrumbs aria-label="Навигационная цепочка" separator={<ChevronRight size={14} />} sx={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden', '& ol': { flexWrap: 'nowrap' }, '& li': { whiteSpace: 'nowrap' }, '& li:last-of-type': { minWidth: 0, overflow: 'hidden' }, '& .MuiBreadcrumbs-li:not(:last-of-type), & .MuiBreadcrumbs-separator': { display: crumbs.length ? { xs: 'none', lg: 'flex' } : 'flex' } }}>
        {crumbs.length ? (
          <Link component={RouterLink} to={home} underline="none" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }} aria-label={t('nav_dashboard')}><Home size={16} />{!isMobile && t('nav_dashboard')}</Link>
        ) : (
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 500 }} aria-current="page"><Home size={16} />{t('nav_dashboard')}</Typography>
        )}
        {crumbs.map((c, i) => (i === crumbs.length - 1 || !c.to
          ? <Typography key={c.label} fontWeight={500} aria-current="page" noWrap>{c.label}</Typography>
          : <Link key={c.label} component={RouterLink} to={c.to} underline="none" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{c.label}</Link>))}
      </Breadcrumbs>

      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Button data-tour="search" onClick={onSearch} color="inherit" aria-label="Поиск (⌘K)"
          sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-start', width: { sm: 180, lg: 260 }, minHeight: 36, height: 36, border: 1, borderColor: 'divider', bgcolor: 'action.hover', color: 'text.secondary', gap: 1, px: 1.25 }}>
          <Search size={16} /><Box component="span" sx={{ flex: 1, textAlign: 'left', fontWeight: 400 }}>{t('search')}</Box>
          <Box component="kbd" sx={{ fontSize: 11, border: 1, borderColor: 'divider', borderRadius: 1, px: 0.5, bgcolor: 'background.paper', fontFamily: 'inherit' }}>⌘K</Box>
        </Button>
        <IconButton sx={{ display: { sm: 'none' } }} aria-label="Поиск" onClick={onSearch}><Search size={19} /></IconButton>

        <IconButton aria-label={`${t('notifications')}${unread ? `: ${unread} новых` : ''}`} aria-haspopup="true" onClick={e => setNotifEl(e.currentTarget)} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, width: 38, height: 38 }}>
          <Badge color="error" badgeContent={unread}><Bell size={18} /></Badge>
        </IconButton>
        <Popover open={!!notifEl} anchorEl={notifEl} onClose={() => setNotifEl(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} PaperProps={{ sx: { width: 360, maxWidth: 'calc(100vw - 24px)', mt: 1, borderRadius: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Typography fontWeight={600}>{t('notifications')}</Typography>
            <Button size="small" onClick={() => update(d => { d.notifications.forEach(n => { n.read = true; }); })}>{t('mark_all')}</Button>
          </Box>
          <List dense sx={{ maxHeight: 380, overflow: 'auto', py: 0 }}>
            {state.notifications.length === 0 && <Typography sx={{ p: 3, textAlign: 'center' }} color="text.secondary">{t('no_notifications')}</Typography>}
            {state.notifications.map(n => (
              <ListItemButton key={n.id} sx={{ borderRadius: 0, alignItems: 'flex-start', bgcolor: n.read ? 'transparent' : 'rgba(47,111,237,.07)' }}
                onClick={() => { update(d => { const x = d.notifications.find(z => z.id === n.id); if (x) x.read = true; }); setNotifEl(null); nav(n.to); }}>
                <ListItemIcon sx={{ minWidth: 30, mt: 0.5, color: n.read ? 'text.secondary' : 'primary.main' }}><Bell size={15} /></ListItemIcon>
                <ListItemText primary={n.text} secondary={fmtDateTime(n.at)} primaryTypographyProps={{ fontWeight: n.read ? 400 : 600, fontSize: 14 }} />
              </ListItemButton>
            ))}
          </List>
        </Popover>

        <Button color="inherit" onClick={e => setUserEl(e.currentTarget)} aria-haspopup="true" aria-label={`Меню пользователя: ${state.profile.name}`} sx={{ gap: 1.25, px: 0.75, textAlign: 'left' }} endIcon={!isMobile && <ChevronDown size={16} />}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>{initials(state.profile.name)}</Avatar>
          <Box sx={{ display: { xs: 'none', md: 'block' }, maxWidth: 150 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{state.profile.name}</Typography>
            <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>{state.role === 'user' ? t('role_user') : t('role_declarant')}</Typography>
          </Box>
        </Button>
        <Menu anchorEl={userEl} open={!!userEl} onClose={closeUser} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} PaperProps={{ sx: { width: 260, mt: 1, borderRadius: 3 } }}>
          <Box sx={{ px: 2, py: 1 }}><Typography fontWeight={600} noWrap>{state.profile.name}</Typography><Typography variant="body2" color="text.secondary" noWrap>{state.profile.email}</Typography></Box>
          <Divider />
          <MenuItem onClick={() => { closeUser(); setProfile(true); }}><ListItemIcon><User size={17} /></ListItemIcon>{t('profile')}</MenuItem>
          <MenuItem onClick={() => update(d => { d.mode = d.mode === 'dark' ? 'light' : 'dark'; })}><ListItemIcon>{state.mode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</ListItemIcon>{state.mode === 'dark' ? t('theme_light') : t('theme_dark')}</MenuItem>
          <MenuItem onClick={() => update(d => { d.lang = d.lang === 'ru' ? 'uz' : 'ru'; })}><ListItemIcon><Globe size={17} /></ListItemIcon>{t('lang_other')}</MenuItem>
          <MenuItem onClick={() => { closeUser(); update(d => { d.role = d.role === 'user' ? 'declarant' : 'user'; }); nav(state.role === 'user' ? '/declarant' : '/'); }}>
            <ListItemIcon><Users size={17} /></ListItemIcon>{t('switch_role')}: {state.role === 'user' ? t('role_declarant') : t('role_user')}
          </MenuItem>
          {state.role === 'user' && <MenuItem onClick={() => { closeUser(); startTour(); }}><ListItemIcon><Compass size={17} /></ListItemIcon>{t('tour')}</MenuItem>}
          <MenuItem onClick={() => { closeUser(); if (confirm('Сбросить все демо-данные?')) { reset(); nav('/'); } }}><ListItemIcon><RotateCcw size={17} /></ListItemIcon>{t('reset_demo')}</MenuItem>
          <Divider />
          <MenuItem onClick={() => { closeUser(); update(d => { d.loggedIn = false; }); }} sx={{ color: 'error.main' }}><ListItemIcon sx={{ color: 'inherit' }}><LogOut size={17} /></ListItemIcon>{t('logout')}</MenuItem>
        </Menu>
        <ProfileDialog open={profile} onClose={() => setProfile(false)} />
      </Box>
    </Box>
  );
}
