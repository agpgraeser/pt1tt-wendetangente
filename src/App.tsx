import { useReducer, useMemo } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import { reducer, initialState } from './store/reducer';
import { computeDerived } from './utils/pt1ttMath';
import ParameterPanel from './components/ParameterPanel';
import ResponseChart from './components/ResponseChart';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const derived = useMemo(() => computeDerived(state), [state]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <ParameterPanel state={state} derived={derived} dispatch={dispatch} />
        <ResponseChart state={state} derived={derived} />
      </Box>
    </ThemeProvider>
  );
}
