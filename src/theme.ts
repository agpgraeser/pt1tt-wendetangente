import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 13,
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
  },
});
