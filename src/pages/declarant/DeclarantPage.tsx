import { Box, Button, Card, Chip, Grid, Stack, Typography } from '@mui/material';
import { BarChart3, Database, FileCheck2, Hammer, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';

const TITLES: Record<string, string> = { '': 'Рабочий стол декларанта', declarations: 'Декларации', clients: 'Клиенты', ais: 'Интеграция с АИС', reports: 'Отчёты' };

export function DeclarantPage() {
  const { update } = useStore();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const sub = pathname.split('/')[2] ?? '';
  return (
    <>
      <PageHeader title={TITLES[sub] ?? TITLES['']} subtitle="Интерфейс декларанта, связанный с АИС" actions={<Chip label="В разработке" sx={{ bgcolor: '#fef3c7', color: '#854d0e' }} />} />
      {sub === '' && (
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}><StatCard icon={<FileCheck2 size={15} />} label="Декларации в работе" value="—" /></Grid>
          <Grid item xs={6} md={3}><StatCard icon={<Users size={15} />} label="Клиенты" value="—" /></Grid>
          <Grid item xs={6} md={3}><StatCard icon={<Database size={15} />} label="Статус АИС" value="—" /></Grid>
          <Grid item xs={6} md={3}><StatCard icon={<BarChart3 size={15} />} label="Выпуск за месяц" value="—" /></Grid>
        </Grid>
      )}
      <Card sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', p: 2, borderRadius: 3, bgcolor: 'rgba(47,111,237,.1)', color: 'primary.main', mb: 2 }}><Hammer size={30} /></Box>
        <Typography variant="h2">Раздел для декларантов скоро появится</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 520, mx: 'auto' }}>
          Здесь будет работа с декларациями, клиентами и обменом с АИС. Каркас, навигация и роли уже готовы — сейчас в демо доступен кабинет физического лица.
        </Typography>
        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
          <Button variant="contained" onClick={() => { update(d => { d.role = 'user'; }); nav('/'); }}>Перейти в кабинет физлица</Button>
        </Stack>
      </Card>
    </>
  );
}
