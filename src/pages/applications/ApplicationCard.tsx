import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { Clock, Paperclip } from 'lucide-react';
import type { Application } from '@/types';
import { StatusChip, TypeChip, STATUS_LABEL } from '@/components/common/StatusChip';
import { NextHint, StageStepper } from '@/components/common/StageStepper';
import { fmtDateTime } from '@/lib/format';

export function ApplicationCard({ app, onOpen }: { app: Application; onOpen: () => void }) {
  return (
    <Card sx={{ mb: 1.25, '&:hover': { borderColor: 'rgba(47,111,237,.35)' } }}>
      <CardActionArea onClick={onOpen} aria-label={`Заявка №${app.id}: ${app.title}, ${STATUS_LABEL[app.status]}`} sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 500 }}>{app.title}</Typography>
          <StatusChip status={app.status} />
          <TypeChip type={app.type} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto !important' }}>№{app.id}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{app.description}</Typography>
        <StageStepper app={app} />
        <NextHint app={app} />
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1, color: 'text.secondary' }}>
          <Clock size={13} /><Typography variant="caption">{fmtDateTime(app.createdAt)}</Typography>
          {app.attachment && <><Box sx={{ mx: 0.5 }}>·</Box><Paperclip size={13} /><Typography variant="caption">{app.attachment}</Typography></>}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
