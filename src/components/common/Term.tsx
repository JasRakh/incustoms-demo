import { Box, Tooltip } from '@mui/material';
import type { ReactNode } from 'react';

export function Term({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <Tooltip title={tip} placement="top">
      <Box component="span" tabIndex={0} sx={{ borderBottom: '1px dashed currentColor', cursor: 'help' }}>{children}</Box>
    </Tooltip>
  );
}
