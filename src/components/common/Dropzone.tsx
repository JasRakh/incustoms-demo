import { Box, Typography } from '@mui/material';
import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';

interface Props {
  title: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  compact?: boolean;
}

export function Dropzone({ title, hint, accept, multiple, onFiles, compact }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <Box
      component="button"
      type="button"
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = Array.from(e.dataTransfer.files); if (f.length) onFiles(f); }}
      sx={{
        width: '100%', border: '2px dashed', borderColor: over ? 'primary.main' : 'divider', borderRadius: 3, bgcolor: over ? 'rgba(47,111,237,.06)' : 'transparent',
        py: compact ? 3 : 5, px: 2, cursor: 'pointer', color: 'text.secondary', font: 'inherit', transition: 'all .15s',
        '&:hover, &:focus-visible': { borderColor: 'primary.main', bgcolor: 'rgba(47,111,237,.06)' },
      }}
    >
      <Box sx={{ display: 'inline-flex', p: 1.25, borderRadius: 2, bgcolor: 'rgba(47,111,237,.1)', color: 'primary.main', mb: 1 }}><FileUp size={22} /></Box>
      <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
      {hint && <Typography variant="body2" sx={{ mt: 0.5 }}>{hint}</Typography>}
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple} onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = ''; }} />
    </Box>
  );
}
