import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ChevronDown, Plus, ScanText, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { num } from '@/lib/format';
import type { Declaration } from '@/types';
import { FieldInput, Lookup } from '@/pages/declarant/gtd/Fields';
import {
  DOC_CODES,
  SAMPLE_ITEMS,
  fieldDef,
  payments,
  type Ctx,
  type Problem,
} from '@/pages/declarant/gtd/schema';
import type { useGtd } from '@/pages/declarant/gtd/useGtd';

type Api = ReturnType<typeof useGtd>;

export interface BlankProps {
  decl: Declaration;
  ctx: Ctx;
  api: Api;
  problems: Problem[];
  readOnly: boolean;
  showErrors: boolean;
  fieldError: (key: string) => string | null;
}

const mono = { fontFamily: 'ui-monospace, Menlo, monospace' };
const cellInput = { '& .MuiOutlinedInput-root': { fontSize: 14 } };
const sum = (n: number) => `${num(n, 0)} сум`;

export function Sheet({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
        borderTop: 1,
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
}

export function Cell({
  no,
  title,
  span,
  cols = 1,
  ai,
  id,
  aside,
  children,
}: {
  no?: string;
  title: string;
  span: number;
  cols?: number;
  ai?: boolean;
  id?: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box
      id={id}
      tabIndex={id ? -1 : undefined}
      sx={{
        gridColumn: { xs: span <= 4 ? 'span 8' : 'span 24', md: `span ${span}` },
        borderRight: 1,
        borderBottom: 1,
        borderColor: 'divider',
        p: 1.25,
        pb: 1.5,
        minWidth: 0,
        outline: 'none',
      }}
    >
      <Stack direction='row' alignItems='center' spacing={0.75} sx={{ minHeight: 20 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', flex: 1, minWidth: 0 }} noWrap>
          {no && (
            <Box component='span' sx={{ fontWeight: 700, color: 'text.primary', mr: 0.75 }}>
              {no}
            </Box>
          )}
          {title}
        </Typography>
        {ai && <AiDot />}
        {aside}
      </Stack>
      {children && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: `repeat(${cols}, minmax(0, 1fr))` },
            gap: 1,
            mt: 0.75,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}

export function AiDot() {
  return (
    <Tooltip title='Заполнено Азизой — проверьте'>
      <Box
        component='span'
        aria-label='Заполнено Азизой'
        sx={{ width: 7, height: 7, borderRadius: 4, bgcolor: 'secondary.main', flexShrink: 0 }}
      />
    </Tooltip>
  );
}

export function Caption({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <Typography
      component='label'
      htmlFor={htmlFor}
      sx={{
        fontSize: 11,
        color: 'text.secondary',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        mb: 0.35,
      }}
    >
      {children}
    </Typography>
  );
}

function Fld({ p, k, label, wide }: { p: BlankProps; k: string; label?: string; wide?: boolean }) {
  const f = fieldDef(k);
  if (!f) return null;
  const ai = (p.decl.aiFields ?? []).includes(k);
  const value = p.ctx.form[k] ?? '';
  return (
    <Box sx={{ gridColumn: wide ? '1 / -1' : undefined, minWidth: 0 }}>
      {label && (
        <Caption htmlFor={`gtd-${k}`}>
          {label}
          {f.required && (
            <Box component='span' sx={{ color: 'error.main' }} aria-hidden>
              *
            </Box>
          )}
          {ai && <AiDot />}
        </Caption>
      )}
      <FieldInput
        f={f}
        ctx={p.ctx}
        value={value}
        error={p.fieldError(k)}
        ai={ai}
        readOnly={p.readOnly}
        onChange={(v) => p.api.setField(k, v)}
        dense
      />
      {f.lookup && (
        <Box sx={{ mt: 1.75 }}>
          <Lookup f={f} ctx={p.ctx} value={value} readOnly={p.readOnly} onPatch={p.api.setFields} />
        </Box>
      )}
    </Box>
  );
}

export function Totals({ rows }: { rows: [string, string, string?][] }) {
  return (
    <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <tbody>
        {rows.map(([k, v, rate], i) => {
          const last = i === rows.length - 1;
          return (
            <tr key={k}>
              <Box
                component='td'
                sx={{
                  py: 0.5,
                  color: last ? 'text.primary' : 'text.secondary',
                  fontWeight: last ? 700 : 400,
                  borderTop: last ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                {k}
              </Box>
              <Box
                component='td'
                sx={{
                  py: 0.5,
                  textAlign: 'right',
                  color: 'text.secondary',
                  borderTop: last ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                {rate}
              </Box>
              <Box
                component='td'
                sx={{
                  py: 0.5,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: last ? 700 : 500,
                  borderTop: last ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                {v}
              </Box>
            </tr>
          );
        })}
      </tbody>
    </Box>
  );
}

export function MainSheet(p: BlankProps) {
  const [service, setService] = useState(false);
  const F = (k: string, label?: string, wide?: boolean) => (
    <Fld p={p} k={k} label={label} wide={wide} />
  );
  const ai = (k: string) => (p.decl.aiFields ?? []).includes(k);
  const pay = payments(p.ctx);
  const docs = p.decl.docs ?? [];
  const docError = p.showErrors ? p.problems.find((x) => x.section === 'docs')?.text : undefined;

  return (
    <Sheet>
      <Cell no='2' title='Экспортёр / грузоотправитель' span={14} cols={2}>
        {F('exporterName', 'Наименование')}
        {F('exporterCountry', 'Страна')}
        {F('exporterAddress', 'Адрес', true)}
      </Cell>
      <Cell no='1' title='Тип декларации' span={10}>
        {F('direction')}
        {F('regime', 'Таможенный режим')}
      </Cell>

      <Cell no='8' title='Импортёр / грузополучатель' span={14} cols={2}>
        {F('importerInn', 'ИНН / ПИНФЛ')}
        {F('importerName', 'Наименование')}
        {F('importerAddress', 'Адрес', true)}
      </Cell>
      <Cell no='3' title='Доб. лист' span={3}>
        {F('extraSheets')}
      </Cell>
      <Cell no='5' title='Всего наим.' span={3}>
        {F('goodsCount')}
      </Cell>
      <Cell no='6' title='Кол-во мест' span={4} ai={ai('places')}>
        {F('places')}
      </Cell>

      <Cell no='9' title='Лицо, ответственное за финансовое урегулирование' span={14} cols={2}>
        {F('finInn', 'ИНН / ПИНФЛ')}
        {F('finName', 'Наименование')}
      </Cell>
      <Cell no='7' title='Справочный номер' span={10} cols={2}>
        {F('post', 'Таможенный пост', true)}
        {F('regDate', 'Дата регистрации')}
        {F('seq', 'Порядковый №')}
        {F('acceptDate', 'Дата принятия')}
        {F('regNo', 'Рег. номер')}
      </Cell>

      <Cell no='14' title='Декларант / представитель' span={10} cols={2}>
        {F('declarantInn', 'ИНН / ПИНФЛ')}
        {F('declarantName', 'Наименование')}
      </Cell>
      <Cell no='11' title='Торг. страна' span={4} ai={ai('tradeCountry')}>
        {F('tradeCountry')}
      </Cell>
      <Cell no='12' title='Общ. там. стоимость' span={6}>
        <Box sx={{ py: 0.75, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {sum(pay.base)}
        </Box>
      </Cell>
      <Cell no='35' title='Вес брутто, кг' span={4}>
        {F('grossWeight')}
      </Cell>

      <Cell no='15' title='Страна отправления' span={8} ai={ai('originCountry')}>
        {F('originCountry')}
      </Cell>
      <Cell no='17' title='Страна назначения' span={8} ai={ai('destCountry')}>
        {F('destCountry')}
      </Cell>
      <Cell no='19' title='Контейнер' span={8}>
        {F('container')}
      </Cell>

      <Cell no='18' title='Транспортное средство' span={8} ai={ai('vehicleNo')}>
        {F('vehicleNo')}
      </Cell>
      <Cell no='20' title='Условия поставки' span={8} cols={2}>
        {F('incoterms', 'Incoterms')}
        {F('deliveryPlace', 'Пункт')}
      </Cell>
      <Cell no='22' title='Валюта и общая фактур. стоимость' span={8} cols={2}>
        {F('currency', 'Валюта')}
        {F('invoiceTotal', 'Сумма')}
      </Cell>

      <Cell no='25' title='Вид транспорта на границе' span={5} ai={ai('borderMode')}>
        {F('borderMode')}
      </Cell>
      <Cell no='26' title='Вид тр-та внутри страны' span={5}>
        {F('innerMode')}
      </Cell>
      <Cell no='23' title='Курс валюты' span={4}>
        {F('rate')}
      </Cell>
      <Cell no='24' title='Характер сделки' span={10} cols={2}>
        {F('dealNature', 'Характер')}
        {F('paymentForm', 'Расчёты')}
      </Cell>

      <Cell no='30' title='Местонахождение товаров' span={10}>
        {F('goodsLocation')}
      </Cell>
      <Cell no='28' title='Финансовые и банковские сведения' span={14} cols={2}>
        {F('bankName', 'Банк', true)}
        {F('mfo', 'МФО')}
        {F('swift', 'SWIFT')}
        {F('account', 'Расчётный счёт', true)}
      </Cell>

      <Cell no='B' title='Подробности подсчёта' span={10}>
        <Totals
          rows={[
            ['10 Таможенный сбор', sum(pay.fee), '0,2%'],
            ['20 Пошлина', sum(pay.duty)],
            ...(pay.excise ? [['27 Акциз', sum(pay.excise)] as [string, string]] : []),
            ['29 НДС', sum(pay.vat), '12%'],
            ...(pay.other ? [['Прочие', sum(pay.other)] as [string, string]] : []),
            ['Итого', sum(pay.total)],
          ]}
        />
      </Cell>
      <Cell
        no='44'
        title='Представляемые документы'
        span={14}
        cols={2}
        id='gtd-docs'
        aside={
          !p.readOnly && (
            <Button
              size='small'
              startIcon={<Plus size={14} />}
              onClick={() => p.api.addDoc()}
              sx={{ py: 0 }}
            >
              Документ
            </Button>
          )
        }
      >
        {F('contractNo', 'Номер контракта')}
        {F('contractDate', 'Дата контракта')}
        {F('invoiceNo', 'Номер инвойса')}
        {F('passportNo', 'Паспорт сделки')}
        <Stack spacing={0.75} sx={{ gridColumn: '1 / -1', mt: 0.5 }}>
          {docs.map((d) => (
            <Box
              key={d.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1.4fr 1fr 150px 32px' },
                gap: 0.75,
                alignItems: 'center',
              }}
            >
              <TextField
                select
                size='small'
                sx={cellInput}
                value={d.code}
                disabled={p.readOnly}
                onChange={(e) => p.api.setDoc(d.id, { code: e.target.value })}
                inputProps={{ 'aria-label': 'Вид документа' }}
              >
                {DOC_CODES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size='small'
                sx={cellInput}
                placeholder='Номер'
                value={d.number}
                disabled={p.readOnly}
                onChange={(e) => p.api.setDoc(d.id, { number: e.target.value })}
                inputProps={{ 'aria-label': 'Номер документа' }}
              />
              <TextField
                size='small'
                type='date'
                sx={cellInput}
                value={d.date}
                disabled={p.readOnly}
                onChange={(e) => p.api.setDoc(d.id, { date: e.target.value })}
                inputProps={{ 'aria-label': 'Дата документа' }}
              />
              {!p.readOnly && (
                <IconButton
                  size='small'
                  aria-label='Удалить документ'
                  onClick={() => p.api.removeDoc(d.id)}
                >
                  <Trash2 size={15} />
                </IconButton>
              )}
            </Box>
          ))}
          {!docs.length && (
            <Typography variant='body2' color={docError ? 'error.main' : 'text.secondary'}>
              {docError ?? 'Документы не добавлены — нужен как минимум инвойс (код 02).'}
            </Typography>
          )}
          {docs.length > 0 && docError && (
            <Typography variant='body2' color='error.main'>
              {docError}
            </Typography>
          )}
        </Stack>
      </Cell>

      <Cell no='54' title='Место и дата · лицо, заполнившее декларацию' span={24} cols={4}>
        {F('signerName', 'ФИО')}
        {F('signerPosition', 'Должность')}
        {F('signerPhone', 'Телефон')}
        {F('certNo', 'Сертификат ЭЦП')}
      </Cell>

      <Cell
        title='Служебные поля'
        span={24}
        cols={4}
        aside={
          <Button
            size='small'
            color='inherit'
            onClick={() => setService((v) => !v)}
            aria-expanded={service}
            endIcon={
              <Box sx={{ display: 'flex', transform: service ? 'rotate(180deg)' : 'none' }}>
                <ChevronDown size={14} />
              </Box>
            }
            sx={{ py: 0, color: 'text.secondary' }}
          >
            {service ? 'Скрыть' : 'Показать'}
          </Button>
        }
      >
        {service && (
          <>
            {F('p3t1', 'P3T1 в XML')}
            {F('incomplete', 'Неполная декларация')}
            {F('p16', 'P16')}
            {F('p18', 'P18')}
          </>
        )}
      </Cell>
    </Sheet>
  );
}

export function SheetList({
  p,
  active,
  onSelect,
}: {
  p: BlankProps;
  active: string;
  onSelect: (key: string) => void;
}) {
  const cur = p.ctx.form.currency || 'USD';
  const bad = (id: string) =>
    p.showErrors && p.problems.some((x) => x.field?.startsWith(`item-${id}-`));
  const mainBad =
    p.showErrors && p.problems.some((x) => !x.field?.startsWith('item-') && x.section !== 'goods');
  const btn = (key: string, content: ReactNode, error: boolean) => (
    <ButtonBase
      key={key}
      onClick={() => onSelect(key)}
      aria-current={active === key ? 'page' : undefined}
      sx={{
        width: { md: '100%' },
        flexShrink: 0,
        justifyContent: 'flex-start',
        gap: 1,
        px: 1.25,
        py: 0.9,
        borderRadius: 1.5,
        fontSize: 13,
        textAlign: 'left',
        border: 1,
        borderColor: active === key ? 'primary.main' : 'divider',
        bgcolor: active === key ? 'rgba(47,111,237,.07)' : 'background.paper',
        color: error ? 'error.main' : 'text.primary',
        '&:hover': { borderColor: 'primary.main' },
        '&.Mui-focusVisible': { outline: '2px solid #2f6fed', outlineOffset: 1 },
      }}
    >
      {content}
    </ButtonBase>
  );

  return (
    <Stack
      component='nav'
      aria-label='Листы декларации'
      direction={{ xs: 'row', md: 'column' }}
      spacing={0.75}
      sx={{
        position: { md: 'sticky' },
        top: { md: 80 },
        overflowX: { xs: 'auto', md: 'visible' },
        pb: { xs: 0.5, md: 0 },
      }}
    >
      {btn(
        'main',
        <Typography component='span' fontWeight={700} fontSize={13}>
          ГТД · основной лист
        </Typography>,
        mainBad
      )}
      {p.ctx.items.map((i, n) =>
        btn(
          i.id,
          <>
            <Box component='span' sx={{ color: 'text.secondary', width: 16 }}>
              {n + 1}
            </Box>
            <Box component='span' sx={{ ...mono, flex: 1, whiteSpace: 'nowrap' }}>
              {i.hs || '——————'}
            </Box>
            <Box
              component='span'
              sx={{
                color: 'text.secondary',
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {num(i.value, 0)} {cur}
            </Box>
          </>,
          bad(i.id)
        )
      )}
      {!p.readOnly && (
        <Stack direction={{ xs: 'row', md: 'column' }} spacing={0.5} sx={{ flexShrink: 0 }}>
          <Button
            id='gtd-add-item'
            size='small'
            startIcon={<Plus size={15} />}
            onClick={() => {
              p.api.addItem();
              setTimeout(() => onSelect('last'), 0);
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            Добавить товар
          </Button>
          <Button
            size='small'
            color='inherit'
            startIcon={<ScanText size={15} />}
            onClick={() => SAMPLE_ITEMS().forEach((i) => p.api.addItem(i))}
            sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}
          >
            Из инвойса (OCR)
          </Button>
        </Stack>
      )}
      {p.showErrors && p.problems.some((x) => x.section === 'goods' && !x.field) && (
        <Typography variant='caption' color='error.main' sx={{ px: 1 }}>
          Добавьте хотя бы один товар
        </Typography>
      )}
    </Stack>
  );
}
