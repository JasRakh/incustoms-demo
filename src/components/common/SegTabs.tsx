import { Badge, Box, Tab, Tabs } from '@mui/material';
import type { ReactElement } from 'react';

export interface SegItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactElement;
  badge?: number;
}

export function SegTabs<T extends string>({ value, onChange, items, ariaLabel }: { value: T; onChange: (v: T) => void; items: SegItem<T>[]; ariaLabel: string }) {
  return (
    <Box sx={{ mb: 3, maxWidth: '100%' }}>
    <Tabs
      value={value}
      onChange={(_, v: T) => onChange(v)}
      aria-label={ariaLabel}
      variant="scrollable"
      scrollButtons={false}
      sx={{
        minHeight: 42, bgcolor: 'action.hover', p: 0.5, borderRadius: 2, display: 'inline-flex', maxWidth: '100%',
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTab-root': { minHeight: 34, py: 0.5, px: 2, borderRadius: 1.5, color: 'text.secondary', textTransform: 'none', fontWeight: 500, gap: 1 },
        '& .Mui-selected': { bgcolor: 'background.paper', color: 'text.primary !important', boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
      }}
    >
      {items.map(it => (
        <Tab
          key={it.value}
          value={it.value}
          iconPosition="start"
          icon={it.icon}
          label={it.badge ? <Badge color="error" badgeContent={it.badge} sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none', ml: 1 } }}>{it.label}</Badge> : it.label}
        />
      ))}
    </Tabs>
    </Box>
  );
}
