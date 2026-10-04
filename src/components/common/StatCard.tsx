import { Box, Card, CardActionArea, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'hero' | 'green' | 'red';
  onClick?: () => void;
}

export function StatCard({ label, value, hint, icon, tone = 'default', onClick }: Props) {
  const hero = tone === 'hero';
  const body = (
    <Box sx={{ p: 2.25 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: hero ? 'rgba(255,255,255,.85)' : 'text.secondary',
          fontSize: 13,
        }}
      >
        {icon}
        {label}
      </Box>
      <Typography
        sx={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          mt: 1,
          color: hero
            ? '#fff'
            : tone === 'green'
              ? 'success.main'
              : tone === 'red'
                ? 'error.main'
                : 'text.primary',
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography
          variant='caption'
          sx={{ color: hero ? 'rgba(255,255,255,.8)' : 'text.secondary' }}
        >
          {hint}
        </Typography>
      )}
    </Box>
  );
  return (
    <Card
      sx={hero ? { background: 'linear-gradient(135deg,#2f6fed,#6d4af2)', border: 0 } : undefined}
    >
      {onClick ? <CardActionArea onClick={onClick}>{body}</CardActionArea> : body}
    </Card>
  );
}
