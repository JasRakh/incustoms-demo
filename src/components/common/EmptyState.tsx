import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <Box sx={{ textAlign: 'center', py: 5, px: 2, color: 'text.secondary' }}>
      <Box
        sx={{
          display: 'inline-flex',
          p: 1.5,
          borderRadius: 3,
          bgcolor: 'action.hover',
          mb: 1.5,
          opacity: 0.8,
        }}
      >
        {icon}
      </Box>
      <Typography variant='h4' color='text.primary'>
        {title}
      </Typography>
      {text && (
        <Typography variant='body2' sx={{ mt: 0.5, maxWidth: 420, mx: 'auto' }}>
          {text}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
