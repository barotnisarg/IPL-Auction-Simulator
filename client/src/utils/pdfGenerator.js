// client/src/utils/pdfGenerator.js

import jsPDF from 'jspdf';

import { formatLakhsAsDisplay } from './formatCurrency';

const ROLE_DISPLAY_LABELS = {
  batter: 'Batter',
  'all-rounder': 'All-Rounder',
  bowler: 'Bowler',
  wicketkeeper: 'Wicketkeeper',
};

const PAGE_MARGIN = 14;
const LINE_HEIGHT = 7;
const PAGE_BREAK_THRESHOLD = 280; // mm — A4 height is 297mm

const sanitizeFilename = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Expects team.squad[i].playerId populated (name/role/country) — already
// guaranteed by teamService.js's existing patch. team.userId.name is read
// optimistically but NOT yet guaranteed — see explanation below.
export const generateTeamPDF = (team) => {
  const doc = new jsPDF();
  let cursorY = PAGE_MARGIN;

  const ownerName = team.userId?.name || 'Unknown Owner';
  const totalSpentLakhs = team.squad.reduce((sum, entry) => sum + entry.purchasePriceLakhs, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(team.teamName, PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Owner: ${ownerName}`, PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT;

  doc.text(`Budget Remaining: ${formatLakhsAsDisplay(team.budgetRemainingLakhs)}`, PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT;

  doc.text(`Total Amount Spent: ${formatLakhsAsDisplay(totalSpentLakhs)}`, PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Squad (${team.squad.length})`, PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT;

  doc.setFontSize(10);
  doc.text('Player', PAGE_MARGIN, cursorY);
  doc.text('Role', PAGE_MARGIN + 80, cursorY);
  doc.text('Price', PAGE_MARGIN + 130, cursorY);
  cursorY += 2;
  doc.setLineWidth(0.2);
  doc.line(PAGE_MARGIN, cursorY, 196, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');

  if (team.squad.length === 0) {
    doc.text('No players purchased.', PAGE_MARGIN, cursorY);
    cursorY += LINE_HEIGHT;
  } else {
    team.squad.forEach((entry) => {
      if (cursorY > PAGE_BREAK_THRESHOLD) {
        doc.addPage();
        cursorY = PAGE_MARGIN;
      }

      const playerName = entry.playerId?.name || 'Unknown Player';
      doc.text(playerName, PAGE_MARGIN, cursorY);
      doc.text(ROLE_DISPLAY_LABELS[entry.role] || entry.role, PAGE_MARGIN + 80, cursorY);
      doc.text(formatLakhsAsDisplay(entry.purchasePriceLakhs), PAGE_MARGIN + 130, cursorY);
      cursorY += LINE_HEIGHT;
    });
  }

  doc.save(`${sanitizeFilename(team.teamName)}-squad.pdf`);
};