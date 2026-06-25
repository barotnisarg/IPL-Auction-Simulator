// server/services/auctionEngine/AuctionEngine.js

const { EventEmitter } = require('events');

const {
  AUCTION_CATEGORIES,
  PLAYER_ROLES,
  BOWLING_OPTION_ROLES,
  BID_TIMER_SECONDS,
  MAX_SQUAD_SIZE,
  STARTING_BUDGET_LAKHS,
} = require('../../constants/auctionConstants');
const { ROOM_STATUS, MIN_PLAYERS_PER_ROOM } = require('../../constants/roomConstants');

const BidHistory = require('../../models/BidHistory');
const bidService = require('../bidService');
const playerQueueManager = require('./playerQueueManager');
const { startCountdown } = require('./timerManager');

class AuctionEngine extends EventEmitter {
  constructor({ room, teams }) {
    super();

    this.room = room;
    this.teamsById = new Map(teams.map((team) => [team._id.toString(), team]));

    this.currentCategory = null;
    this.currentRoleSubPhase = room.currentRoleSubPhase || null;
    this.queue = [];
    this.roleBlocks = null;
    this.roleBlockIndex = 0;

    this.currentPlayer = null;
    this.currentBidLakhs = null;
    this.highestBidderTeamId = null;
    this.skippedTeamIds = new Set();

    this.isPaused = false;
    this.timerHandle = null;
    this.pausedSecondsRemaining = null;
  }

  // ---------------------------------------------------------------------
  // Host-triggered actions (called by auctionSocketHandlers.js after it
  // has already verified the caller is the host)
  // ---------------------------------------------------------------------

  async start() {
    if (this.room.status !== ROOM_STATUS.LOBBY) {
      const error = new Error('The auction has already started.');
      error.statusCode = 409;
      throw error;
    }

    if (this.teamsById.size < MIN_PLAYERS_PER_ROOM) {
      const error = new Error(`At least ${MIN_PLAYERS_PER_ROOM} teams are required to start.`);
      error.statusCode = 409;
      throw error;
    }

    this.currentCategory = AUCTION_CATEGORIES.MARQUEE;
    this.room.status = AUCTION_CATEGORIES.MARQUEE;
    this.queue = await playerQueueManager.buildMarqueeQueue(this._getAuctionedPlayerIds());
    this.roleBlocks = null;
    this.roleBlockIndex = 0;
    this.currentRoleSubPhase = null;
    this.room.currentRoleSubPhase = null;

    await this.room.save();
    this.emit('category-started', this._getCategorySnapshot());

    await this._loadNextPlayer();
  }

  pause() {
    if (this.isPaused || !this.timerHandle) {
      return;
    }

    this.pausedSecondsRemaining = this.timerHandle.getSecondsRemaining();
    this.timerHandle.stop();
    this.timerHandle = null;
    this.isPaused = true;

    this.emit('state-update', this.getStateSnapshot());
  }

  resume() {
    if (!this.isPaused) {
      return;
    }

    this.isPaused = false;
    this._startTimer(this.pausedSecondsRemaining ?? BID_TIMER_SECONDS);

    this.emit('state-update', this.getStateSnapshot());
  }

  // Wipes every sale, every budget, and the bid log — returns the room to
  // the Lobby so the host can start over. See explanation below for why
  // this specific behavior was chosen over alternatives.
  async restart() {
    this.timerHandle?.stop();
    this.timerHandle = null;
    this.currentPlayer = null;
    this.currentBidLakhs = null;
    this.highestBidderTeamId = null;
    this.skippedTeamIds = new Set();
    this.isPaused = false;
    this.queue = [];
    this.roleBlocks = null;
    this.roleBlockIndex = 0;
    this.currentCategory = null;
    this.currentRoleSubPhase = null;

    this.room.status = ROOM_STATUS.LOBBY;
    this.room.currentRoleSubPhase = null;
    this.room.auctionLog = [];
    await this.room.save();

    await BidHistory.deleteMany({ roomId: this.room._id });

    for (const team of this.teamsById.values()) {
      team.budgetRemainingLakhs = STARTING_BUDGET_LAKHS;
      team.squad = [];
      await team.save();
    }

    this.emit('state-update', this.getStateSnapshot());
  }

  // Ends immediately. Whoever is currently up for bid is left unrecorded —
  // see explanation below.
  async end() {
    this.timerHandle?.stop();
    this.timerHandle = null;
    this.currentPlayer = null;

    this.room.status = ROOM_STATUS.COMPLETED;
    await this.room.save();

    this.emit('ended', this.getStateSnapshot());
  }

  // ---------------------------------------------------------------------
  // Team-triggered actions
  // ---------------------------------------------------------------------

  async placeBid(teamId) {
    this._assertActivePlayer();

    const team = this._getTeamOrThrow(teamId);
    const nextBidLakhs = bidService.validateBid({
      team,
      player: this.currentPlayer,
      currentBidLakhs: this.currentBidLakhs,
      highestBidderTeamId: this.highestBidderTeamId,
    });

    // State is mutated synchronously, before any await below. Two bids
    // arriving back-to-back can't corrupt "who's winning" — by the time
    // either call yields control, its decision is already committed.
    this.currentBidLakhs = nextBidLakhs;
    this.highestBidderTeamId = team._id;
    this.skippedTeamIds = new Set();

    await BidHistory.create({
      roomId: this.room._id,
      playerId: this.currentPlayer._id,
      teamId: team._id,
      bidAmountLakhs: nextBidLakhs,
      category: this.currentCategory,
      roleSubPhase: this.currentRoleSubPhase,
    });

    this._startTimer(BID_TIMER_SECONDS);
    this.emit('state-update', this.getStateSnapshot());

    await this._checkAutoResolve();
  }

  async skipBid(teamId) {
    this._assertActivePlayer();

    const team = this._getTeamOrThrow(teamId);

    if (this.highestBidderTeamId && team._id.toString() === this.highestBidderTeamId.toString()) {
      const error = new Error('You are already the highest bidder and cannot skip.');
      error.statusCode = 409;
      throw error;
    }

    this.skippedTeamIds.add(team._id.toString());
    this.emit('state-update', this.getStateSnapshot());

    await this._checkAutoResolve();
  }

  // ---------------------------------------------------------------------
  // Public hook for unsoldRoundManager.js (Phase 9)
  // ---------------------------------------------------------------------

  async beginMiniAuction(playerQueue) {
    this.currentCategory = AUCTION_CATEGORIES.MINI_AUCTION;
    this.room.status = AUCTION_CATEGORIES.MINI_AUCTION;
    this.queue = [...playerQueue];
    this.roleBlocks = null;
    this.roleBlockIndex = 0;

    await this.room.save();
    this.emit('category-started', this._getCategorySnapshot());

    await this._loadNextPlayer();
  }

  // ---------------------------------------------------------------------
  // Snapshot builders (public — also used by auctionSocketHandlers.js to
  // answer a fresh JOIN with current state, not just future broadcasts)
  // ---------------------------------------------------------------------

  getStateSnapshot() {
    return {
      roomId: this.room._id,
      status: this.room.status,
      currentRoleSubPhase: this.currentRoleSubPhase,
      currentPlayer: this.currentPlayer,
      currentBidLakhs: this.currentBidLakhs,
      highestBidderTeamId: this.highestBidderTeamId,
      secondsRemaining: this.timerHandle ? this.timerHandle.getSecondsRemaining() : null,
      isPaused: this.isPaused,
      teams: this._getTeamSummaries(),
    };
  }

  // ---------------------------------------------------------------------
  // Internal mechanics
  // ---------------------------------------------------------------------

  _startTimer(durationSeconds) {
    this.timerHandle = startCountdown({
      durationSeconds,
      onTick: (secondsRemaining) => {
        this.emit('timer-tick', { secondsRemaining });
      },
      onExpire: () => {
        this._resolveCurrentPlayer().catch((error) => {
          this.emit('error', { message: error.message });
        });
      },
    });
  }

  _assertActivePlayer() {
    if (!this.currentPlayer) {
      const error = new Error('No player is currently up for auction.');
      error.statusCode = 409;
      throw error;
    }

    if (this.isPaused) {
      const error = new Error('The auction is currently paused.');
      error.statusCode = 409;
      throw error;
    }
  }

  _getTeamOrThrow(teamId) {
    const team = this.teamsById.get(teamId.toString());

    if (!team) {
      const error = new Error('Team not found in this room.');
      error.statusCode = 404;
      throw error;
    }

    return team;
  }

  _getAuctionedPlayerIds() {
    return this.room.auctionLog.map((entry) => entry.playerId);
  }

  // A team is "eligible" to still act on the current player if they have
  // an open squad slot and can afford the next legal bid. Ineligible teams
  // are treated as already-skipped for quorum purposes below, so the
  // auction can never stall waiting on a team that structurally can't act.
  _getEligibleTeamIds() {
    const nextBidLakhs = bidService.calculateNextBidLakhs(
      this.currentBidLakhs,
      this.currentPlayer.basePriceLakhs
    );

    return Array.from(this.teamsById.values())
      .filter((team) => team.squad.length < MAX_SQUAD_SIZE && team.budgetRemainingLakhs >= nextBidLakhs)
      .map((team) => team._id.toString());
  }

  // The "everyone skips" rule: resolves immediately, without waiting for
  // the timer, once every eligible team other than the current highest
  // bidder has explicitly skipped at this price level.
  async _checkAutoResolve() {
    if (!this.currentPlayer) {
      return;
    }

    const eligibleTeamIds = this._getEligibleTeamIds();
    const teamsThatMustAct = eligibleTeamIds.filter(
      (id) => id !== this.highestBidderTeamId?.toString()
    );
    const allHaveSkipped = teamsThatMustAct.every((id) => this.skippedTeamIds.has(id));

    if (teamsThatMustAct.length === 0 || allHaveSkipped) {
      await this._resolveCurrentPlayer();
    }
  }

  async _resolveCurrentPlayer() {
    this.timerHandle?.stop();
    this.timerHandle = null;

    if (this.currentBidLakhs !== null && this.highestBidderTeamId) {
      await this._sellCurrentPlayer();
    } else {
      await this._markCurrentPlayerUnsold();
    }

    await this._loadNextPlayer();
  }

  async _sellCurrentPlayer() {
    const team = this.teamsById.get(this.highestBidderTeamId.toString());

    team.budgetRemainingLakhs -= this.currentBidLakhs;
    team.squad.push({
      playerId: this.currentPlayer._id,
      role: this.currentPlayer.role,
      category: this.currentCategory,
      purchasePriceLakhs: this.currentBidLakhs,
    });
    await team.save();

    this.room.auctionLog.push({
      playerId: this.currentPlayer._id,
      category: this.currentCategory,
      roleSubPhase: this.currentRoleSubPhase,
      result: 'sold',
      finalPriceLakhs: this.currentBidLakhs,
      teamId: team._id,
    });
    await this.room.save();

    this.emit('player-sold', {
      player: this.currentPlayer,
      team,
      priceLakhs: this.currentBidLakhs,
    });
  }

  async _markCurrentPlayerUnsold() {
    this.room.auctionLog.push({
      playerId: this.currentPlayer._id,
      category: this.currentCategory,
      roleSubPhase: this.currentRoleSubPhase,
      result: 'unsold',
    });
    await this.room.save();

    this.emit('player-unsold', { player: this.currentPlayer });
  }

  async _loadNextPlayer() {
    const nextPlayer = this._pullFromCurrentQueue();

    if (nextPlayer) {
      await this._beginBiddingOn(nextPlayer);
      return;
    }

    const hasMorePhases = await this._advanceToNextPhase();

    if (hasMorePhases) {
      await this._loadNextPlayer();
    }
  }

  _pullFromCurrentQueue() {
    if (
      this.currentCategory === AUCTION_CATEGORIES.POOL_1 ||
      this.currentCategory === AUCTION_CATEGORIES.POOL_2
    ) {
      const block = this.roleBlocks[this.roleBlockIndex];
      return block && block.queue.length > 0 ? block.queue.shift() : null;
    }

    // Marquee and Mini-Auction: one flat, mixed-role queue.
    return this.queue.length > 0 ? this.queue.shift() : null;
  }

  async _beginBiddingOn(player) {
    this.currentPlayer = player;
    this.currentBidLakhs = null;
    this.highestBidderTeamId = null;
    this.skippedTeamIds = new Set();

    this._startTimer(BID_TIMER_SECONDS);
    this.emit('state-update', this.getStateSnapshot());

    await this._checkAutoResolve();
  }

  async _advanceToNextPhase() {
    if (this.currentCategory === AUCTION_CATEGORIES.MARQUEE) {
      await this._enterPool(AUCTION_CATEGORIES.POOL_1);
      return true;
    }

    if (this.currentCategory === AUCTION_CATEGORIES.POOL_1) {
      this.roleBlockIndex += 1;

      if (this.roleBlockIndex < this.roleBlocks.length) {
        await this._enterNextRoleBlock();
        return true;
      }

      await this._enterPool(AUCTION_CATEGORIES.POOL_2);
      return true;
    }

    if (this.currentCategory === AUCTION_CATEGORIES.POOL_2) {
      this.roleBlockIndex += 1;

      if (this.roleBlockIndex < this.roleBlocks.length) {
        await this._enterNextRoleBlock();
        return true;
      }

      await this._enterUnsoldSelection();
      return false; // Engine goes idle until Phase 9 calls beginMiniAuction.
    }

    if (this.currentCategory === AUCTION_CATEGORIES.MINI_AUCTION) {
      await this._completeAuction();
      return false;
    }

    return false;
  }

  async _enterPool(category) {
    this.currentCategory = category;
    this.room.status = category;
    this.roleBlocks = await playerQueueManager.buildPoolRoleBlocks(
      category,
      this._getAuctionedPlayerIds()
    );
    this.roleBlockIndex = 0;
    this.currentRoleSubPhase = this.roleBlocks[0]?.role ?? null;
    this.room.currentRoleSubPhase = this.currentRoleSubPhase;

    await this.room.save();
    this.emit('category-started', this._getCategorySnapshot());
  }

  async _enterNextRoleBlock() {
    this.currentRoleSubPhase = this.roleBlocks[this.roleBlockIndex].role;
    this.room.currentRoleSubPhase = this.currentRoleSubPhase;

    await this.room.save();
    this.emit('category-started', this._getCategorySnapshot());
  }

  async _enterUnsoldSelection() {
    this.currentPlayer = null;
    this.currentBidLakhs = null;
    this.highestBidderTeamId = null;
    this.skippedTeamIds = new Set();
    this.currentRoleSubPhase = null;

    this.room.status = ROOM_STATUS.UNSOLD_SELECTION;
    this.room.currentRoleSubPhase = null;

    await this.room.save();
    this.emit('category-started', this._getCategorySnapshot());
  }

  async _completeAuction() {
    this.currentPlayer = null;
    this.room.status = ROOM_STATUS.COMPLETED;

    await this.room.save();
    this.emit('ended', this.getStateSnapshot());
  }

  _getTeamSummaries() {
    return Array.from(this.teamsById.values()).map((team) => {
      const bowlingOptionsCount = team.squad.filter((entry) =>
        BOWLING_OPTION_ROLES.includes(entry.role)
      ).length;
      const wicketkeeperCount = team.squad.filter(
        (entry) => entry.role === PLAYER_ROLES.WICKETKEEPER
      ).length;

      return {
        teamId: team._id,
        teamName: team.teamName,
        budgetRemainingLakhs: team.budgetRemainingLakhs,
        squadSize: team.squad.length,
        bowlingOptionsCount,
        wicketkeeperCount,
      };
    });
  }

  _getCategorySnapshot() {
    return {
      category: this.currentCategory,
      roleSubPhase: this.currentRoleSubPhase,
    };
  }
}

module.exports = AuctionEngine;