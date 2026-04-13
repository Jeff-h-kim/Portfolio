import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';

// ─── AUDIO: NOTE FREQUENCIES ───────────────────────────────────────────────
const NOTE_FREQ = {
  G1: 49.00, A1: 55.00, B1: 61.74,

  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31,
  G2: 98.00, A2: 110.00, B2: 123.47,

  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61,
  G3: 196.00, A3: 220.00, B3: 246.94,

  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,

  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00, B5: 987.77,

  C6: 1046.5, D6: 1174.66, E6: 1318.51, F6: 1396.91,
  G6: 1567.98, A6: 1760.00, B6: 1975.53,
};

const SEMITONE = Math.pow(2, 1/12);

function getEffectiveAccidental(noteObj, keySig) {
  if (!noteObj || noteObj.note === 'Rest') return 'natural';

  const letter = noteObj.note[0];

  // 🎯 MANUAL overrides FIRST
  if (noteObj.accidental === 'sharp') return 'sharp';
  if (noteObj.accidental === 'flat') return 'flat';
  if (noteObj.accidental === 'natural') return 'natural';

  // 🎯 "regular" OR undefined → follow key signature
  if (keySig.sharps.includes(letter)) return 'sharp';
  if (keySig.flats.includes(letter)) return 'flat';

  return 'natural';
}

function getFrequency(noteObj, keySig) {
  if (!noteObj || noteObj.note === 'Rest') return null;

  const base = NOTE_FREQ[noteObj.note];
  if (!base) return null;

  const acc = getEffectiveAccidental(noteObj, keySig);

  if (acc === 'sharp') return base * SEMITONE;
  if (acc === 'flat') return base / SEMITONE;

  return base;
}

// ─── LAYOUT CONSTANTS ─────────────────────────────────────────────────────────
const LINE_GAP        = 9;      // was 14 — tighter staff lines
const HALF_STEP       = LINE_GAP / 2;
const NOTE_W          = 36;     // unused but kept for reference
const MARGIN_L        = 80;     // wider to fit clef + key sig accidentals
const MARGIN_R        = 20;
const STAFF_TOP       = 52;     // less top padding
const NOTES_PER_LINE  = 20;
const KEY_SIG_START_X = 40;     // x where key sig accidentals begin (after clef)

// ─── TREBLE ROW MAP ───────────────────────────────────────────────────────────
const TREBLE_ROWS = [
  { note:'C7', row:-13 },
  { note:'D7', row:-12 },
  { note:'B6', row:-11 },
  { note:'A6', row:-10 },
  { note:'G6', row:-9 },
  { note:'F6', row:-8 },
  { note:'E6', row:-7 },
  { note:'D6', row:-6 },
  { note:'C6', row:-5 },
  { note:'B5', row:-4 },
  { note:'A5', row:-3 },
  { note:'G5', row:-2 },
  { note:'F5', row:-1 },
  { note:'E5', row:0 },
  { note:'D5', row:1 },
  { note:'C5', row:2 },
  { note:'B4', row:3 }, // ✅ aligned
  { note:'A4', row:4 },
  { note:'G4', row:5 }, // ✅ correct now
  { note:'F4', row:6 },
  { note:'E4', row:7 },
  { note:'D4', row:8 },
  { note:'C4', row:9 },
  { note:'B3', row:10 },
  { note:'A3', row:11 },
  { note:'G3', row:12 },
];
const TREBLE_LINES   = [-1, 1, 3, 5, 7];
const TREBLE_ROW_MIN = -10;
const TREBLE_ROW_MAX = 13;

// ─── BASS ROW MAP ─────────────────────────────────────────────────────────────
const BASS_ROWS = [
  { note:'G4', row:-5 },
  { note:'F4', row:-4 },
  { note:'E4', row:-3 },
  { note:'D4', row:-2 },
  { note:'C4', row:-1 },
  { note:'B3', row:0 },
  { note:'A3', row:1 },
  { note:'G3', row:2 },
  { note:'F3', row:3 },
  { note:'E3', row:4 },
  { note:'D3', row:5 }, // ✅ aligned
  { note:'C3', row:6 },
  { note:'B2', row:7 },
];
const BASS_LINES   = [1, 3, 5, 7, 9];
const BASS_ROW_MIN = -2;
const BASS_ROW_MAX = 10;

// ─── KEY SIGNATURES ───────────────────────────────────────────────────────────
const KEY_SIGNATURES = {
  'C maj / A min':   { sharps:[], flats:[] },
  'G maj / E min':   { sharps:['F'], flats:[] },
  'D maj / B min':   { sharps:['F','C'], flats:[] },
  'A maj / F# min':  { sharps:['F','C','G'], flats:[] },
  'E maj / C# min':  { sharps:['F','C','G','D'], flats:[] },
  'B maj / G# min':  { sharps:['F','C','G','D','A'], flats:[] },
  'F maj / D min':   { sharps:[], flats:['B'] },
  'Bb maj / G min':  { sharps:[], flats:['B','E'] },
  'Eb maj / C min':  { sharps:[], flats:['B','E','A'] },
  'Ab maj / F min':  { sharps:[], flats:['B','E','A','D'] },
  'Db maj / Bb min': { sharps:[], flats:['B','E','A','D','G'] },
};
const TREBLE_SHARP_ROW = { F:-1, C:2, G:-3, D:0, A:-4 };
const TREBLE_FLAT_ROW  = { B:3, E:7, A:4, D:1, G:5 };
const BASS_SHARP_ROW   = { F:3, C:6, G:2, D:5, A:1 };
const BASS_FLAT_ROW    = { B:1, E:4, A:2, D:6, G:3 };

// ─── DURATIONS / ARTICULATIONS / ACCIDENTALS ──────────────────────────────────
const DURATIONS = [
  {value:0.25,label:'16th'},{value:0.5,label:'8th'},{value:0.75,label:'8th·'},
  {value:1.0,label:'qtr'},{value:1.5,label:'qtr·'},
  {value:2.0,label:'half'},{value:3.0,label:'hlf·'},{value:4.0,label:'whole'},
];
const ARTICULATIONS = [
  {value:'reg',      label:'reg'},
  {value:'stac',     label:'stac'},
  {value:'legato',   label:'legato'},
  {value:'grace',    label:'grace'},
  {value:'roll',     label:'roll'},
  {value:'slur_start',label:'slur▶'},
  {value:'slur_end', label:'◀slur'},
];
const ACCIDENTALS = [
  { value:'regular', label:'reg' },   // 👈 NEW
  { value:'natural', label:'♮ nat' },
  { value:'sharp',   label:'♯ sharp' },
  { value:'flat',    label:'♭ flat' },
];
const TIME_SIGS = [
  { value:'4/4', label:'4/4', beats:4 },
  { value:'3/4', label:'3/4', beats:3 },
];

const TREBLE_COLORS = ['#c8804e','#6ec88a','#6eaac8'];
const BASS_COLORS   = ['#6eaac8','#a08bc8','#c8a96e'];

// Decompose a beat duration into note-value rests (greedy, largest first)
function makeRestFill(beats) {
  const rests = [];
  let rem = Math.round(beats * 10000) / 10000;
  // Auto-rests only use whole and half — never 8th or 16th
  for (const u of [4.0, 2.0, 1.0]) {
    while (rem >= u - 0.0001) {
      rests.push({ note:'Rest', duration:u, type:'reg', accidental:'natural', autoRest:true });
      rem = Math.round((rem - u) * 10000) / 10000;
    }
  }
  return rests;
}

// Fill gap with rests of the specified duration (used when inserting between notes)
function makeRestFillWithDuration(beats, dur) {
  const rests = [];
  let rem = Math.round(beats * 10000) / 10000;
  while (rem >= dur - 0.0001) {
    rests.push({ note:'Rest', duration:dur, type:'reg', accidental:'natural', autoRest:true });
    rem = Math.round((rem - dur) * 10000) / 10000;
  }
  // Fill any leftover with standard rests
  if (rem > 0.0001) {
    rests.push(...makeRestFill(rem));
  }
  return rests;
}

// ─── DRAW HELPERS ─────────────────────────────────────────────────────────────
function drawLedgerLines(ctx, x, row, lines, rToY, staffTop, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;

  const minLine = Math.min(...lines);
  const maxLine = Math.max(...lines);

  // Above staff
  if (row < minLine) {
    for (let r = minLine - 2; r >= row; r -= 2) {
      const y = rToY(r, staffTop);
      ctx.beginPath();
      ctx.moveTo(x - 7, y);   // was 10
      ctx.lineTo(x + 7, y);
      ctx.stroke();
    }
  }

  // Below staff
  if (row > maxLine) {
    for (let r = maxLine + 2; r <= row; r += 2) {
      const y = rToY(r, staffTop);
      ctx.beginPath();
      ctx.moveTo(x - 7, y);   // was 10
      ctx.lineTo(x + 7, y);
      ctx.stroke();
    }
  }
}

function drawRest(ctx, duration, cx, midLineY, color) {
  ctx.save();
  ctx.fillStyle = color; ctx.strokeStyle = color;
  if (duration >= 4.0) {
    ctx.fillRect(cx - 6, midLineY, 12, 4);        // was 9, 18, 6
  } else if (duration >= 2.0) {
    ctx.fillRect(cx - 6, midLineY - 4, 12, 4);    // was 9, 18, 6
  } else if (duration >= 1.0) {
    ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx+3, midLineY-7); ctx.lineTo(cx-2, midLineY-3);
    ctx.lineTo(cx+3, midLineY+1);  ctx.lineTo(cx-1, midLineY+4);
    ctx.bezierCurveTo(cx-5, midLineY+8, cx-3, midLineY+11, cx+1, midLineY+11);
    ctx.moveTo(cx-1, midLineY+4);  ctx.lineTo(cx+3, midLineY+6);
    ctx.stroke();
  } else if (duration >= 0.5) {
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(cx-1, midLineY+6); ctx.lineTo(cx+2, midLineY-5); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+3, midLineY-4, 2.2, 0, Math.PI*2); ctx.fill();
  } else {
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(cx-1, midLineY+6); ctx.lineTo(cx+2, midLineY-5); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+3, midLineY-4, 2.0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+1, midLineY+1, 2.0, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = color + '77';
  ctx.font = '5px "Roboto Mono",monospace';     // was 7px
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const dur = DURATIONS.find(d => d.value === duration);
  if (dur) ctx.fillText(dur.label, cx, midLineY + 14);   // was +22
  ctx.restore();
}


function drawNoteHead(ctx, cx, cy, duration, color, stemUp, articulation) {
  const hollow = duration >= 2.0;
  const whole  = duration >= 4.0;
  const isDotted = [0.75, 1.5, 3.0].includes(duration);
  const baseDur  = isDotted ? duration / 1.5 : duration;

  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4.5, 3.5, -0.18, 0, Math.PI*2);   // was 6.5, 5
  if (hollow) {
    ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = color; ctx.stroke();
  } else { ctx.fill(); }
  if (!whole) {
    const sx  = stemUp ? cx+4  : cx-4;    // was ±6
    const sy1 = stemUp ? cy-3  : cy+3;    // was ±5
    const sy2 = stemUp ? cy-26 : cy+26;   // was ±36
    ctx.strokeStyle = color; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(sx, sy1); ctx.lineTo(sx, sy2); ctx.stroke();
    const flagCount = baseDur <= 0.25 ? 2 : baseDur <= 0.5 ? 1 : 0;
    for (let f = 0; f < flagCount; f++) {
      const fy = sy2 + f*(stemUp ? 5 : -5);   // was 7
      const dir = stemUp ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(sx, fy);
      ctx.bezierCurveTo(sx+7*dir, fy+4*dir, sx+9*dir, fy+8*dir, sx+6*dir, fy+14*dir);  // was 10,6,13,12,8,20
      ctx.stroke();
    }
  }
  if (isDotted) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx+7, cy-1, 1.5, 0, Math.PI*2); ctx.fill();  // was cx+10, 2.1
  }
  if (articulation === 'stac') {
    ctx.fillStyle = color;
    const dotY = stemUp ? cy+9 : cy-9;   // was ±13
    ctx.beginPath(); ctx.arc(cx, dotY, 1.6, 0, Math.PI*2); ctx.fill();   // was 2.2
  } else if (articulation === 'legato' || articulation === 'lega') {
    ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    const lineY = stemUp ? cy+9 : cy-9;
    ctx.beginPath(); ctx.moveTo(cx-5, lineY); ctx.lineTo(cx+5, lineY); ctx.stroke();  // was ±7
  } else if (articulation === 'grace') {
    // Small 'g' marker above note
    ctx.fillStyle = color;
    ctx.font = '5px "Roboto Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('gr', cx, stemUp ? cy-30 : cy+30);
  } else if (articulation === 'roll') {
    // Wavy ~ marker
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    const ry = stemUp ? cy-30 : cy+30;
    ctx.beginPath(); ctx.moveTo(cx-5, ry);
    ctx.bezierCurveTo(cx-2, ry-3, cx+2, ry+3, cx+5, ry);
    ctx.stroke();
  } else if (articulation === 'slur_start') {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, stemUp ? cy-30 : cy+30); ctx.lineTo(cx+6, stemUp ? cy-27 : cy+27); ctx.stroke();
  } else if (articulation === 'slur_end') {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx-6, stemUp ? cy-27 : cy+27); ctx.lineTo(cx, stemUp ? cy-30 : cy+30); ctx.stroke();
  }
  ctx.restore();
}


// ─── STAFF CANVAS ─────────────────────────────────────────────────────────────
// Each StaffCanvas now renders a SINGLE voice (voiceNotes = array of notes).
// notePositions: computed pixel x for each note, accounting for min spacing.
const MIN_NOTE_PX = 28; // minimum pixels per note slot regardless of duration

function computeNotePositions(voice, usableWidth, beatsPerLine, lineStartBeat) {
  // Build slots: each note gets max(duration*beatPx, MIN_NOTE_PX)
  const beatPx = usableWidth / beatsPerLine;
  const positions = [];
  let beatCursor = 0;
  let xCursor = 0;

  // First pass: assign each note a "natural" x from beat position
  for (let i = 0; i < voice.length; i++) {
    const note = voice[i];
    const noteStartBeat = beatCursor;
    const naturalX = (noteStartBeat - lineStartBeat) * beatPx;
    const naturalW = note.duration * beatPx;
    const slotW = Math.max(naturalW, MIN_NOTE_PX);
    positions.push({ naturalX, slotW, beat: noteStartBeat, noteIdx: i });
    beatCursor += note.duration;
  }

  // Second pass: push notes right if they'd overlap (enforce min gap)
  let runningX = 0;
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    if (p.naturalX < runningX) {
      p.adjustedX = runningX;
    } else {
      p.adjustedX = p.naturalX;
      runningX = p.naturalX;
    }
    runningX += p.slotW;
  }

  return positions;
}

function StaffCanvas({
  clef,
  voiceNotes,      // single voice array
  voiceColor,      // color string
  voiceIdx,
  isActive,
  eraseMode,       // boolean — left-click deletes instead of placing
  slurMode,        // boolean — left-click cycles slur type on existing note
  selDur,
  selArt,
  selAcc,
  keySig,
  timeSig,
  onAddNote,
  onAddRest,       // (beat) => void — right-click adds rest at beat
  onDeleteNote,
  onSlurNote,      // (idx) => void — cycles slur state on existing note
  onEditNote,      // (idx, patch) => void — mutate properties of existing note
  playingBar,
  totalBeatsRef,   // shared ref so bar lines align across voices
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [hoverBeat, setHoverBeat] = useState(null); // { beat, row }
  const [hoveredNoteIdx, setHoveredNoteIdx] = useState(null);

  const isT = clef === 'treble';
  const rows = isT ? TREBLE_ROWS : BASS_ROWS;
  const lines = isT ? TREBLE_LINES : BASS_LINES;

  const beatsPerBar = timeSig === '3/4' ? 3 : 4;
  const STAFF_H = 130;       // was 200
  const LINE_SPACING = STAFF_H + 20;  // was +30

  const totalVoiceBeats = voiceNotes.reduce((s, n) => s + n.duration, 0);
  const maxBeats = Math.max(totalVoiceBeats, beatsPerBar);

  // beatsPerLine is computed dynamically in the draw loop based on canvas width + MIN_NOTE_PX.
  // We store the latest value in a ref so getCoords can use it without stale closure issues.
  const beatsPerLineRef = useRef(NOTES_PER_LINE);
  const beatPxRef = useRef(null);

  const getYFromRow = (row, staffTop) => {
    const middleLine = lines[2];
    const middleY = staffTop + (2 * LINE_GAP);
    return middleY + (row - middleLine) * HALF_STEP;
  };

  // ─── DRAW ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const W = wrap.clientWidth;

    canvas.width = W * dpr;
    canvas.style.width = W + 'px';

    const ctx = canvas.getContext('2d');

    const usableWidth = W - MARGIN_L - MARGIN_R;

    // Find the shortest note duration in this voice to ensure it gets at least MIN_NOTE_PX
    let minDur = 1.0;
    for (const n of voiceNotes) {
      if (n.duration < minDur) minDur = n.duration;
    }
    // beatPx must be large enough that the shortest note gets MIN_NOTE_PX
    const minBeatPx = MIN_NOTE_PX / minDur;
    const naturalBeatPx = usableWidth / NOTES_PER_LINE;
    const beatPx = Math.max(naturalBeatPx, minBeatPx);

    // How many beats fit per line given this beatPx, rounded down to whole bars
    const rawBeatsPerLine = usableWidth / beatPx;
    const barsPerLine = Math.max(1, Math.floor(rawBeatsPerLine / beatsPerBar));
    const actualBeatsPerLine = barsPerLine * beatsPerBar;
    const actualNumLines = Math.ceil(maxBeats / actualBeatsPerLine);

    // Store for getCoords
    beatsPerLineRef.current = actualBeatsPerLine;
    beatPxRef.current = beatPx;

    // Compute how far notes extend on the last line, add one bar of breathing room
    const lastLineStartBeat = (actualNumLines - 1) * actualBeatsPerLine;
    const lastLineBeats = Math.min(totalVoiceBeats - lastLineStartBeat, actualBeatsPerLine);
    const lastLineNotesPx = Math.max(lastLineBeats * beatPx, 0);
    const extraPx = Math.min(beatsPerBar * beatPx, usableWidth - lastLineNotesPx); // one bar of space
    // Staff line right edge per line: full width for all lines except the last
    const getLineRightX = (li) => {
      if (li < actualNumLines - 1) return W - MARGIN_R;
      return MARGIN_L + lastLineNotesPx + extraPx;
    };

    canvas.height = actualNumLines * LINE_SPACING * dpr;
    canvas.style.height = actualNumLines * LINE_SPACING + 'px';

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Use totalBeatsRef for bar lines so all voices show bars at same positions
    const sharedTotalBeats = totalBeatsRef?.current ?? maxBeats;

    for (let li = 0; li < actualNumLines; li++) {
      const staffTop = li * LINE_SPACING + STAFF_TOP;
      const lineStartBeat = li * actualBeatsPerLine;

      const topY = getYFromRow(lines[0], staffTop);
      const botY = getYFromRow(lines[lines.length - 1], staffTop);
      const midY = getYFromRow(lines[2], staffTop);

      // ─── PLAYING BAR HIGHLIGHT ──────────────────
      if (playingBar !== null) {
        const barStartBeat = playingBar * beatsPerBar;
        if (barStartBeat >= lineStartBeat - 0.0001 && barStartBeat < lineStartBeat + actualBeatsPerLine - 0.0001) {
          const barX = MARGIN_L + (barStartBeat - lineStartBeat) * beatPx;
          ctx.save();
          ctx.fillStyle = 'rgba(200,128,78,0.11)';
          ctx.fillRect(barX, topY - 8, beatsPerBar * beatPx, botY - topY + 16);
          ctx.strokeStyle = 'rgba(200,128,78,0.3)';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(barX, topY - 8, beatsPerBar * beatPx, botY - topY + 16);
          ctx.restore();
        }
      }

      // staff lines — clipped to content width on the last line
      const lineRightX = getLineRightX(li);
      lines.forEach(lr => {
        const y = getYFromRow(lr, staffTop);
        ctx.beginPath();
        ctx.moveTo(MARGIN_L, y);
        ctx.lineTo(lineRightX, y);
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // clef symbol
      ctx.font = isT ? '36px serif' : '26px serif';   // was 52 / 36
      ctx.fillStyle = '#666';
      ctx.fillText(isT ? '𝄞' : '𝄢', 6, getYFromRow(lines[2], staffTop) + (isT ? 3 : 6));

      // ─── KEY SIGNATURE ACCIDENTALS ──────────────
      const sharpRowMap = isT ? TREBLE_SHARP_ROW : BASS_SHARP_ROW;
      const flatRowMap  = isT ? TREBLE_FLAT_ROW  : BASS_FLAT_ROW;
      ctx.save();
      ctx.fillStyle = '#555';
      ctx.strokeStyle = '#555';
      ctx.font = '10px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let keySigX = KEY_SIG_START_X;
      if (keySig.sharps.length > 0) {
        for (const letter of keySig.sharps) {
          const row = sharpRowMap[letter];
          if (row !== undefined) {
            const y = getYFromRow(row, staffTop);
            ctx.fillText('♯', keySigX, y);
            keySigX += 9;
          }
        }
      } else if (keySig.flats.length > 0) {
        for (const letter of keySig.flats) {
          const row = flatRowMap[letter];
          if (row !== undefined) {
            const y = getYFromRow(row, staffTop);
            ctx.fillText('♭', keySigX, y);
            keySigX += 9;
          }
        }
      }
      ctx.restore();

      // ─── NOTES + BAR LINE LAYOUT ────────────────
      // Compute positions with min spacing — this is the single source of truth for x coords
      const lineNotes = [];
      let bc = 0;
      for (let i = 0; i < voiceNotes.length; i++) {
        const note = voiceNotes[i];
        if (bc >= lineStartBeat + actualBeatsPerLine) break;
        if (bc + note.duration > lineStartBeat - 0.0001) {
          lineNotes.push({ note, idx: i, beat: bc });
        }
        bc += note.duration;
      }

      // Compute adjusted x positions with min spacing
      let xCursor = 0;
      const noteXMap = new Map(); // idx -> center x
      // Also build a beat->x map for bar line placement
      const beatXMap = new Map(); // beat (rounded) -> left-edge x of that slot
      for (const ln of lineNotes) {
        const naturalX = (ln.beat - lineStartBeat) * beatPx;
        const slotW = Math.max(ln.note.duration * beatPx, MIN_NOTE_PX);
        const adjustedX = Math.max(naturalX, xCursor);
        noteXMap.set(ln.idx, MARGIN_L + adjustedX + slotW / 2);
        const beatKey = Math.round(ln.beat * 10000);
        beatXMap.set(beatKey, { leftX: MARGIN_L + adjustedX, slotW });
        xCursor = adjustedX + slotW;
      }

      // Helper: convert a beat to its actual canvas x using the layout map
      // Falls back to raw beatPx math if beat isn't in the map (empty voice)
      const beatToCanvasX = (beat) => {
        // Find the note whose slot contains this beat
        let bc2 = 0;
        for (const ln of lineNotes) {
          const noteEnd = bc2 + ln.note.duration; // won't work — ln.beat is absolute
          const noteEnd2 = ln.beat + ln.note.duration;
          if (beat >= ln.beat - 0.0001 && beat < noteEnd2 - 0.0001) {
            // beat falls inside this note's slot
            const entry = beatXMap.get(Math.round(ln.beat * 10000));
            if (entry) {
              const fracInSlot = (beat - ln.beat) / ln.note.duration;
              return entry.leftX + fracInSlot * entry.slotW;
            }
          }
          bc2 = noteEnd2;
        }
        // Beat is after all notes — use raw math offset from last note's end
        const lastEntry = lineNotes.length > 0 ? (() => {
          const ln = lineNotes[lineNotes.length - 1];
          const e = beatXMap.get(Math.round(ln.beat * 10000));
          return e ? { endX: e.leftX + e.slotW, endBeat: ln.beat + ln.note.duration } : null;
        })() : null;
        if (lastEntry) {
          return lastEntry.endX + (beat - lastEntry.endBeat) * beatPx;
        }
        return MARGIN_L + (beat - lineStartBeat) * beatPx;
      };

      // ─── BAR LINES — only when voice has enough beats to complete the bar ───
      const voiceTotalBeats = voiceNotes.reduce((s, n) => s + n.duration, 0);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      for (let barBeat = beatsPerBar; barBeat <= voiceTotalBeats - 0.0001; barBeat += beatsPerBar) {
        const rb = Math.round(barBeat * 10000) / 10000;
        if (rb > lineStartBeat - 0.0001 && rb <= lineStartBeat + actualBeatsPerLine + 0.0001) {
          const x = beatToCanvasX(rb);
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(x, botY);
          ctx.stroke();
        }
      }

      for (const ln of lineNotes) {
        if (ln.beat < lineStartBeat - 0.0001) continue;
        const x = noteXMap.get(ln.idx);
        if (x === undefined) continue;

        const isHovered = ln.idx === hoveredNoteIdx;
        // In erase mode hovered note = red; slur mode = blue; normal = orange
        const noteColor = isHovered
          ? (eraseMode ? '#e55' : slurMode ? '#6eaac8' : '#e8924e')
          : voiceColor;

        if (ln.note.note === 'Rest') {
          drawRest(ctx, ln.note.duration, x, midY, noteColor);
          if (isHovered) {
            ctx.save();
            ctx.fillStyle = eraseMode ? 'rgba(220,80,80,0.1)' : 'rgba(232,146,78,0.08)';
            ctx.fillRect(x - 16, midY - 20, 32, 55);
            if (eraseMode) {
              // draw X over rest
              ctx.strokeStyle = 'rgba(220,80,80,0.7)';
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(x-8, midY-8); ctx.lineTo(x+8, midY+8); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(x+8, midY-8); ctx.lineTo(x-8, midY+8); ctx.stroke();
            }
            ctx.restore();
          }
        } else {
          const rowObj = rows.find(r => r.note === ln.note.note);
          if (!rowObj) continue;
          const y = getYFromRow(rowObj.row, staffTop);
          drawLedgerLines(ctx, x, rowObj.row, lines, getYFromRow, staffTop, noteColor);
          drawNoteHead(ctx, x, y, ln.note.duration, noteColor, isT, ln.note.type);
          if (isHovered) {
            ctx.save();
            if (eraseMode) {
              // Red X over note head
              ctx.strokeStyle = 'rgba(220,80,80,0.75)';
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(x-9, y-9); ctx.lineTo(x+9, y+9); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(x+9, y-9); ctx.lineTo(x-9, y+9); ctx.stroke();
            } else {
              ctx.strokeStyle = slurMode ? 'rgba(110,170,200,0.7)' : 'rgba(232,146,78,0.55)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.ellipse(x, y, 10, 8, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }
          // accidental
          if (ln.note.accidental === 'sharp' || ln.note.accidental === 'flat' || ln.note.accidental === 'natural') {
            const sym = { sharp:'♯', flat:'♭', natural:'♮' }[ln.note.accidental];
            ctx.save();
            ctx.fillStyle = noteColor;
            ctx.font = '13px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sym, x - 14, y);
            ctx.restore();
          }
          // slur indicator dots
          if (ln.note.type === 'slur_start' || ln.note.type === 'slur_end') {
            ctx.save();
            ctx.fillStyle = '#6eaac8';
            ctx.globalAlpha = 0.9;
            const dotY = isT ? y + 22 : y - 22;
            ctx.beginPath(); ctx.arc(x, dotY, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.font = '5.5px "Roboto Mono",monospace';
            ctx.fillStyle = '#6eaac8';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(ln.note.type === 'slur_start' ? '▶' : '◀', x, dotY + 8);
            ctx.restore();
          }
        }
      }
      // ─── SLUR ARCS ─────────────────────────────────────────────────────
      // Find all slur_start → slur_end spans on this line and draw a curved arc
      {
        // Build a map of all note positions across the whole voice (with beat tracking)
        let slurBeatCursor = 0;
        const allNoteBeats = voiceNotes.map(n => { const b = slurBeatCursor; slurBeatCursor += n.duration; return b; });

        // Find slur groups
        let i = 0;
        while (i < voiceNotes.length) {
          if (voiceNotes[i].type === 'slur_start') {
            const startIdx = i;
            let endIdx = -1;
            for (let j = i + 1; j < voiceNotes.length; j++) {
              if (voiceNotes[j].type === 'slur_end') { endIdx = j; break; }
            }
            if (endIdx === -1) { i++; continue; }

            // Check if either endpoint is on this line
            const startBeat = allNoteBeats[startIdx];
            const endBeat   = allNoteBeats[endIdx];
            const lineEnd   = lineStartBeat + actualBeatsPerLine;

            // Only draw if the slur overlaps this line
            if (endBeat >= lineStartBeat - 0.0001 && startBeat < lineEnd + 0.0001) {
              const clampedStartBeat = Math.max(startBeat, lineStartBeat);
              const clampedEndBeat   = Math.min(endBeat,   lineEnd - 0.0001);

              // Get x coords
              const sx = noteXMap.get(startIdx) ?? beatToCanvasX(clampedStartBeat);
              const ex = noteXMap.get(endIdx)   ?? beatToCanvasX(clampedEndBeat);

              // Get y coords — average row of slurred notes for arc placement
              let sumY = 0, cnt = 0;
              for (let k = startIdx; k <= endIdx; k++) {
                const rowObj = rows.find(r => r.note === voiceNotes[k].note);
                if (rowObj) { sumY += getYFromRow(rowObj.row, staffTop); cnt++; }
              }
              const avgY = cnt > 0 ? sumY / cnt : midY;
              // Arc goes below notes for treble (stems up), above for bass
              const arcDir = isT ? 1 : -1;
              const arcY = avgY + arcDir * 18;
              const cp1x = sx + (ex - sx) * 0.25;
              const cp2x = sx + (ex - sx) * 0.75;
              const cpY  = avgY + arcDir * 32;

              ctx.save();
              ctx.strokeStyle = voiceColor;
              ctx.lineWidth = 2;
              ctx.globalAlpha = 0.55;
              ctx.setLineDash([]);
              ctx.beginPath();
              ctx.moveTo(sx, avgY + arcDir * 6);
              ctx.bezierCurveTo(cp1x, cpY, cp2x, cpY, ex, avgY + arcDir * 6);
              ctx.stroke();

              // Shade the interior of the slur span
              ctx.globalAlpha = 0.06;
              ctx.fillStyle = voiceColor;
              ctx.beginPath();
              ctx.moveTo(sx, avgY + arcDir * 6);
              ctx.bezierCurveTo(cp1x, cpY, cp2x, cpY, ex, avgY + arcDir * 6);
              ctx.lineTo(ex, avgY + arcDir * 4);
              ctx.bezierCurveTo(cp2x, cpY - arcDir * 4, cp1x, cpY - arcDir * 4, sx, avgY + arcDir * 4);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
            i = endIdx + 1;
          } else {
            i++;
          }
        }
      }
    } // end for (let li...)

    if (hoverBeat && isActive) {
      const li = hoverBeat.li ?? Math.floor(hoverBeat.beat / actualBeatsPerLine);
      if (li < actualNumLines) {
        const staffTop = li * LINE_SPACING + STAFF_TOP;
        const lineStartBeat = li * actualBeatsPerLine;
        const midY = getYFromRow(lines[2], staffTop);
        const y = getYFromRow(hoverBeat.row, staffTop);

        // Rebuild layout for this line to get correct x positions (same as draw pass)
        const ghostLineNotes = [];
        let gbc = 0;
        for (let i = 0; i < voiceNotes.length; i++) {
          const note = voiceNotes[i];
          if (gbc >= lineStartBeat + actualBeatsPerLine) break;
          if (gbc + note.duration > lineStartBeat - 0.0001) {
            ghostLineNotes.push({ note, beat: gbc });
          }
          gbc += note.duration;
        }
        let gxCursor = 0;
        const ghostBeatXMap = new Map();
        for (const ln of ghostLineNotes) {
          const naturalX = (ln.beat - lineStartBeat) * beatPx;
          const slotW = Math.max(ln.note.duration * beatPx, MIN_NOTE_PX);
          const adjustedX = Math.max(naturalX, gxCursor);
          ghostBeatXMap.set(Math.round(ln.beat * 10000), { leftX: MARGIN_L + adjustedX, slotW, beat: ln.beat, dur: ln.note.duration });
          gxCursor = adjustedX + slotW;
        }

        // Convert snapped beat to canvas x — returns the CENTER x of where a note at snapBeat would be drawn
        const snapBeatToX = (snapBeat, fallbackRawX) => {
          // Find the note slot that starts at this beat
          for (const [, entry] of ghostBeatXMap) {
            if (Math.abs(snapBeat - entry.beat) < 0.0001) {
              return entry.leftX + entry.slotW / 2;
            }
          }
          // Not an existing slot — use raw cursor x if provided, else compute
          if (fallbackRawX !== undefined) return fallbackRawX;
          let lastEntry = null;
          for (const [, e] of ghostBeatXMap) lastEntry = e;
          if (lastEntry) {
            const afterX = lastEntry.leftX + lastEntry.slotW;
            const afterBeat = lastEntry.beat + lastEntry.dur;
            const newSlotW = Math.max(selDur * beatPx, MIN_NOTE_PX);
            return afterX + (snapBeat - afterBeat) * beatPx + newSlotW / 2;
          }
          const newSlotW = Math.max(selDur * beatPx, MIN_NOTE_PX);
          return MARGIN_L + (snapBeat - lineStartBeat) * beatPx + newSlotW / 2;
        };

        const ghostX = snapBeatToX(hoverBeat.beat, hoverBeat.rawX);

        // Determine if we need gap-filling rests
        const voiceEndBeat = voiceNotes.reduce((s, n) => s + n.duration, 0);
        const gapStart = voiceEndBeat;
        const gapEnd = hoverBeat.beat;

        ctx.save();
        ctx.globalAlpha = 0.32;

        // Draw ghost rests filling the gap (only if cursor is beyond voice end)
        if (gapEnd > gapStart + 0.0001) {
          const gapRests = makeRestFill(gapEnd - gapStart);
          let restBeat = gapStart;
          for (const gr of gapRests) {
            if (restBeat >= lineStartBeat && restBeat < lineStartBeat + actualBeatsPerLine) {
              const restX = snapBeatToX(restBeat, undefined);
              drawRest(ctx, gr.duration, restX, midY, voiceColor);
            }
            restBeat += gr.duration;
          }
        }

        // Draw ghost note/rest at snapped position
        const rowObj = rows.find(r => r.row === hoverBeat.row);
        if (rowObj) {
          drawLedgerLines(ctx, ghostX, hoverBeat.row, lines, getYFromRow, staffTop, voiceColor);
          drawNoteHead(ctx, ghostX, y, selDur, voiceColor, isT, selArt);
          if (selAcc !== 'regular') {
            const symbols = { sharp: '♯', flat: '♭', natural: '♮' };
            ctx.fillStyle = voiceColor;
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbols[selAcc] || '', ghostX - 14, y);
          }
        } else {
          // Off staff — show ghost rest
          drawRest(ctx, selDur, ghostX, midY, voiceColor);
        }

        ctx.restore();
      }
    }

  }, [voiceNotes, hoverBeat, hoveredNoteIdx, selDur, selArt, selAcc, isActive, eraseMode, slurMode, playingBar]);

  // ─── MOUSE ─────────────────────────────────────────────
  const getCoords = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const bpl = beatsPerLineRef.current;
    const bpx = beatPxRef.current ?? ((rect.width - MARGIN_L - MARGIN_R) / NOTES_PER_LINE);

    const li = Math.floor(y / LINE_SPACING);
    const staffTop = li * LINE_SPACING + STAFF_TOP;
    const relativeY = y - staffTop;
    const middleLine = lines[2];
    const middleY = (2 * LINE_GAP);
    const row = Math.round((relativeY - middleY) / HALF_STEP + middleLine);

    const lineStartBeat = li * bpl;

    // Build layout for this line (same as draw pass) to invert pixel->beat
    const layoutNotes = [];
    let lbc = 0;
    for (let i = 0; i < voiceNotes.length; i++) {
      const note = voiceNotes[i];
      if (lbc >= lineStartBeat + bpl) break;
      if (lbc + note.duration > lineStartBeat - 0.0001) {
        layoutNotes.push({ note, beat: lbc, idx: i });
      }
      lbc += note.duration;
    }
    let lxCursor = 0;
    const layoutSlots = []; // { leftX, slotW, beat, dur, idx }
    for (const ln of layoutNotes) {
      const naturalX = (ln.beat - lineStartBeat) * bpx;
      const slotW = Math.max(ln.note.duration * bpx, MIN_NOTE_PX);
      const adjustedX = Math.max(naturalX, lxCursor);
      layoutSlots.push({ leftX: MARGIN_L + adjustedX, slotW, beat: ln.beat, dur: ln.note.duration, idx: ln.idx });
      lxCursor = adjustedX + slotW;
    }

    // Invert: find which beat corresponds to pixel x
    let beat = lineStartBeat; // default
    let foundSlot = false;
    for (const slot of layoutSlots) {
      if (x >= slot.leftX && x < slot.leftX + slot.slotW) {
        beat = slot.beat;
        foundSlot = true;
        break;
      }
    }
    if (!foundSlot) {
      if (layoutSlots.length === 0 || x < layoutSlots[0].leftX) {
        const rawBeat = ((x - MARGIN_L) / bpx) + lineStartBeat;
        beat = Math.max(0, Math.round(rawBeat / 0.25) * 0.25);
      } else {
        const last = layoutSlots[layoutSlots.length - 1];
        const afterBeat = last.beat + last.dur;
        const afterX = last.leftX + last.slotW;
        const rawBeat = afterBeat + (x - afterX) / bpx;
        beat = Math.max(0, Math.round(rawBeat / 0.25) * 0.25);
      }
    }

    // Find which note index is hovered (by beat)
    let hni = null;
    let hbc = 0;
    for (let i = 0; i < voiceNotes.length; i++) {
      const nb = hbc + voiceNotes[i].duration;
      if (beat >= hbc - 0.0001 && beat < nb - 0.0001) { hni = i; break; }
      hbc = nb;
    }

    return { row, beat, rawX: x, li, hoveredNoteIdx: hni };
  }, [voiceNotes, lines]);

  const handleMouseMove = useCallback((e) => {
    const c = getCoords(e);
    setHoverBeat({ beat: c.beat, row: c.row, rawX: c.rawX, li: c.li });
    setHoveredNoteIdx(c.hoveredNoteIdx);
  }, [getCoords]);

  const handleMouseLeave = useCallback(() => {
    setHoverBeat(null);
    setHoveredNoteIdx(null);
  }, []);

  const handleClick = useCallback((e) => {
    if (!isActive) return;
    const c = getCoords(e);
    if (eraseMode) {
      onDeleteNote(c.hoveredNoteIdx !== null ? c.hoveredNoteIdx : null);
      return;
    }
    if (slurMode) {
      if (c.hoveredNoteIdx !== null) onSlurNote(c.hoveredNoteIdx);
      return;
    }
    // If clicking an existing note, patch its properties instead of inserting a new note
    if (c.hoveredNoteIdx !== null) {
      const patch = {};
      // Apply selected accidental if it differs from 'regular' (i.e. user explicitly picked one)
      if (selAcc !== 'regular') patch.accidental = selAcc;
      // Apply selected articulation if it's not the default 'reg'
      if (selArt !== 'reg') patch.type = selArt;
      if (Object.keys(patch).length > 0) {
        onEditNote(c.hoveredNoteIdx, patch);
        return;
      }
      // If both are defaults, fall through to normal note placement
    }
    const rowObj = rows.find(r => r.row === c.row);
    if (!rowObj) return;
    onAddNote({
      note: rowObj.note,
      duration: selDur,
      type: selArt,
      accidental: selAcc,
      targetBeat: c.beat
    });
  }, [isActive, eraseMode, slurMode, getCoords, rows, selDur, selArt, selAcc, onAddNote, onDeleteNote, onSlurNote, onEditNote]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (!isActive) return;
    const c = getCoords(e);
    // Right-click always adds a rest at the clicked beat
    onAddRest(c.beat);
  }, [isActive, getCoords, onAddRest]);

  return (
    <div ref={wrapRef} style={{ width: '100%', opacity: isActive ? 1 : 0.7 }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        style={{ cursor: isActive ? (eraseMode ? 'cell' : slurMode ? 'crosshair' : 'none') : 'default', display: 'block' }}
      />
    </div>
  );
}
// ─── NOTE LIST ────────────────────────────────────────────────────────────────
function NoteList({ voices, clef, onDelete }) {
  const colors = clef === 'treble' ? TREBLE_COLORS : BASS_COLORS;
  const has    = voices.some(v => v.length > 0);
  if (!has) return (
    <p style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.67rem', color:'#aaa9a0', textAlign:'center', padding:'1rem 0' }}>
      click the staff to add notes
    </p>
  );
  return (
    <div>
      {voices.map((arr, vi) => arr.length > 0 && (
        <div key={vi} style={{ marginBottom:'0.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0.3rem 0.75rem', borderBottom:'1px solid rgba(0,0,0,0.07)', background:'rgba(0,0,0,0.03)' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:colors[vi] }} />
            <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.57rem', color:colors[vi], letterSpacing:'0.1em' }}>VOICE {vi+1}</span>
            <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.55rem', color:'#999', marginLeft:'auto' }}>{arr.length} events</span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', padding:'0.4rem 0.5rem' }}>
            {arr.map((n, ni) => {
              let acc = '';
if (n.accidental === 'sharp') acc = '♯';
else if (n.accidental === 'flat') acc = '♭';
else if (n.accidental === 'natural') acc = '♮';
              const isAuto = n.autoRest;
              return (
                <div key={ni} style={{ display:'flex', flexDirection:'column', alignItems:'center',
                  background: isAuto ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.04)',
                  border:`1px solid ${isAuto ? 'rgba(0,0,0,0.08)' : colors[vi]+'33'}`,
                  borderRadius:5, padding:'4px 6px', minWidth:44, opacity: isAuto ? 0.55 : 1 }}>
                  <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.6rem', color:'#aaa', marginBottom:1 }}>{ni+1}</span>
                  <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.76rem', fontWeight:700, color: isAuto ? '#aaa' : colors[vi] }}>{n.note}{acc}</span>
                  <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.55rem', color:'#999' }}>{n.duration}b</span>
                  <button onClick={() => onDelete(vi, ni)}
                    style={{ marginTop:3, background:'none', border:'1px solid #e0a0a0', color:'#c86e6e', cursor:'pointer', borderRadius:3, fontFamily:'"Roboto Mono",monospace', fontSize:'0.55rem', padding:'1px 5px', opacity:0.7 }}
                    onMouseEnter={e => e.target.style.opacity=1}
                    onMouseLeave={e => e.target.style.opacity=0.7}
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── HEADER GENERATOR ─────────────────────────────────────────────────────────
function generateHeader(title, tempo, treble, bass) {
  const NAMES = { treble:['MELODY1_JSON','MELODY2_JSON','MELODY3_JSON'], bass:['BASS1_JSON','BASS2_JSON','BASS3_JSON'] };
  const fmtNote = n => {
    if (n.note === 'Rest') return 'Rest';
    const acc = n.accidental === 'sharp' ? '#' : n.accidental === 'flat' ? 'b' : '';
    return n.note[0] + acc + n.note.slice(1);
  };
  // Normalize type: lega→legato for ESP32 compatibility
  const fmtType = t => t === 'lega' ? 'legato' : t;
  const out = ['#pragma once', `// Generated by Buzzer Composer — ${new Date().toISOString()}`, `// Song: ${title}  |  Tempo: ${tempo} BPM`, ''];
  [['treble',treble],['bass',bass]].forEach(([clef,vs]) => {
    vs.forEach((arr,vi) => {
      if (!arr.length) return;
      const obj = { title:`${title} - ${clef[0].toUpperCase()+clef.slice(1)} V${vi+1}`, tempo, notes:arr.map(n=>({note:fmtNote(n),duration:n.duration,type:fmtType(n.type)})) };
      out.push(`const char *${NAMES[clef][vi]} = R"(${JSON.stringify(obj,null,4)})";`);
      out.push('');
    });
  });
  out.push('// Usage: deserializeJson(docs[0], MELODY1_JSON); ... up to MELODY3_JSON, BASS1_JSON–BASS3_JSON');
  return out.join('\n');
}

// ─── SMALL UI PIECES ─────────────────────────────────────────────────────────
const M = { fontFamily:'"Roboto Mono",monospace' };
const S = { fontFamily:'"PT Sans",sans-serif' };

function Btn({ children, onClick, primary, success, danger, small }) {
  const base = { ...M, fontSize:small?'0.63rem':'0.69rem', padding:small?'0.25rem 0.6rem':'0.38rem 0.82rem', borderRadius:4, cursor:'pointer', border:'1px solid', display:'inline-flex', alignItems:'center', gap:4, background:'transparent', letterSpacing:'0.03em' };
  const v = primary ? { background:'#c8804e', borderColor:'#c8804e', color:'#fff', fontWeight:700 }
          : success  ? { borderColor:'#4e9e6a', color:'#4e9e6a' }
          : danger   ? { borderColor:'#c86e6e', color:'#c86e6e' }
          :            { borderColor:'rgba(0,0,0,0.18)', color:'#666' };
  return <button onClick={onClick} style={{ ...base, ...v }}>{children}</button>;
}

function SectionLabel({ children }) {
  return (
    <div style={{ ...M, fontSize:'0.6rem', color:'#888', letterSpacing:'0.12em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:6, marginBottom:'0.5rem' }}>
      <span style={{ width:3, height:3, background:'#c8804e', borderRadius:'50%', flexShrink:0 }} />
      {children}
    </div>
  );
}

function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{ ...M, fontSize:'0.62rem', padding:'0.22rem 0.52rem', borderRadius:3,
            border:`1px solid ${value===o.value?'#c8804e':'rgba(0,0,0,0.14)'}`,
            background:value===o.value?'rgba(200,128,78,0.12)':'transparent',
            color:value===o.value?'#c8804e':'#888', cursor:'pointer', transition:'all .15s' }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}


// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
const BuzzerComposerPage = ({ setCurrentPage }) => {
  const [title,   setTitle]   = useState('My Song');
  const [tempo,   setTempo]   = useState(120);
  const [selKey,  setSelKey]  = useState('C maj / A min');
  const [timeSig, setTimeSig] = useState('4/4');
  const [selDur,  setSelDur]  = useState(1.0);
  const [selArt,  setSelArt]  = useState('reg');
  const [selAcc,  setSelAcc]  = useState('regular');

  const [treble,       setTreble]       = useState([[], [], []]);
  const [bass,         setBass]         = useState([[], [], []]);
  const [activeTreble, setActiveTreble] = useState(0);
  const [activeBass,   setActiveBass]   = useState(0);
  // 'treble' | 'bass' — which clef is focused for keyboard voice switching
  const [activeClef,   setActiveClef]   = useState('treble');

  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const [playingBar, setPlayingBar] = useState(null);
  const [eraseMode, setEraseMode] = useState(false);
  const [slurMode, setSlurMode] = useState(false);

  const [xApiKey, setXApiKey] = useState('');
  const [tunnelUrl, setTunnelUrl] = useState('');

  // Shared ref so all voice canvases can draw bar lines at same positions
  const totalBeatsRef = useRef(4);

  const showToast = (msg, type='ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('xApiKey');
    const savedUrl = localStorage.getItem('tunnelUrl');
    if (savedKey) setXApiKey(savedKey);
    if (savedUrl) setTunnelUrl(savedUrl);
  }, []);

  useEffect(() => {
    localStorage.setItem('xApiKey', xApiKey);
    localStorage.setItem('tunnelUrl', tunnelUrl);
  }, [xApiKey, tunnelUrl]);

  // Update totalBeatsRef whenever notes change
  useEffect(() => {
    const all = [...treble, ...bass];
    totalBeatsRef.current = Math.max(...all.map(v => v.reduce((s,n)=>s+n.duration,0)), 4);
  }, [treble, bass]);

  // ─── KEYBOARD BINDINGS ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        // Duration: 1=16th 2=8th 3=8th· 4=qtr 5=qtr· 6=half 7=hlf· 8=whole
        case '1': setSelDur(0.25); showToast('16th note'); break;
        case '2': setSelDur(0.5);  showToast('8th note'); break;
        case '3': setSelDur(0.75); showToast('8th dotted'); break;
        case '4': setSelDur(1.0);  showToast('Quarter note'); break;
        case '5': setSelDur(1.5);  showToast('Quarter dotted'); break;
        case '6': setSelDur(2.0);  showToast('Half note'); break;
        case '7': setSelDur(3.0);  showToast('Half dotted'); break;
        case '8': setSelDur(4.0);  showToast('Whole note'); break;

        // Accidentals: n=natural, s=sharp, f=flat, r=regular
        case 'n': setSelAcc('natural'); showToast('♮ Natural'); break;
        case 's': setSelAcc('sharp');   showToast('♯ Sharp'); break;
        case 'f': setSelAcc('flat');    showToast('♭ Flat'); break;
        case 'r': setSelAcc('regular'); showToast('Regular (key sig)'); break;

        // Articulations: q=regular, w=staccato, e=legato
        case 'q': setSelArt('reg');       showToast('Articulation: Regular'); break;
        case 'w': setSelArt('stac');      showToast('Articulation: Staccato'); break;
        case 'e': setSelArt('legato');    showToast('Articulation: Legato'); break;
        case 'g': setSelArt('grace');     showToast('Articulation: Grace'); break;
        case 'o': setSelArt('roll');      showToast('Articulation: Roll'); break;

        // Active clef: t=treble, b=bass
        case 't': setActiveClef('treble'); showToast('Treble clef active'); break;
        case 'b': setActiveClef('bass');   showToast('Bass clef active'); break;

        // Voice select within active clef: [ ] \ for V1 V2 V3
        case '[':
          if (activeClef==='treble') setActiveTreble(0);
          else setActiveBass(0);
          showToast(`${activeClef} V1`); break;
        case ']':
          if (activeClef==='treble') setActiveTreble(1);
          else setActiveBass(1);
          showToast(`${activeClef} V2`); break;
        case '\\':
          if (activeClef==='treble') setActiveTreble(2);
          else setActiveBass(2);
          showToast(`${activeClef} V3`); break;

        // + Rest: add rest with current duration to active voice
        case 'x':
          if (activeClef==='treble') addRestManual('treble', activeTreble, selDur);
          else addRestManual('bass', activeBass, selDur);
          break;

        // Erase mode toggle: `d`
        case 'd':
          setEraseMode(p => {
            const next = !p;
            if (next) setSlurMode(false);
            showToast(next ? '✕ Erase mode on' : 'Erase off');
            return next;
          });
          break;

        // Slur mode toggle: `z`
        case 'z':
          setSlurMode(p => {
            const next = !p;
            if (next) setEraseMode(false);
            showToast(next ? '⌒ Slur mode on — click notes' : 'Slur mode off');
            return next;
          });
          break;

        // Delete hovered note: Delete or Backspace = delete last in active voice
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (activeClef==='treble') deleteLast('treble', activeTreble, null);
          else deleteLast('bass', activeBass, null);
          showToast('Deleted last note');
          break;

        // Space = play
        case ' ':
          e.preventDefault();
          handlePlayRef.current?.();
          break;

        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selDur, selAcc, selArt, activeClef, activeTreble, activeBass, eraseMode, slurMode]);

  // Scroll wheel + Shift cycles through durations; plain scroll = normal page scroll
  useEffect(() => {
    const durValues = DURATIONS.map(d => d.value);
    const wheelHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (!e.shiftKey) return; // let normal scroll through
      e.preventDefault();
      setSelDur(prev => {
        const idx = durValues.indexOf(prev);
        const next = e.deltaY > 0
          ? durValues[Math.max(idx - 1, 0)]
          : durValues[Math.min(idx + 1, durValues.length - 1)];
        showToast(DURATIONS.find(d => d.value === next)?.label ?? '');
        return next;
      });
    };
    window.addEventListener('wheel', wheelHandler, { passive: false });
    return () => window.removeEventListener('wheel', wheelHandler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importRef = useRef(null);

  const downloadFile = (content, filename, type='text/plain') => {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.title) setTitle(data.title);
        if (data.tempo) setTempo(Number(data.tempo));
        if (Array.isArray(data.treble)) {
          // Validate and normalise each voice
          const t = data.treble.map(v =>
            Array.isArray(v) ? v.map(n => ({
              note: n.note ?? 'Rest',
              duration: Number(n.duration) || 1,
              type: n.type ?? 'reg',
              accidental: n.accidental ?? 'natural',
            })) : []
          );
          while (t.length < 3) t.push([]);
          setTreble(t.slice(0, 3));
        }
        if (Array.isArray(data.bass)) {
          const b = data.bass.map(v =>
            Array.isArray(v) ? v.map(n => ({
              note: n.note ?? 'Rest',
              duration: Number(n.duration) || 1,
              type: n.type ?? 'reg',
              accidental: n.accidental ?? 'natural',
            })) : []
          );
          while (b.length < 3) b.push([]);
          setBass(b.slice(0, 3));
        }
        showToast(`Imported "${data.title || file.name}"`);
      } catch {
        showToast('Invalid JSON file', 'err');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so same file can be re-imported
  };

  function scheduleNote(audioCtx, freq, startT, playDur, totalDur, waveform = 'square', gainPeak = 0.45) {
    if (!freq || playDur <= 0) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = waveform;
    osc.frequency.setValueAtTime(freq, startT);
    gain.gain.setValueAtTime(0.001, startT);
    gain.gain.exponentialRampToValueAtTime(gainPeak, startT + Math.min(0.012, playDur * 0.1));
    gain.gain.exponentialRampToValueAtTime(0.001, startT + playDur - 0.005);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startT);
    osc.stop(startT + playDur);
  }

  function playVoice(voice, audioCtx, keySig, rollStaggerSec = 0) {
    const beatMs  = 60000 / tempo;
    const GRACE_S = 0.085; // matches ESP32 GRACE_MS = 85
    let t = audioCtx.currentTime + rollStaggerSec;
    let graceDebt = 0; // seconds already consumed by preceding grace note
    let inSlur = false;

    for (let i = 0; i < voice.length; i++) {
      const note   = voice[i];
      const type   = note.type || 'reg';
      const totalS = Math.max((note.duration * beatMs) / 1000 - graceDebt, 0.01);
      graceDebt = 0;

      if (type === 'grace') {
        // Grace: play for GRACE_S, steal that time from next note
        const freq = getFrequency(note, keySig);
        if (freq && note.note !== 'Rest') scheduleNote(audioCtx, freq, t, GRACE_S * 0.9, GRACE_S, 'square', 0.3);
        t += GRACE_S;
        graceDebt = GRACE_S;
        continue;
      }

      // Slur tracking
      if (type === 'slur_start') inSlur = true;

      const freq = getFrequency(note, keySig);

      // Compute playDur based on articulation
      let playDur;
      if (type === 'stac')                   playDur = totalS * 0.5;
      else if (type === 'legato')            playDur = totalS;
      else if (inSlur)                       playDur = totalS; // no gap inside slur
      else if (type === 'roll')              playDur = totalS * 0.92;
      else                                   playDur = totalS * 0.8; // reg

      if (type === 'slur_end') inSlur = false;

      if (note.note !== 'Rest' && freq) {
        scheduleNote(audioCtx, freq, t, playDur, totalS);
      }

      t += totalS;
    }
  }

  const handlePlayRef = useRef(null);

  const handlePlay = async () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();    const beatMs = 60000 / tempo;
    const beatsPerBar = timeSig === '3/4' ? 3 : 4;
    const allVoices = [...treble, ...bass];
    const totalBeats = Math.max(...allVoices.map(v => v.reduce((s,n)=>s+n.duration,0)), beatsPerBar);
    const totalBars = Math.ceil(totalBeats / beatsPerBar);

    setPlayingBar(0);
    for (let bar = 0; bar < totalBars; bar++) {
      setTimeout(() => setPlayingBar(bar), bar * beatsPerBar * beatMs);
    }
    setTimeout(() => setPlayingBar(null), totalBars * beatsPerBar * beatMs);

    // Roll stagger: ESP32 plays bass→treble with 25ms between each channel.
    // Voices order: [treble0, treble1, treble2, bass0, bass1, bass2]
    // Roll order bass→treble: bass2, bass1, bass0, treble2, treble1, treble0
    const ROLL_STEP_S = 0.025;
    const rollOrder = [5, 4, 3, 2, 1, 0]; // indices into allVoices
    allVoices.forEach((v, vi) => {
      const rollPos = rollOrder.indexOf(vi);
      const stagger = rollPos >= 0 ? rollPos * ROLL_STEP_S : 0;
      playVoice(v, audioCtx, keySig, stagger);
    });
  };
  handlePlayRef.current = handlePlay;

  const handleUpload = async () => {
    try {
      if (!tunnelUrl || !xApiKey) { alert('Missing tunnel URL or API key'); return; }

      // Normalize note data for ESP32 consumption:
      //   - accidental "regular" → "" (ESP32 convertChannel checks for "sharp"/"flat" only)
      //   - type "lega" → "legato" (legacy value guard)
      const normalizeVoice = voice => voice.map(n => ({
        ...n,
        accidental: n.accidental === 'regular' ? '' : n.accidental,
        type: n.type === 'lega' ? 'legato' : n.type,
      }));
      const normalizeClef = voices => voices.map(normalizeVoice);

      const res = await fetch(`${tunnelUrl}/upload`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key': xApiKey },
        body: JSON.stringify({ tempo, treble: normalizeClef(treble), bass: normalizeClef(bass) }),
      });
      if (!res.ok) { alert('❌ Upload failed: ' + res.status); return; }
      alert('✅ Sent to ESP32!');
    } catch { alert('❌ Network error'); }
  };

  const keySig = KEY_SIGNATURES[selKey] || { sharps:[], flats:[] };

  const addNote = useCallback((clef, vi, nd) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => {
      const next = prev.map(v => [...v]);
      const voice = next[vi];
      const newNote = { note: nd.note, duration: nd.duration, type: nd.type, accidental: nd.accidental };
      let beatCursor = 0;
      const newVoice = [];
      let inserted = false;
      for (let note of voice) {
        if (!inserted && nd.targetBeat < beatCursor + note.duration - 0.0001) {
          const gap = Math.round((nd.targetBeat - beatCursor) * 10000) / 10000;
          if (gap >= nd.duration - 0.0001) {
            newVoice.push(...makeRestFillWithDuration(gap, nd.duration));
          }
          newVoice.push(newNote);
          inserted = true;
        }
        newVoice.push(note);
        beatCursor += note.duration;
      }
      if (!inserted) {
        if (nd.targetBeat > beatCursor + 0.0001) {
          newVoice.push(...makeRestFill(nd.targetBeat - beatCursor));
        }
        newVoice.push(newNote);
      }
      next[vi] = newVoice;
      return next;
    });
  }, []);

  const addRestManual = useCallback((clef, vi, dur) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => {
      const next = prev.map(v => [...v]);
      next[vi] = [...next[vi], { note:'Rest', duration:dur, type:'reg', accidental:'natural' }];
      return next;
    });
    showToast(`+ Rest (${DURATIONS.find(d=>d.value===dur)?.label||dur}) → ${clef} V${vi+1}`);
  }, []);

  // Add a rest at a specific beat position (right-click behavior)
  const addRestAtBeat = useCallback((clef, vi, dur, targetBeat) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => {
      const next = prev.map(v => [...v]);
      const voice = next[vi];
      const restNote = { note:'Rest', duration:dur, type:'reg', accidental:'natural' };
      let beatCursor = 0;
      const newVoice = [];
      let inserted = false;
      for (let note of voice) {
        if (!inserted && targetBeat < beatCursor + note.duration - 0.0001) {
          const gap = Math.round((targetBeat - beatCursor) * 10000) / 10000;
          if (gap >= dur - 0.0001) {
            newVoice.push(...makeRestFillWithDuration(gap, dur));
          }
          newVoice.push(restNote);
          inserted = true;
        }
        newVoice.push(note);
        beatCursor += note.duration;
      }
      if (!inserted) {
        if (targetBeat > beatCursor + 0.0001) {
          newVoice.push(...makeRestFill(targetBeat - beatCursor));
        }
        newVoice.push(restNote);
      }
      next[vi] = newVoice;
      return next;
    });
  }, []);

  const deleteLast = useCallback((clef, vi, idx) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => {
      const n = prev.map(v => [...v]);
      if (!n[vi].length) return n;
      if (idx !== null && idx >= 0 && idx < n[vi].length) {
        n[vi] = n[vi].filter((_, i) => i !== idx);
      } else {
        n[vi] = n[vi].slice(0, -1);
      }
      return n;
    });
  }, []);

  const deleteExact = (clef, vi, ni) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => { const n=prev.map(v=>[...v]); n[vi]=n[vi].filter((_,i)=>i!==ni); return n; });
  };

  // Cycle a note's slur state when in slur mode:
  //   reg/stac/legato → slur_start → (middle notes stay as-is, auto-detected) → slur_end → reg
  // More specifically: clicking in slur mode toggles slur_start/slur_end on individual notes.
  // The canvas draws an arc from the nearest slur_start to matching slur_end automatically.
  const slurNote = useCallback((clef, vi, idx) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => {
      const next = prev.map(v => [...v]);
      const note = { ...next[vi][idx] };
      // Cycle: reg → slur_start → slur_end → reg
      if (note.type === 'slur_start') note.type = 'slur_end';
      else if (note.type === 'slur_end') note.type = 'reg';
      else note.type = 'slur_start';
      next[vi][idx] = note;
      showToast(`Note ${idx+1}: ${note.type}`);
      return next;
    });
  }, []);

  // Patch specific properties of an existing note in-place
  const editNote = useCallback((clef, vi, idx, patch) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => {
      const next = prev.map(v => [...v]);
      next[vi][idx] = { ...next[vi][idx], ...patch };
      const parts = Object.entries(patch).map(([k,v]) => `${k}: ${v}`).join(', ');
      showToast(`Note ${idx+1} → ${parts}`);
      return next;
    });
  }, []);

  const clearAll = () => {
    if (!confirm('Clear all notes?')) return;
    setTreble([[], [], []]); setBass([[], [], []]);
    showToast('Cleared', 'err');
  };

  const generated = generateHeader(title, tempo, treble, bass);
  const downloadHeader = () => {
    const fname = title.toLowerCase().replace(/[^a-z0-9]/g,'_') + '.h';
    downloadFile(generated, fname);
    showToast(`Downloaded ${fname}`);
  };

  const bg       = '#f5f4f0';
  const surface  = '#ffffff';
  const border   = 'rgba(0,0,0,0.1)';
  const textMain = '#2a2825';
  const textMuted= '#888';
  const accent   = '#c8804e';

  return (
    <div style={{ background:bg, minHeight:'100vh', color:textMain }}>

      <header style={{ borderBottom:`1px solid ${border}`, padding:'1rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'rgba(245,244,240,0.96)', backdropFilter:'blur(14px)', zIndex:100 }}>
        <button onClick={() => { window.scrollTo({top:0}); setCurrentPage && setCurrentPage('home'); }}
          style={{ ...M, display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem', color:textMuted, background:'none', border:'none', cursor:'pointer', letterSpacing:'0.05em' }}
          onMouseEnter={e=>e.currentTarget.style.color=accent}
          onMouseLeave={e=>e.currentTarget.style.color=textMuted}
        >
          <ArrowLeft size={13}/> back
        </button>
        <span style={{ ...M, fontSize:'0.72rem', color:accent, letterSpacing:'0.12em', opacity:0.9 }}>BUZZER_COMPOSER</span>
        <span style={{ ...M, fontSize:'0.62rem', color:textMuted }}>6-ch ESP32</span>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 1.5rem 5rem' }}>

        <div style={{ padding:'2.5rem 0 1.75rem', borderBottom:`1px solid ${border}`, marginBottom:'1.5rem' }}>
          <div style={{ ...M, fontSize:'0.6rem', color:accent, letterSpacing:'0.2em', marginBottom:'0.5rem' }}>// project / esp32-music</div>
          <h1 style={{ ...S, fontSize:'clamp(1.5rem,4vw,2.2rem)', fontWeight:700, lineHeight:1.1, marginBottom:'0.55rem' }}>
            Buzzer <span style={{ color:accent }}>Composer</span>
          </h1>
          <p style={{ ...M, fontSize:'0.75rem', color:textMuted, lineHeight:1.75, maxWidth:560 }}>
            Click the staff to place notes · right-click = delete hovered note · Space = play
          </p>
        </div>

        {/* SETTINGS */}
        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:8, padding:'1rem 1.2rem', marginBottom:'1rem' }}>
          <SectionLabel>Song Settings</SectionLabel>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>TITLE</span>
              <input value={title} onChange={e=>setTitle(e.target.value)}
                style={{ ...M, fontSize:'0.72rem', background:'#f5f4f0', border:`1px solid ${border}`, color:textMain, padding:'0.32rem 0.55rem', borderRadius:4, width:140, outline:'none' }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>TEMPO</span>
              <input type="number" value={tempo} min={40} max={300} onChange={e=>setTempo(Number(e.target.value))}
                style={{ ...M, fontSize:'0.72rem', background:'#f5f4f0', border:`1px solid ${border}`, color:textMain, padding:'0.32rem 0.55rem', borderRadius:4, width:60, outline:'none' }} />
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>BPM</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>KEY</span>
              <select value={selKey} onChange={e=>setSelKey(e.target.value)}
                style={{ ...M, fontSize:'0.7rem', background:'#f5f4f0', border:`1px solid ${border}`, color:textMain, padding:'0.32rem 0.55rem', borderRadius:4, outline:'none', cursor:'pointer' }}>
                {Object.keys(KEY_SIGNATURES).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>TIME</span>
              <ToggleGroup options={TIME_SIGS} value={timeSig} onChange={setTimeSig} />
            </div>
            <div style={{ marginLeft:'auto' }}>
              <Btn danger onClick={clearAll}><Trash2 size={11}/> Clear all</Btn>
            </div>
          </div>
        </div>

        {/* NOTE PROPERTIES */}
        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:8, padding:'1rem 1.2rem', marginBottom:'1rem' }}>
          <SectionLabel>Note Properties <span style={{ color:textMuted, fontWeight:400, fontSize:'0.5rem', letterSpacing:'0.05em', textTransform:'none' }}>(Shift+scroll to change duration)</span></SectionLabel>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>DUR</span>
              <ToggleGroup options={DURATIONS} value={selDur} onChange={v=>setSelDur(Number(v))} />
            </div>
            <div style={{ width:1, height:20, background:border }} />
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>ACC</span>
              <ToggleGroup options={ACCIDENTALS} value={selAcc} onChange={setSelAcc} />
            </div>
            <div style={{ width:1, height:20, background:border }} />
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>ART</span>
              <ToggleGroup options={ARTICULATIONS} value={selArt} onChange={setSelArt} />
            </div>
          </div>

          {/* Mode buttons row */}
          <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>MODES</span>
            {/* Erase toggle */}
            <button onClick={() => { setEraseMode(p => !p); if (slurMode) setSlurMode(false); }}
              style={{ ...M, fontSize:'0.65rem', padding:'0.28rem 0.8rem', borderRadius:4, cursor:'pointer',
                border:`1px solid ${eraseMode ? '#c86e6e' : 'rgba(0,0,0,0.15)'}`,
                background: eraseMode ? 'rgba(200,110,110,0.13)' : 'transparent',
                color: eraseMode ? '#c86e6e' : '#888', transition:'all .15s', fontWeight: eraseMode ? 700 : 400,
                display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:'0.8rem' }}>✕</span> Erase {eraseMode ? 'ON' : 'OFF'}
            </button>
            {/* Slur toggle */}
            <button onClick={() => { setSlurMode(p => !p); if (eraseMode) setEraseMode(false); }}
              style={{ ...M, fontSize:'0.65rem', padding:'0.28rem 0.8rem', borderRadius:4, cursor:'pointer',
                border:`1px solid ${slurMode ? '#6eaac8' : 'rgba(0,0,0,0.15)'}`,
                background: slurMode ? 'rgba(110,170,200,0.13)' : 'transparent',
                color: slurMode ? '#6eaac8' : '#888', transition:'all .15s', fontWeight: slurMode ? 700 : 400,
                display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:'1rem', lineHeight:1 }}>⌒</span> Slur {slurMode ? 'ON — click notes to set slur_start / slur_end' : 'OFF'}
            </button>
            {slurMode && (
              <span style={{ ...M, fontSize:'0.58rem', color:'#6eaac8', fontStyle:'italic' }}>
                click a note once → slur_start · again → slur_end · again → clear
              </span>
            )}
          </div>
        </div>

        {/* KEYBOARD SHORTCUT LEGEND */}
        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:8, padding:'0.75rem 1.2rem', marginBottom:'1.5rem' }}>
          <SectionLabel>Keyboard Shortcuts</SectionLabel>
          <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
            {[
              ['1–8', 'Duration (16th → whole)'],
              ['Shift+scroll', 'Duration ↕'],
              ['r/n/s/f', 'Accidental (reg/nat/sharp/flat)'],
              ['q/w/e', 'Art: reg / stac / legato'],
              ['g / o', 'Art: grace / roll'],
              ['t / b', 'Focus treble / bass'],
              ['[ ] \\', 'Voice 1 / 2 / 3'],
              ['x', '+ Rest'],
              ['d', 'Toggle erase mode'],
              ['z', 'Toggle slur mode'],
              ['Del / ⌫', 'Delete last note'],
              ['Space', 'Play'],
            ].map(([k, desc]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ ...M, fontSize:'0.6rem', background:'#f5f4f0', border:`1px solid ${border}`, borderRadius:3, padding:'0.15rem 0.4rem', color:accent, fontWeight:700 }}>{k}</span>
                <span style={{ ...M, fontSize:'0.58rem', color:textMuted }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TREBLE — one canvas per voice */}
        <div style={{ marginBottom:'2rem' }}>
          <SectionLabel>Treble Clef</SectionLabel>
          {treble.map((voice, vi) => (
            <div key={vi} style={{ marginBottom:'0.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.25rem' }}>
                <button onClick={() => { setActiveTreble(vi); setActiveClef('treble'); }}
                  style={{ ...M, fontSize:'0.6rem', padding:'0.2rem 0.6rem', borderRadius:3,
                    border:`1px solid ${vi===activeTreble && activeClef==='treble' ? TREBLE_COLORS[vi] : 'rgba(0,0,0,0.14)'}`,
                    background: vi===activeTreble && activeClef==='treble' ? TREBLE_COLORS[vi]+'22' : 'transparent',
                    color: vi===activeTreble && activeClef==='treble' ? TREBLE_COLORS[vi] : '#888',
                    cursor:'pointer', transition:'all .15s' }}>
                  V{vi+1} {voice.length ? `(${voice.length})` : '(empty)'}
                </button>
                <Btn small onClick={() => addRestManual('treble', vi, selDur)}>+ Rest</Btn>
                <span style={{ ...M, fontSize:'0.55rem', color:textMuted }}>
                  {vi===activeTreble && activeClef==='treble' ? '← active (click staff to add notes)' : 'click label to activate'}
                </span>
              </div>
              <StaffCanvas
                clef="treble"
                voiceNotes={voice}
                voiceColor={TREBLE_COLORS[vi]}
                voiceIdx={vi}
                isActive={vi===activeTreble && activeClef==='treble'}
                eraseMode={eraseMode}
                slurMode={slurMode}
                selDur={selDur} selArt={selArt} selAcc={selAcc} keySig={keySig} timeSig={timeSig}
                onAddNote={nd => { setActiveClef('treble'); setActiveTreble(vi); addNote('treble', vi, nd); }}
                onAddRest={beat => { setActiveClef('treble'); setActiveTreble(vi); addRestAtBeat('treble', vi, selDur, beat); }}
                onDeleteNote={idx => deleteLast('treble', vi, idx)}
                onSlurNote={idx => slurNote('treble', vi, idx)}
                onEditNote={(idx, patch) => editNote('treble', vi, idx, patch)}
                playingBar={playingBar}
                totalBeatsRef={totalBeatsRef}
              />
            </div>
          ))}
        </div>

        {/* BASS — one canvas per voice */}
        <div style={{ marginBottom:'2rem' }}>
          <SectionLabel>Bass Clef</SectionLabel>
          {bass.map((voice, vi) => (
            <div key={vi} style={{ marginBottom:'0.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.25rem' }}>
                <button onClick={() => { setActiveBass(vi); setActiveClef('bass'); }}
                  style={{ ...M, fontSize:'0.6rem', padding:'0.2rem 0.6rem', borderRadius:3,
                    border:`1px solid ${vi===activeBass && activeClef==='bass' ? BASS_COLORS[vi] : 'rgba(0,0,0,0.14)'}`,
                    background: vi===activeBass && activeClef==='bass' ? BASS_COLORS[vi]+'22' : 'transparent',
                    color: vi===activeBass && activeClef==='bass' ? BASS_COLORS[vi] : '#888',
                    cursor:'pointer', transition:'all .15s' }}>
                  V{vi+1} {voice.length ? `(${voice.length})` : '(empty)'}
                </button>
                <Btn small onClick={() => addRestManual('bass', vi, selDur)}>+ Rest</Btn>
                <span style={{ ...M, fontSize:'0.55rem', color:textMuted }}>
                  {vi===activeBass && activeClef==='bass' ? '← active (click staff to add notes)' : 'click label to activate'}
                </span>
              </div>
              <StaffCanvas
                clef="bass"
                voiceNotes={voice}
                voiceColor={BASS_COLORS[vi]}
                voiceIdx={vi}
                isActive={vi===activeBass && activeClef==='bass'}
                eraseMode={eraseMode}
                slurMode={slurMode}
                selDur={selDur} selArt={selArt} selAcc={selAcc} keySig={keySig} timeSig={timeSig}
                onAddNote={nd => { setActiveClef('bass'); setActiveBass(vi); addNote('bass', vi, nd); }}
                onAddRest={beat => { setActiveClef('bass'); setActiveBass(vi); addRestAtBeat('bass', vi, selDur, beat); }}
                onDeleteNote={idx => deleteLast('bass', vi, idx)}
                onSlurNote={idx => slurNote('bass', vi, idx)}
                onEditNote={(idx, patch) => editNote('bass', vi, idx, patch)}
                playingBar={playingBar}
                totalBeatsRef={totalBeatsRef}
              />
            </div>
          ))}
        </div>

        {/* NOTE LISTS */}
        <div style={{ marginBottom:'2rem' }}>
          <SectionLabel>Note Lists</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            {[['treble',treble,TREBLE_COLORS],['bass',bass,BASS_COLORS]].map(([clef,vs,clrs]) => (
              <div key={clef} style={{ background:surface, border:`1px solid ${border}`, borderRadius:6, overflow:'hidden' }}>
                <div style={{ padding:'0.4rem 0.75rem', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ ...M, fontSize:'0.58rem', color:clrs[0], letterSpacing:'0.1em' }}>{clef.toUpperCase()} NOTES</span>
                  <span style={{ ...M, fontSize:'0.55rem', color:textMuted, marginLeft:'auto' }}>{vs.reduce((s,v)=>s+v.length,0)} total</span>
                </div>
                <NoteList voices={vs} clef={clef} onDelete={(vi,ni)=>deleteExact(clef,vi,ni)} />
              </div>
            ))}
          </div>
        </div>

        {/* EXPORT */}
        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:8, padding:'1.2rem', marginBottom:'2rem' }}>
          <SectionLabel>Export & Deploy</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', marginBottom:'0.8rem' }}>
            <input placeholder="Cloudflare Tunnel URL (https://...)" value={tunnelUrl} onChange={e=>setTunnelUrl(e.target.value)}
              style={{ ...M, fontSize:'0.65rem', padding:'0.35rem 0.5rem', borderRadius:4, border:`1px solid ${border}`, background:'#f5f4f0' }} />
            <input placeholder="X-API Key" value={xApiKey} onChange={e=>setXApiKey(e.target.value)}
              style={{ ...M, fontSize:'0.65rem', padding:'0.35rem 0.5rem', borderRadius:4, border:`1px solid ${border}`, background:'#f5f4f0' }} />
          </div>
          <input ref={importRef} type="file" accept=".json,application/json" style={{ display:'none' }} onChange={handleImportJSON} />
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <Btn onClick={() => importRef.current?.click()}>📂 Import JSON</Btn>
            <Btn onClick={handleUpload}>📡 Upload to ESP</Btn>
            <Btn success onClick={downloadHeader}><Download size={11}/> Download .h</Btn>
            <Btn onClick={() => downloadFile(generateHeader(title,tempo,treble,bass), `${title}.h`)}>📥 Export .h</Btn>
            <Btn onClick={() => downloadFile(JSON.stringify({title,tempo,treble,bass},null,2), `${title}.json`, 'application/json')}>📥 Export JSON</Btn>
            <Btn onClick={() => setShowPreview(p => !p)}>{'{ }'} Preview</Btn>
            <Btn primary onClick={handlePlay}>▶ Play</Btn>
          </div>
          {showPreview && (
            <pre style={{ ...M, fontSize:'0.6rem', color:textMuted, background:'#f5f4f0', border:`1px solid ${border}`, borderRadius:4, padding:'0.8rem', marginTop:'0.8rem', maxHeight:200, overflowY:'auto', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
              {generated}
            </pre>
          )}
        </div>

        {/* SETUP GUIDE */}
        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:8, padding:'1.2rem', marginBottom:'2rem' }}>
          <SectionLabel>ESP32 + Cloudflare Tunnel Setup</SectionLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {[
              ['1', 'Get the ESP32 code', <>Flash your ESP32 with the code from <a href="https://github.com/Jeff-h-kim/dancing-motor" target="_blank" rel="noreferrer" style={{ color:'#c8804e', textDecoration:'none' }}>github.com/Jeff-h-kim/dancing-motor</a>. Set your Wi-Fi credentials and an <code style={{ background:'#f5f4f0', padding:'0 3px', borderRadius:2 }}>X-API-Key</code> secret in the sketch before flashing.</>],
              ['2', 'Install cloudflared', <>Download the <a href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" target="_blank" rel="noreferrer" style={{ color:'#c8804e', textDecoration:'none' }}>cloudflared</a> CLI for your OS (no account needed for a quick tunnel).</>],
              ['3', 'Start a quick tunnel', <>With the ESP32 on your local network, run: <code style={{ background:'#f5f4f0', padding:'1px 5px', borderRadius:2 }}>cloudflared tunnel --url http://&lt;ESP32-IP&gt;:80</code>. Cloudflared prints a public <code style={{ background:'#f5f4f0', padding:'0 3px', borderRadius:2 }}>https://…trycloudflare.com</code> URL.</>],
              ['4', 'Paste into the fields above', <>Copy that URL into <strong>Cloudflare Tunnel URL</strong> and your chosen secret into <strong>X-API Key</strong>, then hit <strong>📡 Upload to ESP</strong>.</>],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
                <span style={{ ...M, fontSize:'0.6rem', color:'#fff', background:'#c8804e', borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, fontWeight:700 }}>{num}</span>
                <div>
                  <span style={{ ...M, fontSize:'0.65rem', color:textMain, fontWeight:700 }}>{title} — </span>
                  <span style={{ ...M, fontSize:'0.63rem', color:textMuted, lineHeight:1.6 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {toast && (
        <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', background:surface, border:`1px solid ${toast.type==='err'?'#c86e6e':'#6ec88a'}`, color:textMain, ...M, fontSize:'0.7rem', padding:'0.6rem 1rem', borderRadius:5, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default BuzzerComposerPage;