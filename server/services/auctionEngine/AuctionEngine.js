// server/services/auctionEngine/AuctionEngine.js

const { EventEmitter } = require("events");

const {
  AUCTION_CATEGORIES,
  PLAYER_ROLES,
  BOWLING_OPTION_ROLES,
  BID_TIMER_SECONDS,
  OUTCOME_OVERLAY_MS,
  CATEGORY_INTRO_MS,
  MAX_SQUAD_SIZE,
  STARTING_BUDGET_LAKHS,
} = require("../../constants/auctionConstants");
const {
  ROOM_STATUS,
  MIN_PLAYERS_PER_ROOM,
} = require("../../constants/roomConstants");

const BidHistory = require("../../models/BidHistory");
const bidService = require("../bidService");
const playerQueueManager = require("./playerQueueManager");
const { startCountdown } = require("./timerManager");

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

    this.lastCategorySnapshot = null;
  }

  async start() {
    if (this.room.status !== ROOM_STATUS.LOBBY) {
      const error = new Error("The auction has already started.");
      error.statusCode = 409;
      throw error;
    }

    if (this.teamsById.size < MIN_PLAYERS_PER_ROOM) {
      const error = new Error(
        `At least ${MIN_PLAYERS_PER_ROOM} teams are required to start.`
      );
      error.statusCode = 409;
      throw error;
    }

    this.currentCategory = AUCTION_CATEGORIES.MARQUEE;
    this.room.status = AUCTION_CATEGORIES.MARQUEE;
    this.queue = await playerQueueManager.buildMarqueeQueue(
      this._getAuctionedPlayerIds()
    );
    this.roleBlocks = null;
    this.roleBlockIndex = 0;
    this.currentRoleSubPhase = null;
    this.room.currentRoleSubPhase = null;

    await this.room.save();
    this.lastCategorySnapshot = this._getCategorySnapshot();
    this.emit("category-started", this.lastCategorySnapshot);

    // afterCategoryIntro: true — first player's timer waits CATEGORY_INTRO_MS
    // so users have time to view the player list before bidding begins.
    await this._loadNextPlayer({ afterCategoryIntro: true });
  }

  pause() {
    if (this.isPaused || !this.timerHandle) {
      return;
    }

    this.pausedSecondsRemaining = this.timerHandle.getSecondsRemaining();
    this.timerHandle.stop();
    this.timerHandle = null;
    this.isPaused = true;

    this.emit("state-update", this.getStateSnapshot());
  }

  resume() {
    if (!this.isPaused) {
      return;
    }

    this.isPaused = false;
    this._startTimer(this.pausedSecondsRemaining ?? BID_TIMER_SECONDS);

    this.emit("state-update", this.getStateSnapshot());
  }

  async restart() {
    this._stopTimer();
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
    this.lastCategorySnapshot = null;

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

    this.emit("state-update", this.getStateSnapshot());
  }

  async end() {
    this._stopTimer();
    this.currentPlayer = null;

    this.room.status = ROOM_STATUS.COMPLETED;
    await this.room.save();

    this.emit("ended", this.getStateSnapshot());
  }

  async placeBid(teamId) {
    this._assertActivePlayer();

    const team = this._getTeamOrThrow(teamId);
    const nextBidLakhs = bidService.validateBid({
      team,
      player: this.currentPlayer,
      currentBidLakhs: this.currentBidLakhs,
      highestBidderTeamId: this.highestBidderTeamId,
    });

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
    this.emit("state-update", this.getStateSnapshot());

    await this._checkAutoResolve();
  }

  async skipBid(teamId) {
    this._assertActivePlayer();

    const team = this._getTeamOrThrow(teamId);

    if (
      this.highestBidderTeamId &&
      team._id.toString() === this.highestBidderTeamId.toString()
    ) {
      const error = new Error(
        "You are already the highest bidder and cannot skip."
      );
      error.statusCode = 409;
      throw error;
    }

    this.skippedTeamIds.add(team._id.toString());
    this.emit("state-update", this.getStateSnapshot());

    await this._checkAutoResolve();
  }

  async beginMiniAuction(playerQueue) {
    this.currentCategory = AUCTION_CATEGORIES.MINI_AUCTION;
    this.room.status = AUCTION_CATEGORIES.MINI_AUCTION;
    this.queue = [...playerQueue];
    this.roleBlocks = null;
    this.roleBlockIndex = 0;

    await this.room.save();
    this.lastCategorySnapshot = this._getCategorySnapshot();
    this.emit("category-started", this.lastCategorySnapshot);

    await this._loadNextPlayer({ afterCategoryIntro: true });
  }

  getStateSnapshot() {
    return {
      roomId: this.room._id,
      status: this.room.status,
      currentRoleSubPhase: this.currentRoleSubPhase,
      currentPlayer: this.currentPlayer,
      currentBidLakhs: this.currentBidLakhs,
      highestBidderTeamId: this.highestBidderTeamId,
      secondsRemaining: this.timerHandle
        ? this.timerHandle.getSecondsRemaining()
        : null,
      isPaused: this.isPaused,
      teams: this._getTeamSummaries(),
      skippedTeamIds: Array.from(this.skippedTeamIds),
    };
  }

  _stopTimer() {
    if (this.timerHandle) {
      this.timerHandle.stop();
      this.timerHandle = null;
    }
  }

  _startTimer(durationSeconds) {
    this._stopTimer();

    this.timerHandle = startCountdown({
      durationSeconds,
      onTick: (secondsRemaining) => {
        this.emit("timer-tick", { secondsRemaining });
      },
      onExpire: () => {
        this._resolveCurrentPlayer().catch((error) => {
          this.emit("error", { message: error.message });
        });
      },
    });
  }

  _assertActivePlayer() {
    if (!this.currentPlayer) {
      const error = new Error("No player is currently up for auction.");
      error.statusCode = 409;
      throw error;
    }

    if (this.isPaused) {
      const error = new Error("The auction is currently paused.");
      error.statusCode = 409;
      throw error;
    }
  }

  _getTeamOrThrow(teamId) {
    const team = this.teamsById.get(teamId.toString());

    if (!team) {
      const error = new Error("Team not found in this room.");
      error.statusCode = 404;
      throw error;
    }

    return team;
  }

  _getAuctionedPlayerIds() {
    return this.room.auctionLog.map((entry) => entry.playerId);
  }

  _getEligibleTeamIds() {
    const nextBidLakhs = bidService.calculateNextBidLakhs(
      this.currentBidLakhs,
      this.currentPlayer.basePriceLakhs
    );

    return Array.from(this.teamsById.values())
      .filter(
        (team) =>
          team.squad.length < MAX_SQUAD_SIZE &&
          team.budgetRemainingLakhs >= nextBidLakhs
      )
      .map((team) => team._id.toString());
  }

  async _checkAutoResolve() {
    if (!this.currentPlayer) {
      return;
    }

    const eligibleTeamIds = this._getEligibleTeamIds();
    const teamsThatMustAct = eligibleTeamIds.filter(
      (id) => id !== this.highestBidderTeamId?.toString()
    );
    const allHaveSkipped = teamsThatMustAct.every((id) =>
      this.skippedTeamIds.has(id)
    );

    if (teamsThatMustAct.length === 0 || allHaveSkipped) {
      await this._resolveCurrentPlayer();
    }
  }

  async _resolveCurrentPlayer() {
    this._stopTimer();

    if (this.currentBidLakhs !== null && this.highestBidderTeamId) {
      await this._sellCurrentPlayer();
    } else {
      await this._markCurrentPlayerUnsold();
    }

    await this._loadNextPlayer({ afterResolution: true });
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
      result: "sold",
      finalPriceLakhs: this.currentBidLakhs,
      teamId: team._id,
    });
    await this.room.save();

    this.emit("player-sold", {
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
      result: "unsold",
    });
    await this.room.save();

    this.emit("player-unsold", { player: this.currentPlayer });
  }

  async _loadNextPlayer({
    afterResolution = false,
    afterCategoryIntro = false,
  } = {}) {
    const nextPlayer = this._pullFromCurrentQueue();

    if (nextPlayer) {
      // Broadcast a fresh category snapshot marking THIS player as the live
      // one being auctioned. The client merges this into its existing list
      // (rather than replacing it), so:
      //  - The very first player of the pool gets an explicit "live" marker
      //    instead of just silently appearing as currentPlayer with no
      //    indication in the list itself.
      //  - Every player who already finished earlier in this pool stays in
      //    the list with their sold/unsold result, instead of disappearing
      //    the moment the next player's snapshot is sent.
      this._emitCategoryUpdate(nextPlayer);

      await this._beginBiddingOn(nextPlayer, {
        afterResolution,
        afterCategoryIntro,
      });
      return;
    }

    // Queue is empty — advance to the next phase.
    // IMPORTANT: _enterPool and _enterNextRoleBlock are SELF-CONTAINED:
    // they call _loadNextPlayer internally with the correct flags, then
    // return. So _advanceToNextPhase returns false for those cases to
    // prevent this caller from also calling _loadNextPlayer and double-
    // loading the first player.
    await this._advanceToNextPhase();
  }

  // Emits a category-started update carrying ONLY the still-pending players
  // plus the one now live (marked isCurrentlyAuctioning: true). This is
  // intentionally a partial list — the client's applyCategoryStarted reducer
  // merges it into the existing roster by _id rather than replacing it, so
  // players who already sold/went unsold earlier in this pool are preserved.
  _emitCategoryUpdate(currentlyAuctioning) {
    const snapshot = this._getCategorySnapshot(currentlyAuctioning);
    this.lastCategorySnapshot = snapshot;
    this.emit("category-started", snapshot);
  }

  _pullFromCurrentQueue() {
    if (
      this.currentCategory === AUCTION_CATEGORIES.POOL_1 ||
      this.currentCategory === AUCTION_CATEGORIES.POOL_2
    ) {
      const block = this.roleBlocks[this.roleBlockIndex];
      return block && block.queue.length > 0 ? block.queue.shift() : null;
    }

    return this.queue.length > 0 ? this.queue.shift() : null;
  }

  async _beginBiddingOn(
    player,
    { afterResolution = false, afterCategoryIntro = false } = {}
  ) {
    this.currentPlayer = player;
    this.currentBidLakhs = null;
    this.highestBidderTeamId = null;
    this.skippedTeamIds = new Set();

    this.emit("state-update", this.getStateSnapshot());

    if (afterCategoryIntro) {
      await new Promise((resolve) => setTimeout(resolve, CATEGORY_INTRO_MS));
    } else if (afterResolution) {
      await new Promise((resolve) => setTimeout(resolve, OUTCOME_OVERLAY_MS));
    }

    this._startTimer(BID_TIMER_SECONDS);
    this.emit("state-update", this.getStateSnapshot());
  }

  async _advanceToNextPhase() {
    if (this.currentCategory === AUCTION_CATEGORIES.MARQUEE) {
      // _enterPool is self-contained — it emits category-started, then
      // calls _loadNextPlayer({ afterCategoryIntro: true }) internally.
      // We do NOT call _loadNextPlayer here to avoid double-loading.
      await this._enterPool(AUCTION_CATEGORIES.POOL_1);
      return;
    }

    if (this.currentCategory === AUCTION_CATEGORIES.POOL_1) {
      this.roleBlockIndex += 1;

      if (this.roleBlockIndex < this.roleBlocks.length) {
        // _enterNextRoleBlock is self-contained — it silently updates the
        // role sub-phase and calls _loadNextPlayer() internally (no intro
        // delay between role blocks within the same pool).
        await this._enterNextRoleBlock();
        return;
      }

      await this._enterPool(AUCTION_CATEGORIES.POOL_2);
      return;
    }

    if (this.currentCategory === AUCTION_CATEGORIES.POOL_2) {
      this.roleBlockIndex += 1;

      if (this.roleBlockIndex < this.roleBlocks.length) {
        await this._enterNextRoleBlock();
        return;
      }

      await this._enterUnsoldSelection();
      return;
    }

    if (this.currentCategory === AUCTION_CATEGORIES.MINI_AUCTION) {
      await this._completeAuction();
      return;
    }
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

  // Pass null explicitly so the snapshot is built with NO currently-
  // auctioning player. At this exact moment this.currentPlayer still
  // holds the last player from the previous pool — using it as the
  // fallback in _getCategorySnapshot would cause that player to appear
  // in the new pool's list with an isCurrentlyAuctioning marker.
  this.lastCategorySnapshot = this._getCategorySnapshot(null);
  this.emit("category-started", this.lastCategorySnapshot);

  await this._loadNextPlayer({ afterCategoryIntro: true });
}

async _enterNextRoleBlock() {
  this.currentRoleSubPhase = this.roleBlocks[this.roleBlockIndex].role;
  this.room.currentRoleSubPhase = this.currentRoleSubPhase;

  await this.room.save();

  // Pass null explicitly — same reason as _enterPool above.
  // this.currentPlayer is still the last player from the previous role
  // block; including it as the fallback would bleed them into the
  // all-rounders / bowlers / wicketkeepers list they don't belong to.
  this.lastCategorySnapshot = this._getCategorySnapshot(null);
  this.emit("state-update", this.getStateSnapshot());

  await this._loadNextPlayer();
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
    this.lastCategorySnapshot = this._getCategorySnapshot();
    this.emit("category-started", this.lastCategorySnapshot);
  }

  async _completeAuction() {
    this.currentPlayer = null;
    this.room.status = ROOM_STATUS.COMPLETED;

    await this.room.save();
    this.emit("ended", this.getStateSnapshot());
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

  _getCategorySnapshot(currentlyAuctioning = null) {
  let players = [];

  if (
    this.currentCategory === AUCTION_CATEGORIES.POOL_1 ||
    this.currentCategory === AUCTION_CATEGORIES.POOL_2
  ) {
    if (this.roleBlocks) {
      players = this.roleBlocks.flatMap((block) =>
        block.queue.map((p) => this._playerSummary(p))
      );
    }
  } else {
    players = this.queue.map((p) => this._playerSummary(p));
  }

  // Only include the live player marker when currentlyAuctioning is
  // explicitly provided. We deliberately DO NOT fall back to
  // this.currentPlayer here — that fallback was the source of the
  // pool-bleed bug: _enterPool and _enterNextRoleBlock call this method
  // mid-transition when this.currentPlayer still holds the last player
  // from the pool/role-block that just finished, causing them to appear
  // in the next pool's list with isCurrentlyAuctioning: true.
  // _emitCategoryUpdate always passes the correct next player explicitly,
  // so the fallback is never needed in practice.
  if (currentlyAuctioning) {
    const summary = this._playerSummary(currentlyAuctioning);
    summary.isCurrentlyAuctioning = true;
    players.push(summary);
  }

  players.sort((a, b) => a.name.localeCompare(b.name));

  return {
    category: this.currentCategory,
    roleSubPhase: this.currentRoleSubPhase,
    players,
  };
}

  _playerSummary(player) {
    return {
      _id: player._id,
      name: player.name,
      role: player.role,
      country: player.country ?? null,
      basePriceLakhs: player.basePriceLakhs,
    };
  }
}

module.exports = AuctionEngine;