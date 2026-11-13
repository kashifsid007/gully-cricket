import React, { useState, useEffect } from 'react';
import {
  Gavel,
  Trophy,
  Plus,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getInitialAuctionData,
  saveAuctionData,
  generateInitialAuctionPool,
} from '../utils/auctionDb';
import { autoRegisterPlayer } from '../utils/playerDb';
import { getTournamentData, saveTournamentData } from '../utils/realtimeDb';

export default function AuctionTab({ onNavigateToTournament }) {
  const [auctionData, setAuctionData] = useState(getInitialAuctionData);
  const [activeSection, setActiveSection] = useState('live'); // 'live', 'teams', 'pool', 'tournament'
  const [poolFilter, setPoolFilter] = useState('all'); // 'all', 'available', 'sold', 'unsold'
  const [searchQuery, setSearchQuery] = useState('');
  const [soldCelebration, setSoldCelebration] = useState(null); // { player, team, price }

  // Team creation / editing modal state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPurse, setNewTeamPurse] = useState(1000);
  const [newTeamColor, setNewTeamColor] = useState('#5ec8f8');

  // Player addition modal state
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState('All-Rounder');
  const [newPlayerBasePrice, setNewPlayerBasePrice] = useState(50);

  // Tournament creation modal / form state
  const [tournamentExportForm, setTournamentExportForm] = useState({
    title: 'Post-Auction Championship 2026',
    format: 'limited',
    overs: 10,
    matchCount: 3,
    startDate: new Date().toISOString().split('T')[0],
    team1Id: '',
    team2Id: '',
  });

  // Save to persistence whenever auctionData changes
  useEffect(() => {
    saveAuctionData(auctionData);
  }, [auctionData]);

  // Sync teams into export form on initial load
  useEffect(() => {
    if (auctionData.teams && auctionData.teams.length >= 2) {
      setTournamentExportForm(prev => ({
        ...prev,
        team1Id: prev.team1Id || auctionData.teams[0].id,
        team2Id: prev.team2Id || auctionData.teams[1].id,
      }));
    }
  }, [auctionData.teams]);

  // Current player being auctioned
  const currentPlayer = auctionData.currentPlayerId
    ? auctionData.pool.find(p => p.id === auctionData.currentPlayerId)
    : auctionData.pool.find(p => p.status === 'available') || null;

  // Initialize currentPlayerId if not set
  useEffect(() => {
    if (!auctionData.currentPlayerId && currentPlayer) {
      setAuctionData(prev => ({
        ...prev,
        currentPlayerId: currentPlayer.id,
        currentBid: currentPlayer.basePrice || 50,
        leadingTeamId: null,
        bidHistory: [],
      }));
    }
  }, [auctionData.currentPlayerId, currentPlayer]);

  // Leading team details
  const leadingTeam = auctionData.leadingTeamId
    ? auctionData.teams.find(t => t.id === auctionData.leadingTeamId)
    : null;

  // Available players count
  const availableCount = auctionData.pool.filter(p => p.status === 'available').length;
  const soldCount = auctionData.pool.filter(p => p.status === 'sold').length;
  const unsoldCount = auctionData.pool.filter(p => p.status === 'unsold').length;

  // Place a bid for a team
  const handlePlaceBid = (teamId, increment = 10) => {
    const team = auctionData.teams.find(t => t.id === teamId);
    if (!team || team.isStopped) return;

    if (!currentPlayer) {
      alert('No player is currently on the auction block.');
      return;
    }

    const currentAmount = auctionData.currentBid || currentPlayer.basePrice || 50;
    const isFirstBid = !auctionData.leadingTeamId;
    const newBidAmount = isFirstBid ? currentAmount : currentAmount + increment;

    if (team.purse < newBidAmount) {
      alert(`⚠️ ${team.name} only has ${team.purse} points remaining. Cannot bid ${newBidAmount} points!`);
      return;
    }

    setAuctionData(prev => ({
      ...prev,
      currentBid: newBidAmount,
      leadingTeamId: teamId,
      bidHistory: [
        {
          teamId,
          teamName: team.name,
          amount: newBidAmount,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.bidHistory,
      ],
    }));
  };

  // Sell current player to leading team
  const handleSellPlayer = () => {
    if (!currentPlayer) return;

    if (!auctionData.leadingTeamId) {
      alert('No team has bid on this player yet. Click UNSOLD or place a bid.');
      return;
    }

    const winningTeam = auctionData.teams.find(t => t.id === auctionData.leadingTeamId);
    if (!winningTeam) return;

    const winningPrice = auctionData.currentBid;

    // Deduct points from team and add player to squad
    const updatedSquadPlayer = {
      name: currentPlayer.name,
      role: currentPlayer.role,
      isCaptain: winningTeam.squad.length === 0, // First player becomes captain by default
      boughtPrice: winningPrice,
    };

    const updatedTeams = auctionData.teams.map(t => {
      if (t.id === winningTeam.id) {
        return {
          ...t,
          purse: Math.max(0, t.purse - winningPrice),
          squad: [...t.squad, updatedSquadPlayer],
        };
      }
      return t;
    });

    const updatedPool = auctionData.pool.map(p => {
      if (p.id === currentPlayer.id) {
        return {
          ...p,
          status: 'sold',
          soldToTeamId: winningTeam.id,
          soldToTeamName: winningTeam.name,
          soldPrice: winningPrice,
        };
      }
      return p;
    });

    // Also auto-register player in main player DB so career stats are linked
    autoRegisterPlayer(currentPlayer.name);

    // Pick next available player
    const nextPlayer = updatedPool.find(p => p.status === 'available' && p.id !== currentPlayer.id);

    setSoldCelebration({
      player: currentPlayer.name,
      team: winningTeam.name,
      price: winningPrice,
    });

    setTimeout(() => {
      setSoldCelebration(null);
    }, 3500);

    setAuctionData(prev => ({
      ...prev,
      teams: updatedTeams,
      pool: updatedPool,
      currentPlayerId: nextPlayer ? nextPlayer.id : null,
      currentBid: nextPlayer ? (nextPlayer.basePrice || 50) : 0,
      leadingTeamId: null,
      bidHistory: [],
    }));
  };

  // Mark player as Unsold
  const handleMarkUnsold = () => {
    if (!currentPlayer) return;

    const updatedPool = auctionData.pool.map(p => {
      if (p.id === currentPlayer.id) {
        return {
          ...p,
          status: 'unsold',
        };
      }
      return p;
    });

    const nextPlayer = updatedPool.find(p => p.status === 'available' && p.id !== currentPlayer.id);

    setAuctionData(prev => ({
      ...prev,
      pool: updatedPool,
      currentPlayerId: nextPlayer ? nextPlayer.id : null,
      currentBid: nextPlayer ? (nextPlayer.basePrice || 50) : 0,
      leadingTeamId: null,
      bidHistory: [],
    }));
  };

  // Pick a specific player from the pool to auction
  const handleBringToHammer = (playerId) => {
    const player = auctionData.pool.find(p => p.id === playerId);
    if (!player) return;

    setAuctionData(prev => ({
      ...prev,
      currentPlayerId: playerId,
      currentBid: player.basePrice || 50,
      leadingTeamId: null,
      bidHistory: [],
    }));

    setActiveSection('live');
  };

  // Re-auction all unsold players
  const handleReauctionUnsold = () => {
    if (unsoldCount === 0) {
      alert('There are no unsold players.');
      return;
    }

    const updatedPool = auctionData.pool.map(p => {
      if (p.status === 'unsold') {
        return { ...p, status: 'available' };
      }
      return p;
    });

    setAuctionData(prev => ({
      ...prev,
      pool: updatedPool,
      currentPlayerId: prev.currentPlayerId || updatedPool.find(p => p.status === 'available')?.id || null,
    }));

    alert(`Re-introduced ${unsoldCount} unsold players back to the available auction pool!`);
  };

  // Add new team
  const handleAddTeam = (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const teamId = `team_${Date.now()}`;
    const purseVal = Math.max(10, Number(newTeamPurse) || 1000);

    const newTeam = {
      id: teamId,
      name: newTeamName.trim(),
      color: newTeamColor,
      initialPurse: purseVal,
      purse: purseVal,
      isStopped: false,
      squad: [],
    };

    setAuctionData(prev => ({
      ...prev,
      teams: [...prev.teams, newTeam],
    }));

    setNewTeamName('');
    setShowAddTeamModal(false);
  };

  // Toggle team stopping bidding ("both the team can choose as many players if they dont want they can stop")
  const handleToggleTeamStop = (teamId) => {
    setAuctionData(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id === teamId) {
          return { ...t, isStopped: !t.isStopped };
        }
        return t;
      }),
    }));
  };

  // Set Captain in a team squad
  const handleSetCaptain = (teamId, playerIndex) => {
    setAuctionData(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            squad: t.squad.map((p, idx) => ({
              ...p,
              isCaptain: idx === playerIndex,
            })),
          };
        }
        return t;
      }),
    }));
  };

  // Release a player from squad (refunds points and returns player to available pool)
  const handleReleasePlayer = (teamId, playerIndex) => {
    const team = auctionData.teams.find(t => t.id === teamId);
    if (!team) return;

    const released = team.squad[playerIndex];
    if (!released) return;

    if (!window.confirm(`Release ${released.name} back to the auction pool and refund ${released.boughtPrice || 0} pts to ${team.name}?`)) {
      return;
    }

    const refund = released.boughtPrice || 0;

    const updatedTeams = auctionData.teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          purse: t.purse + refund,
          squad: t.squad.filter((_, idx) => idx !== playerIndex),
        };
      }
      return t;
    });

    const updatedPool = auctionData.pool.map(p => {
      if (p.name.toLowerCase() === released.name.toLowerCase()) {
        return {
          ...p,
          status: 'available',
          soldToTeamId: null,
          soldToTeamName: null,
          soldPrice: null,
        };
      }
      return p;
    });

    setAuctionData(prev => ({
      ...prev,
      teams: updatedTeams,
      pool: updatedPool,
    }));
  };

  // Add new player to auction pool
  const handleAddNewPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const newP = {
      id: `custom_p_${Date.now()}`,
      name: newPlayerName.trim(),
      role: newPlayerRole,
      basePrice: Math.max(10, Number(newPlayerBasePrice) || 50),
      photo: null,
      matches: 0,
      runs: 0,
      wickets: 0,
      highestScore: 0,
      status: 'available',
      soldToTeamId: null,
      soldToTeamName: null,
      soldPrice: null,
    };

    // Auto-register in database
    autoRegisterPlayer(newP.name);

    setAuctionData(prev => ({
      ...prev,
      pool: [newP, ...prev.pool],
    }));

    setNewPlayerName('');
    setShowAddPlayerModal(false);
  };

  // Reset entire auction
  const handleResetAuction = () => {
    if (!window.confirm('Are you sure you want to reset this auction? All bids and bought squads will be cleared!')) {
      return;
    }

    const resetPool = generateInitialAuctionPool();
    const resetTeams = auctionData.teams.map(t => ({
      ...t,
      purse: t.initialPurse || 1000,
      isStopped: false,
      squad: [],
    }));

    setAuctionData({
      title: auctionData.title || 'Mega Cricket Auction',
      defaultPurse: auctionData.defaultPurse || 1000,
      teams: resetTeams,
      pool: resetPool,
      currentPlayerId: resetPool[0]?.id || null,
      currentBid: resetPool[0]?.basePrice || 50,
      leadingTeamId: null,
      bidHistory: [],
      completed: false,
    });
  };

  // Export auctioned teams directly into Tournament!
  const handleCreateTournamentFromAuction = (e) => {
    if (e) e.preventDefault();

    const t1 = auctionData.teams.find(t => t.id === tournamentExportForm.team1Id);
    const t2 = auctionData.teams.find(t => t.id === tournamentExportForm.team2Id);

    if (!t1 || !t2) {
      alert('Please select two valid teams for the tournament.');
      return;
    }

    if (t1.id === t2.id) {
      alert('Please choose two different teams for the tournament fixture.');
      return;
    }

    if (t1.squad.length < 2 || t2.squad.length < 2) {
      alert(`Both teams need at least 2 players to play a tournament!\n${t1.name} has ${t1.squad.length} players.\n${t2.name} has ${t2.squad.length} players.\nContinue bidding or add more players before starting the tournament.`);
      return;
    }

    // Read current tournament store to append
    const currentTourneyStore = getTournamentData({ tournaments: [], activeTournamentId: null });
    const tournamentId = `tournament_auction_${Date.now()}`;
    const isTest = tournamentExportForm.format === 'test';
    const matchCount = Math.max(1, Number(tournamentExportForm.matchCount) || 3);
    const startDate = tournamentExportForm.startDate || new Date().toISOString().split('T')[0];

    // Helper for match dates
    const getOffsetDate = (baseIso, offsetDays) => {
      const d = new Date(baseIso);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };

    const formatDateToDayString = (isoDate) => {
      if (!isoDate) return 'Day 1';
      const d = new Date(isoDate);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} (${days[d.getDay()]})`;
    };

    const newTournament = {
      id: tournamentId,
      seriesTitle: tournamentExportForm.title.trim() || `${t1.name} vs ${t2.name} Super Series`,
      subTitle: isTest ? 'POST-AUCTION TEST SERIES' : `${tournamentExportForm.overs}-OVER POST-AUCTION TOURNAMENT`,
      docInfo: `Official tournament fixture generated from live auction squads`,
      format: tournamentExportForm.format,
      overs: isTest ? null : Math.max(1, Number(tournamentExportForm.overs) || 10),
      startDate: startDate,
      teams: {
        team1: {
          name: t1.name,
          captain: t1.squad.find(p => p.isCaptain)?.name || t1.squad[0].name,
          squad: t1.squad.map(p => ({
            name: p.name,
            isCaptain: Boolean(p.isCaptain),
            role: p.role || 'Player',
          })),
        },
        team2: {
          name: t2.name,
          captain: t2.squad.find(p => p.isCaptain)?.name || t2.squad[0].name,
          squad: t2.squad.map(p => ({
            name: p.name,
            isCaptain: Boolean(p.isCaptain),
            role: p.role || 'Player',
          })),
        },
      },
      matches: Array.from({ length: matchCount }, (_, idx) => {
        const rawDate = getOffsetDate(startDate, idx * 2);
        return {
          id: `${tournamentId}_match_${idx + 1}`,
          name: `Match ${idx + 1}`,
          fixture: `${t1.name} vs ${t2.name}`,
          date: rawDate,
          dateDay: formatDateToDayString(rawDate),
          format: isTest ? 'Test Match' : `${tournamentExportForm.overs} overs/side`,
          tossTime: '3:40 PM',
          startTime: '3:50 PM onwards',
          winner: null,
          resultSummary: '',
        };
      }),
      rules: [
        {
          id: 1,
          title: 'Squad Freedom Rule',
          desc: 'Teams can play with all auctioned players. No benching restrictions.',
          highlight: 'Full squad participation',
        },
        {
          id: 2,
          title: 'Bowler Overs Limit',
          desc: isTest ? 'Unlimited overs per bowler.' : `Max ${Math.ceil((tournamentExportForm.overs || 10) / 5)} overs per bowler.`,
          highlight: 'Fair bowling distribution',
        },
      ],
    };

    const nextTournaments = Array.isArray(currentTourneyStore.tournaments)
      ? [...currentTourneyStore.tournaments, newTournament]
      : [newTournament];

    const nextStore = {
      activeTournamentId: tournamentId,
      tournaments: nextTournaments,
    };

    saveTournamentData(nextStore);

    alert(`🎉 Tournament "${newTournament.seriesTitle}" created successfully!\n${t1.name} (${t1.squad.length} players) vs ${t2.name} (${t2.squad.length} players).\nNavigating to Tournament Tab now...`);

    if (onNavigateToTournament) {
      onNavigateToTournament(tournamentId);
    }
  };

  // Filter pool list
  const filteredPool = auctionData.pool.filter(p => {
    if (poolFilter === 'available' && p.status !== 'available') return false;
    if (poolFilter === 'sold' && p.status !== 'sold') return false;
    if (poolFilter === 'unsold' && p.status !== 'unsold') return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="auction-tab-container" style={{ paddingBottom: '90px' }}>
      {/* Toast Notification when player is SOLD */}
      {soldCelebration && (
        <div className="auction-sold-toast" role="alert">
          <div className="toast-icon">🔨</div>
          <div className="toast-details">
            <div className="toast-headline">
              <strong>{soldCelebration.player}</strong> SOLD!
            </div>
            <div className="toast-subline">
              to <strong>{soldCelebration.team}</strong> for <strong>{soldCelebration.price} pts</strong>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="auction-header-card card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div className="series-pill-badge" style={{ marginBottom: '4px' }}>
              <Gavel size={13} color="var(--primary)" />
              <span>LIVE CRICKET AUCTION</span>
            </div>
            <h1 className="tournament-main-title" style={{ fontSize: '1.4rem', margin: 0 }}>
              Gully IPL Mega Auction
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Set team budgets, bid live on players, and launch instant tournaments
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '6px 10px', gap: '5px' }}
              onClick={handleResetAuction}
              title="Reset auction state"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.74rem', padding: '6px 12px', gap: '5px' }}
              onClick={() => setActiveSection('tournament')}
            >
              <Trophy size={13} /> Create Tournament
            </button>
          </div>
        </div>

        {/* Quick Stats Pill Strip */}
        <div className="auction-quick-stats">
          <div className="stat-chip">
            <span className="chip-label">Teams</span>
            <span className="chip-val">{auctionData.teams.length}</span>
          </div>
          <div className="stat-chip">
            <span className="chip-label">Available</span>
            <span className="chip-val highlight-cyan">{availableCount}</span>
          </div>
          <div className="stat-chip">
            <span className="chip-label">Sold</span>
            <span className="chip-val highlight-green">{soldCount}</span>
          </div>
          <div className="stat-chip">
            <span className="chip-label">Unsold</span>
            <span className="chip-val highlight-red">{unsoldCount}</span>
          </div>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="tournament-section-tabs" style={{ margin: '12px 0 16px' }} role="tablist">
        <button
          className={activeSection === 'live' ? 'active' : ''}
          onClick={() => setActiveSection('live')}
        >
          🔨 Live Auction
        </button>
        <button
          className={activeSection === 'teams' ? 'active' : ''}
          onClick={() => setActiveSection('teams')}
        >
          👥 Teams ({auctionData.teams.length})
        </button>
        <button
          className={activeSection === 'pool' ? 'active' : ''}
          onClick={() => setActiveSection('pool')}
        >
          📋 Player Pool ({auctionData.pool.length})
        </button>
        <button
          className={activeSection === 'tournament' ? 'active' : ''}
          onClick={() => setActiveSection('tournament')}
        >
          🏆 To Tournament
        </button>
      </div>

      {/* SECTION 1: LIVE AUCTION ROOM */}
      {activeSection === 'live' && (
        <div className="auction-live-arena">
          {currentPlayer ? (
            <>
              {/* Active Player Card on Hammer */}
              <div className="card auction-spotlight-card">
                <div className="spotlight-top-bar">
                  <span className="auction-badge-hammer">
                    <Gavel size={13} /> ON THE HAMMER
                  </span>
                  <span className="spotlight-base-price">
                    Base: <strong>{currentPlayer.basePrice || 50} pts</strong>
                  </span>
                </div>

                <div className="spotlight-player-center">
                  <div className="spotlight-avatar">
                    {currentPlayer.photo ? (
                      <img src={currentPlayer.photo} alt={currentPlayer.name} className="avatar-img" />
                    ) : (
                      <div className="avatar-fallback">
                        {currentPlayer.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h2 className="spotlight-name">{currentPlayer.name}</h2>
                  <div className="spotlight-role-pill">
                    {currentPlayer.role}
                  </div>

                  {/* Career Stats Pills */}
                  <div className="spotlight-stats-row">
                    <div className="stat-mini-pill">
                      <span>Matches</span>
                      <strong>{currentPlayer.matches || 0}</strong>
                    </div>
                    <div className="stat-mini-pill">
                      <span>Runs</span>
                      <strong>{currentPlayer.runs || 0}</strong>
                    </div>
                    <div className="stat-mini-pill">
                      <span>Wickets</span>
                      <strong>{currentPlayer.wickets || 0}</strong>
                    </div>
                    <div className="stat-mini-pill">
                      <span>HS</span>
                      <strong>{currentPlayer.highestScore || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Digital Current Bid Board */}
                <div className="auction-bid-board">
                  <div className="bid-board-label">CURRENT HIGHEST BID</div>
                  <div className="bid-board-amount">
                    {auctionData.currentBid} <span className="pts-label">PTS</span>
                  </div>
                  <div className="bid-board-leader">
                    {leadingTeam ? (
                      <span className="leading-team-tag" style={{ borderColor: leadingTeam.color }}>
                        🏆 Leading: <strong>{leadingTeam.name}</strong>
                      </span>
                    ) : (
                      <span className="no-bids-tag">
                        Waiting for opening bid (Base: {currentPlayer.basePrice || 50} pts)
                      </span>
                    )}
                  </div>
                </div>

                {/* Auctioneer Hammer Actions */}
                <div className="auctioneer-actions-grid">
                  <button
                    type="button"
                    className="btn btn-primary btn-sell-player"
                    onClick={handleSellPlayer}
                    disabled={!auctionData.leadingTeamId}
                    style={{
                      opacity: auctionData.leadingTeamId ? 1 : 0.45,
                      cursor: auctionData.leadingTeamId ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Gavel size={18} />
                    <span>
                      {auctionData.leadingTeamId
                        ? `SOLD to ${leadingTeam?.name} for ${auctionData.currentBid} pts`
                        : 'SOLD (Waiting for bid)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-unsold-player"
                    onClick={handleMarkUnsold}
                  >
                    <X size={16} /> Mark Unsold
                  </button>
                </div>
              </div>

              {/* Team Bidding Consoles */}
              <div className="bidding-teams-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    ⚡ Team Bidding Panels
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Teams bid live & stop anytime
                  </span>
                </div>

                <div className="team-bidding-cards-grid">
                  {auctionData.teams.map((team) => {
                    const isLeading = auctionData.leadingTeamId === team.id;
                    const nextBidAmount = !auctionData.leadingTeamId
                      ? (currentPlayer.basePrice || 50)
                      : auctionData.currentBid + 10;
                    const canAffordNext = team.purse >= nextBidAmount;

                    return (
                      <div
                        key={team.id}
                        className={`card team-bid-card ${isLeading ? 'is-leading' : ''} ${team.isStopped ? 'is-stopped' : ''}`}
                      >
                        <div className="team-bid-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="team-color-indicator" style={{ background: team.color }} />
                            <strong className="team-bid-name">{team.name}</strong>
                          </div>

                          <button
                            type="button"
                            className={`btn-stop-toggle ${team.isStopped ? 'stopped' : 'active'}`}
                            onClick={() => handleToggleTeamStop(team.id)}
                            title={team.isStopped ? 'Resume bidding for this team' : 'Stop bidding for this team (Squad Complete)'}
                          >
                            {team.isStopped ? '🚫 Stopped' : 'Active'}
                          </button>
                        </div>

                        {/* Purse Meter */}
                        <div className="purse-meter-wrap">
                          <div className="purse-row">
                            <span className="purse-label">Points Left:</span>
                            <span className="purse-value"><strong>{team.purse}</strong> / {team.initialPurse} pts</span>
                          </div>
                          <div className="purse-bar-track">
                            <div
                              className="purse-bar-fill"
                              style={{
                                width: `${Math.min(100, Math.max(0, (team.purse / (team.initialPurse || 1000)) * 100))}%`,
                                background: team.color || 'var(--primary)',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            Squad: <strong>{team.squad.length}</strong> players bought
                          </div>
                        </div>

                        {/* Bidding Controls */}
                        {team.isStopped ? (
                          <div className="team-stopped-message">
                            Team has stopped bidding (Squad Satisfied)
                          </div>
                        ) : isLeading ? (
                          <div className="team-leading-badge">
                            <CheckCircle2 size={14} color="#10b981" />
                            <span>Currently Holding Highest Bid ({auctionData.currentBid} pts)</span>
                          </div>
                        ) : (
                          <div className="bid-action-buttons">
                            <button
                              type="button"
                              className="btn btn-primary btn-bid-main"
                              onClick={() => handlePlaceBid(team.id, 10)}
                              disabled={!canAffordNext}
                              style={{
                                opacity: canAffordNext ? 1 : 0.45,
                                cursor: canAffordNext ? 'pointer' : 'not-allowed',
                              }}
                            >
                              Bid {nextBidAmount} pts (+10)
                            </button>

                            <div className="quick-increments-row">
                              <button
                                type="button"
                                className="btn-inc-pill"
                                onClick={() => handlePlaceBid(team.id, 20)}
                                disabled={team.purse < (auctionData.currentBid + 20)}
                              >
                                +20
                              </button>
                              <button
                                type="button"
                                className="btn-inc-pill"
                                onClick={() => handlePlaceBid(team.id, 50)}
                                disabled={team.purse < (auctionData.currentBid + 50)}
                              >
                                +50
                              </button>
                              <button
                                type="button"
                                className="btn-inc-pill"
                                onClick={() => handlePlaceBid(team.id, 100)}
                                disabled={team.purse < (auctionData.currentBid + 100)}
                              >
                                +100
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Bid History Log */}
              {auctionData.bidHistory.length > 0 && (
                <div className="card auction-bid-history-card">
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    📜 Recent Bids on {currentPlayer.name}
                  </div>
                  <div className="history-bids-list">
                    {auctionData.bidHistory.slice(0, 6).map((b, idx) => (
                      <div key={idx} className="history-bid-row">
                        <span className="hist-team">{b.teamName}</span>
                        <span className="hist-arrow">➔</span>
                        <span className="hist-amt">{b.amount} pts</span>
                        <span className="hist-time">{b.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card auction-complete-card">
              <Sparkles size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>Auction Pool Complete!</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                All registered players have been auctioned. You can re-auction unsold players or launch your tournament with the squads!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                {unsoldCount > 0 && (
                  <button className="btn btn-secondary" onClick={handleReauctionUnsold}>
                    <RotateCcw size={14} /> Re-auction {unsoldCount} Unsold
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => setActiveSection('tournament')}>
                  <Trophy size={14} /> Create Tournament with Squads
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: TEAMS & SQUADS */}
      {activeSection === 'teams' && (
        <div className="auction-teams-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Auction Teams & Points</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Customize purse budgets, assign captains, or stop bidding anytime
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '4px' }}
              onClick={() => setShowAddTeamModal(true)}
            >
              <Plus size={14} /> Add Team
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {auctionData.teams.map((team) => {
              const totalSpent = (team.initialPurse || 1000) - team.purse;

              return (
                <div key={team.id} className="card team-management-card">
                  <div className="team-manage-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="team-color-dot" style={{ background: team.color }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {team.name}
                        </h4>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Spent: <strong>{totalSpent} pts</strong> • Left: <strong style={{ color: team.color }}>{team.purse} pts</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className={`btn-stop-toggle ${team.isStopped ? 'stopped' : 'active'}`}
                        onClick={() => handleToggleTeamStop(team.id)}
                      >
                        {team.isStopped ? '🚫 Stopped' : '✓ Active'}
                      </button>
                    </div>
                  </div>

                  {/* Team Squad List */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Bought Squad ({team.squad.length} Players):
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Tap 👑 to set captain • ✕ to refund
                      </span>
                    </div>

                    {team.squad.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                        No players bought yet. Bid in the Live Auction tab!
                      </p>
                    ) : (
                      <div className="squad-chips-wrap">
                        {team.squad.map((player, pIdx) => (
                          <div key={pIdx} className={`auction-squad-chip ${player.isCaptain ? 'is-captain' : ''}`}>
                            <span className="chip-name">{player.name}</span>
                            <span className="chip-role">({player.role?.substring(0, 3)})</span>
                            <span className="chip-price">{player.boughtPrice}p</span>

                            <button
                              type="button"
                              className="chip-btn-crown"
                              onClick={() => handleSetCaptain(team.id, pIdx)}
                              title={player.isCaptain ? 'Team Captain' : 'Click to make Captain'}
                            >
                              👑
                            </button>

                            <button
                              type="button"
                              className="chip-btn-remove"
                              onClick={() => handleReleasePlayer(team.id, pIdx)}
                              title="Release player and refund points"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: PLAYER POOL */}
      {activeSection === 'pool' && (
        <div className="auction-pool-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Auction Player Catalog</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Pick players to bring to the hammer or add new talent
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '4px' }}
              onClick={() => setShowAddPlayerModal(true)}
            >
              <Plus size={14} /> Add Player
            </button>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['all', 'available', 'sold', 'unsold'].map(filterKey => (
                <button
                  key={filterKey}
                  type="button"
                  className={`btn-filter-pill ${poolFilter === filterKey ? 'active' : ''}`}
                  onClick={() => setPoolFilter(filterKey)}
                >
                  {filterKey.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Player Cards Grid */}
          <div className="pool-players-grid">
            {filteredPool.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No players found matching your criteria.
              </div>
            ) : (
              filteredPool.map(player => (
                <div key={player.id} className={`card pool-player-card status-${player.status}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {player.name}
                      </h4>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {player.role} • Base: <strong>{player.basePrice || 50} pts</strong>
                      </div>
                    </div>

                    <span className={`pool-status-badge ${player.status}`}>
                      {player.status.toUpperCase()}
                    </span>
                  </div>

                  {player.status === 'sold' ? (
                    <div className="pool-sold-info">
                      Sold to <strong>{player.soldToTeamName}</strong> for <strong>{player.soldPrice} pts</strong>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: '0.72rem', padding: '4px 10px', gap: '4px' }}
                        onClick={() => handleBringToHammer(player.id)}
                      >
                        <Gavel size={12} /> Auction Now
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: TOURNAMENT EXPORT */}
      {activeSection === 'tournament' && (
        <div className="auction-tournament-export card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Trophy size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              Launch Tournament from Auction Squads
            </h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Seamlessly turn your auctioned squads into an official tournament schedule with fixtures and live series standings.
          </p>

          <form onSubmit={handleCreateTournamentFromAuction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Tournament / Series Title</label>
              <input
                type="text"
                className="form-input"
                required
                value={tournamentExportForm.title}
                onChange={(e) => setTournamentExportForm({ ...tournamentExportForm, title: e.target.value })}
                placeholder="e.g. Post-Auction Premier League"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Format</label>
                <select
                  className="form-input"
                  value={tournamentExportForm.format}
                  onChange={(e) => setTournamentExportForm({ ...tournamentExportForm, format: e.target.value })}
                >
                  <option value="limited">Limited Overs Match</option>
                  <option value="test">Test Match</option>
                </select>
              </div>

              {tournamentExportForm.format === 'limited' && (
                <div className="form-group">
                  <label className="form-label">Overs per Side</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="form-input"
                    value={tournamentExportForm.overs}
                    onChange={(e) => setTournamentExportForm({ ...tournamentExportForm, overs: Number(e.target.value) })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Total Matches (Best of X)</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  className="form-input"
                  value={tournamentExportForm.matchCount}
                  onChange={(e) => setTournamentExportForm({ ...tournamentExportForm, matchCount: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={tournamentExportForm.startDate}
                  onChange={(e) => setTournamentExportForm({ ...tournamentExportForm, startDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '6px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--primary)' }}>Team 1 (Home Squad)</label>
                <select
                  className="form-input"
                  required
                  value={tournamentExportForm.team1Id}
                  onChange={(e) => setTournamentExportForm({ ...tournamentExportForm, team1Id: e.target.value })}
                >
                  {auctionData.teams.map(t => (
                    <option key={t.id} value={t.id}>
                      🏏 {t.name} ({t.squad.length} players)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--accent)' }}>Team 2 (Away Squad)</label>
                <select
                  className="form-input"
                  required
                  value={tournamentExportForm.team2Id}
                  onChange={(e) => setTournamentExportForm({ ...tournamentExportForm, team2Id: e.target.value })}
                >
                  {auctionData.teams.map(t => (
                    <option key={t.id} value={t.id}>
                      🏏 {t.name} ({t.squad.length} players)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', gap: '8px' }}>
                <Trophy size={16} /> Create & Open Tournament
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD TEAM */}
      {showAddTeamModal && (
        <div className="overlay" style={{ zIndex: 1200 }} onClick={() => setShowAddTeamModal(false)}>
          <div className="modal" style={{ maxWidth: '360px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Add Auction Team</h3>
              <button className="edit-name-btn" onClick={() => setShowAddTeamModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddTeam} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Royal Strikers"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Starting Purse Points</label>
                <input
                  type="number"
                  min="50"
                  max="100000"
                  className="form-input"
                  value={newTeamPurse}
                  onChange={(e) => setNewTeamPurse(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Team Color</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {['#5ec8f8', '#ff4766', '#10b981', '#f59e0b', '#a855f7', '#ec4899'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTeamColor(c)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: c,
                        border: newTeamColor === c ? '2.5px solid #ffffff' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTeamModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PLAYER */}
      {showAddPlayerModal && (
        <div className="overlay" style={{ zIndex: 1200 }} onClick={() => setShowAddPlayerModal(false)}>
          <div className="modal" style={{ maxWidth: '360px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Add Player to Pool</h3>
              <button className="edit-name-btn" onClick={() => setShowAddPlayerModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddNewPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Player Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Babar Azam"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={newPlayerRole}
                  onChange={(e) => setNewPlayerRole(e.target.value)}
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicketkeeper">Wicketkeeper</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base Price (Points)</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  className="form-input"
                  value={newPlayerBasePrice}
                  onChange={(e) => setNewPlayerBasePrice(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPlayerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add to Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
