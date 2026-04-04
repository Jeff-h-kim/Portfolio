import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Download, Upload, Trash2 } from 'lucide-react';

// ─── AUDIO: NOTE FREQUENCIES ───────────────────────────────────────────────
const NOTE_FREQ = {
  // Bass
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31,
  G2: 98.00, A2: 110.00, B2: 123.47,

  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61,
  G3: 196.00, A3: 220.00, B3: 246.94,

  // Treble
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,

  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00, B5: 987.77,

  C6: 1046.5,
};

// ─── LAYOUT CONSTANTS ─────────────────────────────────────────────────────────
const LINE_GAP   = 14;
const HALF_STEP  = LINE_GAP / 2;
const NOTE_W     = 52;
const MARGIN_L   = 64;
const MARGIN_R   = 32;
const STAFF_TOP  = 30;

// ─── TREBLE ROW MAP ───────────────────────────────────────────────────────────
// row 0 = above top line, rows increase downward, each = one diatonic half-step
// Staff lines at rows: 3(F5), 5(D5), 7(B4), 9(G4), 11(E4)
const TREBLE_ROWS = [
  { note:'C6', row:-2 }, { note:'B5', row:-1 }, { note:'A5', row:0  },
  { note:'G5', row:1  }, { note:'F5', row:2  }, { note:'E5', row:3  },
  { note:'D5', row:4  }, { note:'C5', row:5  }, { note:'B4', row:6  },
  { note:'A4', row:7  }, { note:'G4', row:8  }, { note:'F4', row:9  },
  { note:'E4', row:10 }, { note:'D4', row:11 }, { note:'C4', row:12 },
  { note:'B3', row:13 },
];
const TREBLE_LINES   = [2, 4, 6, 8, 10]; // row indices of 5 staff lines
const TREBLE_ROW_MIN = -2;
const TREBLE_ROW_MAX = 13;

// ─── BASS ROW MAP ─────────────────────────────────────────────────────────────
// Staff lines at rows: 1(A3), 3(F3), 5(D3), 7(B2), 9(G2)
const BASS_ROWS = [
  { note:'B3', row:0  }, { note:'A3', row:1  }, { note:'G3', row:2  },
  { note:'F3', row:3  }, { note:'E3', row:4  }, { note:'D3', row:5  },
  { note:'C3', row:6  }, { note:'B2', row:7  }, { note:'A2', row:8  },
  { note:'G2', row:9  }, { note:'F2', row:10 }, { note:'E2', row:11 },
];
const BASS_LINES   = [1, 3, 5, 7, 9];
const BASS_ROW_MIN = 0;
const BASS_ROW_MAX = 11;

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
// Treble staff rows for key sig symbols
const TREBLE_SHARP_ROW = { F:2, C:5, G:1, D:4, A:0 };
const TREBLE_FLAT_ROW  = { B:6, E:10, A:7, D:4, G:8 };
const BASS_SHARP_ROW   = { F:3, C:6, G:2, D:5, A:1 };
const BASS_FLAT_ROW    = { B:1, E:4, A:2, D:6, G:3 };

// ─── DURATIONS / ARTICULATIONS / ACCIDENTALS ──────────────────────────────────
const DURATIONS     = [
  {value:0.25,label:'16th'},{value:0.5,label:'8th'},{value:0.75,label:'8th·'},
  {value:1.0,label:'qtr'},{value:1.5,label:'qtr·'},
  {value:2.0,label:'half'},{value:3.0,label:'hlf·'},{value:4.0,label:'whole'},
];
const ARTICULATIONS = [
  {value:'reg',label:'reg'},{value:'stac',label:'stac'},{value:'lega',label:'lega'},
];
const ACCIDENTALS   = [
  {value:'natural',label:'♮ nat'},{value:'sharp',label:'♯ sharp'},{value:'flat',label:'♭ flat'},
];

const TREBLE_COLORS = ['#c8a96e','#6ec88a','#6eaac8'];
const BASS_COLORS   = ['#6eaac8','#a08bc8','#c8a96e'];

// ─── DRAW HELPERS ─────────────────────────────────────────────────────────────
function rowToY(row) { return STAFF_TOP + row * HALF_STEP; }

// Proper rest symbols
function drawRest(ctx, duration, cx, midLineY, color) {
  ctx.save();
  ctx.fillStyle   = color;
  ctx.strokeStyle = color;

  if (duration >= 4.0) {
    // Whole rest: filled rect hanging below middle line
    ctx.fillRect(cx - 9, midLineY, 18, 6);
  } else if (duration >= 2.0) {
    // Half rest: filled rect sitting on top of middle line
    ctx.fillRect(cx - 9, midLineY - 6, 18, 6);
  } else if (duration >= 1.0) {
    // Quarter rest: classic zigzag
    ctx.lineWidth = 1.6;
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + 4, midLineY - 10);
    ctx.lineTo(cx - 3, midLineY - 4);
    ctx.lineTo(cx + 5,  midLineY + 1);
    ctx.lineTo(cx - 1,  midLineY + 5);
    ctx.bezierCurveTo(cx - 7, midLineY + 11, cx - 5, midLineY + 16, cx + 2, midLineY + 16);
    ctx.moveTo(cx - 1, midLineY + 5);
    ctx.lineTo(cx + 4,  midLineY + 8);
    ctx.stroke();
  } else if (duration >= 0.5) {
    // 8th rest: diagonal with filled flag
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - 1, midLineY + 8);
    ctx.lineTo(cx + 3, midLineY - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 4, midLineY - 5, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 16th rest: two flags
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - 1, midLineY + 8);
    ctx.lineTo(cx + 3, midLineY - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 4, midLineY - 5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 2, midLineY + 1, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Duration label
  ctx.fillStyle = color + '77';
  ctx.font = '7px "Roboto Mono",monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const dur = DURATIONS.find(d => d.value === duration);
  if (dur) ctx.fillText(dur.label, cx, midLineY + 22);

  ctx.restore();
}

function drawNoteHead(ctx, cx, cy, duration, color, stemUp, articulation) {
  const hollow = duration >= 2.0;
  const whole  = duration >= 4.0;
  ctx.save();

  // Head
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = 1.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 6.5, 5, -0.18, 0, Math.PI * 2);
  if (hollow) {
    ctx.stroke();
    ctx.fillStyle = '#1c1c22';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();
  } else {
    ctx.fill();
  }

  // Stem — treble always up, bass always down
  if (!whole) {
    const sx  = stemUp ? cx + 6   : cx - 6;
    const sy1 = stemUp ? cy - 5   : cy + 5;
    const sy2 = stemUp ? cy - 36  : cy + 36;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx, sy1);
    ctx.lineTo(sx, sy2);
    ctx.stroke();

    // Flags (8th/16th)
    const flagCount = duration <= 0.25 ? 2 : duration <= 0.5 ? 1 : 0;
    for (let f = 0; f < flagCount; f++) {
      const fy  = sy2 + f * (stemUp ? 7 : -7);
      const dir = stemUp ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(sx, fy);
      ctx.bezierCurveTo(
        sx + 10*dir, fy + 6*dir,
        sx + 13*dir, fy + 12*dir,
        sx + 8*dir,  fy + 20*dir
      );
      ctx.stroke();
    }
  }

  // Augmentation dot
  if ([0.75, 1.5, 3.0].includes(duration)) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 2, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Articulation
  if (articulation === 'stac') {
    ctx.fillStyle = color;
    const dotY = stemUp ? cy + 13 : cy - 13;
    ctx.beginPath();
    ctx.arc(cx, dotY, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (articulation === 'lega') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    const lineY = stemUp ? cy + 13 : cy - 13;
    ctx.beginPath();
    ctx.moveTo(cx - 7, lineY);
    ctx.lineTo(cx + 7, lineY);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── STAFF CANVAS ─────────────────────────────────────────────────────────────
function StaffCanvas({ clef, voicesNotes, activeVoice, selDur, selArt, selAcc, keySig, onAddNote, onDeleteNote }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const [ghostRow, setGhostRow] = useState(null);
  const [ghostCol, setGhostCol] = useState(null);

  const isT      = clef === 'treble';
  const rows     = isT ? TREBLE_ROWS     : BASS_ROWS;
  const lines    = isT ? TREBLE_LINES    : BASS_LINES;
  const rowMin   = isT ? TREBLE_ROW_MIN  : BASS_ROW_MIN;
  const rowMax   = isT ? TREBLE_ROW_MAX  : BASS_ROW_MAX;
  const colors   = isT ? TREBLE_COLORS   : BASS_COLORS;
  const stemUp   = isT; // treble = up, bass = down
  const sharpMap = isT ? TREBLE_SHARP_ROW : BASS_SHARP_ROW;
  const flatMap  = isT ? TREBLE_FLAT_ROW  : BASS_FLAT_ROW;

  const keySigSymbols = keySig.sharps.length + keySig.flats.length;
  const keySigW  = keySigSymbols * 11 + (keySigSymbols > 0 ? 4 : 0);
  const notesX0  = MARGIN_L + keySigW; // where note columns start

  const maxNotes = Math.max(...voicesNotes.map(v => v.length), 8);
  const CANVAS_H = STAFF_TOP + (rowMax - rowMin + 3) * HALF_STEP + 30;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const W   = Math.max(wrap.clientWidth, notesX0 + (maxNotes + 3) * NOTE_W + MARGIN_R);

    canvas.width        = W * dpr;
    canvas.height       = CANVAS_H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = CANVAS_H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // BG
    ctx.fillStyle = '#1c1c22';
    ctx.fillRect(0, 0, W, CANVAS_H);

    // Column hover highlight
    if (ghostCol !== null) {
      const hx = notesX0 + ghostCol * NOTE_W;
      ctx.fillStyle = 'rgba(200,169,110,0.05)';
      ctx.fillRect(hx, 0, NOTE_W, CANVAS_H);
    }

    // Staff lines
    const topY    = rowToY(lines[0]);
    const botY    = rowToY(lines[lines.length - 1]);
    lines.forEach(lr => {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(MARGIN_L - 6, rowToY(lr));
      ctx.lineTo(W - MARGIN_R + 8, rowToY(lr));
      ctx.stroke();
    });

    // Opening bar
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(MARGIN_L - 6, topY); ctx.lineTo(MARGIN_L - 6, botY); ctx.stroke();

    // Clef symbol
    ctx.fillStyle = 'rgba(200,169,110,0.85)';
    ctx.textBaseline = 'alphabetic';
    if (isT) {
      ctx.font = 'bold 62px serif';
      ctx.fillText('𝄞', 3, rowToY(lines[0]) + 38);
    } else {
      ctx.font = 'bold 40px serif';
      ctx.fillText('𝄢', 5, rowToY(lines[1]) + 10);
    }

    // Key signature
    let kx = MARGIN_L + 4;
    ctx.fillStyle = 'rgba(220,215,205,0.88)';
    ctx.font = '13px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    keySig.sharps.forEach(note => {
      const r = sharpMap[note];
      if (r !== undefined) { ctx.fillText('♯', kx, rowToY(r)); kx += 11; }
    });
    keySig.flats.forEach(note => {
      const r = flatMap[note];
      if (r !== undefined) { ctx.fillText('♭', kx, rowToY(r)); kx += 11; }
    });

    // Bar lines every 8 slots
    const totalSlots = Math.max(maxNotes + 3, Math.floor((W - notesX0 - MARGIN_R) / NOTE_W));
    ctx.strokeStyle = 'rgba(255,255,255,0.11)';
    ctx.lineWidth = 0.7;
    for (let b = 8; b <= totalSlots; b += 8) {
      const bx = notesX0 + b * NOTE_W - NOTE_W * 0.5;
      ctx.beginPath(); ctx.moveTo(bx, topY); ctx.lineTo(bx, botY); ctx.stroke();
    }

    // Middle line Y (for rests)
    const midY = rowToY(lines[2]);

    // Ghost note
    if (ghostRow !== null && ghostCol !== null) {
      const rowObj = rows.find(r => r.row === ghostRow);
      if (rowObj) {
        const gx = notesX0 + ghostCol * NOTE_W + NOTE_W * 0.5;
        const gy = rowToY(ghostRow);
        ctx.globalAlpha = 0.3;
        drawNoteHead(ctx, gx, gy, selDur, colors[activeVoice], stemUp, selArt);
        ctx.globalAlpha = 1;
      }
    }

    // All voices
    voicesNotes.forEach((vArr, vi) => {
      const color = colors[vi];
      vArr.forEach((n, ni) => {
        const nx = notesX0 + ni * NOTE_W + NOTE_W * 0.5;

        if (n.note === 'Rest') {
          drawRest(ctx, n.duration, nx, midY, color + 'cc');
          return;
        }

        const rowObj = rows.find(r => r.note === n.note);
        if (!rowObj) return;
        const ny = rowToY(rowObj.row);

        // Ledger lines
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 0.9;
        const topLine = lines[0];
        const botLine = lines[lines.length - 1];
        if (rowObj.row < topLine) {
          for (let lp = topLine - 2; lp >= rowObj.row; lp -= 2) {
            const ly = rowToY(lp);
            ctx.beginPath(); ctx.moveTo(nx-11, ly); ctx.lineTo(nx+11, ly); ctx.stroke();
          }
        }
        if (rowObj.row > botLine) {
          for (let lp = botLine + 2; lp <= rowObj.row; lp += 2) {
            const ly = rowToY(lp);
            ctx.beginPath(); ctx.moveTo(nx-11, ly); ctx.lineTo(nx+11, ly); ctx.stroke();
          }
        }

        drawNoteHead(ctx, nx, ny, n.duration, color, stemUp, n.type);

        // Accidental
        if (n.accidental === 'sharp' || n.accidental === 'flat') {
          ctx.fillStyle = color;
          ctx.font = '12px serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.accidental === 'sharp' ? '♯' : '♭', nx - 9, ny);
        }

        // Voice label v2/v3
        if (vi > 0) {
          ctx.fillStyle = color + '77';
          ctx.font = '7px "Roboto Mono",monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`v${vi+1}`, nx, ny + (stemUp ? 18 : -18));
        }

        // Note name below staff
        ctx.fillStyle = 'rgba(255,255,255,0.13)';
        ctx.font = '7px "Roboto Mono",monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const acc = n.accidental === 'sharp' ? '♯' : n.accidental === 'flat' ? '♭' : '';
        ctx.fillText(n.note + acc, nx, rowToY(botLine) + 5);
      });
    });

    // Final double barline
    const fx = notesX0 + (maxNotes + 1) * NOTE_W + 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(fx, topY); ctx.lineTo(fx, botY); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(fx + 5, topY); ctx.lineTo(fx + 5, botY); ctx.stroke();

  }, [voicesNotes, ghostRow, ghostCol, activeVoice, rows, lines, colors, stemUp,
      rowMin, rowMax, maxNotes, CANVAS_H, notesX0, keySig, selDur, selArt,
      isT, sharpMap, flatMap, keySigW]);

  const getCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor((x - notesX0) / NOTE_W);
    const row = Math.round((y - STAFF_TOP) / HALF_STEP);
    return { col, row };
  }, [notesX0]);

  const handleMouseMove = useCallback((e) => {
    const c = getCoords(e);
    if (!c) return;
    if (c.col >= 0 && c.row >= rowMin && c.row <= rowMax) {
      setGhostCol(c.col); setGhostRow(c.row);
    } else {
      setGhostCol(null); setGhostRow(null);
    }
  }, [getCoords, rowMin, rowMax]);

  const handleMouseLeave = useCallback(() => {
    setGhostCol(null); setGhostRow(null);
  }, []);

  const handleClick = useCallback((e) => {
    const c = getCoords(e);
    if (!c || c.col < 0 || c.row < rowMin || c.row > rowMax) return;
    const rowObj = rows.find(r => r.row === c.row);
    if (!rowObj) return;
    onAddNote({ note: rowObj.note, duration: selDur, type: selArt, accidental: selAcc });
  }, [getCoords, rowMin, rowMax, rows, selDur, selArt, selAcc, onAddNote]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    onDeleteNote();
  }, [onDeleteNote]);

  return (
    <div ref={wrapRef} style={{ width: '100%', overflowX: 'hidden', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ cursor: 'crosshair', display: 'block', maxWidth: '100%' }}
      />
    </div>
  );
}

// ─── NOTE LIST ─────────────────────────────────────────────────────────────────
function NoteList({ voices, clef, onDelete }) {
  const colors = clef === 'treble' ? TREBLE_COLORS : BASS_COLORS;
  const has    = voices.some(v => v.length > 0);
  if (!has) return (
    <p style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.67rem', color:'#3a3855', textAlign:'center', padding:'1rem 0' }}>
      click the staff to add notes
    </p>
  );
  return (
    <div>
      {voices.map((arr, vi) => arr.length > 0 && (
        <div key={vi}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0.3rem 0.75rem', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.02)' }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:colors[vi] }} />
            <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.57rem', color:colors[vi], letterSpacing:'0.1em' }}>VOICE {vi+1}</span>
          </div>
          {arr.map((n, ni) => {
            const acc = n.accidental==='sharp'?'♯':n.accidental==='flat'?'♭':'';
            return (
              <div key={ni}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'0.28rem 0.75rem', borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.57rem', color:'#3a3855', minWidth:18 }}>{ni+1}</span>
                <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.74rem', fontWeight:700, color:colors[vi], minWidth:42 }}>{n.note}{acc}</span>
                <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.62rem', color:'#5a5875', minWidth:32 }}>{n.duration}</span>
                <span style={{ fontFamily:'"Roboto Mono",monospace', fontSize:'0.62rem', color:'#5a5875' }}>{n.type}</span>
                <button onClick={() => onDelete(vi, ni)}
                  style={{ marginLeft:'auto', background:'none', border:'none', color:'#c86e6e', cursor:'pointer', fontFamily:'"Roboto Mono",monospace', fontSize:'0.6rem', padding:'0 2px', opacity:0.4 }}
                  onMouseEnter={e => e.target.style.opacity=1}
                  onMouseLeave={e => e.target.style.opacity=0.4}
                >✕</button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── HEADER GENERATOR ─────────────────────────────────────────────────────────
function generateHeader(title, tempo, treble, bass) {
  const NAMES = {
    treble: ['MELODY_JSON','MELODY2_JSON','MELODY3_JSON'],
    bass:   ['BASS_JSON','BASS2_JSON','BASS3_JSON'],
  };
  const fmtNote = n => {
    if (n.note === 'Rest') return 'Rest';
    const acc = n.accidental === 'sharp' ? '#' : n.accidental === 'flat' ? 'b' : '';
    return n.note[0] + acc + n.note.slice(1);
  };
  const lines = [
    '#pragma once',
    `// Generated by Buzzer Composer — ${new Date().toISOString()}`,
    `// Song: ${title}  |  Tempo: ${tempo} BPM`, '',
  ];
  [['treble', treble], ['bass', bass]].forEach(([clef, vs]) => {
    vs.forEach((arr, vi) => {
      if (!arr.length) return;
      const obj = { title:`${title} - ${clef[0].toUpperCase()+clef.slice(1)} V${vi+1}`, tempo, notes: arr.map(n => ({ note:fmtNote(n), duration:n.duration, type:n.type })) };
      lines.push(`const char *${NAMES[clef][vi]} = R"(${JSON.stringify(obj,null,4)})";`);
      lines.push('');
    });
  });
  lines.push('// loadSong(MELODY_JSON, melodyDoc); loadSong(BASS_JSON, bassDoc);');
  return lines.join('\n');
}

// ─── SMALL UI PIECES ─────────────────────────────────────────────────────────
const M = { fontFamily:'"Roboto Mono",monospace' };
const S = { fontFamily:'"PT Sans",sans-serif' };

function Btn({ children, onClick, primary, success, danger, small }) {
  const base = { ...M, fontSize:small?'0.63rem':'0.69rem', padding:small?'0.25rem 0.6rem':'0.38rem 0.82rem', borderRadius:4, cursor:'pointer', border:'1px solid', display:'inline-flex', alignItems:'center', gap:4, background:'transparent', letterSpacing:'0.03em' };
  const v = primary?{ background:'#c8a96e', borderColor:'#c8a96e', color:'#0f0f14', fontWeight:700 }
          : success?{ borderColor:'#6ec88a', color:'#6ec88a' }
          : danger ?{ borderColor:'#c86e6e', color:'#c86e6e' }
          :         { borderColor:'rgba(255,255,255,0.13)', color:'#8a8898' };
  return <button onClick={onClick} style={{ ...base, ...v }}>{children}</button>;
}

function SectionLabel({ children }) {
  return (
    <div style={{ ...M, fontSize:'0.6rem', color:'#5a5875', letterSpacing:'0.12em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:6, marginBottom:'0.5rem' }}>
      <span style={{ width:3, height:3, background:'#c8a96e', borderRadius:'50%', flexShrink:0 }} />
      {children}
    </div>
  );
}

function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{ ...M, fontSize:'0.62rem', padding:'0.22rem 0.52rem', borderRadius:3, border:`1px solid ${value===o.value?'#c8a96e':'rgba(255,255,255,0.1)'}`, background:value===o.value?'rgba(200,169,110,0.15)':'transparent', color:value===o.value?'#c8a96e':'#5a5875', cursor:'pointer', transition:'all .15s' }}>
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
          style={{ ...M, fontSize:'0.6rem', padding:'0.2rem 0.5rem', borderRadius:3, border:`1px solid ${i===active?colors[i]:'rgba(255,255,255,0.1)'}`, background:i===active?colors[i]+'22':'transparent', color:i===active?colors[i]:'#5a5875', cursor:'pointer', transition:'all .15s' }}>
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
  const [selDur,  setSelDur]  = useState(0.5);
  const [selArt,  setSelArt]  = useState('reg');
  const [selAcc,  setSelAcc]  = useState('natural');

  const [treble,       setTreble]       = useState([[], [], []]);
  const [bass,         setBass]         = useState([[], [], []]);
  const [activeTreble, setActiveTreble] = useState(0);
  const [activeBass,   setActiveBass]   = useState(0);

  const [serverUrl,   setServerUrl]   = useState('http://localhost:5500/upload');
  const [flashStatus, setFlashStatus] = useState('idle');
  const [flashMsg,    setFlashMsg]    = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState(null);
  
  // ─── AUDIO ENGINE ──────────────────────────────────────────────────────────
const audioCtxRef = useRef(null);

const getAudioCtx = () => {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtxRef.current;
};

  const downloadFile = (content, filename, type = "text/plain") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
  };
  
  const handleExportHeader = () => {
  const header = generateHeader(title, tempo, treble, bass);
  downloadFile(header, `${title}.h`);
  };
  
  const handleExportJSON = () => {
  const data = {
    title,
    tempo,
    treble,
    bass
  };

  downloadFile(JSON.stringify(data, null, 2), `${title}.json`, "application/json");
};
  
  
const playTone = (freq, durationSec) => {
  const ctx = getAudioCtx();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square"; // buzzer-like sound
  osc.frequency.value = freq;

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();

  // smooth fade-out to avoid clicking sound
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

  osc.stop(ctx.currentTime + durationSec);
};
  
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function playVoice(voice, audioCtx) {
  const beatMs = 60000 / tempo;
  let currentTime = audioCtx.currentTime;

  for (const note of voice) {
    const durationSec = (note.duration * beatMs) / 1000;

    if (!note || note.note === "Rest") {
      currentTime += durationSec;
      continue;
    }

    const freq = NOTE_FREQ[note.note];

    if (freq) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, currentTime);

      // Smooth envelope (THIS IS KEY 🔥)
      gain.gain.setValueAtTime(0.001, currentTime);
      gain.gain.exponentialRampToValueAtTime(0.5, currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, currentTime + durationSec);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(currentTime);
      osc.stop(currentTime + durationSec);
    }

    currentTime += durationSec;
  }
}

const handlePlay = async () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // 🔥 REQUIRED for browsers
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  const allVoices = [
    ...treble,
    ...bass
  ];

  await Promise.all(
    allVoices.map(v => playVoice(v, audioCtx))
  );
};

  const keySig = KEY_SIGNATURES[selKey] || { sharps:[], flats:[] };

  const showToast = (msg, type='ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  const addNote = useCallback((clef, vi, nd) => {
    if (clef === 'treble') setTreble(p => { const n=p.map(v=>[...v]); n[vi]=[...n[vi],nd]; return n; });
    else                   setBass  (p => { const n=p.map(v=>[...v]); n[vi]=[...n[vi],nd]; return n; });
    showToast(`+ ${nd.note} → ${clef} V${vi+1}`);
  }, []);

  const deleteLast = useCallback((clef, vi) => {
    if (clef === 'treble') setTreble(p => { const n=p.map(v=>[...v]); if(n[vi].length) n[vi]=n[vi].slice(0,-1); return n; });
    else                   setBass  (p => { const n=p.map(v=>[...v]); if(n[vi].length) n[vi]=n[vi].slice(0,-1); return n; });
  }, []);

  const deleteExact = (clef, vi, ni) => {
    if (clef === 'treble') setTreble(p => { const n=p.map(v=>[...v]); n[vi]=n[vi].filter((_,i)=>i!==ni); return n; });
    else                   setBass  (p => { const n=p.map(v=>[...v]); n[vi]=n[vi].filter((_,i)=>i!==ni); return n; });
  };

  const clearAll = () => {
    if (!confirm('Clear all notes?')) return;
    setTreble([[], [], []]);
    setBass([[], [], []]);
    showToast('Cleared', 'err');
  };

  const generated = generateHeader(title, tempo, treble, bass);

  const downloadHeader = () => {
    const fname = title.toLowerCase().replace(/[^a-z0-9]/g,'_') + '.h';
    const blob = new Blob([generated], { type:'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    showToast(`Downloaded ${fname}`);
  };

  const pingServer = async () => {
    try {
      const r = await fetch(serverUrl.replace(/\/upload$/,'/ping'), { signal:AbortSignal.timeout(3000) });
      if (r.ok) { setFlashStatus('ok'); setFlashMsg('server reachable'); showToast('Server online!'); }
      else { setFlashStatus('err'); setFlashMsg(`HTTP ${r.status}`); }
    } catch { setFlashStatus('err'); setFlashMsg('cannot reach server'); showToast('Cannot reach server','err'); }
  };

  const sendToESP32 = async () => {
    const fname = title.toLowerCase().replace(/[^a-z0-9]/g,'_') + '.h';
    try {
      const r = await fetch(serverUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ header:generated, filename:fname }) });
      const data = await r.json();
      if (r.ok) { setFlashStatus('ok'); setFlashMsg('flash sent'); showToast(data.message||'Flashing…'); }
      else { setFlashStatus('err'); setFlashMsg(data.error||'error'); showToast('Error','err'); }
    } catch { setFlashStatus('err'); setFlashMsg('send failed'); showToast('Is esp32_server.py running?','err'); }
  };

  return (
    <div style={{ background:'#0f0f14', minHeight:'100vh', color:'#dddbe8' }}>

      {/* NAV */}
      <header style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'1rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'rgba(15,15,20,0.95)', backdropFilter:'blur(14px)', zIndex:100 }}>
        <button onClick={() => { window.scrollTo({top:0}); setCurrentPage('home'); }}
          style={{ ...M, display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem', color:'#6b697a', background:'none', border:'none', cursor:'pointer', letterSpacing:'0.05em' }}
          onMouseEnter={e=>e.currentTarget.style.color='#c8a96e'}
          onMouseLeave={e=>e.currentTarget.style.color='#6b697a'}
        >
          <ArrowLeft size={13} /> back
        </button>
        <span style={{ ...M, fontSize:'0.72rem', color:'#c8a96e', letterSpacing:'0.12em', opacity:0.85 }}>BUZZER_COMPOSER</span>
        <span style={{ ...M, fontSize:'0.62rem', color:'#3a3855' }}>6-ch ESP32</span>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 1.5rem 5rem' }}>

        {/* HERO */}
        <div style={{ padding:'2.5rem 0 1.75rem', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:'1.5rem' }}>
          <div style={{ ...M, fontSize:'0.6rem', color:'#c8a96e', letterSpacing:'0.2em', marginBottom:'0.5rem' }}>// project / esp32-music</div>
          <h1 style={{ ...S, fontSize:'clamp(1.5rem,4vw,2.2rem)', fontWeight:700, lineHeight:1.1, marginBottom:'0.55rem' }}>
            Buzzer <span style={{ color:'#c8a96e' }}>Composer</span>
          </h1>
          <p style={{ ...M, fontSize:'0.75rem', color:'#5a5875', lineHeight:1.75, maxWidth:520 }}>
            Click the staff to place notes · Right-click = undo last note in active voice
          </p>
        </div>

        {/* SETTINGS */}
        <div style={{ background:'#1a1a20', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'1rem 1.2rem', marginBottom:'1rem' }}>
          <SectionLabel>Song Settings</SectionLabel>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>TITLE</span>
              <input value={title} onChange={e=>setTitle(e.target.value)}
                style={{ ...M, fontSize:'0.72rem', background:'#0f0f14', border:'1px solid rgba(255,255,255,0.12)', color:'#dddbe8', padding:'0.32rem 0.55rem', borderRadius:4, width:140, outline:'none' }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>TEMPO</span>
              <input type="number" value={tempo} min={40} max={300} onChange={e=>setTempo(Number(e.target.value))}
                style={{ ...M, fontSize:'0.72rem', background:'#0f0f14', border:'1px solid rgba(255,255,255,0.12)', color:'#dddbe8', padding:'0.32rem 0.55rem', borderRadius:4, width:60, outline:'none' }} />
              <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>BPM</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>KEY</span>
              <select value={selKey} onChange={e=>setSelKey(e.target.value)}
                style={{ ...M, fontSize:'0.7rem', background:'#0f0f14', border:'1px solid rgba(255,255,255,0.12)', color:'#dddbe8', padding:'0.32rem 0.55rem', borderRadius:4, outline:'none', cursor:'pointer' }}>
                {Object.keys(KEY_SIGNATURES).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* NOTE PROPERTIES */}
        <div style={{ background:'#1a1a20', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'1rem 1.2rem', marginBottom:'1.5rem' }}>
          <SectionLabel>Note Properties</SectionLabel>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>DURATION</span>
              <ToggleGroup options={DURATIONS} value={selDur} onChange={v=>setSelDur(Number(v))} />
            </div>
            <div style={{ width:1, height:20, background:'rgba(255,255,255,0.08)' }} />
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>ACC</span>
              <ToggleGroup options={ACCIDENTALS} value={selAcc} onChange={setSelAcc} />
            </div>
            <div style={{ width:1, height:20, background:'rgba(255,255,255,0.08)' }} />
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>ART</span>
              <ToggleGroup options={ARTICULATIONS} value={selArt} onChange={setSelArt} />
            </div>
          </div>
        </div>

        {/* TREBLE STAFF */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.45rem', flexWrap:'wrap' }}>
            <SectionLabel>Treble Clef</SectionLabel>
            <VoicePicker voices={treble} active={activeTreble} setActive={setActiveTreble} colors={TREBLE_COLORS} />
            <Btn small onClick={() => addNote('treble', activeTreble, { note:'Rest', duration:selDur, type:'reg', accidental:'natural' })}>+ Rest</Btn>
          </div>
          <StaffCanvas
            clef="treble" voicesNotes={treble} activeVoice={activeTreble}
            selDur={selDur} selArt={selArt} selAcc={selAcc} keySig={keySig}
            onAddNote={nd => addNote('treble', activeTreble, nd)}
            onDeleteNote={() => deleteLast('treble', activeTreble)}
          />
          <p style={{ ...M, fontSize:'0.57rem', color:'#2e2c40', marginTop:'0.3rem' }}>
            stems up · V{activeTreble+1} active · right-click = undo last
          </p>
        </div>

        {/* BASS STAFF */}
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.45rem', flexWrap:'wrap' }}>
            <SectionLabel>Bass Clef</SectionLabel>
            <VoicePicker voices={bass} active={activeBass} setActive={setActiveBass} colors={BASS_COLORS} />
            <Btn small onClick={() => addNote('bass', activeBass, { note:'Rest', duration:selDur, type:'reg', accidental:'natural' })}>+ Rest</Btn>
          </div>
          <StaffCanvas
            clef="bass" voicesNotes={bass} activeVoice={activeBass}
            selDur={selDur} selArt={selArt} selAcc={selAcc} keySig={keySig}
            onAddNote={nd => addNote('bass', activeBass, nd)}
            onDeleteNote={() => deleteLast('bass', activeBass)}
          />
          <p style={{ ...M, fontSize:'0.57rem', color:'#2e2c40', marginTop:'0.3rem' }}>
            stems down · V{activeBass+1} active · right-click = undo last
          </p>
        </div>

        {/* NOTE LISTS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'2rem' }}>
          {[['treble',treble,TREBLE_COLORS],['bass',bass,BASS_COLORS]].map(([clef,vs,colors]) => (
            <div key={clef} style={{ background:'#1a1a20', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, overflow:'hidden' }}>
              <div style={{ padding:'0.4rem 0.75rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ ...M, fontSize:'0.58rem', color:colors[0], letterSpacing:'0.1em' }}>{clef.toUpperCase()} NOTES</span>
                <span style={{ ...M, fontSize:'0.55rem', color:'#3a3855', marginLeft:'auto' }}>{vs.reduce((s,v)=>s+v.length,0)} total</span>
              </div>
              <NoteList voices={vs} clef={clef} onDelete={(vi,ni)=>deleteExact(clef,vi,ni)} />
            </div>
          ))}
        </div>

        {/* EXPORT */}
        <div style={{ background:'#1a1a20', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'1.2rem', marginBottom:'2rem' }}>
          <SectionLabel>Export & Deploy</SectionLabel>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:'0.75rem' }}>
            <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>SERVER</span>
            <input value={serverUrl} onChange={e=>setServerUrl(e.target.value)}
              style={{ ...M, fontSize:'0.7rem', background:'#0f0f14', border:'1px solid rgba(255,255,255,0.12)', color:'#dddbe8', padding:'0.32rem 0.6rem', borderRadius:4, width:255, outline:'none' }} />
            <Btn small onClick={pingServer}>Ping</Btn>
            <div style={{ width:7, height:7, borderRadius:'50%', background:flashStatus==='ok'?'#6ec88a':flashStatus==='err'?'#c86e6e':'#3a3855', flexShrink:0 }} />
            <span style={{ ...M, fontSize:'0.6rem', color:'#5a5875' }}>{flashMsg||'not connected'}</span>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <Btn primary onClick={sendToESP32}><Upload size={11} /> Flash to ESP32</Btn>
            <Btn success onClick={downloadHeader}><Download size={11} /> Download .h</Btn>
            <Btn onClick={handleExportHeader}>
  📥 Export .h
</Btn>

<Btn onClick={handleExportJSON}>
  📥 Export JSON
</Btn>
            <Btn onClick={() => setShowPreview(p => !p)}>{'{ }'} Preview</Btn>
            <Btn primary onClick={handlePlay}>
  ▶ Play
            </Btn>
            <Btn danger onClick={clearAll}><Trash2 size={11} /> Clear all</Btn>
          </div>
          {showPreview && (
            <pre style={{ ...M, fontSize:'0.6rem', color:'#5a5875', background:'#0f0f14', border:'1px solid rgba(255,255,255,0.06)', borderRadius:4, padding:'0.8rem', marginTop:'0.8rem', maxHeight:200, overflowY:'auto', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-all' }}>
              {generated}
            </pre>
          )}
        </div>

      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', background:'#1c1c26', border:`1px solid ${toast.type==='err'?'#c86e6e':'#6ec88a'}`, color:'#dddbe8', ...M, fontSize:'0.7rem', padding:'0.6rem 1rem', borderRadius:5, zIndex:9999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default BuzzerComposerPage;
