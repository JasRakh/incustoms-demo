import { Box, Button, Card, Chip, Stack, Typography } from '@mui/material';
import { Hammer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DECLARANT_ALL } from '@/app/nav';
import { useStore } from '@/app/store';
import { PageHeader } from '@/components/common/PageHeader';
import { CommunicationsPage } from '@/pages/declarant/CommunicationsPage';
import { GtdEditor } from '@/pages/declarant/gtd/GtdEditor';
import { DeclarationsPage } from '@/pages/declarant/DeclarationsPage';
import { FinancePage } from '@/pages/finance/FinancePage';
import { WorkspacePage } from '@/pages/declarant/WorkspacePage';
import { DealCalculator } from '@/pages/tools/DealCalculator';
import { OcrExcel } from '@/pages/tools/OcrExcel';

export function DeclarantPage() {
  const { update } = useStore();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const sub = pathname.split('/')[2] ?? '';
  if (sub === 'communications') return <CommunicationsPage />;
  if (sub === 'ocr') return <OcrExcel />;
  if (sub === 'finance') return <FinancePage />;
  const gtdId = pathname.split('/')[3];
  if (sub === 'declarations' && gtdId) return <GtdEditor id={gtdId} />;
  if (sub === 'declarations') return <DeclarationsPage />;
  if (sub === 'calculator') return <DealCalculator variant='declarant' />;
  if (sub === '') return <WorkspacePage />;
  return (
    <>
      <PageHeader
        title={
          DECLARANT_ALL.find((i) => i.path === (sub ? `/declarant/${sub}` : '/declarant'))?.text ??
          'Рабочее место'
        }
        subtitle='Интерфейс декларанта, связанный с АИС'
        actions={<Chip label='В разработке' sx={{ bgcolor: '#fef3c7', color: '#854d0e' }} />}
      />
      <Card sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-flex',
            p: 2,
            borderRadius: 3,
            bgcolor: 'rgba(47,111,237,.1)',
            color: 'primary.main',
            mb: 2,
          }}
        >
          <Hammer size={30} />
        </Box>
        <Typography variant='h2'>Раздел для декларантов скоро появится</Typography>
        <Typography color='text.secondary' sx={{ mt: 1, maxWidth: 520, mx: 'auto' }}>
          Здесь будет работа с декларациями, клиентами и обменом с АИС. Каркас, навигация и роли уже
          готовы — сейчас в демо доступен кабинет физического лица.
        </Typography>
        <Stack direction='row' justifyContent='center' sx={{ mt: 3 }}>
          <Button
            variant='contained'
            onClick={() => {
              update((d) => {
                d.role = 'user';
              });
              nav('/');
            }}
          >
            Перейти в кабинет физлица
          </Button>
        </Stack>
      </Card>
    </>
  );
}
