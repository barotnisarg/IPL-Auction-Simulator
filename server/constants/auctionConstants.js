// server/constants/auctionConstants.js

// All player roles used across the schema, squad validation, and the queue manager.
const PLAYER_ROLES = Object.freeze({
  BATTER: 'batter',
  ALL_ROUNDER: 'all-rounder',
  BOWLER: 'bowler',
  WICKETKEEPER: 'wicketkeeper',
});

// Roles that count toward the "5 bowling options" squad minimum.
const BOWLING_OPTION_ROLES = Object.freeze([
  PLAYER_ROLES.BOWLER,
  PLAYER_ROLES.ALL_ROUNDER,
]);

// Active-bidding phases. Room.status will reuse these exact string values
// for its lifecycle enum (alongside non-bidding states like "lobby").
const AUCTION_CATEGORIES = Object.freeze({
  MARQUEE: 'marquee',
  POOL_1: 'pool1',
  POOL_2: 'pool2',
  MINI_AUCTION: 'mini-auction',
});

// All monetary values in this system are stored as integer Lakhs
// (1 Crore = 100 Lakhs) to avoid floating-point rounding errors.
const LAKHS_PER_CRORE = 100;

const STARTING_BUDGET_LAKHS = 100 * LAKHS_PER_CRORE; // 100 Crores per team

const MAX_SQUAD_SIZE = 11;
const MIN_BOWLING_OPTIONS = 5;
const MIN_WICKETKEEPERS = 1;

const BASE_PRICE_LAKHS = Object.freeze({
  [AUCTION_CATEGORIES.MARQUEE]: 2 * LAKHS_PER_CRORE,   // 2 Cr
  [AUCTION_CATEGORIES.POOL_1]: 1 * LAKHS_PER_CRORE,    // 1 Cr
  [AUCTION_CATEGORIES.POOL_2]: 50,                     // 50 Lakhs
  [AUCTION_CATEGORIES.MINI_AUCTION]: 20,                // 20 Lakhs
});

// Increment that applies while the current bid is below `upToLakhs` (exclusive).
// Tiers are checked in order; the last tier (upToLakhs: null) is the catch-all
// for everything at or above the previous threshold.
const BID_INCREMENT_TIERS = Object.freeze([
  { upToLakhs: 1 * LAKHS_PER_CRORE, incrementLakhs: 10 },    // below 1 Cr -> +10 Lakhs
  { upToLakhs: 2 * LAKHS_PER_CRORE, incrementLakhs: 25 },    // 1 Cr to <2 Cr -> +25 Lakhs
  { upToLakhs: 5 * LAKHS_PER_CRORE, incrementLakhs: 50 },    // 2 Cr to <5 Cr -> +50 Lakhs
  { upToLakhs: null, incrementLakhs: 1 * LAKHS_PER_CRORE },  // 5 Cr and above -> +1 Cr
]);

const BID_TIMER_SECONDS = 7;

// How long the server waits before starting the next player's timer, to
// match the client-side outcome overlay (OUTCOME_DISPLAY_MS in
// AuctionPlayerCard.jsx). Without this delay the timer starts immediately
// after PLAYER_SOLD/PLAYER_UNSOLD is emitted — the overlay hides the
// countdown for its full 2.5 s, so users only see ~4.5 s of actual bidding
// time. The delay means the timer only begins once the overlay has cleared.
const OUTCOME_OVERLAY_MS = 2500;

// How long the server waits before starting the FIRST player's timer when
// a brand-new category begins. Users need time to check the player list.
// Subsequent players within the same category use OUTCOME_OVERLAY_MS.
const CATEGORY_INTRO_MS = 5000;

const UNSOLD_SELECTION_TIMER_SECONDS = 5 * 60; // 5 minutes

module.exports = {
  PLAYER_ROLES,
  BOWLING_OPTION_ROLES,
  AUCTION_CATEGORIES,
  LAKHS_PER_CRORE,
  STARTING_BUDGET_LAKHS,
  MAX_SQUAD_SIZE,
  MIN_BOWLING_OPTIONS,
  MIN_WICKETKEEPERS,
  BASE_PRICE_LAKHS,
  BID_INCREMENT_TIERS,
  BID_TIMER_SECONDS,
  OUTCOME_OVERLAY_MS,
  CATEGORY_INTRO_MS,
  UNSOLD_SELECTION_TIMER_SECONDS,
};