import {
  Box,
  Button,
  Card,
  Divider,
  Drawer,
  IconButton,
  ListItemButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  FileText,
  History,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/app/store';
import { EmptyState } from '@/components/common/EmptyState';
import { SegTabs } from '@/components/common/SegTabs';
import { fmtTime, num } from '@/lib/format';
import { MainSheet, SheetList, type BlankProps } from '@/pages/declarant/gtd/Blank';
import { ItemSheet } from '@/pages/declarant/gtd/ItemSheet';
import {
  EditsSection,
  JournalSection,
  VersionsSection,
  isLocked,
} from '@/pages/declarant/gtd/Sections';
import {
  EMPTY_FORM,
  payments,
  sectionTitle,
  validateAll,
  type Ctx,
  type Problem,
} from '@/pages/declarant/gtd/schema';
import { StatusChip } from '@/pages/declarant/gtd/status';
import { useGtd } from '@/pages/declarant/gtd/useGtd';

type HistoryTab = 'versions' | 'journal' | 'edits';

export function GtdEditor({ id }: { id: string }) {
  const { toast } = useStore();
  const nav = useNavigate();
  const api = useGtd(id);
  const { decl } = api;
  const [params, setParams] = useSearchParams();
  const [showErrors, setShowErrors] = useState(false);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryTab | null>(null);

  const ctx: Ctx = useMemo(
    () => ({ form: decl?.form ?? EMPTY_FORM(), items: decl?.items ?? [] }),
    [decl?.form, decl?.items]
  );
  const problems = useMemo(() => (decl ? validateAll(ctx, decl.docs ?? []) : []), [ctx, decl]);

  if (!decl) {
    return (
      <Card>
        <EmptyState
          icon={<FileText size={30} />}
          title='Декларация не найдена'
          text='Возможно, она была удалена.'
          action={
            <Button variant='contained' onClick={() => nav('/declarant/declarations')}>
              К списку деклараций
            </Button>
          }
        />
      </Card>
    );
  }

  const items = ctx.items;
  const t = params.get('t');
  const sheetId = t === 'last' ? (items[items.length - 1]?.id ?? 'main') : (t ?? 'main');
  const itemIndex = items.findIndex((i) => i.id === sheetId);
  const sheet = itemIndex >= 0 ? sheetId : 'main';

  const readOnly = isLocked(decl.status);
  const total = payments(ctx).total;
  const aiCount = (decl.aiFields ?? []).length;
  const ready = decl.status === 'checked' && !problems.length;

  const select = (key: string) => {
    setParams(key === 'main' ? {} : { t: key });
    window.scrollTo({ top: 0 });
  };

  const fieldError = (key: string) => {
    const list = problems.filter((p) => p.field === key);
    if (!list.length) return null;
    const format = list.find((p) => !p.text.startsWith('Заполните'));
    if (format) return format.text;
    return showErrors ? list[0].text : null;
  };

  const focusProblem = (p: Problem) => {
    setErrorsOpen(false);
    setShowErrors(true);
    const itemId = p.field?.match(/^item-([^-]+)-/)?.[1];
    if (itemId) select(itemId);
    else if (sheet !== 'main') select('main');
    const target = itemId
      ? `gtd-${p.field}`
      : p.section === 'goods'
        ? 'gtd-add-item'
        : p.section === 'docs'
          ? 'gtd-docs'
          : `gtd-${p.field}`;
    setTimeout(() => {
      const el = document.getElementById(target);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el?.focus?.();
    }, 300);
  };

  const check = () => {
    setShowErrors(true);
    if (problems.length) {
      api.setStatus('validation');
      setErrorsOpen(true);
      toast(`Найдено ошибок: ${problems.length}`, { severity: 'error' });
    } else {
      api.setStatus('checked');
      toast('Проверка пройдена — ГТД готова к отправке');
    }
  };

  const bp: BlankProps = { decl, ctx, api, problems, readOnly, showErrors, fieldError };
  const title = decl.orderNo ? `ГТД ${decl.orderNo}` : 'Новая декларация';

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ md: 'center' }}
        sx={{ mb: 2 }}
      >
        <Stack direction='row' spacing={1} alignItems='center' sx={{ flex: 1, minWidth: 0 }}>
          <Tooltip title='К списку деклараций'>
            <IconButton
              aria-label='К списку деклараций'
              onClick={() => nav('/declarant/declarations')}
            >
              <ArrowLeft size={19} />
            </IconButton>
          </Tooltip>
          <Typography variant='h1' sx={{ fontSize: { xs: 19, md: 22 } }} noWrap>
            {title}
          </Typography>
          <StatusChip status={decl.status} />
        </Stack>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Tooltip title='Версии, журнал и история правок'>
            <IconButton aria-label='История' onClick={() => setHistory('versions')}>
              <History size={18} />
            </IconButton>
          </Tooltip>
          {!readOnly && (
            <>
              <Button variant='outlined' startIcon={<ShieldCheck size={16} />} onClick={check}>
                Проверить
              </Button>
              <Tooltip title={ready ? '' : 'Сначала нажмите «Проверить»'}>
                <span>
                  <Button
                    variant='contained'
                    startIcon={<Send size={16} />}
                    disabled={!ready}
                    onClick={api.submit}
                  >
                    Отправить в АИС
                  </Button>
                </span>
              </Tooltip>
            </>
          )}
        </Stack>
      </Stack>

      {aiCount > 0 && !readOnly && (
        <Stack
          direction='row'
          spacing={1.25}
          alignItems='center'
          sx={{ mb: 2, px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 2 }}
        >
          <Box sx={{ width: 7, height: 7, borderRadius: 4, bgcolor: 'secondary.main' }} />
          <Typography variant='body2' sx={{ flex: 1 }}>
            Азиза заполнила {aiCount} полей — они отмечены точкой. Проверьте значения.
          </Typography>
          <Button size='small' onClick={() => api.confirmAi(decl.aiFields ?? [])}>
            Всё верно
          </Button>
        </Stack>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '240px minmax(0, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <SheetList p={bp} active={sheet} onSelect={select} />
        <Box sx={{ minWidth: 0 }}>
          {sheet === 'main' ? (
            <MainSheet {...bp} />
          ) : (
            <ItemSheet
              p={bp}
              item={items[itemIndex]}
              index={itemIndex}
              onNav={(i) => select(items[i]?.id ?? 'main')}
            />
          )}
        </Box>
      </Box>

      <Stack
        component='section'
        aria-label='Строка состояния'
        direction='row'
        alignItems='center'
        spacing={1.5}
        sx={{
          position: 'sticky',
          bottom: { xs: 64, md: 0 },
          zIndex: 5,
          mt: 2,
          px: 1.5,
          pr: { xs: 1.5, md: 10 },
          py: 0.75,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Button
          size='small'
          color={problems.length ? (showErrors ? 'error' : 'inherit') : 'success'}
          startIcon={problems.length ? <CircleAlert size={15} /> : <CircleCheck size={15} />}
          onClick={() => setErrorsOpen(true)}
        >
          {problems.length ? `Список ошибок · ${problems.length}` : 'Ошибок нет'}
        </Button>
        <Divider orientation='vertical' flexItem />
        <Typography variant='body2' sx={{ fontVariantNumeric: 'tabular-nums' }} noWrap>
          К уплате: <b>{num(total, 0)} сум</b>
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ display: { xs: 'none', sm: 'block' } }}
          noWrap
        >
          {readOnly ? 'Подано — только просмотр' : `Сохранено ${fmtTime(decl.updatedAt)}`}
        </Typography>
      </Stack>

      <Drawer
        anchor='right'
        open={errorsOpen}
        onClose={() => setErrorsOpen(false)}
        PaperProps={{ sx: { width: 380, maxWidth: '100%' } }}
      >
        <Stack
          direction='row'
          alignItems='center'
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Typography variant='h3' sx={{ flex: 1 }}>
            Список ошибок · {problems.length}
          </Typography>
          <IconButton aria-label='Закрыть' onClick={() => setErrorsOpen(false)}>
            <X size={18} />
          </IconButton>
        </Stack>
        {problems.length === 0 ? (
          <EmptyState
            icon={<CircleCheck size={28} />}
            title='Ошибок нет'
            text={readOnly ? 'Декларация подана.' : 'Нажмите «Проверить», затем отправьте в АИС.'}
          />
        ) : (
          <Box sx={{ p: 1, overflowY: 'auto' }}>
            {problems.map((p, i) => (
              <ListItemButton key={i} onClick={() => focusProblem(p)} sx={{ gap: 1, py: 0.75 }}>
                <Box sx={{ color: 'error.main', display: 'flex' }}>
                  <CircleAlert size={15} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='body2'>{p.text}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {p.field?.startsWith('item-') ? 'Лист товара' : sectionTitle(p.section)}
                  </Typography>
                </Box>
                <ArrowRight size={14} />
              </ListItemButton>
            ))}
          </Box>
        )}
      </Drawer>

      <Drawer
        anchor='right'
        open={!!history}
        onClose={() => setHistory(null)}
        PaperProps={{ sx: { width: 620, maxWidth: '100%' } }}
      >
        <Stack direction='row' alignItems='center' sx={{ p: 2, pb: 0 }}>
          <Typography variant='h3' sx={{ flex: 1 }}>
            История
          </Typography>
          <IconButton aria-label='Закрыть' onClick={() => setHistory(null)}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Box sx={{ p: 2, overflowY: 'auto' }}>
          {history && (
            <>
              <SegTabs<HistoryTab>
                value={history}
                onChange={setHistory}
                ariaLabel='Раздел истории'
                items={[
                  { value: 'versions', label: 'Версии' },
                  { value: 'journal', label: 'Журнал' },
                  { value: 'edits', label: 'Правки' },
                ]}
              />
              {history === 'versions' && (
                <VersionsSection decl={decl} api={api} readOnly={readOnly} />
              )}
              {history === 'journal' && (
                <JournalSection decl={decl} statusLabel={(s) => <StatusChip status={s} />} />
              )}
              {history === 'edits' && <EditsSection decl={decl} />}
            </>
          )}
        </Box>
      </Drawer>
    </>
  );
}
