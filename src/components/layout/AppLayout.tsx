import { Box, Link, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { AzizaWidget } from '@/components/layout/AzizaWidget';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { TOUR_EVENT, Tour } from '@/components/layout/Tour';
import { useT } from '@/app/i18n';

export function AppLayout() {
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener(TOUR_EVENT, close);
    return () => window.removeEventListener(TOUR_EVENT, close);
  }, []);

  const openSearch = useCallback(() => setSearch(true), []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Link href="#main" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}
        sx={{ position: 'fixed', left: 12, top: -80, zIndex: 3000, bgcolor: 'primary.main', color: '#fff', px: 2, py: 1, borderRadius: 2, fontWeight: 600, '&:focus': { top: 12 } }}>
        {t('skip')}
      </Link>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar onMenu={() => setMobileOpen(true)} onSearch={openSearch} />
        <Box component="main" id="main" ref={mainRef} tabIndex={-1} sx={{ flex: 1, outline: 'none', px: { xs: 2, md: 5 }, py: { xs: 3, md: 5 }, pb: { xs: 12, sm: 6 }, width: '100%', maxWidth: 1600, mx: 'auto' }}>
          <Outlet />
        </Box>
        <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', px: 2, py: 2, pb: { xs: 11, sm: 2 }, color: 'text.secondary', display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">© 2026 InCustoms.AI v2.0</Typography>
        </Box>
      </Box>
      <BottomNav />
      <AzizaWidget />
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <Tour />
    </Box>
  );
}
