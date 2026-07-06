// client/src/utils/pdfGenerator.js

import jsPDF from 'jspdf';
import { formatLakhsAsDisplay } from './formatCurrency';

// ── Constants ─────────────────────────────────────────────────────────────────
const MARGIN        = 14;
const PAGE_W        = 210; // A4 width mm
const CONTENT_W     = PAGE_W - MARGIN * 2;
const PAGE_H        = 297; // A4 height mm
const BREAK_Y       = PAGE_H - 20; // leave 20mm footer room

// Brand colours (same amber + neutral palette as the UI)
const COLOR_AMBER   = [212, 164, 60];   // amber-500
const COLOR_DARK    = [15,  23,  42];   // slate-900
const COLOR_MID     = [51,  65,  85];   // slate-700
const COLOR_LIGHT   = [148, 163, 184];  // slate-400
const COLOR_PALE    = [241, 245, 249];  // slate-100
const COLOR_WHITE   = [255, 255, 255];
const COLOR_EMERALD = [52,  211, 153];  // emerald-400
const COLOR_RED     = [248, 113, 113];  // red-400

const ROLE_LABELS = {
  batter:        'Batter',
  'all-rounder': 'All-Rounder',
  bowler:        'Bowler',
  wicketkeeper:  'Wicketkeeper',
};

// Roles that count toward the bowling-options requirement
const BOWLING_ROLES = ['bowler', 'all-rounder'];

const sanitizeFilename = (name) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ── Helpers ───────────────────────────────────────────────────────────────────
const setColor = (doc, rgb)       => doc.setTextColor(...rgb);
const setFill  = (doc, rgb)       => doc.setFillColor(...rgb);
const setDraw  = (doc, rgb)       => doc.setDrawColor(...rgb);

const bold   = (doc) => doc.setFont('helvetica', 'bold');
const normal = (doc) => doc.setFont('helvetica', 'normal');

// Right-aligned text helper
const textRight = (doc, text, rightEdge, y) => {
  const w = doc.getTextWidth(text);
  doc.text(text, rightEdge - w, y);
};

// Checks remaining space and adds a new page if needed, returning the new Y.
const maybePageBreak = (doc, y, needed = 8) => {
  if (y + needed > BREAK_Y) {
    doc.addPage();
    return MARGIN;
  }
  return y;
};

// ── Section: header banner ────────────────────────────────────────────────────
const drawHeader = (doc, team) => {
  // Dark background banner
  setFill(doc, COLOR_DARK);
  doc.rect(0, 0, PAGE_W, 38, 'F');

  // Amber left accent bar
  setFill(doc, COLOR_AMBER);
  doc.rect(0, 0, 4, 38, 'F');

  // Team name
  bold(doc);
  doc.setFontSize(20);
  setColor(doc, COLOR_WHITE);
  doc.text(team.teamName, MARGIN + 4, 16);

  // Owner + room tag on the right
  normal(doc);
  doc.setFontSize(9);
  setColor(doc, COLOR_LIGHT);
  const ownerName = team.userId?.name ?? 'Unknown Owner';
  textRight(doc, `Owner: ${ownerName}`, PAGE_W - MARGIN, 12);
  textRight(doc, 'CricBid · Squad Report', PAGE_W - MARGIN, 20);

  // Generated date
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  textRight(doc, `Generated: ${dateStr}`, PAGE_W - MARGIN, 28);

  return 38; // cursor Y after header
};

// ── Section: stat boxes ───────────────────────────────────────────────────────
const drawStatBoxes = (doc, team, y) => {
  y += 8;

  const totalSpent = team.squad.reduce((s, e) => s + e.purchasePriceLakhs, 0);
  const bowlingCount = team.squad.filter((e) => BOWLING_ROLES.includes(e.role)).length;
  const wkCount      = team.squad.filter((e) => e.role === 'wicketkeeper').length;

  const stats = [
    { label: 'Squad Size',       value: `${team.squad.length} / 11` },
    { label: 'Budget Remaining', value: formatLakhsAsDisplay(team.budgetRemainingLakhs) },
    { label: 'Total Spent',      value: formatLakhsAsDisplay(totalSpent) },
    { label: 'Bowling Options',  value: `${bowlingCount} / 5`, warn: bowlingCount < 5 },
    { label: 'Wicketkeepers',    value: `${wkCount} / 1`,    warn: wkCount < 1  },
  ];

  const boxW   = (CONTENT_W - (stats.length - 1) * 3) / stats.length;
  let   startX = MARGIN;

  stats.forEach((stat) => {
    // Box background
    setFill(doc, COLOR_PALE);
    doc.roundedRect(startX, y, boxW, 18, 2, 2, 'F');

    // Amber top edge
    setFill(doc, stat.warn ? COLOR_RED : COLOR_AMBER);
    doc.rect(startX, y, boxW, 1.5, 'F');

    // Value
    bold(doc);
    doc.setFontSize(11);
    setColor(doc, stat.warn ? [185, 28, 28] : COLOR_DARK);
    const vW = doc.getTextWidth(stat.value);
    doc.text(stat.value, startX + (boxW - vW) / 2, y + 9);

    // Label
    normal(doc);
    doc.setFontSize(7);
    setColor(doc, COLOR_MID);
    const lW = doc.getTextWidth(stat.label);
    doc.text(stat.label, startX + (boxW - lW) / 2, y + 15);

    startX += boxW + 3;
  });

  return y + 24;
};

// ── Section: squad table ──────────────────────────────────────────────────────
const drawSquadTable = (doc, team, y) => {
  y = maybePageBreak(doc, y, 16);
  y += 4;

  // Section heading
  bold(doc);
  doc.setFontSize(11);
  setColor(doc, COLOR_DARK);
  doc.text('Squad', MARGIN, y);

  // Underline
  y += 2;
  setDraw(doc, COLOR_AMBER);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, MARGIN + 20, y);
  doc.setLineWidth(0.2);
  y += 5;

  if (team.squad.length === 0) {
    normal(doc);
    doc.setFontSize(9);
    setColor(doc, COLOR_LIGHT);
    doc.text('No players purchased this auction.', MARGIN, y);
    return y + 8;
  }

  // Column layout
  const COL = {
    num:      { x: MARGIN,          w: 8  },
    name:     { x: MARGIN + 8,      w: 72 },
    role:     { x: MARGIN + 80,     w: 38 },
    category: { x: MARGIN + 118,    w: 28 },
    price:    { x: MARGIN + 146,    w: CONTENT_W - 146 },
  };

  // Table header row
  setFill(doc, COLOR_DARK);
  doc.rect(MARGIN, y, CONTENT_W, 7, 'F');

  bold(doc);
  doc.setFontSize(7.5);
  setColor(doc, COLOR_AMBER);

  doc.text('#',        COL.num.x + 1,      y + 5);
  doc.text('PLAYER',   COL.name.x,         y + 5);
  doc.text('ROLE',     COL.role.x,         y + 5);
  doc.text('CATEGORY', COL.category.x,     y + 5);
  textRight(doc, 'PRICE', MARGIN + CONTENT_W, y + 5);
  y += 9;

  // Player rows
  const CATEGORY_LABELS = {
    marquee:        'Marquee',
    pool1:          'Pool 1',
    pool2:          'Pool 2',
    'mini-auction': 'Mini',
  };

  team.squad.forEach((entry, i) => {
    y = maybePageBreak(doc, y, 8);

    const isEven = i % 2 === 0;

    // Alternating row background
    if (isEven) {
      setFill(doc, [248, 250, 252]); // near-white
    } else {
      setFill(doc, COLOR_WHITE);
    }
    doc.rect(MARGIN, y - 1, CONTENT_W, 7.5, 'F');

    const playerName  = entry.playerId?.name ?? 'Unknown';
    const roleLabel   = ROLE_LABELS[entry.role] ?? entry.role;
    const catLabel    = CATEGORY_LABELS[entry.category] ?? '';
    const priceStr    = formatLakhsAsDisplay(entry.purchasePriceLakhs);

    // Row number
    normal(doc);
    doc.setFontSize(7.5);
    setColor(doc, COLOR_LIGHT);
    doc.text(String(i + 1), COL.num.x + 1, y + 4.5);

    // Player name — bold
    bold(doc);
    doc.setFontSize(8.5);
    setColor(doc, COLOR_DARK);
    // Truncate long names to fit the column
    let displayName = playerName;
    while (doc.getTextWidth(displayName) > COL.name.w - 2 && displayName.length > 4) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== playerName) displayName += '…';
    doc.text(displayName, COL.name.x, y + 4.5);

    // Role — coloured pill via text only (jsPDF supports no real CSS)
    normal(doc);
    doc.setFontSize(7.5);
    const roleColor = {
      'Batter':       [14,  165, 233], // sky-500
      'All-Rounder':  [139, 92,  246], // violet-500
      'Bowler':       [34,  197, 94],  // green-500
      'Wicketkeeper': [245, 158, 11],  // amber-500
    }[roleLabel] ?? COLOR_MID;
    setColor(doc, roleColor);
    doc.text(roleLabel, COL.role.x, y + 4.5);

    // Category
    setColor(doc, COLOR_LIGHT);
    doc.setFontSize(7);
    doc.text(catLabel, COL.category.x, y + 4.5);

    // Price — right-aligned, amber
    bold(doc);
    doc.setFontSize(8.5);
    setColor(doc, COLOR_AMBER);
    textRight(doc, priceStr, MARGIN + CONTENT_W, y + 4.5);

    // Subtle bottom border
    setDraw(doc, [226, 232, 240]); // slate-200
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y + 6.5, MARGIN + CONTENT_W, y + 6.5);

    y += 7.5;
  });

  return y;
};

// ── Section: totals row ───────────────────────────────────────────────────────
const drawTotals = (doc, team, y) => {
  y = maybePageBreak(doc, y, 12);
  y += 3;

  const totalSpent = team.squad.reduce((s, e) => s + e.purchasePriceLakhs, 0);

  setFill(doc, COLOR_DARK);
  doc.rect(MARGIN, y, CONTENT_W, 9, 'F');

  bold(doc);
  doc.setFontSize(8.5);
  setColor(doc, COLOR_LIGHT);
  doc.text('TOTAL SPENT', MARGIN + 2, y + 6);

  setColor(doc, COLOR_AMBER);
  textRight(doc, formatLakhsAsDisplay(totalSpent), MARGIN + CONTENT_W - 2, y + 6);

  return y + 13;
};

// ── Section: page footer ──────────────────────────────────────────────────────
const drawFooter = (doc) => {
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);

    setFill(doc, COLOR_DARK);
    doc.rect(0, PAGE_H - 10, PAGE_W, 10, 'F');

    normal(doc);
    doc.setFontSize(7);
    setColor(doc, COLOR_MID);
    doc.text('CricBid — Real-time IPL Auction Simulator', MARGIN, PAGE_H - 4);

    setColor(doc, COLOR_AMBER);
    textRight(doc, `Page ${p} of ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 4);
  }
};

// ── Main export ───────────────────────────────────────────────────────────────
export const generateTeamPDF = (team) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawHeader(doc, team);
  y     = drawStatBoxes(doc, team, y);
  y     = drawSquadTable(doc, team, y);
        drawTotals(doc, team, y);
        drawFooter(doc);

  doc.save(`${sanitizeFilename(team.teamName)}-squad.pdf`);
};