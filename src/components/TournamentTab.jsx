import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Clock, Shield, AlertTriangle, Play, 
  RotateCcw, CheckCircle2, UserCheck, Sparkles, Award, Plus, X, BarChart3
} from 'lucide-react';
import { autoRegisterPlayer } from '../utils/playerDb';
import {
  getTournamentData,
  isRealtimeEnabled,
  saveTournamentData,
  subscribeToMatches,
  subscribeToTournament,
} from '../utils/realtimeDb';
import { buildPlayerStats, getEmptyPlayerStats } from '../utils/playerStats';

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

const parseSquad = (value) => value
  .split(/[\n,]+/)
  .map((name) => name.trim())
  .filter(Boolean)
  .map((name, index) => ({ name, isCaptain: index === 0 }));

export default function TournamentTab({ onStartTournamentMatch }) {
  const [store, setStore] = useState(() =>
    normalizeTournamentStore(getTournamentData(INITIAL_TOURNAMENT_DATA))
  );

  const [syncMessage, setSyncMessage] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [appMatches, setAppMatches] = useState([]);
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [customNote, setCustomNote] = useState('');
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    format: 'limited',
    overs: 10,
    matchCount: 3,
    team1Name: '',
    team1Squad: '',
    team2Name: '',
    team2Squad: '',
  });

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
    saveTournamentData(nextStore);
  };

  const handleCreateTournament = (event) => {
    event.preventDefault();
    const team1Squad = parseSquad(newTournament.team1Squad);
    const team2Squad = parseSquad(newTournament.team2Squad);
    if (!newTournament.name.trim() || !newTournament.team1Name.trim() || !newTournament.team2Name.trim()) return;
    if (team1Squad.length < 2 || team2Squad.length < 2) {
      window.alert('Please add at least two players to each squad. The first player will be captain.');
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
      teams: {
        team1: {
          name: newTournament.team1Name.trim(),
          captain: team1Squad[0].name,
          squad: team1Squad,
        },
        team2: {
          name: newTournament.team2Name.trim(),
          captain: team2Squad[0].name,
          squad: team2Squad,
        },
      },
      matches: Array.from({ length: matchCount }, (_, index) => ({
        id: `${id}_match_${index + 1}`,
        name: `Match ${index + 1}`,
        fixture: `${newTournament.team1Name.trim()} vs ${newTournament.team2Name.trim()}`,
        dateDay: 'To be scheduled',
        format: isTest ? 'Test Match' : `${newTournament.overs} overs/side`,
        tossTime: 'TBA',
        startTime: 'TBA',
        winner: null,
        resultSummary: '',
      })),
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
      team1Name: '', team1Squad: '', team2Name: '', team2Squad: '',
    });
  };

  const handleSelectTournament = (tournamentId) => {
    saveTournamentData({ ...store, activeTournamentId: tournamentId });
    setEditingScoreId(null);
    setActiveSection('overview');
  };

  // Calculate Series Score (e.g. 1-0, 1-1, 2-0)
  const assasinsWins = data.matches.filter(m => m.winner === 'assasins' || m.winner === 'team1').length;
  const battleWins = data.matches.filter(m => m.winner === 'battle' || m.winner === 'team2').length;
  const tiedCount = data.matches.filter(m => m.winner === 'tied').length;
  const playedCount = data.matches.filter(m => m.winner !== null).length;
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

  const winsNeeded = Math.floor(data.matches.length / 2) + 1;
  let seriesStatus = `Series not started yet (${data.matches.length}-Match Championship)`;

  if (assasinsWins > battleWins) {
    if (assasinsWins >= winsNeeded) {
      seriesStatus = `🏆 ${data.teams.team1.name} Won the Series (${assasinsWins}-${battleWins})!`;
    } else {
      seriesStatus = `${data.teams.team1.name} leads the series ${assasinsWins}-${battleWins}`;
    }
  } else if (battleWins > assasinsWins) {
    if (battleWins >= winsNeeded) {
      seriesStatus = `🏆 ${data.teams.team2.name} Won the Series (${battleWins}-${assasinsWins})!`;
    } else {
      seriesStatus = `${data.teams.team2.name} leads the series ${battleWins}-${assasinsWins}`;
    }
  } else if (playedCount > 0) {
    if (assasinsWins === battleWins && playedCount === data.matches.length) {
      seriesStatus = `Series Tied at ${assasinsWins}-${battleWins}!`;
    } else if (assasinsWins > 0) {
      seriesStatus = `Series deadlocked at ${assasinsWins}-${battleWins}!`;
    } else if (tiedCount > 0) {
      seriesStatus = `Match drawn / tied (${tiedCount})`;
    }
  }

  // Handle Match Result Change
  const handleSetWinner = (matchId, winnerType) => {
    updateData(prev => {
      const updatedMatches = prev.matches.map(match => {
        if (match.id === matchId) {
          const isSame = match.winner === winnerType;
          return {
            ...match,
            winner: isSame ? null : winnerType,
            resultSummary: isSame ? "" : (match.resultSummary || (
              winnerType === 'team1' ? `${data.teams.team1.name} won`
                : winnerType === 'team2' ? `${data.teams.team2.name} won`
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
      const updatedMatches = prev.matches.map(match => {
        if (match.id === matchId) {
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
    if (window.confirm("Reset all 3 match results and series score back to 0-0?")) {
      updateData(prev => ({
        ...prev,
        matches: prev.matches.map(m => ({ ...m, winner: null, resultSummary: "" }))
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
          <Sparkles size={13} color="#00e5ff" />
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
            <Trophy size={18} color="#ffea00" />
            <span className="series-header-text">SERIES STANDINGS (BEST OF {data.matches.length})</span>
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
          <Award size={18} color="#00e5ff" />
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
          <Calendar size={18} color="#00ff88" />
          OFFICIAL {data.matches.length}-MATCH SERIES SCHEDULE
        </h2>
      </div>

      <div className="fixtures-container">
        {data.matches.map((m) => {
          const isAssasinsWinner = m.winner === 'assasins' || m.winner === 'team1';
          const isBattleWinner = m.winner === 'battle' || m.winner === 'team2';
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
                    {isAssasinsWinner && `${data.teams.team1.name} Won`}
                    {isBattleWinner && `${data.teams.team2.name} Won`}
                    {isTied && "Match Tied"}
                  </div>
                )}
              </div>

              <div className="fixture-main-title">
                {m.fixture}
              </div>

              <div className="fixture-info-grid">
                <div className="info-chip">
                  <Calendar size={13} color="#93c5fd" />
                  <span><strong>Date & Day:</strong> {m.dateDay}</span>
                </div>
                <div className="info-chip">
                  <Clock size={13} color="#ffea00" />
                  <span><strong>Toss:</strong> {m.tossTime}</span>
                </div>
                <div className="info-chip">
                  <Play size={13} color="#00ff88" />
                  <span><strong>Start:</strong> {m.startTime}</span>
                </div>
              </div>

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
                    🏆 {data.teams.team1.name} Won
                  </button>

                  <button 
                    className={`btn-winner-pick battle-btn ${isBattleWinner ? 'selected' : ''}`}
                    onClick={() => handleSetWinner(m.id, 'team2')}
                  >
                    🏆 {data.teams.team2.name} Won
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
          <AlertTriangle size={22} color="#ffea00" />
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
              <Shield size={18} color="#e11d48" />
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
              <BarChart3 size={18} color="#ffea00" /> TOURNAMENT LEADERS
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
                    onChange={(event) => setNewTournament({ ...newTournament, matchCount: event.target.value })} />
                </div>
              </div>

              {['team1', 'team2'].map((teamKey, index) => (
                <div key={teamKey} className="card tournament-team-form">
                  <h4>Team {index + 1}</h4>
                  <input className="form-input" required
                    placeholder={`Team ${index + 1} name`}
                    value={newTournament[`${teamKey}Name`]}
                    onChange={(event) => setNewTournament({
                      ...newTournament,
                      [`${teamKey}Name`]: event.target.value,
                    })} />
                  <textarea className="form-input" required rows="4"
                    placeholder="Squad names separated by commas or new lines. First player will be captain."
                    value={newTournament[`${teamKey}Squad`]}
                    onChange={(event) => setNewTournament({
                      ...newTournament,
                      [`${teamKey}Squad`]: event.target.value,
                    })} />
                </div>
              ))}

              <button className="btn btn-primary" type="submit">
                <Trophy size={16} /> Create Tournament
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
