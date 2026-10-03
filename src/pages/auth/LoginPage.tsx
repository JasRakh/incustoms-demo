import { Box, Button, Card, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ArrowRight, Briefcase, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store';
import { Logo } from '@/components/common/Logo';
import type { Role } from '@/types';

export function LoginPage() {
  const { update } = useStore();
  const nav = useNavigate();
  const [role, setRole] = useState<Role>('user');

  const enter = () => {
    update(d => { d.loggedIn = true; d.role = role; });
    nav(role === 'user' ? '/' : '/declarant');
  };

  return (
    <Box component="main" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, background: theme => `radial-gradient(circle at 20% 20%, ${theme.palette.mode === 'light' ? '#eaf1ff' : '#1e2a4a'}, ${theme.palette.background.default} 60%)` }}>
      <Card sx={{ width: 440, maxWidth: '100%', p: { xs: 3, sm: 4 }, borderRadius: 4, boxShadow: '0 20px 50px rgba(15,23,42,.12)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}><Logo /></Box>
        <Typography variant="h1" sx={{ fontSize: 24, textAlign: 'center' }}>Добро пожаловать</Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 1, mb: 3 }}>Выберите, как вы работаете с таможней</Typography>
        <ToggleButtonGroup exclusive fullWidth value={role} onChange={(_, v: Role | null) => v && setRole(v)} aria-label="Роль" sx={{ mb: 3, '& .MuiToggleButton-root': { textTransform: 'none', py: 1.5, flexDirection: 'column', gap: 0.5, borderRadius: 2 } }}>
          <ToggleButton value="user"><User size={20} /><b>Физическое лицо</b><Typography variant="caption" color="text.secondary">Посылки, расчёты, заявки</Typography></ToggleButton>
          <ToggleButton value="declarant"><Briefcase size={20} /><b>Декларант</b><Typography variant="caption" color="text.secondary">АИС, декларации, клиенты</Typography></ToggleButton>
        </ToggleButtonGroup>
        <Stack spacing={1}>
          <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={enter}>Войти в демо</Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>Демо-режим: данные хранятся только в этом браузере</Typography>
        </Stack>
      </Card>
    </Box>
  );
}
