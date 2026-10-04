import { Alert, Button, Stack } from '@mui/material';
import { useStore } from '@/app/store';

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <Stack
      spacing={1}
      role='status'
      aria-live='polite'
      sx={{ position: 'fixed', top: 76, right: 20, left: { xs: 12, sm: 'auto' }, zIndex: 2000 }}
    >
      {toasts.map((t) => (
        <Alert
          key={t.id}
          severity={t.severity}
          variant='filled'
          onClose={t.undo ? undefined : () => dismissToast(t.id)}
          action={
            t.undo ? (
              <Button
                color='inherit'
                size='small'
                sx={{ minHeight: 28 }}
                onClick={() => {
                  t.undo?.();
                  dismissToast(t.id);
                }}
              >
                Отменить
              </Button>
            ) : undefined
          }
          sx={{ minWidth: 280, maxWidth: 420, boxShadow: 6, alignItems: 'center' }}
        >
          {t.text}
        </Alert>
      ))}
    </Stack>
  );
}
