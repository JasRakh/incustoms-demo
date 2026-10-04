import { Box, Button, Typography } from '@mui/material';
import { ArrowRight, Paperclip } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Message } from '@/types';
import { fmtTime } from '@/lib/format';
import type { ReactNode } from 'react';

export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Box component='span' sx={{ whiteSpace: 'pre-line' }}>
      {parts.map((p, i) =>
        p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>
      )}
    </Box>
  );
}

export function TypingDots() {
  return (
    <Box
      aria-label='Печатает…'
      sx={{
        display: 'inline-flex',
        gap: '3px',
        py: 0.5,
        '& i': {
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: 'currentColor',
          opacity: 0.35,
          animation: 'blink 1s infinite',
        },
        '& i:nth-of-type(2)': { animationDelay: '.15s' },
        '& i:nth-of-type(3)': { animationDelay: '.3s' },
        '@keyframes blink': { '50%': { opacity: 0.9 } },
      }}
    >
      <i />
      <i />
      <i />
    </Box>
  );
}

export function ChatBubble({
  m,
  avatar,
  footer,
}: {
  m: Message;
  avatar?: ReactNode;
  footer?: ReactNode;
}) {
  const nav = useNavigate();
  const me = m.from === 'me';
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'flex-end',
        maxWidth: { xs: '92%', md: '80%' },
        alignSelf: me ? 'flex-end' : 'flex-start',
        flexDirection: me ? 'row-reverse' : 'row',
      }}
    >
      {!me && avatar}
      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            px: 1.75,
            py: 1.25,
            borderRadius: me ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            bgcolor: me ? 'primary.main' : 'action.hover',
            color: me ? '#fff' : 'text.primary',
            overflowWrap: 'anywhere',
          }}
        >
          {m.typing ? (
            <TypingDots />
          ) : (
            <Typography variant='body2' component='div' sx={{ fontSize: 14 }}>
              <RichText text={m.text} />
            </Typography>
          )}
          {m.attachment && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                mt: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                bgcolor: me ? 'rgba(255,255,255,.18)' : 'background.paper',
                fontSize: 12,
              }}
            >
              <Paperclip size={13} /> {m.attachment}
            </Box>
          )}
          {m.link && (
            <Box>
              <Button
                size='small'
                variant='outlined'
                sx={{ mt: 1, bgcolor: 'background.paper' }}
                endIcon={<ArrowRight size={14} />}
                onClick={() => nav(m.link!.to)}
              >
                {m.link.label}
              </Button>
            </Box>
          )}
          {!m.typing && (
            <Typography
              variant='caption'
              sx={{ display: 'block', textAlign: 'right', opacity: 0.7, mt: 0.25, fontSize: 10 }}
            >
              {fmtTime(m.at)}
            </Typography>
          )}
        </Box>
        {footer}
      </Box>
    </Box>
  );
}
