import { Box } from '@mui/material';
import logoFull from '@/assets/logo.png';
import logoMark from '@/assets/logo-mark.png';

export function Logo({ compact = false, height = 30 }: { compact?: boolean; height?: number }) {
  return (
    <Box
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '100%',
        ...(theme.palette.mode === 'dark' ? { bgcolor: '#fff', borderRadius: 2, px: 1 } : {}),
      })}
    >
      <Box
        component='img'
        src={compact ? logoMark : logoFull}
        alt='InCustoms.AI'
        sx={{ height, width: 'auto', display: 'block', maxWidth: '100%' }}
      />
    </Box>
  );
}
