import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, LinearProgress, Radio, RadioGroup, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Activity, CircleAlert, CircleCheck, CreditCard, FileText, History, Landmark, Package, Receipt, Smartphone, TrendingDown, TrendingUp, Wallet, Zap } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nowIso, uid, useStore } from '@/app/store';
import { PageHeader } from '@/components/common/PageHeader';
import { SegTabs } from '@/components/common/SegTabs';
import { StatCard } from '@/components/common/StatCard';
import { ToneChip } from '@/components/common/StatusChip';
import { EmptyState } from '@/components/common/EmptyState';
import { fmtDateTime, fmtShort, money, today } from '@/lib/format';

type TabKey = 'energy' | 'invoices' | 'payments' | 'services';

const PACKAGES = [
  { id: 'start', name: 'Стартовый', energy: 50, bonus: 0, usd: 10 },
  { id: 'base', name: 'Базовый', energy: 150, bonus: 15, usd: 25, popular: true },
  { id: 'pro', name: 'Профессиональный', energy: 500, bonus: 75, usd: 70 },
  { id: 'corp', name: 'Корпоративный', energy: 2000, bonus: 500, usd: 240 },
];
const TARIFFS = [
  ['AI-ассистент, быстрая модель', 1], ['AI-ассистент, точная модель', 3], ['OCR → Excel, за документ', 2], ['Калькулятор сделки', 0], ['Экспорт диалога в PDF', 0],
] as const;
const USD = 12500;

export function FinancePage() {
  const { state, update, toast, notify } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'energy';
  const [sub, setSub] = useState<'packages' | 'tariffs' | 'history'>('packages');
  const [buy, setBuy] = useState<(typeof PACKAGES)[number] | null>(null);
  const [method, setMethod] = useState('card');
  const [paying, setPaying] = useState(false);

  const received = state.energy.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const used = state.energy.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
  const balance = received - used;
  const billed = state.invoices.reduce((s, i) => s + i.amount, 0);
  const paid = state.invoices.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
  const debt = billed - paid;
  const unpaid = state.invoices.filter(i => !i.paid).length;

  const pay = (id: string) => {
    update(d => {
      const inv = d.invoices.find(i => i.id === id);
      if (!inv) return;
      inv.paid = true;
      d.payments.unshift({ id: `P-${Math.floor(Math.random() * 900 + 100)}`, title: `Оплата счёта ${inv.id}`, amount: inv.amount, at: nowIso(), method: 'Банковская карта' });
      d.files.unshift({ id: uid(), name: `Квитанция_${inv.id}.pdf`, ext: 'pdf', size: 18400, at: nowIso(), source: 'Финансы' });
    });
    toast(`Счёт ${id} оплачен. Квитанция — в «Документах»`);
  };

  const confirmBuy = () => {
    if (!buy) return;
    setPaying(true);
    setTimeout(() => {
      const total = buy.energy + buy.bonus;
      update(d => {
        d.energy.unshift({ id: uid(), type: 'in', title: `Пакет «${buy.name}»`, amount: total, at: nowIso() });
        d.payments.unshift({ id: `P-${Math.floor(Math.random() * 900 + 100)}`, title: `Пакет энергии «${buy.name}»`, amount: buy.usd * USD, at: nowIso(), method: method === 'card' ? 'Банковская карта' : method === 'wallet' ? 'Электронный кошелёк' : 'Банковский перевод' });
      });
      setPaying(false); setBuy(null);
      toast(`Начислено ${total} энергии`);
      notify(`Пакет «${buy.name}» оплачен: +${total} энергии`, '/finance?tab=energy');
    }, 1100);
  };

  return (
    <>
      <PageHeader title="Финансы" subtitle="Энергия, счета по договорам, платежи и использованные сервисы — в одном разделе" />
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={6} lg={3}><StatCard icon={<FileText size={15} />} label="Выставлено по счетам" value={money(billed)} hint={`Документов: ${state.invoices.length}`} onClick={() => setParams({ tab: 'invoices' })} /></Grid>
        <Grid item xs={6} lg={3}><StatCard icon={<CircleCheck size={15} />} label="Оплачено" value={money(paid)} tone="green" hint={`Платежей: ${state.payments.length}`} onClick={() => setParams({ tab: 'payments' })} /></Grid>
        <Grid item xs={6} lg={3}><StatCard icon={<CircleAlert size={15} />} label="Задолженность" value={money(debt)} tone={debt ? 'red' : 'default'} hint={debt ? `Неоплаченных счетов: ${unpaid}` : 'Долгов нет'} onClick={() => setParams({ tab: 'invoices' })} /></Grid>
        <Grid item xs={6} lg={3}><StatCard icon={<Zap size={15} />} label="Баланс энергии" value={balance.toLocaleString('ru-RU')} tone="hero" hint={`Потрачено: ${used}`} onClick={() => setParams({ tab: 'energy' })} /></Grid>
      </Grid>

      <SegTabs<TabKey> ariaLabel="Разделы финансов" value={tab} onChange={v => setParams({ tab: v })} items={[
        { value: 'energy', label: 'Энергия', icon: <Zap size={16} /> },
        { value: 'invoices', label: 'Счета по договорам', icon: <Receipt size={16} />, badge: unpaid },
        { value: 'payments', label: 'Платежи', icon: <CreditCard size={16} /> },
        { value: 'services', label: 'Использованные сервисы', icon: <Activity size={16} /> },
      ]} />

      {tab === 'energy' && (
        <>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2.5, height: '100%', background: theme => theme.palette.mode === 'light' ? 'linear-gradient(135deg,#eff6ff,#fff)' : undefined }}>
                <Typography variant="body2" color="text.secondary">Текущий баланс</Typography>
                <Typography sx={{ fontSize: 34, fontWeight: 700, color: 'primary.main', lineHeight: 1.2, mt: 0.5 }}>{balance.toLocaleString('ru-RU')} <Typography component="span" color="text.secondary">энергии</Typography></Typography>
                <Typography variant="caption" color="text.secondary">≈ {Math.floor(balance)} запросов к Азизе или {Math.floor(balance / 2)} документов OCR</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={4}>
              <Card sx={{ p: 2.5, height: '100%' }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'success.main' }}><TrendingUp size={15} /><Typography variant="body2" color="text.secondary">Получено</Typography></Stack>
                <Typography sx={{ fontSize: 28, fontWeight: 700, color: 'success.main', mt: 0.5 }}>{received.toLocaleString('ru-RU')}</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={4}>
              <Card sx={{ p: 2.5, height: '100%' }}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'error.main' }}><TrendingDown size={15} /><Typography variant="body2" color="text.secondary">Использовано</Typography></Stack>
                <Typography sx={{ fontSize: 28, fontWeight: 700, mt: 0.5 }}>{used.toLocaleString('ru-RU')}</Typography>
                <LinearProgress variant="determinate" value={received ? (used / received) * 100 : 0} sx={{ mt: 1 }} aria-label="Доля использованной энергии" />
              </Card>
            </Grid>
          </Grid>

          <ToggleButtonGroup exclusive size="small" value={sub} onChange={(_, v) => v && setSub(v)} sx={{ mb: 2, '& .MuiToggleButton-root': { textTransform: 'none', gap: 0.75, px: 1.75 } }}>
            <ToggleButton value="packages"><Package size={15} />Пакеты</ToggleButton>
            <ToggleButton value="tariffs"><Zap size={15} />Тарифы</ToggleButton>
            <ToggleButton value="history"><History size={15} />История</ToggleButton>
          </ToggleButtonGroup>

          {sub === 'packages' && (
            <Grid container spacing={1.5}>
              {PACKAGES.map(p => (
                <Grid item xs={12} sm={6} lg={3} key={p.id}>
                  <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', borderColor: p.popular ? 'primary.main' : 'divider', borderWidth: p.popular ? 2 : 1 }}>
                    <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 12, right: 12 }}>
                      {p.popular && <Chip size="small" color="primary" label="Популярный" sx={{ height: 20 }} />}
                      {p.bonus > 0 && <Chip size="small" label={`+${p.bonus} бонус`} sx={{ height: 20, bgcolor: 'success.main', color: '#fff' }} />}
                    </Stack>
                    <Typography variant="h3" sx={{ mt: p.popular || p.bonus ? 2.5 : 0 }}>{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{p.energy.toLocaleString('ru-RU')} энергии</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 700, mt: 2 }}>{p.usd} <Typography component="span" color="text.secondary">USD</Typography></Typography>
                    <Typography variant="caption" color="text.secondary">≈ {money(p.usd * USD)} · {(p.usd / (p.energy + p.bonus)).toFixed(3)} USD за ед.</Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button variant={p.popular ? 'contained' : 'outlined'} startIcon={<CreditCard size={16} />} sx={{ mt: 2 }} onClick={() => setBuy(p)}>Купить</Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          {sub === 'tariffs' && (
            <Card>
              <TableContainer>
                <Table>
                  <TableHead><TableRow><TableCell>Сервис</TableCell><TableCell align="right">Стоимость</TableCell></TableRow></TableHead>
                  <TableBody>{TARIFFS.map(([n, e]) => <TableRow key={n}><TableCell>{n}</TableCell><TableCell align="right">{e ? `${e} энергии` : <ToneChip label="Бесплатно" tone="green" />}</TableCell></TableRow>)}</TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
          {sub === 'history' && (
            <Card>
              <TableContainer>
                <Table>
                  <TableHead><TableRow><TableCell>Операция</TableCell><TableCell>Дата</TableCell><TableCell align="right">Энергия</TableCell></TableRow></TableHead>
                  <TableBody>
                    {state.energy.map(e => (
                      <TableRow key={e.id} hover>
                        <TableCell>{e.title}</TableCell><TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{fmtDateTime(e.at)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: e.type === 'in' ? 'success.main' : 'text.primary' }}>{e.type === 'in' ? '+' : '−'}{e.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </>
      )}

      {tab === 'invoices' && (
        <Card>
          {state.invoices.length ? (
            <TableContainer>
              <Table sx={{ minWidth: 640 }}>
                <TableHead><TableRow><TableCell>Счёт</TableCell><TableCell>Договор</TableCell><TableCell>Назначение</TableCell><TableCell>Срок оплаты</TableCell><TableCell align="right">Сумма</TableCell><TableCell align="right">Статус</TableCell></TableRow></TableHead>
                <TableBody>
                  {state.invoices.map(i => {
                    const overdue = !i.paid && i.dueDate < today();
                    return (
                      <TableRow key={i.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{i.id}</TableCell><TableCell>{i.contract}</TableCell><TableCell>{i.title}</TableCell>
                        <TableCell sx={{ color: overdue ? 'error.main' : undefined }}>{fmtShort(i.dueDate)}{overdue && ' · просрочен'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{money(i.amount)}</TableCell>
                        <TableCell align="right">{i.paid ? <ToneChip label="Оплачен" tone="green" /> : <Button size="small" variant="contained" onClick={() => pay(i.id)}>Оплатить</Button>}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <EmptyState icon={<Receipt size={28} />} title="Счетов нет" text="Счета появятся после завершения заявок" />}
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          {state.payments.length ? (
            <TableContainer>
              <Table sx={{ minWidth: 560 }}>
                <TableHead><TableRow><TableCell>Номер</TableCell><TableCell>Назначение</TableCell><TableCell>Способ</TableCell><TableCell>Дата</TableCell><TableCell align="right">Сумма</TableCell></TableRow></TableHead>
                <TableBody>
                  {state.payments.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{p.id}</TableCell><TableCell>{p.title}</TableCell><TableCell>{p.method}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{fmtDateTime(p.at)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{money(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <EmptyState icon={<Wallet size={28} />} title="Платежей пока нет" />}
        </Card>
      )}

      {tab === 'services' && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead><TableRow><TableCell>Сервис</TableCell><TableCell>Дата</TableCell><TableCell align="right">Энергия</TableCell></TableRow></TableHead>
              <TableBody>
                {state.services.map(s => (
                  <TableRow key={s.id} hover><TableCell>{s.service}</TableCell><TableCell sx={{ color: 'text.secondary' }}>{fmtDateTime(s.at)}</TableCell><TableCell align="right" sx={{ fontWeight: 600 }}>−{s.energy}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={!!buy} onClose={() => !paying && setBuy(null)} fullWidth maxWidth="xs">
        <DialogTitle>Покупка пакета «{buy?.name}»</DialogTitle>
        <DialogContent>
          <Stack direction="row" justifyContent="space-between" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', mb: 2 }}>
            <Box><Typography variant="body2" color="text.secondary">Начислим</Typography><Typography fontWeight={700}>{buy && (buy.energy + buy.bonus).toLocaleString('ru-RU')} энергии</Typography></Box>
            <Box sx={{ textAlign: 'right' }}><Typography variant="body2" color="text.secondary">К оплате</Typography><Typography fontWeight={700}>{buy && money(buy.usd * USD)}</Typography></Box>
          </Stack>
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }} id="payMethod">Способ оплаты</Typography>
          <RadioGroup aria-labelledby="payMethod" value={method} onChange={e => setMethod(e.target.value)}>
            {[['card', 'Банковская карта', <CreditCard key="c" size={17} />], ['wallet', 'Электронный кошелёк', <Smartphone key="w" size={17} />], ['bank', 'Банковский перевод', <Landmark key="b" size={17} />]].map(([v, l, ic]) => (
              <FormControlLabel key={String(v)} value={v} control={<Radio />} label={<Stack direction="row" spacing={1} alignItems="center">{ic}<span>{String(l)}</span></Stack>}
                sx={{ border: 1, borderColor: method === v ? 'primary.main' : 'divider', borderRadius: 2, mx: 0, mb: 1, pr: 1, bgcolor: method === v ? 'rgba(47,111,237,.06)' : undefined }} />
            ))}
          </RadioGroup>
          <Typography variant="caption" color="text.secondary">Демо-режим: реальные платежи не проводятся.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="inherit" disabled={paying} onClick={() => setBuy(null)}>Отмена</Button>
          <Button variant="contained" disabled={paying} onClick={confirmBuy}>{paying ? 'Обработка…' : 'Оплатить'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
