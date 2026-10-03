import { Box } from '@mui/material';
import { brand } from '@/theme/theme';

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size * 1.8} height={size} viewBox="0 0 62 34" aria-hidden="true">
      <path d="M4 8 L22 26 M22 8 L4 26" stroke={brand.logoRed} strokeWidth="5" strokeLinecap="round" />
      <path d="M18 18 L28 28 L56 4" stroke={brand.logoBlue} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <LogoMark />
      {!compact && (
        <Box component="span" sx={{ fontWeight: 800, fontSize: 23, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
          <Box component="span" sx={{ color: brand.logoRed }}>In</Box>
          <Box component="span" sx={{ background: `linear-gradient(90deg,#1d4ed8,${brand.logoBlue})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            Customs.AI
          </Box>
        </Box>
      )}
    </Box>
  );
}
