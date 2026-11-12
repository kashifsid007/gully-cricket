import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Clock, Shield, AlertTriangle, Play, 
  RotateCcw, CheckCircle2, UserCheck, Sparkles, Award, Plus, X, BarChart3
} from 'lucide-react';
import { autoRegisterPlayer, getAllPlayers } from '../utils/playerDb';
import {
  getTournamentData,
  isRealtimeEnabled,
  saveTournamentData,
  subscribeToMatches,
  subscribeToTournament,
} from '../utils/realtimeDb';
import { buildPlayerStats, getEmptyPlayerStats } from '../utils/playerStats';
import { determineMatchOutcome, isTeam1Winner, isTeam2Winner } from '../utils/matchOutcome';

const INITIAL_TOURNAMENT_DATA = {
  id: 't10-championship-2026',
  format: 'limited',
  overs: 10,
  seriesTitle: "3-MATCH T10 CHAMPIONSHIP SERIES • 2026",
  subTitle: "T10 CRICKET TOURNAMENT FIXTURE & RULES",
  docInfo: "Official Schedule, Playing Squads & Ground Regulations",
  teams: {
    team1: {
      name: "Team Assasins",
      captain: "Kashif",
      squad: [
        { name: "Kashif", isCaptain: true },
        { name: "Shad", isCaptain: false },
        { name: "Nadir", isCaptain: false },
        { name: "Arish", isCaptain: false },
        { name: "Noraiz", isCaptain: false }
      ]
    },
    team2: {
      name: "Team Battle",
      captain: "Ayan",
      squad: [
        { name: "Ayan", isCaptain: true },
        { name: "Ani", isCaptain: false },
        { name: "Kamran", isCaptain: false },
        { name: "Rafique", isCaptain: false },
        { name: "Almas", isCaptain: false }
      ]
    }
  },
  matches: [
    {
      id: 1,
      name: "Match 1",
      fixture: "Team Assasins vs Team Battle",
      dateDay: "20 Sept 2026 (Sunday)",
      format: "T10 (10 overs/side)",
      tossTime: "3:40 PM",
      startTime: "3:50 PM onwards",
      winner: null, // 'assasins', 'battle', 'tied'
      resultSummary: ""
    },
    {
      id: 2,
      name: "Match 2",
      fixture: "Team Assasins vs Team Battle",
      dateDay: "2 Oct 2026 (Friday)",
      format: "T10 (10 overs/side)",
      tossTime: "3:40 PM",
      startTime: "3:50 PM onwards",
      winner: null,
      resultSummary: ""
    },
    {
      id: 3,
      name: "Match 3",
      fixture: "Team Assasins vs Team Battle",
      dateDay: "4 Oct 2026 (Sunday)",
      format: "T10 (10 overs/side)",
      tossTime: "3:40 PM",
      startTime: "3:50 PM onwards",
      winner: null,
      resultSummary: ""
    }
  ],
  rules: [
    {
      id: 1,
      title: "Bowling Quota",
      desc: "A bowler can bowl upto 4 overs only.",
      highlight: "Max 4 overs / bowler"
    },
    {
      id: 2,
      title: "Wides Scoring",
      desc: "Every wide delivery will be counted and added as a run.",
      highlight: "+1 run on every wide"
    },
    {
      id: 3,
      title: "No Ball & Free Hit",
      desc: "A Free Hit will be awarded for a no-ball; no extra run is added for the no-ball itself.",
      highlight: "Free Hit (0 extra run for ball)"
    },
    {
      id: 4,
      title: "Extras Restriction",
      desc: "No Leg Byes (LB), no overthrows, and no byes runs will be credited or added.",
      highlight: "No LB, Bye, or Overthrow runs"
    },
    {
      id: 5,
      title: "Team Composition",
      desc: "No single player permitted; full team participation is required.",
      highlight: "Full team participation required"
    },
    {
      id: 6,
      title: "Behind the Wicket",
      desc: "If a batsman hits behind the wicket and the ball goes into the ground, the batsman will be given OUT. However, a batting team player is permitted to stand behind to stop/save the ball.",
      highlight: "Hit behind into ground = OUT"
    },
    {
      id: 7,
      title: "Six Rule",
      desc: "Hitting a six is declared OUT immediately.",
      highlight: "Six is declared OUT!"
    },
    {
      id: 8,
      title: "Boundary Interference",
      desc: "If the ball heads toward the boundary and is hit/interfered with by any non-fielding person, it must completely cross over the boundary line to be awarded as 4; otherwise, only 1s and 2s can be scored.",
      highlight: "Interference: complete cross for 4"
    }
  ]
};

const getOffsetDate = (baseIsoStr, days) => {
  const parts = (baseIsoStr || '').split('-');
  const base = parts.length === 3
    ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0)
    : new Date();
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const generateDefaultMatchDates = (startDateStr, count) => {
  const dates = [];
  const validCount = Math.max(1, Math.min(20, count || 1));
  for (let i = 0; i < validCount; i++) {
    dates.push(getOffsetDate(startDateStr, i * 2));
  }
  return dates;
};

const formatDateToDayString = (isoDateStr) => {
  if (!isoDateStr) return 'To be scheduled';
  try {
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) {
        const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
        const dateMonthYear = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${dateMonthYear} (${dayName})`;
      }
    }
    const d = new Date(isoDateStr);
    if (!isNaN(d.getTime())) {
      const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
      const dateMonthYear = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${dateMonthYear} (${dayName})`;
    }
  } catch {
    // fallback
  }
  return isoDateStr;
};

const getIsoDateFromMatch = (match) => {
  if (match?.date && /^\d{4}-\d{2}-\d{2}$/.test(match.date)) {
    return match.date;
  }
  if (match?.dateDay) {
    const cleaned = match.dateDay.replace(/\bSept\b/i, 'Sep').replace(/\s*\([^)]*\)/, '').trim();
    const parsed = Date.parse(cleaned);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  return new Date().toISOString().split('T')[0];
};

const normalizeTournamentStore = (saved) => {
  if (Array.isArray(saved?.tournaments) && saved.tournaments.length > 0) {
    return saved;
  }

  const legacyTournament = {
    ...INITIAL_TOURNAMENT_DATA,
    ...(saved || {}),
    id: saved?.id || INITIAL_TOURNAMENT_DATA.id,
    format: saved?.format || 'limited',
    overs: saved?.overs || 10,
  };

  return {
    activeTournamentId: legacyTournament.id,
    tournaments: [legacyTournament],
  };
};

export default function TournamentTab({ onStartTournamentMatch }) {
  const [store, setStore] = useState(() =>
    normalizeTournamentStore(getTournamentData(INITIAL_TOURNAMENT_DATA))
  );

  const todayIso = new Date().toISOString().split('T')[0];
  const [syncMessage, setSyncMessage] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [appMatches, setAppMatches] = useState([]);
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [customNote, setCustomNote] = useState('');
  const [editingDateMatchId, setEditingDateMatchId] = useState(null);
  const [tempMatchDate, setTempMatchDate] = useState('');
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    format: 'limited',
    overs: 10,
    matchCount: 3,
    startDate: todayIso,
    matchDates: generateDefaultMatchDates(todayIso, 3),
    team1Name: '',
    team1Squad: [],
    team2Name: '',
    team2Squad: [],
  });
  const [newPlayerInput1, setNewPlayerInput1] = useState('');
  const [newPlayerInput2, setNewPlayerInput2] = useState('');

  const allDbPlayers = getAllPlayers();

  const handleStartDateChange = (newStartDate) => {
    setNewTournament(prev => {
      const count = Math.max(1, Number(prev.matchCount) || 1);
      const newDates = generateDefaultMatchDates(newStartDate, count);
      return {
        ...prev,
        startDate: newStartDate,
        matchDates: newDates,
      };
    });
  };

  const handleMatchCountChange = (newCount) => {
    const num = Math.max(1, Math.min(20, Number(newCount) || 1));
    setNewTournament(prev => {
      const existing = prev.matchDates || [];
      const updated = [];
      for (let i = 0; i < num; i++) {
        if (existing[i]) {
          updated.push(existing[i]);
        } else {
          const lastDate = updated[i - 1] || prev.startDate || todayIso;
          updated.push(getOffsetDate(lastDate, 2));
        }
      }
      return {
        ...prev,
        matchCount: num,
        matchDates: updated,
      };
    });
  };

  const handleSingleMatchDateChange = (matchIdx, newDate) => {
    setNewTournament(prev => {
      const copy = [...(prev.matchDates || [])];
      copy[matchIdx] = newDate;
      return {
        ...prev,
        matchDates: copy,
        startDate: matchIdx === 0 ? newDate : prev.startDate,
      };
    });
  };

  const handleSaveMatchDate = (matchId) => {
    if (!tempMatchDate) return;
    const formatted = formatDateToDayString(tempMatchDate);
    updateData(prev => ({
      ...prev,
      matches: prev.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            date: tempMatchDate,
            dateDay: formatted,
          };
        }
        return m;
      })
    }));
    setEditingDateMatchId(null);
  };

  const handleAddExistingPlayer = (teamKey, playerName) => {
    if (!playerName) return;
    const squadKey = `${teamKey}Squad`;
    const currentSquad = newTournament[squadKey] || [];
    if (currentSquad.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      alert(`${playerName} is already in Team ${teamKey === 'team1' ? '1' : '2'} squad!`);
      return;
    }
    const isCaptain = currentSquad.length === 0;
    setNewTournament(prev => ({
      ...prev,
      [squadKey]: [...currentSquad, { name: playerName, isCaptain }],
    }));
  };

  const handleAddNewPlayer = (teamKey, rawName) => {
    const trimmed = (rawName || '').trim();
    if (!trimmed) return;
    const squadKey = `${teamKey}Squad`;
    const currentSquad = newTournament[squadKey] || [];
    if (currentSquad.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`${trimmed} is already in the squad!`);
      return;
    }
    autoRegisterPlayer(trimmed);
    const isCaptain = currentSquad.length === 0;
    setNewTournament(prev => ({
      ...prev,
      [squadKey]: [...currentSquad, { name: trimmed, isCaptain }],
    }));
  };

  const handleRemovePlayer = (teamKey, indexToRemove) => {
    const squadKey = `${teamKey}Squad`;
    const updated = (newTournament[squadKey] || []).filter((_, idx) => idx !== indexToRemove);
    if (updated.length > 0 && !updated.some(p => p.isCaptain)) {
      updated[0].isCaptain = true;
    }
    setNewTournament(prev => ({
      ...prev,
      [squadKey]: updated,
    }));
  };

  const handleSetCaptain = (teamKey, captainIndex) => {
    const squadKey = `${teamKey}Squad`;
    const updated = (newTournament[squadKey] || []).map((p, idx) => ({
      ...p,
      isCaptain: idx === captainIndex,
    }));
    setNewTournament(prev => ({
      ...prev,
      [squadKey]: updated,
    }));
  };

  const data = store.tournaments.find(
    (tournament) => tournament.id === store.activeTournamentId
  ) || store.tournaments[0];

  // Receive tournament changes made on any connected device.
  useEffect(() => {
    const unsubscribeTournament = subscribeToTournament(
      (saved) => setStore(normalizeTournamentStore(saved)),
      INITIAL_TOURNAMENT_DATA
    );
    const unsubscribeMatches = subscribeToMatches(setAppMatches);
    return () => {
      unsubscribeTournament();
      unsubscribeMatches();
    };
  }, []);

  const updateData = (updater) => {
    const next = typeof updater === 'function' ? updater(data) : updater;
    const nextStore = {
      ...store,
      tournaments: store.tournaments.map((tournament) =>
        tournament.id === data.id ? next : tournament
      ),
    };
    setStore(nextStore);
    saveTournamentData(nextStore);
  };

  const handleCreateTournament = (event) => {
    event.preventDefault();
    const team1Squad = newTournament.team1Squad;
    const team2Squad = newTournament.team2Squad;

    if (!newTournament.name.trim() || !newTournament.team1Name.trim() || !newTournament.team2Name.trim()) {
      alert('Please enter Tournament Name and both Team Names.');
      return;
    }
    if (team1Squad.length < 2 || team2Squad.length < 2) {
      window.alert('Please add at least two players to each team squad. Tap 👑 next to a player to set as Captain.');
      return;
    }

    const id = `tournament_${Date.now()}`;
    const isTest = newTournament.format === 'test';
    const matchCount = Math.max(1, Number(newTournament.matchCount) || 1);

    const tournament = {
      id,
      seriesTitle: newTournament.name.trim(),
      subTitle: isTest ? 'TEST CRICKET TOURNAMENT' : `${newTournament.overs}-OVER CRICKET TOURNAMENT`,
      docInfo: 'Playing squads, fixtures and live series standings',
      format: newTournament.format,
      overs: isTest ? null : Math.max(1, Number(newTournament.overs) || 1),
      startDate: newTournament.startDate,
      teams: {
        team1: {
          name: newTournament.team1Name.trim(),
          captain: team1Squad.find(p => p.isCaptain)?.name || team1Squad[0].name,
          squad: team1Squad,
        },
        team2: {
          name: newTournament.team2Name.trim(),
          captain: team2Squad.find(p => p.isCaptain)?.name || team2Squad[0].name,
          squad: team2Squad,
        },
      },
      matches: Array.from({ length: matchCount }, (_, index) => {
        const rawDate = newTournament.matchDates?.[index] || getOffsetDate(newTournament.startDate, index * 2);
        const formattedDate = formatDateToDayString(rawDate);

        return {
          id: `${id}_match_${index + 1}`,
          name: `Match ${index + 1}`,
          fixture: `${newTournament.team1Name.trim()} vs ${newTournament.team2Name.trim()}`,
          date: rawDate,
          dateDay: formattedDate,
          format: isTest ? 'Test Match' : `${newTournament.overs} overs/side`,
          tossTime: '3:40 PM',
          startTime: '3:50 PM onwards',
          winner: null,
          resultSummary: '',
        };
      }),
      rules: [],
    };

    const nextStore = {
      activeTournamentId: id,
      tournaments: [...store.tournaments, tournament],
    };
    tournament.teams.team1.squad.forEach((player) => autoRegisterPlayer(player.name));
    tournament.teams.team2.squad.forEach((player) => autoRegisterPlayer(player.name));
    saveTournamentData(nextStore);
    setShowCreateTournament(false);
    setNewTournament({
      name: '', format: 'limited', overs: 10, matchCount: 3,
      startDate: todayIso,
      matchDates: generateDefaultMatchDates(todayIso, 3),
      team1Name: '', team1Squad: [], team2Name: '', team2Squad: [],
    });
    setNewPlayerInput1('');
    setNewPlayerInput2('');
  };

  const handleSelectTournament = (tournamentId) => {
    saveTournamentData({ ...store, activeTournamentId: tournamentId });
    setEditingScoreId(null);
    setActiveSection('overview');
  };

  const team1Name = data.teams?.team1?.name || 'Team 1';
  const team2Name = data.teams?.team2?.name || 'Team 2';

  // Automatically resolve match winners from completed App scoring or manual entries
  const resolvedMatches = (data.matches || []).map((m) => {
    if (m.winner) return m;

    // Search for a completed match scored in the app for this tournament fixture
    const appMatch = appMatches.find((am) =>
      am.matchSettings?.tournamentId === data.id &&
      String(am.matchSettings?.tournamentMatchId) === String(m.id) &&
      (am.status === 'Completed' || am.screen === 'SUMMARY')
    );

    if (appMatch) {
      const outcome = determineMatchOutcome(appMatch.inningsList, appMatch.matchSettings, appMatch.toss);
      if (outcome.winner) {
        return {
          ...m,
          winner: outcome.winner,
          resultSummary: m.resultSummary || outcome.summary,
        };
      }
    }
    return m;
  });

  // Calculate Series Score (e.g. 1-0, 1-1, 2-0) supporting all winner variations
  const assasinsWins = resolvedMatches.filter(m => isTeam1Winner(m.winner, team1Name)).length;
  const battleWins = resolvedMatches.filter(m => isTeam2Winner(m.winner, team2Name)).length;
  const tiedCount = resolvedMatches.filter(m => m.winner === 'tied').length;
  const playedCount = resolvedMatches.filter(m => m.winner !== null && m.winner !== undefined).length;

  const tournamentStats = buildPlayerStats(
    appMatches.filter((match) => match.matchSettings?.tournamentId === data.id)
  );
  const tournamentPlayers = [
    ...data.teams.team1.squad,
    ...data.teams.team2.squad,
  ].map((player) => ({
    name: player.name,
    stats: tournamentStats[player.name.toLowerCase()]?.tournament || getEmptyPlayerStats().tournament,
  }));
  const topRunScorer = [...tournamentPlayers].sort((a, b) => b.stats.runs - a.stats.runs)[0];
  const topWicketTaker = [...tournamentPlayers].sort((a, b) => b.stats.wickets - a.stats.wickets)[0];

  const winsNeeded = Math.floor(resolvedMatches.length / 2) + 1;
  let seriesStatus = `Series not started yet (${resolvedMatches.length}-Match Championship)`;

  if (assasinsWins > battleWins) {
    if (assasinsWins >= winsNeeded) {
      seriesStatus = `🏆 ${team1Name} Won the Series (${assasinsWins}-${battleWins})!`;
    } else {
      seriesStatus = `${team1Name} leads the series ${assasinsWins}-${battleWins}`;
    }
  } else if (battleWins > assasinsWins) {
    if (battleWins >= winsNeeded) {
      seriesStatus = `🏆 ${team2Name} Won the Series (${battleWins}-${assasinsWins})!`;
    } else {
      seriesStatus = `${team2Name} leads the series ${battleWins}-${assasinsWins}`;
    }
  } else if (playedCount > 0) {
    if (assasinsWins === battleWins && playedCount === resolvedMatches.length) {
      seriesStatus = `Series Tied at ${assasinsWins}-${battleWins}!`;
    } else if (assasinsWins > 0) {
      seriesStatus = `Series deadlocked at ${assasinsWins}-${battleWins}!`;
    } else if (tiedCount > 0) {
      seriesStatus = `Match drawn / tied (${tiedCount})`;
    }
  }

  // Handle Match Result Change (manual override or quick picker)
  const handleSetWinner = (matchId, winnerType) => {
    updateData(prev => {
      const updatedMatches = (prev.matches || []).map(match => {
        if (String(match.id) === String(matchId)) {
          const isSame = match.winner === winnerType;
          return {
            ...match,
            winner: isSame ? null : winnerType,
            resultSummary: isSame ? "" : (match.resultSummary || (
              winnerType === 'team1' ? `${team1Name} won`
                : winnerType === 'team2' ? `${team2Name} won`
                  : 'Match Tied'
            ))
          };
        }
        return match;
      });
      return { ...prev, matches: updatedMatches };
    });
  };

  const handleSaveResultSummary = (matchId) => {
    updateData(prev => {
      const updatedMatches = (prev.matches || []).map(match => {
        if (String(match.id) === String(matchId)) {
          return { ...match, resultSummary: customNote };
        }
        return match;
      });
      return { ...prev, matches: updatedMatches };
    });
    setEditingScoreId(null);
    setCustomNote('');
  };

  const handleResetSeries = () => {
    if (window.confirm(`Reset all ${resolvedMatches.length} match results and series score back to 0-0?`)) {
      updateData(prev => ({
        ...prev,
        matches: (prev.matches || []).map(m => ({ ...m, winner: null, resultSummary: "" }))
      }));
    }
  };

  // Auto-sync players to Player Directory
  const handleSyncPlayers = () => {
    const all = [
      ...data.teams.team1.squad.map(p => p.name),
      ...data.teams.team2.squad.map(p => p.name)
    ];

    all.forEach(name => autoRegisterPlayer(name));
    setSyncMessage(`✓ All ${all.length} squad members synced to Players Directory!`);
    setTimeout(() => setSyncMessage(''), 3500);
  };

  return (
    <div className="tournament-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
      <div className="tournament-manager-bar card">
        <div>
          <div className="tournament-selector-heading">
            <label className="form-label" htmlFor="tournament-selector">Tournament</label>
            <span className={`sync-status-pill ${isRealtimeEnabled() ? 'online' : 'offline'}`}>
              <span /> {isRealtimeEnabled() ? 'Live sync' : 'Offline cache'}
            </span>
          </div>
          <select
            id="tournament-selector"
            className="form-input"
            value={data.id}
            onChange={(event) => handleSelectTournament(event.target.value)}
          >
            {store.tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>{tournament.seriesTitle}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateTournament(true)}>
          <Plus size={16} /> New Tournament
        </button>
      </div>

      <div className="tournament-section-tabs" role="tablist" aria-label="Tournament sections">
        {[
          ['overview', 'Overview'],
          ['fixtures', 'Fixtures'],
          ['squads', 'Squads'],
          ['stats', 'Stats'],
        ].map(([section, label]) => (
          <button
            key={section}
            role="tab"
            aria-selected={activeSection === section}
            className={activeSection === section ? 'active' : ''}
            onClick={() => setActiveSection(section)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top Banner & Official Header */}
      {activeSection === 'overview' && (
      <div className="tournament-header-banner card compact-tournament-header">
        <div className="series-pill-badge">
          <Sparkles size={13} color="var(--primary)" />
          <span>{data.seriesTitle}</span>
        </div>

        <h1 className="tournament-main-title">
          {data.subTitle || 'CRICKET TOURNAMENT'}
        </h1>
        <div className="tournament-sub-header">
          FIXTURE & RULES
        </div>
        <p className="tournament-caption">
          {data.docInfo}
        </p>

        {/* Big Live Series Standings Scorecard */}
        <div className="series-scoreboard-card">
          <div className="series-header-bar">
            <Trophy size={18} color="var(--primary)" />
            <span className="series-header-text">SERIES STANDINGS (BEST OF {resolvedMatches.length})</span>
          </div>

          <div className="series-vs-display">
            {/* Team 1 */}
            <div className={`series-team-box assasins ${assasinsWins > battleWins ? 'leading' : ''}`}>
              <div className="team-flag-pill assasins">{data.teams.team1.name}</div>
              <div className="series-big-score">{assasinsWins}</div>
              <div className="team-captain-sub">Capt. {data.teams.team1.captain}</div>
            </div>

            <div className="series-vs-divider">
              <span className="vs-sign">VS</span>
              <span className="dash-sign">-</span>
            </div>

            {/* Team 2 */}
            <div className={`series-team-box battle ${battleWins > assasinsWins ? 'leading' : ''}`}>
              <div className="team-flag-pill battle">{data.teams.team2.name}</div>
              <div className="series-big-score">{battleWins}</div>
              <div className="team-captain-sub">Capt. {data.teams.team2.captain}</div>
            </div>
          </div>

          <div className="series-status-pill">
            <span className="pulse-indicator" />
            <span className="status-text">{seriesStatus}</span>
          </div>

          {playedCount > 0 && (
            <button 
              className="btn-reset-series" 
              onClick={handleResetSeries}
              title="Reset series score"
            >
              <RotateCcw size={12} /> Reset Series
            </button>
          )}
        </div>
      </div>
      )}

      {/* Official Playing Squads Section */}
      {activeSection === 'squads' && (
      <>
      <div className="section-title-wrap">
        <h2 className="section-title">
          <Award size={18} color="var(--primary)" />
          OFFICIAL PLAYING SQUADS
        </h2>
        <button className="sync-btn" onClick={handleSyncPlayers}>
          <UserCheck size={14} /> Sync to Player DB
        </button>
      </div>

      {syncMessage && (
        <div className="sync-banner-alert">
          {syncMessage}
        </div>
      )}

      <div className="squads-grid">
        {/* Team Assasins Squad */}
        <div className="card squad-card assasins-card">
          <div className="squad-header assasins-header">
            <div>
              <span className="squad-tag">TEAM A</span>
              <h3 className="squad-team-name">{data.teams.team1.name}</h3>
            </div>
            <div className="squad-count-badge">{data.teams.team1.squad.length} Players</div>
          </div>

          <div className="squad-members-list">
            {data.teams.team1.squad.map((player, idx) => (
              <div key={idx} className="squad-player-row">
                <div className="player-avatar-mini assasins-avatar">
                  {player.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="player-meta-info">
                  <span className="player-name-text">
                    {player.name}
                    {player.isCaptain && <span className="captain-badge"> (c)</span>}
                  </span>
                  <span className="player-role-text">
                    {player.isCaptain ? 'Team Captain & Batsman' : 'Squad Player'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Battle Squad */}
        <div className="card squad-card battle-card">
          <div className="squad-header battle-header">
            <div>
              <span className="squad-tag">TEAM B</span>
              <h3 className="squad-team-name">{data.teams.team2.name}</h3>
            </div>
            <div className="squad-count-badge">{data.teams.team2.squad.length} Players</div>
          </div>

          <div className="squad-members-list">
            {data.teams.team2.squad.map((player, idx) => (
              <div key={idx} className="squad-player-row">
                <div className="player-avatar-mini battle-avatar">
                  {player.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="player-meta-info">
                  <span className="player-name-text">
                    {player.name}
                    {player.isCaptain && <span className="captain-badge"> (c)</span>}
                  </span>
                  <span className="player-role-text">
                    {player.isCaptain ? 'Team Captain & Batsman' : 'Squad Player'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}

      {/* Official 3-Match Timetable & Fixture */}
      {activeSection === 'fixtures' && (
      <>
      <div className="section-title-wrap" style={{ marginTop: '16px' }}>
        <h2 className="section-title">
          <Calendar size={18} color="var(--primary)" />
          OFFICIAL {resolvedMatches.length}-MATCH SERIES SCHEDULE
        </h2>
      </div>

      <div className="fixtures-container">
        {resolvedMatches.map((m) => {
          const isAssasinsWinner = isTeam1Winner(m.winner, team1Name);
          const isBattleWinner = isTeam2Winner(m.winner, team2Name);
          const isTied = m.winner === 'tied';
          const winnerClass = isAssasinsWinner ? 'assasins' : isBattleWinner ? 'battle' : 'tied';
          const isEditingThis = editingScoreId === m.id;

          return (
            <div key={m.id} className={`card fixture-match-card ${m.winner ? 'has-winner' : ''}`}>
              <div className="fixture-top-bar">
                <div className="match-number-badge">
                  <span>{m.name}</span>
                </div>
                <div className="fixture-format-pill">
                  {m.format}
                </div>
                {m.winner && (
                  <div className={`match-outcome-badge ${winnerClass}`}>
                    <CheckCircle2 size={12} />
                    {isAssasinsWinner && `${team1Name} Won`}
                    {isBattleWinner && `${team2Name} Won`}
                    {isTied && "Match Tied"}
                  </div>
                )}
              </div>

              <div className="fixture-main-title">
                {m.fixture}
              </div>

              {editingDateMatchId === m.id ? (
                <div className="card" style={{ padding: '10px 12px', marginBottom: '10px', background: 'var(--soft-surface)', border: '1px solid var(--primary)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} /> Change Date for {m.name}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {formatDateToDayString(tempMatchDate)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="date"
                        className="form-input"
                        style={{ flex: 1, minWidth: '150px', padding: '6px 10px', fontSize: '0.84rem' }}
                        value={tempMatchDate}
                        onChange={(e) => setTempMatchDate(e.target.value)}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.78rem', width: 'auto' }}
                          onClick={() => handleSaveMatchDate(m.id)}
                        >
                          Save
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto' }}
                          onClick={() => setEditingDateMatchId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="fixture-info-grid">
                  <div className="info-chip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} color="var(--primary)" />
                      <span><strong>Date & Day:</strong> {m.dateDay}</span>
                    </div>
                    <button 
                      type="button"
                      className="btn-text-edit" 
                      style={{ fontSize: '0.7rem', marginLeft: '8px' }}
                      onClick={() => {
                        setEditingDateMatchId(m.id);
                        setTempMatchDate(getIsoDateFromMatch(m));
                      }}
                      title="Change date of this match"
                    >
                      Change Date
                    </button>
                  </div>
                  <div className="info-chip">
                    <Clock size={13} color="var(--primary)" />
                    <span><strong>Toss:</strong> {m.tossTime}</span>
                  </div>
                  <div className="info-chip">
                    <Play size={13} color="#10b981" />
                    <span><strong>Start:</strong> {m.startTime}</span>
                  </div>
                </div>
              )}

              {/* Match Result / Score Note */}
              {m.resultSummary && !isEditingThis && (
                <div className="fixture-result-summary">
                  🏆 <strong>Result:</strong> {m.resultSummary}
                  <button 
                    className="btn-text-edit" 
                    onClick={() => { setEditingScoreId(m.id); setCustomNote(m.resultSummary); }}
                  >
                    Edit Note
                  </button>
                </div>
              )}

              {isEditingThis && (
                <div className="edit-score-box">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Assasins won by 14 runs, Target 85"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => handleSaveResultSummary(m.id)}
                    >
                      Save
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => setEditingScoreId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Winner Pickers (Interactive 1-0 series tracker) */}
              <div className="match-action-section">
                <div className="picker-label">Mark Match Winner:</div>
                <div className="winner-buttons-row">
                  <button 
                    className={`btn-winner-pick assasins-btn ${isAssasinsWinner ? 'selected' : ''}`}
                    onClick={() => handleSetWinner(m.id, 'team1')}
                  >
                    🏆 {team1Name} Won
                  </button>

                  <button 
                    className={`btn-winner-pick battle-btn ${isBattleWinner ? 'selected' : ''}`}
                    onClick={() => handleSetWinner(m.id, 'team2')}
                  >
                    🏆 {team2Name} Won
                  </button>

                  <button 
                    className={`btn-winner-pick tied-btn ${isTied ? 'selected' : ''}`}
                    onClick={() => handleSetWinner(m.id, 'tied')}
                  >
                    🤝 Tied
                  </button>

                  {m.winner && (
                    <button 
                      className="btn-winner-pick clear-btn"
                      onClick={() => handleSetWinner(m.id, m.winner)}
                      title="Clear result"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Direct Match Launch Option */}
                {onStartTournamentMatch && (
                  <button 
                    className="btn-launch-match"
                    onClick={() => onStartTournamentMatch({
                      matchNumber: m.id,
                      tournamentId: data.id,
                      tournamentName: data.seriesTitle,
                      team1: data.teams.team1.name,
                      team2: data.teams.team2.name,
                      overs: data.overs,
                      format: data.format
                    })}
                  >
                    <Play size={14} /> Score {m.name} in App ({data.format === 'test' ? 'Test' : `${data.overs} Overs`})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Reporting Time & Toss Alert Notice */}
      <div className="timing-notice-card">
        <div className="notice-icon-box">
          <AlertTriangle size={22} color="var(--primary)" />
        </div>
        <div className="notice-content">
          <div className="notice-title">TOURNAMENT SCHEDULING</div>
          <p className="notice-desc">
            Confirm the date, reporting time, toss time, and start time with both teams before each fixture.
          </p>
        </div>
      </div>
      </>
      )}

      {/* Special Tournament Rules & Match Regulations */}
      {activeSection === 'overview' && data.rules?.length > 0 && (
        <>
          <div className="section-title-wrap" style={{ marginTop: '20px' }}>
            <h2 className="section-title">
              <Shield size={18} color="#ff4766" />
              SPECIAL TOURNAMENT RULES & REGULATIONS
            </h2>
          </div>

          <div className="rules-grid">
            {data.rules.map((rule) => (
              <div key={rule.id} className="card rule-card">
                <div className="rule-badge-num">
                  <span>◆</span>
                </div>
                <div className="rule-details">
                  <div className="rule-title-row">
                    <span className="rule-title">{rule.title}</span>
                    <span className="rule-highlight-pill">{rule.highlight}</span>
                  </div>
                  <p className="rule-text">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeSection === 'stats' && (
        <div className="tournament-stats-section">
          <div className="section-title-wrap">
            <h2 className="section-title">
              <BarChart3 size={18} color="var(--primary)" /> TOURNAMENT LEADERS
            </h2>
          </div>

          <div className="tournament-leader-grid">
            <div className="card tournament-leader-card runs">
              <span>TOP RUN SCORER</span>
              <strong>{topRunScorer?.name || 'No scores yet'}</strong>
              <b>{topRunScorer?.stats.runs || 0} runs</b>
            </div>
            <div className="card tournament-leader-card wickets">
              <span>TOP WICKET TAKER</span>
              <strong>{topWicketTaker?.name || 'No scores yet'}</strong>
              <b>{topWicketTaker?.stats.wickets || 0} wickets</b>
            </div>
          </div>

          <div className="card tournament-stats-table-wrap">
            <table className="tournament-stats-table">
              <thead>
                <tr><th>Player</th><th>M</th><th>Runs</th><th>Wkts</th><th>HS</th></tr>
              </thead>
              <tbody>
                {[...tournamentPlayers]
                  .sort((a, b) => b.stats.runs - a.stats.runs || b.stats.wickets - a.stats.wickets)
                  .map((player) => (
                    <tr key={player.name.toLowerCase()}>
                      <td>{player.name}</td>
                      <td>{player.stats.matches}</td>
                      <td>{player.stats.runs}</td>
                      <td>{player.stats.wickets}</td>
                      <td>{player.stats.highestScore}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {tournamentPlayers.every((player) => player.stats.matches === 0) && (
            <p className="tournament-stats-empty">
              Complete a match launched from this tournament to populate the leaderboard.
            </p>
          )}
        </div>
      )}

      {/* Footer Branding */}
      <div className="tournament-footer-banner">
        <div className="footer-line" />
        <span className="footer-tagline">
          {data.seriesTitle} • {data.teams.team1.name} vs {data.teams.team2.name}
        </span>
      </div>

      <button
        className="tournament-fab"
        onClick={() => setShowCreateTournament(true)}
        aria-label="Create new tournament"
        title="Create new tournament"
      >
        <Plus size={24} />
      </button>

      {showCreateTournament && (
        <div className="overlay" style={{ zIndex: 1200 }}>
          <div className="modal tournament-create-modal">
            <div className="tournament-modal-header">
              <h3 className="modal-title">Create New Tournament</h3>
              <button className="edit-name-btn" onClick={() => setShowCreateTournament(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="tournament-create-form">
              <div className="form-group">
                <label className="form-label">Tournament Name</label>
                <input className="form-input" required value={newTournament.name}
                  placeholder="e.g. Winter Cup 2026"
                  onChange={(event) => setNewTournament({ ...newTournament, name: event.target.value })} />
              </div>

              <div className="tournament-form-row">
                <div className="form-group">
                  <label className="form-label">Format</label>
                  <select className="form-input" value={newTournament.format}
                    onChange={(event) => setNewTournament({ ...newTournament, format: event.target.value })}>
                    <option value="limited">Overs Match</option>
                    <option value="test">Test Match</option>
                  </select>
                </div>
                {newTournament.format === 'limited' && (
                  <div className="form-group">
                    <label className="form-label">Overs</label>
                    <input className="form-input" type="number" min="1" max="100" required
                      value={newTournament.overs}
                      onChange={(event) => setNewTournament({ ...newTournament, overs: event.target.value })} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Matches</label>
                  <input className="form-input" type="number" min="1" max="20" required
                    value={newTournament.matchCount}
                    onChange={(event) => handleMatchCountChange(event.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={13} color="var(--primary)" />
                  Tournament Start Date (Series Opener)
                </label>
                <input 
                  type="date" 
                  className="form-input" 
                  required 
                  value={newTournament.startDate}
                  onChange={(event) => handleStartDateChange(event.target.value)} 
                />
              </div>

              {/* Match Dates customization */}
              <div className="card" style={{ padding: '12px', marginBottom: '14px', background: 'var(--soft-surface)', border: '1px solid var(--divider)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color="var(--primary)" />
                    Choose Date for Each Match ({newTournament.matchDates.length} Matches)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Pick custom dates
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {newTournament.matchDates.map((mDate, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: 'var(--card-bg)', 
                        padding: '8px 10px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--divider)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                          Match {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {formatDateToDayString(mDate).split('(')[1]?.replace(')', '') || ''}
                        </span>
                      </div>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: '5px 8px', fontSize: '0.82rem' }}
                        required
                        value={mDate}
                        onChange={(e) => handleSingleMatchDateChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {['team1', 'team2'].map((teamKey, index) => {
                const squad = newTournament[`${teamKey}Squad`] || [];
                const teamLabel = `Team ${index + 1}`;
                const currentInputValue = teamKey === 'team1' ? newPlayerInput1 : newPlayerInput2;
                const setInputValue = teamKey === 'team1' ? setNewPlayerInput1 : setNewPlayerInput2;

                const availablePlayers = allDbPlayers.filter(
                  (ap) => !squad.some(sp => sp.name.toLowerCase() === ap.name.toLowerCase())
                );

                return (
                  <div key={teamKey} className="card tournament-team-form" style={{ padding: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: index === 0 ? 'var(--primary)' : 'var(--accent)' }}>
                        {teamLabel} Setup
                      </h4>
                      <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--soft-surface)', color: 'var(--text-secondary)' }}>
                        {squad.length} Players
                      </span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label">{teamLabel} Name</label>
                      <input className="form-input" required
                        placeholder={`e.g. ${index === 0 ? 'Team Assasins' : 'Team Battle'}`}
                        value={newTournament[`${teamKey}Name`]}
                        onChange={(event) => setNewTournament({
                          ...newTournament,
                          [`${teamKey}Name`]: event.target.value,
                        })} />
                    </div>

                    {/* Choose from Dropdown */}
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>
                        Choose Player from Dropdown
                      </label>
                      <select
                        className="form-input"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddExistingPlayer(teamKey, e.target.value);
                          }
                        }}
                      >
                        <option value="">
                          {availablePlayers.length > 0 
                            ? `-- Select registered player (${availablePlayers.length} available) --`
                            : '-- No more registered players --'}
                        </option>
                        {availablePlayers.map((p) => (
                          <option key={p.id || p.name} value={p.name}>
                            🏏 {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Or Add New Player */}
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>
                        Or Add New Player
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1, padding: '7px 10px', fontSize: '0.84rem' }}
                          placeholder="Type new player name..."
                          value={currentInputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewPlayer(teamKey, currentInputValue);
                              setInputValue('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '7px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap', width: 'auto' }}
                          onClick={() => {
                            handleAddNewPlayer(teamKey, currentInputValue);
                            setInputValue('');
                          }}
                        >
                          <Plus size={13} /> Add
                        </button>
                      </div>
                    </div>

                    {/* Squad Members Chips List */}
                    <div style={{ 
                      minHeight: '44px', 
                      background: 'var(--soft-surface)', 
                      border: '1px solid var(--divider)', 
                      borderRadius: '8px', 
                      padding: '8px' 
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Squad List (Tap 👑 to set captain):
                      </div>
                      {squad.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
                          No players added yet. Choose from dropdown or add new player above.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {squad.map((player, pIdx) => (
                            <div
                              key={pIdx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                borderRadius: '20px',
                                background: player.isCaptain ? 'rgba(255, 234, 0, 0.12)' : 'var(--field-bg)',
                                border: player.isCaptain ? '1.5px solid var(--warning)' : '1px solid var(--divider)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              <span style={{ fontWeight: 700 }}>{player.name}</span>
                              <button
                                type="button"
                                onClick={() => handleSetCaptain(teamKey, pIdx)}
                                title={player.isCaptain ? 'Team Captain' : 'Click to make Captain'}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  fontSize: '0.85rem',
                                  opacity: player.isCaptain ? 1 : 0.35,
                                }}
                              >
                                👑
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePlayer(teamKey, pIdx)}
                                title="Remove player from squad"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--error)',
                                  cursor: 'pointer',
                                  padding: 0,
                                  fontWeight: 'bold',
                                  fontSize: '0.85rem',
                                  lineHeight: 1,
                                }}
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

              <button className="btn btn-primary" type="submit" style={{ marginTop: '8px' }}>
                <Trophy size={16} /> Create Tournament
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
