import { Box } from '@mui/material';
import azizaPhoto from '@/assets/aziza.jpg';

export function AzizaAvatar({
  size = 40,
  ring = false,
  online = false,
}: {
  size?: number;
  ring?: boolean;
  online?: boolean;
}) {
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Box
        component='img'
        src={azizaPhoto}
        alt=''
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: 'center 20%',
          display: 'block',
          bgcolor: '#f1f5f9',
          boxShadow: ring
            ? (theme) => `0 0 0 3px ${theme.palette.background.paper}, 0 0 0 5px #a78bfa`
            : 'none',
        }}
      />
      {online && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: '50%',
            bgcolor: 'success.main',
            border: 2,
            borderColor: 'background.paper',
          }}
        />
      )}
    </Box>
  );
}
