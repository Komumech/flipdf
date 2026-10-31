import { FlipbookPage, DocumentInfo } from '../types';

export interface SampleDocMeta {
  info: DocumentInfo;
  generatePages: () => FlipbookPage[];
}

function createPageCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

// 1. "The Architecture of Silence"
function generateArchitecturePages(): FlipbookPage[] {
  const width = 1000;
  const height = 1400;
  const pages: FlipbookPage[] = [];

  // Page 1: Minimalist Cover
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    // Background: warm natural paper
    ctx.fillStyle = '#F7F6F3';
    ctx.fillRect(0, 0, width, height);

    // Subtle paper edge bleed line
    ctx.strokeStyle = '#E8E6DF';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Header label
    ctx.fillStyle = '#78716C';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('ARCHITECTURAL MONOGRAPH / VOL. 14', 100, 160);

    // Title
    ctx.fillStyle = '#1C1917';
    ctx.font = '300 68px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '-1px';
    ctx.fillText('The Architecture', 100, 360);
    ctx.fillText('of Silence', 100, 440);

    // Subtitle
    ctx.fillStyle = '#57534E';
    ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Monastic Proportion, Daylight & Tactile Form', 100, 520);

    // Minimal geometric architectural drawing
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 640, 800, 480);

    ctx.strokeStyle = '#D6D3D1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 880);
    ctx.lineTo(900, 880);
    ctx.moveTo(500, 640);
    ctx.lineTo(500, 1120);
    ctx.stroke();

    // Golden ratio circle in center
    ctx.beginPath();
    ctx.arc(500, 880, 140, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#78716C';
    ctx.font = '400 16px "Plus Jakarta Sans", monospace';
    ctx.fillText('FIG. 01 — PLAN ELEVATION: COURTYARD AXIS', 100, 1160);

    // Footer
    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ZURICH & KYOTO EDITIONS', 100, 1280);
    ctx.fillText('01', width - 140, 1280);

    pages.push({ pageNumber: 1, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // Page 2: Inside Cover & Preface
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#FBFBFA';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#78716C';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('PREFACE', 120, 180);

    ctx.fillStyle = '#1C1917';
    ctx.font = '300 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('A Discipline of Space', 120, 260);

    ctx.fillStyle = '#44403C';
    ctx.font = '400 22px/1.8 "Plus Jakarta Sans", sans-serif';
    const lines = [
      'True architectural quietude does not happen by accident.',
      'It is the consequence of rigorous reduction—removing',
      'every component that exists merely to announce itself.',
      '',
      'When structural mass is positioned with deliberate restraint,',
      'daylight becomes an active material rather than an illumination source.',
      'The wall ceases to be a barrier; it becomes a canvas for the passing',
      'hours of the equinox.',
      '',
      'In this volume, we examine eight residences built between',
      '1964 and 2024 across the alpine slopes of the Engadin and',
      'the cedar groves of northern Kyoto.',
    ];
    let y = 360;
    for (const line of lines) {
      ctx.fillText(line, 120, y);
      y += 38;
    }

    // Small detail plate
    ctx.fillStyle = '#E7E5E4';
    ctx.fillRect(120, 920, 760, 240);
    ctx.fillStyle = '#57534E';
    ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('"To design a space is to decide what is allowed to touch the mind."', 160, 1020);
    ctx.fillStyle = '#78716C';
    ctx.font = '400 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('— Atelier K. Sonderegger, Basel', 160, 1060);

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('02', 120, 1280);

    pages.push({ pageNumber: 2, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // Page 3: Table of Contents & Structure
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#FBFBFA';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#78716C';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('CONTENTS', 120, 180);

    ctx.fillStyle = '#1C1917';
    ctx.font = '300 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Catalogue of Works', 120, 260);

    const contents = [
      { num: '01', title: 'The Pavilion at Valserberg', meta: 'Graubünden, 2,100m', page: '04' },
      { num: '02', title: 'Monolith House & Southern Terrace', meta: 'Ticino Valley', page: '08' },
      { num: '03', title: 'The Kamogawa Stone Cloister', meta: 'Northern Kyoto', page: '14' },
      { num: '04', title: 'Timber Study in Larch & Basalt', meta: 'Engadin Alpine Pass', page: '22' },
      { num: '05', title: 'Material Studies: Raw Lime & Glass', meta: 'Technical Archive', page: '36' },
    ];

    let rowY = 380;
    contents.forEach((item) => {
      ctx.fillStyle = '#78716C';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.num, 120, rowY);

      ctx.fillStyle = '#1C1917';
      ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.title, 200, rowY);

      ctx.fillStyle = '#78716C';
      ctx.font = '400 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.meta, 200, rowY + 28);

      // Dotted leader
      ctx.strokeStyle = '#D6D3D1';
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(580, rowY - 6);
      ctx.lineTo(820, rowY - 6);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#1C1917';
      ctx.font = '500 20px "Plus Jakarta Sans", monospace';
      ctx.fillText(item.page, 840, rowY);

      rowY += 120;
    });

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('03', width - 140, 1280);

    pages.push({ pageNumber: 3, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // Page 4: Visual Spread 1
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#F5F4F0';
    ctx.fillRect(0, 0, width, height);

    // Architectural image canvas simulation
    ctx.fillStyle = '#E2E0D8';
    ctx.fillRect(100, 140, 800, 800);

    // Stylized concrete & light composition
    ctx.fillStyle = '#CAC7BE';
    ctx.beginPath();
    ctx.moveTo(100, 940);
    ctx.lineTo(540, 480);
    ctx.lineTo(900, 940);
    ctx.fill();

    ctx.fillStyle = '#D9D6CC';
    ctx.fillRect(100, 140, 440, 800);

    // Sharp light ray beam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(320, 140);
    ctx.lineTo(580, 140);
    ctx.lineTo(820, 940);
    ctx.lineTo(560, 940);
    ctx.fill();

    ctx.fillStyle = '#1C1917';
    ctx.font = '300 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('The Pavilion at Valserberg', 100, 1020);

    ctx.fillStyle = '#57534E';
    ctx.font = '400 19px/1.6 "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Natural quarried gneiss blocks laid in dry courses.', 100, 1070);
    ctx.fillText('Thermal inertia buffers the high-altitude morning freeze,', 100, 1105);
    ctx.fillText('releasing accumulated radiant warmth throughout dusk.', 100, 1140);

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('04', 100, 1280);

    pages.push({ pageNumber: 4, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // Page 5: Material Analysis
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#FBFBFA';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#78716C';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('MATERIAL ANALYSIS', 120, 180);

    ctx.fillStyle = '#1C1917';
    ctx.font = '300 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Gneiss, Larch & Lime Plaster', 120, 260);

    // 3 Material comparison blocks
    const materials = [
      { label: 'Vals Gneiss Slate', thick: '47mm split-face', rVal: 'R-2.8', shade: '#9E9D97' },
      { label: 'Heartwood Larch', thick: '32mm tongue-groove', rVal: 'R-1.9', shade: '#C8BA9F' },
      { label: 'Hydraulic Lime', thick: '18mm dual-coat float', rVal: 'R-0.6', shade: '#E3DFD4' },
    ];

    materials.forEach((mat, idx) => {
      const cardY = 360 + idx * 240;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E7E5E4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(120, cardY, 760, 190, 16);
      ctx.fill();
      ctx.stroke();

      // Color swatch swatch
      ctx.fillStyle = mat.shade;
      ctx.beginPath();
      ctx.roundRect(144, cardY + 25, 140, 140, 12);
      ctx.fill();

      // Info
      ctx.fillStyle = '#1C1917';
      ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(mat.label, 320, cardY + 65);

      ctx.fillStyle = '#57534E';
      ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Section Thickness: ${mat.thick}`, 320, cardY + 105);
      ctx.fillText(`Thermal Resistance: ${mat.rVal}`, 320, cardY + 140);
    });

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('05', width - 140, 1280);

    pages.push({ pageNumber: 5, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // Page 6: Typographic Essay
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#FBFBFA';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#78716C';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('ESSAY / SECTION 03', 120, 180);

    ctx.fillStyle = '#1C1917';
    ctx.font = '300 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('The Quiet Room', 120, 260);

    // Two column layout simulation
    ctx.fillStyle = '#44403C';
    ctx.font = '400 19px/1.8 "Plus Jakarta Sans", sans-serif';

    const col1 = [
      'In a world dominated by visual noise',
      'and relentless stimulation, space that',
      'makes no claim upon our attention has',
      'become the rarest luxury.',
      '',
      'When an architect removes the ornament,',
      'what remains is the quality of the cut,',
      'the tightness of the joinery, and the',
      'profound dignity of physical gravity.',
      '',
      'The quiet room asks for neither praise',
      'nor entertainment. It holds silence',
      'with poise, reflecting the seasons in',
      'unhurried measure.',
    ];

    const col2 = [
      'To build in this manner demands trust.',
      'One must resist the urge to fill every',
      'recess with utility or decorative distraction.',
      '',
      'A bench placed against a south-facing lime',
      'wall requires only light and shadow to',
      'fulfill its human purpose.',
      '',
      'Silence is not an absence of sound;',
      'it is the presence of attention,',
      'unburdened by urgency.',
      '',
      'Here, human thought settles naturally',
      'into calm equilibrium.',
    ];

    let y1 = 360;
    col1.forEach((l) => {
      ctx.fillText(l, 120, y1);
      y1 += 34;
    });

    let y2 = 360;
    col2.forEach((l) => {
      ctx.fillText(l, 520, y2);
      y2 += 34;
    });

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('06', 120, 1280);

    pages.push({ pageNumber: 6, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // Page 7: Photographic Spread
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#F5F4F0';
    ctx.fillRect(0, 0, width, height);

    // Main photo frame
    ctx.fillStyle = '#E8E6DF';
    ctx.fillRect(120, 160, 760, 720);

    // Shadow play simulation
    ctx.fillStyle = '#D6D3C9';
    ctx.beginPath();
    ctx.moveTo(120, 160);
    ctx.lineTo(880, 880);
    ctx.lineTo(120, 880);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(160, 200, 680, 640);

    ctx.fillStyle = '#1C1917';
    ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('The Kamogawa Stone Cloister', 120, 960);

    ctx.fillStyle = '#78716C';
    ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Hand-chiseled basalt basin capturing natural rainwater at dawn.', 120, 1000);
    ctx.fillText('Kyoto Prefecture, Japan. Photographed October 2024.', 120, 1030);

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('07', width - 140, 1280);

    pages.push({ pageNumber: 7, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // Page 8: Colophon & Back Cover
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#F7F6F3';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#78716C';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('COLOPHON & IMPRINT', 120, 360);

    ctx.fillStyle = '#1C1917';
    ctx.font = '300 40px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Folio Monograph 14', 120, 440);

    ctx.fillStyle = '#57534E';
    ctx.font = '400 20px/1.8 "Plus Jakarta Sans", sans-serif';
    const colophon = [
      'Published by Folio Press, Basel & Kyoto.',
      'Typeset in Swiss Geometric Grotesk.',
      'Bound with exposed thread spine in linen cloth.',
      'Printed on 140gsm uncoated wood-free Munken Pure.',
      'All rights reserved. Dedicated to quiet craft.',
    ];
    let cy = 540;
    colophon.forEach((item) => {
      ctx.fillText(item, 120, cy);
      cy += 40;
    });

    // Emblem mark
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(500, 960, 40, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(500, 920);
    ctx.lineTo(500, 1000);
    ctx.moveTo(460, 960);
    ctx.lineTo(540, 960);
    ctx.stroke();

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('08', 120, 1280);

    pages.push({ pageNumber: 8, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  return pages;
}

// 2. "Swiss Grid & Typography"
function generateTypographyPages(): FlipbookPage[] {
  const width = 1000;
  const height = 1400;
  const pages: FlipbookPage[] = [];

  // P1 Cover
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 84px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('GRID', 100, 240);
    ctx.fillText('SYSTEM', 100, 340);

    ctx.fillStyle = '#64748B';
    ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Modernist Principles of Page Architecture', 100, 420);

    // 8-column layout grid visualization
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.lineWidth = 1;
    for (let c = 0; c < 8; c++) {
      const colX = 100 + c * 105;
      ctx.strokeRect(colX, 520, 85, 680);
    }

    ctx.fillStyle = '#0F172A';
    ctx.font = '500 16px monospace';
    ctx.fillText('8-COLUMN RASTER: 85PX MODULE / 20PX GUTTER', 100, 1260);

    pages.push({ pageNumber: 1, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // P2 Hierarchy & Scale
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#64748B';
    ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SECTION 01 / HIERARCHY', 100, 160);

    ctx.fillStyle = '#0F172A';
    ctx.font = '600 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Contrast Without Clutter', 100, 240);

    ctx.fillStyle = '#334155';
    ctx.font = '400 22px/1.8 "Plus Jakarta Sans", sans-serif';
    const lines = [
      'The fundamental premise of Swiss design is clarity.',
      'Information must be organized logically before it can be styled.',
      'By adhering to a strict spatial baseline, elements align with',
      'predictable elegance across diverse screen dimensions.',
    ];
    let y = 340;
    lines.forEach((l) => {
      ctx.fillText(l, 100, y);
      y += 42;
    });

    // Typography scale demo
    const scales = [
      { tag: 'Display', size: '56px / Light' },
      { tag: 'Heading 1', size: '36px / Regular' },
      { tag: 'Heading 2', size: '24px / Medium' },
      { tag: 'Body', size: '16px / Regular' },
      { tag: 'Caption', size: '12px / Monospace' },
    ];
    let sy = 620;
    scales.forEach((item) => {
      ctx.fillStyle = '#64748B';
      ctx.font = '500 16px monospace';
      ctx.fillText(item.tag, 100, sy);

      ctx.fillStyle = '#0F172A';
      ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(item.size, 300, sy);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, sy + 25);
      ctx.lineTo(900, sy + 25);
      ctx.stroke();

      sy += 80;
    });

    pages.push({ pageNumber: 2, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // P3 Whitespace
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0F172A';
    ctx.font = '300 64px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Whitespace as Structure', 100, 360);

    ctx.fillStyle = '#475569';
    ctx.font = '400 22px/1.8 "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Margins are not empty voids awaiting decoration.', 100, 460);
    ctx.fillText('They are the architectural load-bearing beams of visual pacing.', 100, 505);

    // Center focal frame
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(100, 620, 800, 480);

    ctx.fillStyle = '#0F172A';
    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Active Negative Space Ratio: 42%', 140, 680);

    pages.push({ pageNumber: 3, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  // P4 Baseline Grid
  {
    const { canvas, ctx } = createPageCanvas(width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw 8px baseline grid rules in faint slate
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let r = 80; r < height - 80; r += 24) {
      ctx.beginPath();
      ctx.moveTo(80, r);
      ctx.lineTo(width - 80, r);
      ctx.stroke();
    }

    ctx.fillStyle = '#0F172A';
    ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('The 8px Mathematical Rhythm', 100, 200);

    ctx.fillStyle = '#334155';
    ctx.font = '400 20px/1.8 "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Every component, margin, padding, and lead line snaps', 100, 270);
    ctx.fillText('to the nearest integer divisor of the base coordinate system.', 100, 305);

    pages.push({ pageNumber: 4, dataUrl: canvas.toDataURL('image/jpeg', 0.92), width, height });
  }

  return pages;
}

export const SAMPLE_DOCUMENTS: { id: string; title: string; meta: string; totalPages: number; pages: FlipbookPage[] }[] = [
  {
    id: 'architecture-silence',
    title: 'The Architecture of Silence',
    meta: 'Architectural Monograph / 8 Pages',
    totalPages: 8,
    pages: generateArchitecturePages(),
  },
  {
    id: 'swiss-typography',
    title: 'Swiss Grid & Modernist Form',
    meta: 'Design Specimen / 4 Pages',
    totalPages: 4,
    pages: generateTypographyPages(),
  },
];
