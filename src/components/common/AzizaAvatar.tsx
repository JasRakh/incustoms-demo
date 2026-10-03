import { Box } from '@mui/material';

export function AzizaAvatar({ size = 40, ring = false, online = false }: { size?: number; ring?: boolean; online?: boolean }) {
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Box
        sx={{
          width: size, height: size, borderRadius: '50%', overflow: 'hidden',
          boxShadow: ring ? theme => `0 0 0 3px ${theme.palette.background.paper}, 0 0 0 5px #a78bfa` : 'none',
        }}
      >
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
          <rect width="64" height="64" fill="#dbeafe" />
          <path d="M15 38c-3-17 4-28 17-28s20 11 17 28c-1 6-4 10-4 10H19s-3-4-4-10z" fill="#2b1b17" />
          <rect x="28.5" y="39" width="7" height="7" fill="#e8b48f" />
          <path d="M12 64c0-11 9-19 20-19s20 8 20 19z" fill="#1e40af" />
          <path d="M26 45l6 6 6-6" fill="#fff" />
          <ellipse cx="32" cy="30" rx="10.5" ry="12.5" fill="#f3c9a7" />
          <path d="M21 27c2-9 19-11 22-1-7-4-15-4-22 1z" fill="#2b1b17" />
          <circle cx="27.8" cy="30.5" r="1.4" fill="#2b1b17" />
          <circle cx="36.2" cy="30.5" r="1.4" fill="#2b1b17" />
          <path d="M28.5 36c2 2.2 5 2.2 7 0" stroke="#c2410c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="25" cy="34" r="2" fill="#f9a8a8" opacity=".5" />
          <circle cx="39" cy="34" r="2" fill="#f9a8a8" opacity=".5" />
        </svg>
      </Box>
      {online && (
        <Box sx={{ position: 'absolute', right: 0, bottom: 0, width: size * 0.22, height: size * 0.22, borderRadius: '50%', bgcolor: 'success.main', border: 2, borderColor: 'background.paper' }} />
      )}
    </Box>
  );
}
