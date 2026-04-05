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
const LINE_GAP        = 14;
const HALF_STEP       = LINE_GAP / 2;
const NOTE_W          = 52;
const MARGIN_L        = 64;
const MARGIN_R        = 32;
const STAFF_TOP       = 80;
const NOTES_PER_LINE  = 20;

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
  {value:'reg',label:'reg'},{value:'stac',label:'stac'},{value:'lega',label:'lega'},
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

// ─── BEAT HELPERS ─────────────────────────────────────────────────────────────
// Decompose a beat duration into note-value rests (greedy, largest first)
function makeRestFill(beats) {
  const rests = [];
  let rem = Math.round(beats * 10000) / 10000;
  for (const u of [4.0, 2.0, 1.0, 0.5, 0.25]) {
    while (rem >= u - 0.0001) {
      rests.push({ note:'Rest', duration:u, type:'reg', accidental:'natural', autoRest:true });
      rem = Math.round((rem - u) * 10000) / 10000;
    }
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
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.stroke();
    }
  }

  // Below staff
  if (row > maxLine) {
    for (let r = maxLine + 2; r <= row; r += 2) {
      const y = rToY(r, staffTop);
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.stroke();
    }
  }
}

function drawRest(ctx, duration, cx, midLineY, color) {
  ctx.save();
  ctx.fillStyle = color; ctx.strokeStyle = color;
  if (duration >= 4.0) {
    ctx.fillRect(cx - 9, midLineY, 18, 6);
  } else if (duration >= 2.0) {
    ctx.fillRect(cx - 9, midLineY - 6, 18, 6);
  } else if (duration >= 1.0) {
    ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx+4, midLineY-10); ctx.lineTo(cx-3, midLineY-4);
    ctx.lineTo(cx+5, midLineY+1);  ctx.lineTo(cx-1, midLineY+5);
    ctx.bezierCurveTo(cx-7, midLineY+11, cx-5, midLineY+16, cx+2, midLineY+16);
    ctx.moveTo(cx-1, midLineY+5);  ctx.lineTo(cx+4, midLineY+8);
    ctx.stroke();
  } else if (duration >= 0.5) {
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx-1, midLineY+8); ctx.lineTo(cx+3, midLineY-7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+4, midLineY-5, 3.2, 0, Math.PI*2); ctx.fill();
  } else {
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx-1, midLineY+8); ctx.lineTo(cx+3, midLineY-7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+4, midLineY-5, 2.8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+2, midLineY+1,  2.8, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle = color + '77';
  ctx.font = '7px "Roboto Mono",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const dur = DURATIONS.find(d => d.value === duration);
  if (dur) ctx.fillText(dur.label, cx, midLineY + 22);
  ctx.restore();
}


function drawNoteHead(ctx, cx, cy, duration, color, stemUp, articulation) {
  const hollow = duration >= 2.0;
  const whole  = duration >= 4.0;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 6.5, 5, -0.18, 0, Math.PI*2);
  if (hollow) {
    ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = color; ctx.stroke();
  } else { ctx.fill(); }
  if (!whole) {
    const sx  = stemUp ? cx+6  : cx-6;
    const sy1 = stemUp ? cy-5  : cy+5;
    const sy2 = stemUp ? cy-36 : cy+36;
    ctx.strokeStyle = color; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx, sy1); ctx.lineTo(sx, sy2); ctx.stroke();
    const flagCount = duration <= 0.25 ? 2 : duration <= 0.5 ? 1 : 0;
    for (let f = 0; f < flagCount; f++) {
      const fy = sy2 + f*(stemUp ? 7 : -7);
      const dir = stemUp ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(sx, fy);
      ctx.bezierCurveTo(sx+10*dir, fy+6*dir, sx+13*dir, fy+12*dir, sx+8*dir, fy+20*dir);
      ctx.stroke();
    }
  }
  if ([0.75,1.5,3.0].includes(duration)) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx+10, cy-2, 2.1, 0, Math.PI*2); ctx.fill();
  }
  if (articulation === 'stac') {
    ctx.fillStyle = color;
    const dotY = stemUp ? cy+13 : cy-13;
    ctx.beginPath(); ctx.arc(cx, dotY, 2.2, 0, Math.PI*2); ctx.fill();
  } else if (articulation === 'lega') {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    const lineY = stemUp ? cy+13 : cy-13;
    ctx.beginPath(); ctx.moveTo(cx-7, lineY); ctx.lineTo(cx+7, lineY); ctx.stroke();
  }
  ctx.restore();
}


// ─── STAFF CANVAS ─────────────────────────────────────────────────────────────
function StaffCanvas({
  clef,
  voicesNotes,
  activeVoice,
  selDur,
  selArt,
  selAcc,
  keySig,
  timeSig,
  onAddNote,
  onDeleteNote
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [hoverNote, setHoverNote] = useState(null);

  const isT = clef === 'treble';
  const rows = isT ? TREBLE_ROWS : BASS_ROWS;
  const lines = isT ? TREBLE_LINES : BASS_LINES;
  const colors = isT ? TREBLE_COLORS : BASS_COLORS;

  const beatsPerBar = timeSig === '3/4' ? 3 : 4;

  const STAFF_H = 260;
  const LINE_SPACING = STAFF_H + 40;

  const maxBeats = Math.max(
    ...voicesNotes.map(v => v.reduce((s, n) => s + n.duration, 0)),
    4
  );

  const beatsPerLine = NOTES_PER_LINE;
  const numLines = Math.ceil(maxBeats / beatsPerLine);

  // ✅ SINGLE SOURCE OF TRUTH
  const getYFromRow = (row, staffTop) => {
    const middleLine = lines[2];
    const middleY = staffTop + (2 * LINE_GAP);
    return middleY + (row - middleLine) * HALF_STEP;
  };

  const getRowFromY = (y, staffTop) => {
    const middleLine = lines[2];
    const middleY = staffTop + (2 * LINE_GAP);
    return Math.round((y - middleY) / HALF_STEP + middleLine);
  };

  // ─── DRAW ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const W = wrap.clientWidth;

    canvas.width = W * dpr;
    canvas.height = numLines * LINE_SPACING * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = numLines * LINE_SPACING + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let li = 0; li < numLines; li++) {
      const staffTop = li * LINE_SPACING + STAFF_TOP;

      const usableWidth = W - MARGIN_L - MARGIN_R;
      const noteW = usableWidth / beatsPerLine;

      const lineStartBeat = li * beatsPerLine;

      const topY = getYFromRow(lines[0], staffTop);
      const botY = getYFromRow(lines[lines.length - 1], staffTop);
      const midY = getYFromRow(lines[2], staffTop);

      // staff lines
      lines.forEach(lr => {
        const y = getYFromRow(lr, staffTop);
        ctx.beginPath();
        ctx.moveTo(MARGIN_L, y);
        ctx.lineTo(W - MARGIN_R, y);
        ctx.strokeStyle = '#aaa';
        ctx.stroke();
      });

      // ─── BAR LINES ─────────────────────────────
ctx.strokeStyle = '#888';
ctx.lineWidth = 1;

let beatCursor = 0;
let nextBarBeat = beatsPerBar;

const mainVoice = voicesNotes.reduce((a, b) =>
  a.reduce((s,n)=>s+n.duration,0) >
  b.reduce((s,n)=>s+n.duration,0) ? a : b
);

mainVoice.forEach(note => {
  const nextBeat = beatCursor + note.duration;

  // ✅ draw ALL bars crossed during this note
  while (nextBarBeat <= nextBeat + 0.0001) {

    if (
      nextBarBeat >= lineStartBeat &&
      nextBarBeat <= lineStartBeat + beatsPerLine
    ) {
      const beatInLine = nextBarBeat - lineStartBeat;
      const x = MARGIN_L + beatInLine * noteW;

      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, botY);
      ctx.stroke();
    }

    nextBarBeat += beatsPerBar;
  }

  beatCursor = nextBeat;
});

      // clef
      ctx.font = isT ? '60px serif' : '40px serif';
      ctx.fillText(isT ? '𝄞' : '𝄢', 10, getYFromRow(lines[2], staffTop));

      // notes
      voicesNotes.forEach((voice, vi) => {
        const color = colors[vi];
        let beatCursor = 0;

        voice.forEach(note => {
          if (beatCursor >= lineStartBeat + beatsPerLine) return;

          if (beatCursor >= lineStartBeat) {
            const beatInLine = beatCursor - lineStartBeat;
            const x = MARGIN_L + beatInLine * noteW + noteW / 2;

            if (note.note === 'Rest') {
              drawRest(ctx, note.duration, x, midY, color);
            } else {
              const rowObj = rows.find(r => r.note === note.note);
              if (!rowObj) return;

              const y = getYFromRow(rowObj.row, staffTop);

              drawLedgerLines(ctx, x, rowObj.row, lines, getYFromRow, staffTop, color);
              drawNoteHead(ctx, x, y, note.duration, color, isT, note.type);
            }
          }

          beatCursor += note.duration;
        });
      });
    }

    // ─── GHOST NOTE ─────────────────────────────
    if (hoverNote) {
      const li = Math.floor(hoverNote.beat / beatsPerLine);
      if (li >= numLines) return;

      const staffTop = li * LINE_SPACING + STAFF_TOP;

      const usableWidth = W - MARGIN_L - MARGIN_R;
      const noteW = usableWidth / beatsPerLine;

      const beatInLine = hoverNote.beat - li * beatsPerLine;
      const x = MARGIN_L + beatInLine * noteW + noteW / 2;

      const y = getYFromRow(hoverNote.row, staffTop);

      const color = colors[activeVoice] || '#888';

      ctx.save();
      ctx.globalAlpha = 0.35;

      drawLedgerLines(ctx, x, hoverNote.row, lines, getYFromRow, staffTop, color);
      drawNoteHead(ctx, x, y, selDur, color, isT, selArt);

      // accidental preview
      if (selAcc !== 'regular') {
        ctx.fillStyle = color;
        ctx.font = '14px serif';

        const symbols = { sharp: '♯', flat: '♭', natural: '♮' };
        const sym = symbols[selAcc];
        if (sym) ctx.fillText(sym, x - 12, y + 4);
      }

      ctx.restore();
    }

  }, [voicesNotes, hoverNote, selDur, selArt, selAcc, activeVoice]);

  // ─── MOUSE ─────────────────────────────────────────────
const getCoords = (e) => {
  const rect = canvasRef.current.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const line = Math.floor(y / LINE_SPACING);
  const staffTop = line * LINE_SPACING + STAFF_TOP;

  // ✅ adjust Y relative to staff center system
  const relativeY = y - staffTop;

  const middleLine = lines[2];
  const middleY = (2 * LINE_GAP);

  const row = Math.round((relativeY - middleY) / HALF_STEP + middleLine);

  const usableWidth = rect.width - MARGIN_L - MARGIN_R;
  const noteW = usableWidth / beatsPerLine;

  const rawBeat = ((x - MARGIN_L - noteW / 2) / noteW) + line * beatsPerLine;
  const beat = Math.round(rawBeat / 0.25) * 0.25;

  return { row, beat };
};

  const handleMouseMove = (e) => {
    const c = getCoords(e);
    setHoverNote(c);
  };

  const handleClick = (e) => {
    const c = getCoords(e);

    const rowObj = rows.find(r => r.row === c.row);
    if (!rowObj) return;

    onAddNote({
      note: rowObj.note,
      duration: selDur,
      type: selArt,
      accidental: selAcc,
      targetBeat: c.beat
    });
  };

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverNote(null)}
        onContextMenu={(e) => {
          e.preventDefault();
          onDeleteNote();
        }}
        style={{ cursor: 'crosshair' }}
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
  const NAMES = { treble:['MELODY_JSON','MELODY2_JSON','MELODY3_JSON'], bass:['BASS_JSON','BASS2_JSON','BASS3_JSON'] };
  const fmtNote = n => {
    if (n.note === 'Rest') return 'Rest';
    const acc = n.accidental === 'sharp' ? '#' : n.accidental === 'flat' ? 'b' : '';
    return n.note[0] + acc + n.note.slice(1);
  };
  const out = ['#pragma once', `// Generated by Buzzer Composer — ${new Date().toISOString()}`, `// Song: ${title}  |  Tempo: ${tempo} BPM`, ''];
  [['treble',treble],['bass',bass]].forEach(([clef,vs]) => {
    vs.forEach((arr,vi) => {
      if (!arr.length) return;
      const obj = { title:`${title} - ${clef[0].toUpperCase()+clef.slice(1)} V${vi+1}`, tempo, notes:arr.map(n=>({note:fmtNote(n),duration:n.duration,type:n.type})) };
      out.push(`const char *${NAMES[clef][vi]} = R"(${JSON.stringify(obj,null,4)})";`);
      out.push('');
    });
  });
  out.push('// loadSong(MELODY_JSON, melodyDoc); loadSong(BASS_JSON, bassDoc);');
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

function VoicePicker({ voices, active, setActive, colors }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {voices.map((v, i) => (
        <button key={i} onClick={() => setActive(i)}
          style={{ ...M, fontSize:'0.6rem', padding:'0.2rem 0.5rem', borderRadius:3,
            border:`1px solid ${i===active?colors[i]:'rgba(0,0,0,0.14)'}`,
            background:i===active?colors[i]+'22':'transparent',
            color:i===active?colors[i]:'#888', cursor:'pointer', transition:'all .15s' }}>
          V{i+1}{v.length?` (${v.length})`:''}
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

  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [xApiKey, setXApiKey] = useState('');
const [tunnelUrl, setTunnelUrl] = useState('');

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

  const downloadFile = (content, filename, type='text/plain') => {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  async function playVoice(voice, audioCtx, keySig) {
    const beatMs = 60000 / tempo;
    let t = audioCtx.currentTime;
    for (const note of voice) {
      const dur = (note.duration * beatMs) / 1000;
      if (note.note !== 'Rest') {
        const freq = getFrequency(note, keySig);
        if (freq) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.start(t); osc.stop(t + dur);
        }
      }
      t += dur;
    }
  }

  const handlePlay = async () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    await Promise.all([...treble, ...bass].map(v => playVoice(v, audioCtx, keySig)));
  };

  const handleUpload = async () => {
    try {
      if (!tunnelUrl || !xApiKey) {
  alert('Missing tunnel URL or API key');
  return;
}

const res = await fetch(`${tunnelUrl}/upload`, {
  method:'POST',
  headers:{ 
    'Content-Type':'application/json', 
    'x-api-key': xApiKey
  },
        body: JSON.stringify({ tempo, treble, bass }),
      });
      if (!res.ok) { alert('❌ Upload failed: ' + res.status); return; }
      alert('✅ Sent to ESP32!');
    } catch { alert('❌ Network error'); }
  };

  const keySig = KEY_SIGNATURES[selKey] || { sharps:[], flats:[] };

  // ── addNote: smart placement with auto-rest padding
  // targetSlot is the absolute slot index the user clicked.
  // We map that to beats by treating each existing note as occupying its own duration,
  // then fill any gap with rests before appending the new note.
const addNote = useCallback((clef, vi, nd) => {
  const setter = clef === 'treble' ? setTreble : setBass;

  setter(prev => {
    const next = prev.map(v => [...v]);
    const voice = next[vi];

    const newNote = {
      note: nd.note,
      duration: nd.duration,
      type: nd.type,
      accidental: nd.accidental
    };

    let beatCursor = 0;
    const newVoice = [];
    let inserted = false;

    for (let note of voice) {

      // ✅ INSERT BEFORE existing note (NO RESTS)
      if (!inserted && nd.targetBeat < beatCursor + note.duration) {
        newVoice.push(newNote);
        inserted = true;
      }

      newVoice.push(note);
      beatCursor += note.duration;
    }

    // ✅ If placing AFTER everything → allow rests
    if (!inserted) {
      if (nd.targetBeat > beatCursor) {
        const gap = nd.targetBeat - beatCursor;
        newVoice.push(...makeRestFill(gap));
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
    showToast(`+ Rest → ${clef} V${vi+1}`);
  }, []);

  const deleteLast = useCallback((clef, vi) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => { const n=prev.map(v=>[...v]); if(n[vi].length) n[vi]=n[vi].slice(0,-1); return n; });
  }, []);

  const deleteExact = (clef, vi, ni) => {
    const setter = clef === 'treble' ? setTreble : setBass;
    setter(prev => { const n=prev.map(v=>[...v]); n[vi]=n[vi].filter((_,i)=>i!==ni); return n; });
  };

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
            Click the staff to place notes · clicking ahead of the last note auto-fills rests · right-click = undo last · V2/V3 rests are shown as small indicators below the staff
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
        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:8, padding:'1rem 1.2rem', marginBottom:'1.5rem' }}>
          <SectionLabel>Note Properties</SectionLabel>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:textMuted }}>DURATION</span>
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
        </div>

        {/* TREBLE */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.45rem', flexWrap:'wrap' }}>
            <SectionLabel>Treble Clef</SectionLabel>
            <VoicePicker voices={treble} active={activeTreble} setActive={setActiveTreble} colors={TREBLE_COLORS} />
            <Btn small onClick={() => addRestManual('treble', activeTreble, selDur)}>+ Rest</Btn>
          </div>
          <StaffCanvas
            clef="treble" voicesNotes={treble} activeVoice={activeTreble}
            selDur={selDur} selArt={selArt} selAcc={selAcc} keySig={keySig} timeSig={timeSig}
            onAddNote={nd => addNote('treble', activeTreble, nd)}
            onDeleteNote={() => deleteLast('treble', activeTreble)}
          />
          <p style={{ ...M, fontSize:'0.57rem', color:textMuted, marginTop:'0.3rem' }}>
            stems up · V{activeTreble+1} active · right-click = undo last
          </p>
        </div>

        {/* BASS */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.45rem', flexWrap:'wrap' }}>
            <SectionLabel>Bass Clef</SectionLabel>
            <VoicePicker voices={bass} active={activeBass} setActive={setActiveBass} colors={BASS_COLORS} />
            <Btn small onClick={() => addRestManual('bass', activeBass, selDur)}>+ Rest</Btn>
          </div>
          <StaffCanvas
            clef="bass" voicesNotes={bass} activeVoice={activeBass}
            selDur={selDur} selArt={selArt} selAcc={selAcc} keySig={keySig} timeSig={timeSig}
            onAddNote={nd => addNote('bass', activeBass, nd)}
            onDeleteNote={() => deleteLast('bass', activeBass)}
          />
          <p style={{ ...M, fontSize:'0.57rem', color:textMuted, marginTop:'0.3rem' }}>
            stems down · V{activeBass+1} active · right-click = undo last
          </p>
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
          <div style={{ 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '0.4rem', 
  marginBottom: '0.8rem' 
}}>

  <input
    placeholder="Cloudflare Tunnel URL (https://...)"
    value={tunnelUrl}
    onChange={e => setTunnelUrl(e.target.value)}
    style={{
      ...M,
      fontSize:'0.65rem',
      padding:'0.35rem 0.5rem',
      borderRadius:4,
      border:`1px solid ${border}`,
      background:'#f5f4f0'
    }}
  />

  <input
    placeholder="X-API Key"
    value={xApiKey}
    onChange={e => setXApiKey(e.target.value)}
    style={{
      ...M,
      fontSize:'0.65rem',
      padding:'0.35rem 0.5rem',
      borderRadius:4,
      border:`1px solid ${border}`,
      background:'#f5f4f0'
    }}
  />

</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
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
