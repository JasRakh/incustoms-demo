import {
  Box,
  Card,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  type TextFieldProps,
} from '@mui/material';
import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { CircleCheck, Trash2, TriangleAlert } from 'lucide-react';
import { num } from '@/lib/format';
import { NumberInput } from '@/components/common/NumberInput';
import { Term } from '@/components/common/Term';
import { hsInfo, type Position } from '@/pages/tools/calcModel';

interface Props {
  positions: Position[];
  currency: string;
  onChange: (id: string, patch: Partial<Position>) => void;
  onRemove: (id: string) => void;
}

const cellInputSx = {
  '& .MuiOutlinedInput-root': { height: 38, fontSize: 14, bgcolor: 'background.paper' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
    { WebkitAppearance: 'none', m: 0 },
};

function Cell({ align, ...props }: TextFieldProps & { align?: 'right' }) {
  return (
    <TextField
      size='small'
      fullWidth
      sx={cellInputSx}
      {...props}
      inputProps={{ ...props.inputProps, style: { textAlign: align ?? 'left' } }}
    />
  );
}

function HsField({ p, onChange }: { p: Position; onChange: Props['onChange'] }) {
  const info = hsInfo(p.hs);
  const status = !p.hs ? null : info ? (
    <Tooltip title={`${info.label} · пошлина ${info.duty}%`}>
      <Box
        component='span'
        sx={{ display: 'flex', color: 'success.main' }}
        aria-label={`Код найден: ${info.label}`}
      >
        <CircleCheck size={16} />
      </Box>
    </Tooltip>
  ) : (
    <Tooltip title='Код не найден в демо-базе — будет применена ставка 10%'>
      <Box
        component='span'
        sx={{ display: 'flex', color: 'warning.main' }}
        aria-label='Код не найден'
      >
        <TriangleAlert size={16} />
      </Box>
    </Tooltip>
  );
  return (
    <Cell
      placeholder='0000 00 000 0'
      value={p.hs}
      onChange={(e) => onChange(p.id, { hs: e.target.value })}
      inputProps={{ 'aria-label': 'Код ТН ВЭД', inputMode: 'numeric' }}
      InputProps={{
        endAdornment: status && <InputAdornment position='end'>{status}</InputAdornment>,
      }}
    />
  );
}

function NumberCell(props: ComponentProps<typeof NumberInput>) {
  return <NumberInput size='small' fullWidth align='right' sx={cellInputSx} {...props} />;
}

const numberProps = (label: string, step = 1) => ({
  'aria-label': label,
  min: 0,
  step,
  inputMode: 'decimal' as const,
});

const TABLE_MIN_WIDTH = 960;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export function PositionsEditor(props: Props) {
  const { ref, width } = useWidth();
  return (
    <Box ref={ref}>
      {width > 0 && <PositionsView {...props} compact={width < TABLE_MIN_WIDTH} />}
    </Box>
  );
}

function PositionsView({
  positions,
  currency,
  onChange,
  onRemove,
  compact,
}: Props & { compact: boolean }) {
  const totalSum = positions.reduce((s, p) => s + p.qty * p.unitPrice, 0);
  const totalQty = positions.reduce((s, p) => s + p.qty, 0);

  if (compact) {
    return (
      <Stack spacing={1.25}>
        {positions.map((p, i) => (
          <Card key={p.id} sx={{ p: 1.5, bgcolor: 'action.hover', borderColor: 'transparent' }}>
            <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 1.25 }}>
              <Typography variant='body2' color='text.secondary' sx={{ minWidth: 20 }}>
                {i + 1}.
              </Typography>
              <Cell
                placeholder='Наименование товара'
                value={p.name}
                onChange={(e) => onChange(p.id, { name: e.target.value })}
                inputProps={{ 'aria-label': 'Наименование' }}
              />
              <IconButton aria-label={`Удалить позицию ${p.name}`} onClick={() => onRemove(p.id)}>
                <Trash2 size={17} />
              </IconButton>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant='caption' color='text.secondary'>
                  Код ТН ВЭД
                </Typography>
                <HsField p={p} onChange={onChange} />
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Кол-во
                </Typography>
                <NumberCell
                  value={p.qty}
                  onValueChange={(n) => onChange(p.id, { qty: n })}
                  inputProps={numberProps('Количество')}
                />
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Цена/ед.
                </Typography>
                <NumberCell
                  value={p.unitPrice}
                  onValueChange={(n) => onChange(p.id, { unitPrice: n })}
                  inputProps={numberProps('Цена', 0.01)}
                />
              </Box>
              <Box sx={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                  Сумма
                </Typography>
                <Typography fontWeight={700}>{num(p.qty * p.unitPrice)}</Typography>
              </Box>
            </Box>
          </Card>
        ))}
        <Stack direction='row' justifyContent='space-between' sx={{ px: 1.5, pt: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            {totalQty} шт
          </Typography>
          <Typography fontWeight={700}>
            {num(totalSum)} {currency}
          </Typography>
        </Stack>
      </Stack>
    );
  }

  return (
    <TableContainer>
      <Table
        size='small'
        sx={{
          tableLayout: 'fixed',
          '& td, & th': { px: 1, borderColor: 'divider' },
          '& tbody td': { py: 1 },
        }}
      >
        <colgroup>
          <col style={{ width: 36 }} />
          <col />
          <col style={{ width: 180 }} />
          <col style={{ width: 92 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 128 }} />
          <col style={{ width: 48 }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Наименование</TableCell>
            <TableCell>
              <Term tip='Код товара по ТН ВЭД определяет ставку пошлины'>Код ТН ВЭД</Term>
            </TableCell>
            <TableCell align='right'>Кол-во</TableCell>
            <TableCell align='right'>Цена/ед.</TableCell>
            <TableCell align='right'>Сумма, {currency}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {positions.map((p, i) => (
            <TableRow key={p.id} hover sx={{ '&:hover .row-del': { opacity: 1 } }}>
              <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
              <TableCell>
                <Cell
                  placeholder='Наименование товара'
                  value={p.name}
                  onChange={(e) => onChange(p.id, { name: e.target.value })}
                  inputProps={{ 'aria-label': 'Наименование' }}
                />
              </TableCell>
              <TableCell>
                <HsField p={p} onChange={onChange} />
              </TableCell>
              <TableCell>
                <NumberCell
                  value={p.qty}
                  onValueChange={(n) => onChange(p.id, { qty: n })}
                  inputProps={numberProps('Количество')}
                />
              </TableCell>
              <TableCell>
                <NumberCell
                  value={p.unitPrice}
                  onValueChange={(n) => onChange(p.id, { unitPrice: n })}
                  inputProps={numberProps('Цена', 0.01)}
                />
              </TableCell>

              <TableCell
                align='right'
                sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
              >
                {num(p.qty * p.unitPrice)}
              </TableCell>
              <TableCell align='center'>
                <Tooltip title='Удалить позицию'>
                  <IconButton
                    className='row-del'
                    size='small'
                    aria-label={`Удалить позицию ${p.name}`}
                    onClick={() => onRemove(p.id)}
                    sx={{ opacity: 0.55, '&:focus-visible': { opacity: 1 } }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow
            sx={{ '& td': { borderBottom: 0, pt: 1.5, fontSize: 14, color: 'text.primary' } }}
          >
            <TableCell />
            <TableCell sx={{ fontWeight: 600 }}>Итого</TableCell>
            <TableCell />
            <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {totalQty}
            </TableCell>
            <TableCell />
            <TableCell
              align='right'
              sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
            >
              {num(totalSum)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
