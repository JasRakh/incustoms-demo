import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { BookUser } from 'lucide-react';
import {
  COMPANIES,
  RECENT_EXPORTERS,
  companyPatch,
  type Ctx,
  type FieldDef,
  type Form,
} from '@/pages/declarant/gtd/schema';

interface FieldProps {
  f: FieldDef;
  ctx: Ctx;
  value: string;
  error: string | null;
  ai: boolean;
  readOnly: boolean;
  onChange: (v: string) => void;
  onPatch?: (patch: Form) => void;
}

const monoSx = { fontFamily: 'ui-monospace, Menlo, monospace', letterSpacing: '0.04em' };

export function FieldInput({
  f,
  ctx,
  value,
  error,
  ai,
  readOnly,
  onChange,
  dense,
}: Omit<FieldProps, 'onPatch'> & { dense?: boolean }) {
  const id = `gtd-${f.key}`;
  const helper = dense ? (error ?? undefined) : (error ?? f.hint ?? ' ');
  const size = dense ? 'small' : undefined;
  const aiSx = {
    '& .MuiOutlinedInput-root': { bgcolor: ai ? 'rgba(147,51,234,.05)' : 'transparent' },
  };

  switch (f.type) {
    case 'segmented':
      return (
        <ToggleButtonGroup
          exclusive
          size='small'
          value={value}
          disabled={readOnly}
          onChange={(_, v: string | null) => v && onChange(v)}
          aria-label={f.label}
          id={id}
          sx={{
            gap: 1,
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              gap: 1,
              px: dense ? 1.25 : 1.75,
              py: dense ? 0.4 : undefined,
              border: 1,
              borderColor: 'divider',
              borderRadius: '8px !important',
              '&.Mui-selected': { borderColor: 'primary.main', bgcolor: 'rgba(47,111,237,.08)' },
            },
          }}
        >
          {f.options!.map((o) => (
            <ToggleButton key={o.value} value={o.value}>
              <Box
                component='span'
                sx={{ ...monoSx, fontSize: 11, fontWeight: 700, color: 'primary.main' }}
              >
                {o.badge}
              </Box>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      );
    case 'switch':
      return (
        <FormControlLabel
          control={
            <Switch
              id={id}
              size={size}
              checked={value === '1'}
              disabled={readOnly}
              onChange={(e) => onChange(e.target.checked ? '1' : '')}
            />
          }
          label={<Typography variant='body2'>{value === '1' ? 'Да' : 'Нет'}</Typography>}
        />
      );
    case 'computed':
      return (
        <TextField
          id={id}
          size={size}
          value={f.compute!(ctx)}
          disabled
          helperText={helper}
          inputProps={{ style: f.mono ? monoSx : undefined, 'aria-label': f.label }}
          sx={{
            '& .Mui-disabled': {
              WebkitTextFillColor: 'inherit !important',
              color: 'text.secondary',
            },
            '& .MuiInputBase-root': { bgcolor: 'action.hover' },
          }}
        />
      );
    case 'select':
      return (
        <TextField
          id={id}
          size={size}
          select
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={helper}
          sx={aiSx}
          inputProps={{ 'aria-label': f.label }}
          SelectProps={{
            displayEmpty: true,
            renderValue: (v) =>
              v ? (
                <Box component='span'>
                  {f.options!.find((o) => o.value === v)?.label ?? String(v)}
                </Box>
              ) : (
                <Typography component='span' color='text.disabled'>
                  Выберите
                </Typography>
              ),
          }}
        >
          {f.options!.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      );
    default:
      return (
        <TextField
          id={id}
          size={size}
          type={f.type === 'date' ? 'date' : 'text'}
          value={value}
          disabled={readOnly}
          multiline={f.type === 'textarea'}
          minRows={f.type === 'textarea' ? (dense ? 1 : 2) : undefined}
          placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={helper}
          InputLabelProps={{ shrink: true }}
          sx={aiSx}
          inputProps={{
            style: f.mono ? monoSx : undefined,
            inputMode: f.type === 'number' ? 'numeric' : undefined,
            'aria-label': f.label,
            'aria-required': f.required,
            'aria-invalid': !!error,
          }}
        />
      );
  }
}

export function Lookup({
  f,
  ctx,
  value,
  readOnly,
  onPatch,
}: {
  f: FieldDef;
  ctx: Ctx;
  value: string;
  readOnly: boolean;
  onPatch?: (patch: Form) => void;
}) {
  if (readOnly || !onPatch || !f.lookup) return null;
  if (f.lookup === 'company') {
    const c = COMPANIES[value];
    if (!c) return null;
    const patch = companyPatch(f.key, c);
    if (Object.entries(patch).every(([k, v]) => ctx.form[k] === v)) return null;
    return (
      <Stack
        direction='row'
        spacing={1}
        alignItems='center'
        sx={{
          mt: -1,
          mb: 1,
          p: 1,
          pl: 1.25,
          borderRadius: 2,
          bgcolor: 'rgba(47,111,237,.07)',
        }}
      >
        <Box sx={{ color: 'primary.main', display: 'flex' }}>
          <BookUser size={16} />
        </Box>
        <Typography variant='body2' sx={{ flex: 1, minWidth: 0 }}>
          В справочнике: <b>{c.name}</b>
        </Typography>
        <Button size='small' onClick={() => onPatch(patch)}>
          Подставить
        </Button>
      </Stack>
    );
  }
  const q = value.trim().toLowerCase();
  if (RECENT_EXPORTERS.some((e) => e.name.toLowerCase() === q)) return null;
  const list = RECENT_EXPORTERS.filter((e) => !q || e.name.toLowerCase().includes(q));
  if (!list.length) return null;
  return (
    <Stack direction='row' spacing={0.75} alignItems='center' sx={{ mt: -1, mb: 1, rowGap: 0.75 }}>
      <Typography variant='caption' color='text.secondary'>
        Недавние:
      </Typography>
      {list.map((e) => (
        <Chip
          key={e.name}
          size='small'
          variant='outlined'
          label={e.name}
          onClick={() =>
            onPatch({
              exporterName: e.name,
              exporterCountry: e.country,
              exporterAddress: e.address,
            })
          }
        />
      ))}
    </Stack>
  );
}
