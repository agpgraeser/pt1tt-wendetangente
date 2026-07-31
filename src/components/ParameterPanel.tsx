import {
  Box, Typography, Divider, TextField, Tooltip,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import type { Action } from '../store/reducer';
import type { WendetangenteState, DerivedValues, ShowMode, Methode } from '../types';
import { fmt } from '../utils/pt1ttMath';
import { TIPS } from '../utils/tooltips';
import ExcelImport from './ExcelImport';

interface Props {
  state: WendetangenteState;
  derived: DerivedValues;
  dispatch: React.Dispatch<Action>;
}

// ── Inline helpers ────────────────────────────────────────────────────────────

function NumInput({
  value, onChange, readOnly = false, error = false, disabled = false, step, tip,
}: {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  error?: boolean;
  disabled?: boolean;
  step?: number;
  tip?: string;
}) {
  const field = (
    <TextField
      value={value}
      onChange={e => onChange?.(e.target.value)}
      type="number"
      size="small"
      disabled={disabled}
      error={error && !readOnly && !disabled}
      inputProps={{
        readOnly,
        step,
        style: { textAlign: 'right', fontSize: '0.82rem', padding: '5px 8px' },
      }}
      sx={{
        width: 95,
        '& .MuiInputBase-root': {
          backgroundColor: readOnly ? '#e5f7e5' : undefined,
        },
        '& .MuiOutlinedInput-notchedOutline': readOnly
          ? { borderColor: '#b2d8b2 !important' }
          : {},
      }}
    />
  );
  return tip ? (
    <Tooltip title={tip} placement="right" arrow>
      <span>{field}</span>
    </Tooltip>
  ) : field;
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
      {children}
    </Typography>
  );
}

function TipLbl({ tipKey, children }: { tipKey: string; children: React.ReactNode }) {
  return (
    <Tooltip title={TIPS[tipKey] ?? ''} placement="right" arrow>
      <span><Lbl>{children}</Lbl></span>
    </Tooltip>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, fontSize: '0.82rem' }}>
      {children}
    </Typography>
  );
}

// 6-column compact grid
const row6: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 95px auto 95px auto 95px',
  columnGap: '6px', rowGap: '4px',
  alignItems: 'center',
};

// 4-column compact grid
const row4: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'max-content 95px max-content 95px',
  columnGap: '6px', rowGap: '4px',
  alignItems: 'center',
};

function parseNum(s: string): number | null {
  const v = parseFloat(s);
  return isNaN(v) || !isFinite(v) ? null : v;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ParameterPanel({ state, derived, dispatch }: Props) {
  const { methode } = state;

  function set(field: 'xA' | 'xE' | 'yA' | 'yE' | 't0' | 'xWP' | 'tWP' | 'dx' | 'dt', value: string) {
    dispatch({ type: 'SET_FIELD', field, value });
  }

  const xA  = parseNum(state.xA);
  const xE  = parseNum(state.xE);
  const t0  = parseNum(state.t0);
  const xWP = parseNum(state.xWP);
  const tWP = parseNum(state.tWP);
  const dxV = parseNum(state.dx);
  const dtV = parseNum(state.dt);

  const t0Error  = t0 !== null && t0 < 0;
  const xWPError = state.xWP !== '' && (xWP === null || (xA !== null && xE !== null && (xWP <= xA || xWP >= xE)));
  const tWPError = state.tWP !== '' && (tWP === null || (t0 !== null && t0 >= 0 && tWP <= t0));
  const dxError  = state.dx  !== '' && (dxV === null || (xWP !== null && dxV <= xWP) || (xE !== null && dxV >= xE));
  const dtError  = state.dt  !== '' && (dtV === null || (tWP !== null && dtV <= tWP));

  const dxDtEnabled = xWP !== null && tWP !== null;

  const showRow1 = methode === 1 || methode === 3;
  const showRow2 = methode === 2 || methode === 3;

  const m1Ready    = derived.TT !== null && derived.TG  !== null;
  const m2Ready    = derived.TT !== null && derived.TG1 !== null;
  const modelReady = methode === 2 ? m2Ready : methode === 3 ? (m1Ready || m2Ready) : m1Ready;

  return (
    <Box sx={{
      background: '#fff',
      boxShadow: '2px 0 4px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
    }}>
      {/* ══ Fixed top zone ══════════════════════════════════════════════════ */}
      <Box sx={{ flexShrink: 0 }}>

        {/* ── Abschnitt 1: Signalgrenzen ── */}
        <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}
            sx={{ textAlign: 'center', fontSize: '0.82rem', mb: 1 }}>
            PT1TT Parameter – Wendetangenten-Methode
          </Typography>
          <Box sx={row6}>
            <TipLbl tipKey="xA">XA</TipLbl>
            <NumInput value={state.xA} step={0.01} tip={TIPS.xA}
              error={parseNum(state.xA) === null && state.xA !== ''}
              onChange={v => set('xA', v)} />
            <TipLbl tipKey="xE">XE</TipLbl>
            <NumInput value={state.xE} step={0.01} tip={TIPS.xE}
              error={parseNum(state.xE) === null && state.xE !== ''}
              onChange={v => set('xE', v)} />
            <TipLbl tipKey="dX">ΔX</TipLbl>
            <NumInput value={fmt(derived.dX, 2)} readOnly tip={TIPS.dX} />

            <TipLbl tipKey="yA">YA</TipLbl>
            <NumInput value={state.yA} step={0.01} tip={TIPS.yA}
              error={parseNum(state.yA) === null && state.yA !== ''}
              onChange={v => set('yA', v)} />
            <TipLbl tipKey="yE">YE</TipLbl>
            <NumInput value={state.yE} step={0.01} tip={TIPS.yE}
              error={parseNum(state.yE) === null && state.yE !== ''}
              onChange={v => set('yE', v)} />
            <TipLbl tipKey="dY">ΔY</TipLbl>
            <NumInput value={fmt(derived.dY, 2)} readOnly tip={TIPS.dY} />

            <TipLbl tipKey="t0">t₀</TipLbl>
            <NumInput value={state.t0} step={0.1} tip={TIPS.t0}
              error={t0Error || (parseNum(state.t0) === null && state.t0 !== '')}
              onChange={v => set('t0', v)} />
            <span /><span /><span /><span />
          </Box>
        </Box>

        <Divider />

        {/* ── Abschnitt 2: Methodenwahl ── */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <SectionTitle>Methode</SectionTitle>
          <ToggleButtonGroup
            value={methode} exclusive
            onChange={(_e, val: Methode | null) => {
              if (val !== null) dispatch({ type: 'SET_METHODE', methode: val });
            }}
            size="small"
            sx={{ '& .MuiToggleButton-root': { fontSize: '0.78rem', px: 1.5, py: 0.4 } }}
          >
            <ToggleButton value={1}>Methode 1</ToggleButton>
            <ToggleButton value={2}>Methode 2</ToggleButton>
            <ToggleButton value={3}>Methode 3</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {methode === 1 && 'Küpfmüller: TG = t₂ − t₁'}
            {methode === 2 && 'Modifiziert: TG = t₂ − tWP'}
            {methode === 3 && 'Kombination: beide Methoden'}
          </Typography>
        </Box>

        <Divider />

        {/* ── Abschnitt 3: Wendetangente Eingaben ── */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <SectionTitle>Tangentenpunkte (WP1, WP2) – Eingabe</SectionTitle>
          <Box sx={row4}>
            {/* P₁: Wendepunkt */}
            <TipLbl tipKey="xWP">XWP1</TipLbl>
            <NumInput value={state.xWP} step={0.01} error={xWPError} tip={TIPS.xWP}
              onChange={v => set('xWP', v)} />
            <TipLbl tipKey="tWP">tWP1</TipLbl>
            <NumInput value={state.tWP} step={0.01} error={tWPError} tip={TIPS.tWP}
              onChange={v => set('tWP', v)} />

            {/* P₂: zweiter Tangentenpunkt (absolute Koordinaten) */}
            <TipLbl tipKey="dx">XWP2</TipLbl>
            <NumInput value={state.dx} step={0.01} error={dxError} tip={TIPS.dx}
              disabled={!dxDtEnabled} onChange={v => set('dx', v)} />
            <TipLbl tipKey="dt">tWP2</TipLbl>
            <NumInput value={state.dt} step={0.01} error={dtError} tip={TIPS.dt}
              disabled={!dxDtEnabled} onChange={v => set('dt', v)} />

            {/* Berechnete Schnittpunkte (read-only) */}
            <TipLbl tipKey="t1Calc">t₁</TipLbl>
            <NumInput value={fmt(derived.t1Calc, 3)} readOnly tip={TIPS.t1Calc} />
            <TipLbl tipKey="t2Calc">t₂</TipLbl>
            <NumInput value={fmt(derived.t2Calc, 3)} readOnly tip={TIPS.t2Calc} />
          </Box>
        </Box>

        <Divider />

        {/* ── Abschnitt 4: Berechnete Kennwerte ── */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <SectionTitle>Berechnete Kennwerte</SectionTitle>

          {showRow1 && (
            <Box sx={{ mb: showRow2 ? 1 : 0 }}>
              {methode === 3 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Küpfmüller (Methode 1)
                </Typography>
              )}
              <Box sx={row6}>
                <TipLbl tipKey="kS">kS</TipLbl>
                <NumInput value={fmt(derived.kS, 4)} readOnly tip={TIPS.kS} />
                <TipLbl tipKey="TT">TT</TipLbl>
                <NumInput value={fmt(derived.TT, 3)} readOnly tip={TIPS.TT} />
                <TipLbl tipKey="TG">TG</TipLbl>
                <NumInput value={fmt(derived.TG, 3)} readOnly tip={TIPS.TG} />
              </Box>
            </Box>
          )}

          {showRow2 && (
            <Box>
              {methode === 3 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Modifiziert (Methode 2)
                </Typography>
              )}
              <Box sx={row6}>
                <TipLbl tipKey="kS">kS</TipLbl>
                <NumInput value={fmt(derived.kS, 4)} readOnly tip={TIPS.kS} />
                <TipLbl tipKey="TT">TT</TipLbl>
                <NumInput value={fmt(derived.TT, 3)} readOnly tip={TIPS.TT} />
                <TipLbl tipKey="TG1">TG</TipLbl>
                <NumInput value={fmt(derived.TG1, 3)} readOnly tip={TIPS.TG1} />
              </Box>
            </Box>
          )}
        </Box>

        <Divider />

        {/* ── Abschnitt 5: Darstellung ── */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <SectionTitle>Darstellung</SectionTitle>
          <ToggleButtonGroup
            value={state.showMode} exclusive
            onChange={(_e, val: ShowMode | null) => {
              if (val !== null) dispatch({ type: 'SET_SHOW_MODE', mode: val });
            }}
            size="small"
            disabled={!modelReady}
            sx={{ '& .MuiToggleButton-root': { fontSize: '0.78rem', px: 1.2, py: 0.4 } }}
          >
            <ToggleButton value={1}>Stellgröße</ToggleButton>
            <ToggleButton value={2}>Abweichung</ToggleButton>
            <ToggleButton value={3}>Δx²</ToggleButton>
            <ToggleButton value={4}>Σ Δx²·Δt</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />
      </Box>

      {/* ══ Scrollable bottom: Excel Import ════════════════════════════════ */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        <SectionTitle>Messdaten laden</SectionTitle>
        <ExcelImport state={state} dispatch={dispatch} />
      </Box>
    </Box>
  );
}
