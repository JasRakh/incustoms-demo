import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo, type ReactNode } from 'react';
import { StoreProvider, useStore } from '@/app/store';
import { makeTheme } from '@/theme/theme';
import { Toaster } from '@/components/layout/Toaster';

function Themed({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const theme = useMemo(() => makeTheme(state.mode), [state.mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <Toaster />
    </ThemeProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <Themed>{children}</Themed>
    </StoreProvider>
  );
}
