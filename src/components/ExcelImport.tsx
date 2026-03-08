import { useRef } from 'react';
import {
  Box, Button, Typography, TextField,
  Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { Action } from '../store/reducer';
import type { WendetangenteState } from '../types';
import { parseExcelFile } from '../utils/excelParser';

interface Props {
  state: WendetangenteState;
  dispatch: React.Dispatch<Action>;
}

export default function ExcelImport({ state, dispatch }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseExcelFile(file);
      dispatch({ type: 'LOAD_EXCEL', result, fileName: file.name });
    } catch (err) {
      console.error('Excel parse error:', err);
    }
    // Reset so the same file can be reloaded
    e.target.value = '';
  }

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Button + Modus-Eingabe in einer Zeile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Datei laden
        </Button>
        <TextField
          type="number"
          size="small"
          value={state.displayMode}
          onChange={e => dispatch({ type: 'SET_DISPLAY_MODE', value: parseInt(e.target.value, 10) || 0 })}
          inputProps={{
            min: 0,
            style: { textAlign: 'center', fontSize: '0.82rem', padding: '5px 6px', width: '28px' },
          }}
          sx={{ width: 52 }}
        />
      </Box>

      {state.fileName && (
        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 1 }}>
          {state.fileName}
        </Typography>
      )}

      {/* Modus 1: Bezeichnung + Excel-Tabelle */}
      {state.displayMode === 1 && state.excelPreviewRows.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
            Excel Werte
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ '& td': { fontSize: '0.75rem', py: 0.3, px: 0.5 } }}>
              <TableBody>
                {state.excelPreviewRows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j}>
                        {cell !== undefined ? String(cell) : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </Box>
  );
}
