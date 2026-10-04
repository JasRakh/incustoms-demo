import {
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ChevronDown, GripVertical, LogOut, RotateCcw } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useStore } from '@/app/store';
import { useT } from '@/app/i18n';
import {
  DECLARANT_EXTRA,
  DECLARANT_GROUPS,
  DECLARANT_MAIN,
  USER_EXTRA,
  USER_NAV,
  sectionOf,
  type NavItem,
} from '@/app/nav';
import { DECL_MENU_DEFAULT, MENU_DEFAULT } from '@/data/mock';
import { Logo } from '@/components/common/Logo';

export function useNavCounts(): Record<string, number> {
  const { state } = useStore();
  return {
    applications:
      state.applications.filter((a) => a.needDocs && a.status === 'progress').length +
      state.dialogs.filter((d) => !d.archived && d.unread > 0).length,
    finance: state.invoices.filter((i) => !i.paid).length,
    aziza: state.tasks.filter(
      (x) => x.status !== 'done' && x.due < new Date().toISOString().slice(0, 10)
    ).length,
  };
}

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: Props) {
  const { state, update, toast } = useStore();
  const t = useT();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { pathname } = useLocation();
  const counts = useNavCounts();
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const name = (it: NavItem) => it.text ?? t(it.label!);
  const collapsed = state.collapsed && !isMobile;
  const isUser = state.role === 'user';
  const orderKey = isUser ? 'menuOrder' : 'declMenuOrder';
  const order = state[orderKey];
  const items: NavItem[] = isUser
    ? order.map((k) => USER_NAV[k])
    : order.map((k) => DECLARANT_MAIN.find((i) => i.key === k)!);
  const section = sectionOf(pathname);

  const isActive = (it: NavItem) => {
    if (!isUser)
      return it.path === '/declarant' ? pathname === '/declarant' : pathname.startsWith(it.path);
    return it.key === section;
  };

  const move = (key: string, to: number) => {
    update((d) => {
      const list = d[orderKey];
      const from = list.indexOf(key);
      if (from < 0 || to < 0 || to >= list.length) return;
      list.splice(from, 1);
      list.splice(to, 0, key);
    });
  };

  const onKey = (e: KeyboardEvent, key: string) => {
    if (!order.includes(key) || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const i = order.indexOf(key);
    move(key, i + (e.key === 'ArrowUp' ? -1 : 1));
    setTimeout(() => document.querySelector<HTMLElement>(`[data-nav="${key}"]`)?.focus(), 0);
  };

  const row = (it: NavItem, draggable: boolean) => {
    const active = isActive(it);
    const Icon = it.icon;
    const count = counts[it.key] ?? 0;
    const btn = (
      <ListItemButton
        key={it.key}
        component={RouterLink}
        to={it.path}
        data-nav={it.key}
        onClick={() => isMobile && onClose()}
        aria-current={active ? 'page' : undefined}
        aria-describedby={draggable ? 'menuHint' : undefined}
        draggable={draggable}
        onKeyDown={(e: KeyboardEvent) => onKey(e, it.key)}
        onDragStart={() => setDragKey(it.key)}
        onDragOver={(e: React.DragEvent) => {
          if (dragKey) {
            e.preventDefault();
            setOverKey(it.key);
          }
        }}
        onDragEnd={() => {
          setDragKey(null);
          setOverKey(null);
        }}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          if (dragKey && dragKey !== it.key) move(dragKey, order.indexOf(it.key));
          setDragKey(null);
          setOverKey(null);
        }}
        sx={{
          mb: 0.25,
          py: 1,
          px: collapsed ? 1.5 : 1.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.25,
          color: active ? 'primary.main' : 'text.primary',
          bgcolor: active ? 'rgba(47,111,237,.1)' : 'transparent',
          border: '1px dashed',
          borderColor: overKey === it.key && dragKey !== it.key ? 'primary.main' : 'transparent',
          opacity: dragKey === it.key ? 0.4 : 1,
          '&:hover': { bgcolor: active ? 'rgba(47,111,237,.14)' : 'action.hover' },
          '& .grip': { opacity: 0.45 },
          '&:hover .grip': { opacity: 1 },
        }}
      >
        {draggable && !collapsed && (
          <Box
            className='grip'
            aria-hidden
            sx={{ display: 'flex', color: 'text.secondary', ml: -0.5, cursor: 'grab' }}
          >
            <GripVertical size={14} />
          </Box>
        )}
        <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>
          <Badge color='error' variant='dot' invisible={!collapsed || !count}>
            <Icon size={19} />
          </Badge>
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={name(it)}
            primaryTypographyProps={{ fontWeight: active ? 600 : 500, fontSize: 14, noWrap: true }}
          />
        )}
        {!collapsed && count > 0 && (
          <Box
            sx={{
              bgcolor: 'error.main',
              color: '#fff',
              borderRadius: 9,
              minWidth: 20,
              height: 20,
              px: 0.75,
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={`${count} требует внимания`}
          >
            {count}
          </Box>
        )}
        {!collapsed && active && !count && (
          <Box
            aria-hidden
            sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', ml: 'auto' }}
          />
        )}
      </ListItemButton>
    );
    return collapsed ? (
      <Tooltip key={it.key} title={name(it)} placement='right'>
        {btn}
      </Tooltip>
    ) : (
      btn
    );
  };

  const label = (text: string, action?: React.ReactNode) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        px: collapsed ? 0 : 1.25,
        height: 28,
        mb: 0.5,
      }}
    >
      {!collapsed && (
        <Typography
          variant='overline'
          sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '.08em', lineHeight: 1 }}
        >
          {text}
        </Typography>
      )}
      {action}
    </Box>
  );

  const content = (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}
    >
      <Box
        component={RouterLink}
        to={isUser ? '/' : '/declarant'}
        onClick={() => isMobile && onClose()}
        aria-label='InCustoms.AI — главная'
        sx={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 0 : 2,
          borderBottom: 1,
          borderColor: 'divider',
          textDecoration: 'none',
          color: 'inherit',
          flexShrink: 0,
        }}
      >
        <Logo compact={collapsed} />
      </Box>
      <Box
        component='nav'
        aria-label='Основное меню'
        sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', p: 1.25, pt: 2.5 }}
        data-tour='nav'
      >
        {label(
          t('menu'),
          !collapsed ? (
            <Tooltip title={t('reset_order')}>
              <IconButton
                size='small'
                aria-label={t('reset_order')}
                onClick={() => {
                  update((d) => {
                    d[orderKey] = [...(isUser ? MENU_DEFAULT : DECL_MENU_DEFAULT)];
                  });
                  toast('Порядок меню сброшен');
                }}
              >
                <RotateCcw size={15} />
              </IconButton>
            </Tooltip>
          ) : undefined
        )}
        <List disablePadding>{items.map((it) => row(it, true))}</List>
        <Box
          id='menuHint'
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          {t('menu_hint')}
        </Box>
        {!isUser &&
          DECLARANT_GROUPS.map((g) => {
            const GIcon = g.icon;
            const open = !closedGroups[g.key];
            const inner = (
              <List
                disablePadding
                sx={{
                  ml: collapsed ? 0 : 2.25,
                  pl: collapsed ? 0 : 0.75,
                  borderLeft: collapsed ? 0 : 1,
                  borderColor: 'divider',
                }}
              >
                {g.items.map((it) => row(it, false))}
              </List>
            );
            if (collapsed)
              return (
                <Box key={g.key} sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                  {inner}
                </Box>
              );
            return (
              <Box key={g.key} sx={{ mt: 1.5 }}>
                <ListItemButton
                  onClick={() => setClosedGroups((c) => ({ ...c, [g.key]: open }))}
                  aria-expanded={open}
                  sx={{ py: 1, gap: 1.25 }}
                >
                  <GIcon size={19} />
                  <ListItemText
                    primary={g.text}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: 14, noWrap: true }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      transition: 'transform .2s',
                      transform: open ? 'none' : 'rotate(-90deg)',
                    }}
                  >
                    <ChevronDown size={16} />
                  </Box>
                </ListItemButton>
                {open && inner}
              </Box>
            );
          })}
        <Divider sx={{ my: 2 }} />
        {label(t('extra'))}
        <List disablePadding>
          {(isUser ? USER_EXTRA : DECLARANT_EXTRA).map((it) => row(it, false))}
        </List>
        <ListItemButton
          onClick={() =>
            update((d) => {
              d.lang = d.lang === 'ru' ? 'uz' : 'ru';
            })
          }
          aria-label={`Язык: ${t('lang_name')}. Переключить на ${t('lang_other')}`}
          sx={{
            mt: 1.5,
            border: 1,
            borderColor: 'divider',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.25,
            py: 0.75,
          }}
        >
          <span aria-hidden>{state.lang === 'ru' ? '🇷🇺' : '🇺🇿'}</span>
          {!collapsed && (
            <ListItemText
              primary={t('lang_name')}
              primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }}
            />
          )}
        </ListItemButton>
      </Box>
      <Box sx={{ borderTop: 1, borderColor: 'divider', p: 1.25 }}>
        <ListItemButton
          onClick={() =>
            update((d) => {
              d.loggedIn = false;
            })
          }
          sx={{ justifyContent: collapsed ? 'center' : 'flex-start', gap: 1.25, py: 1 }}
        >
          <LogOut size={19} />
          {!collapsed && (
            <ListItemText
              primary={t('logout')}
              primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }}
            />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer open={mobileOpen} onClose={onClose} PaperProps={{ sx: { width: 270 } }}>
        {content}
      </Drawer>
    );
  }
  return (
    <Box
      component='aside'
      sx={{
        width: collapsed ? 76 : 260,
        flexShrink: 0,
        borderRight: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'width .2s',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {content}
    </Box>
  );
}
