import { alpha, createTheme } from '@mui/material/styles';

export const brand = {
  primary: '#2f6fed',
  purple: '#9333ea',
  green: '#16a34a',
  teal: '#0d9488',
  orange: '#d97706',
  red: '#dc2626',
  logoRed: '#e5322d',
  logoBlue: '#2563eb',
};

export function makeTheme(mode: 'light' | 'dark') {
  const light = mode === 'light';
  return createTheme({
    palette: {
      mode,
      primary: { main: brand.primary, light: '#5b8ff9', contrastText: '#ffffff' },
      secondary: { main: brand.purple },
      success: { main: brand.green },
      error: { main: light ? brand.red : '#f87171' },
      warning: { main: brand.orange },
      background: light ? { default: '#ffffff', paper: '#ffffff' } : { default: '#0b1120', paper: '#111827' },
      divider: light ? '#e5e7eb' : '#253041',
      text: light ? { primary: '#0f172a', secondary: '#5f6673' } : { primary: '#e5e7eb', secondary: '#a1adbf' },
      action: { hover: light ? '#f3f4f6' : '#1f2937' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      h1: { fontSize: 30, fontWeight: 800, letterSpacing: '-0.6px' },
      h2: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' },
      h3: { fontSize: 17, fontWeight: 600 },
      h4: { fontSize: 15, fontWeight: 600 },
      subtitle1: { fontSize: 16 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { WebkitFontSmoothing: 'antialiased' },
          '*:focus-visible': { outline: `2px solid ${brand.primary}`, outlineOffset: 2 },
          '@media (prefers-reduced-motion: reduce)': { '*': { animation: 'none !important', transition: 'none !important' } },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 8, minHeight: 40, whiteSpace: 'nowrap' }, sizeSmall: { minHeight: 32 } },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderRadius: 12 } } },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiSelect: { defaultProps: { size: 'small' } },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 14 } } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 500, color: light ? '#5f6673' : '#a1adbf', fontSize: 12, whiteSpace: 'nowrap' } } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, height: 8, backgroundColor: alpha(brand.primary, 0.12) } } },
    },
  });
}
