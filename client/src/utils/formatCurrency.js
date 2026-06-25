// client/src/utils/formatCurrency.js

// Mirrors server/constants/auctionConstants.js's LAKHS_PER_CRORE. Re-declared
// here rather than imported — this is a basic unit-conversion fact (100
// lakhs in a crore), not an auction *rule* that could ever meaningfully
// change independently on one side of the client/server boundary, unlike
// the genuinely-mirrored gameplay constants elsewhere in this project.
const LAKHS_PER_CRORE = 100;

// The one function every other helper in this file builds on. Always
// returns a string with exactly the right unit and precision for the
// magnitude given — this is what every component should actually call.
export const formatLakhsAsDisplay = (amountLakhs) => {
  if (amountLakhs === null || amountLakhs === undefined) {
    return '—';
  }

  if (amountLakhs >= LAKHS_PER_CRORE) {
    const crores = amountLakhs / LAKHS_PER_CRORE;
    const formattedCrores = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2);
    return `₹${formattedCrores} Cr`;
  }

  return `₹${amountLakhs} L`;
};

// For places that need just the bare number with no currency symbol or
// unit suffix, still unit-aware (e.g. a compact table column with a
// separate "Cr" header) — kept genuinely distinct from the function above
// rather than asking every call site to strip the ₹ and unit back out.
export const formatLakhsAsNumber = (amountLakhs) => {
  if (amountLakhs === null || amountLakhs === undefined) {
    return '—';
  }

  if (amountLakhs >= LAKHS_PER_CRORE) {
    const crores = amountLakhs / LAKHS_PER_CRORE;
    return crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2);
  }

  return String(amountLakhs);
};

export const lakhsToCrores = (amountLakhs) => amountLakhs / LAKHS_PER_CRORE;