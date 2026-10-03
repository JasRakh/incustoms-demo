import { Badge, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store';
import { useT } from '@/app/i18n';
import { DECLARANT_NAV, USER_NAV, sectionOf } from '@/app/nav';
import { useNavCounts } from '@/components/layout/Sidebar';

export function BottomNav() {
  const { state } = useStore();
  const t = useT();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const counts = useNavCounts();
  const isUser = state.role === 'user';
  const items = isUser ? state.menuOrder.filter(k => k !== 'aziza').map(k => USER_NAV[k]) : DECLARANT_NAV;
  const value = isUser ? sectionOf(pathname) : (DECLARANT_NAV.slice().reverse().find(i => pathname.startsWith(i.path))?.key ?? 'd-dashboard');

  return (
    <Paper data-tour="bottom-nav" component="nav" aria-label="Основное меню" elevation={0} sx={{ display: { xs: 'block', sm: 'none' }, position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, borderTop: 1, borderColor: 'divider', pb: 'env(safe-area-inset-bottom)' }}>
      <BottomNavigation value={value} showLabels sx={{ height: 64, bgcolor: 'background.paper' }}>
        {items.map(it => {
          const Icon = it.icon;
          return (
            <BottomNavigationAction
              key={it.key}
              value={it.key}
              label={t(it.label)}
              onClick={() => nav(it.path)}
              icon={<Badge color="error" variant="dot" invisible={!counts[it.key]}><Icon size={20} /></Badge>}
              sx={{ minWidth: 0, px: 0.5, '& .MuiBottomNavigationAction-label': { fontSize: 10.5, mt: 0.25, whiteSpace: 'nowrap' }, '& .Mui-selected': { fontSize: '10.5px !important' } }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
