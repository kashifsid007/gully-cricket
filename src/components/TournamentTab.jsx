import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Clock, Shield, AlertTriangle, Play, 
  RotateCcw, CheckCircle2, UserCheck, Flame, Info, Sparkles, Award
} from 'lucide-react';
import { autoRegisterPlayer } from '../utils/playerDb';
import {
  getTournamentData,
  saveTournamentData,
  subscribeToTournament,
} from '../utils/realtimeDb';

const INITIAL_TOURNAMENT_DATA = {
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

export default function TournamentTab({ onStartTournamentMatch }) {
  const [data, setData] = useState(() => getTournamentData(INITIAL_TOURNAMENT_DATA));

  const [syncMessage, setSyncMessage] = useState('');
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [customNote, setCustomNote] = useState('');

  // Receive tournament changes made on any connected device.
  useEffect(() => {
    return subscribeToTournament(setData, INITIAL_TOURNAMENT_DATA);
  }, []);

  const updateData = (updater) => {
    const next = typeof updater === 'function' ? updater(data) : updater;
    saveTournamentData(next);
  };

  // Calculate Series Score (e.g. 1-0, 1-1, 2-0)
  const assasinsWins = data.matches.filter(m => m.winner === 'assasins').length;
  const battleWins = data.matches.filter(m => m.winner === 'battle').length;
  const tiedCount = data.matches.filter(m => m.winner === 'tied').length;
  const playedCount = data.matches.filter(m => m.winner !== null).length;

  let seriesStatus = "Series not started yet (3-Match Championship)";
  let seriesLeader = null;

  if (assasinsWins > battleWins) {
    seriesLeader = "Team Assasins";
    if (assasinsWins >= 2) {
      seriesStatus = `🏆 Team Assasins Won the Series (${assasinsWins}-${battleWins})!`;
    } else {
      seriesStatus = `Team Assasins leads the series ${assasinsWins}-${battleWins}`;
    }
  } else if (battleWins > assasinsWins) {
    seriesLeader = "Team Battle";
    if (battleWins >= 2) {
      seriesStatus = `🏆 Team Battle Won the Series (${battleWins}-${assasinsWins})!`;
    } else {
      seriesStatus = `Team Battle leads the series ${battleWins}-${assasinsWins}`;
    }
  } else if (playedCount > 0) {
    if (assasinsWins === battleWins && playedCount === 3) {
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
            resultSummary: isSame ? "" : (match.resultSummary || (winnerType === 'assasins' ? 'Team Assasins won' : winnerType === 'battle' ? 'Team Battle won' : 'Match Tied'))
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
      {/* Top Banner & Official Header */}
      <div className="tournament-header-banner card">
        <div className="series-pill-badge">
          <Sparkles size={13} color="#00e5ff" />
          <span>{data.seriesTitle}</span>
        </div>

        <h1 className="tournament-main-title">
          T10 CRICKET TOURNAMENT
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
            <span className="series-header-text">SERIES STANDINGS (BEST OF 3)</span>
          </div>

          <div className="series-vs-display">
            {/* Team 1 */}
            <div className={`series-team-box assasins ${assasinsWins > battleWins ? 'leading' : ''}`}>
              <div className="team-flag-pill assasins">TEAM ASSASINS</div>
              <div className="series-big-score">{assasinsWins}</div>
              <div className="team-captain-sub">Capt. {data.teams.team1.captain}</div>
            </div>

            <div className="series-vs-divider">
              <span className="vs-sign">VS</span>
              <span className="dash-sign">-</span>
            </div>

            {/* Team 2 */}
            <div className={`series-team-box battle ${battleWins > assasinsWins ? 'leading' : ''}`}>
              <div className="team-flag-pill battle">TEAM BATTLE</div>
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

      {/* Official Playing Squads Section */}
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
              <h3 className="squad-team-name">TEAM ASSASINS</h3>
            </div>
            <div className="squad-count-badge">5 Players</div>
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
              <h3 className="squad-team-name">TEAM BATTLE</h3>
            </div>
            <div className="squad-count-badge">5 Players</div>
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

      {/* Official 3-Match Timetable & Fixture */}
      <div className="section-title-wrap" style={{ marginTop: '16px' }}>
        <h2 className="section-title">
          <Calendar size={18} color="#00ff88" />
          OFFICIAL 3-MATCH SERIES SCHEDULE
        </h2>
      </div>

      <div className="fixtures-container">
        {data.matches.map((m) => {
          const isAssasinsWinner = m.winner === 'assasins';
          const isBattleWinner = m.winner === 'battle';
          const isTied = m.winner === 'tied';
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
                  <div className={`match-outcome-badge ${m.winner}`}>
                    <CheckCircle2 size={12} />
                    {isAssasinsWinner && "Assasins Won"}
                    {isBattleWinner && "Battle Won"}
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
                    onClick={() => handleSetWinner(m.id, 'assasins')}
                  >
                    🏆 Assasins Won
                  </button>

                  <button 
                    className={`btn-winner-pick battle-btn ${isBattleWinner ? 'selected' : ''}`}
                    onClick={() => handleSetWinner(m.id, 'battle')}
                  >
                    🏆 Battle Won
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
                      team1: data.teams.team1.name,
                      team2: data.teams.team2.name,
                      overs: 10,
                      format: 'limited'
                    })}
                  >
                    <Play size={14} /> Score {m.name} in App (10 Overs)
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
          <div className="notice-title">MANDATORY TIMING NOTICE</div>
          <p className="notice-desc">
            Reporting time for both teams is <strong>3:30 PM</strong>. The coin toss will take place promptly at <strong>3:40 PM</strong>, with play beginning at <strong>3:50 PM sharp</strong>.
          </p>
        </div>
      </div>

      {/* Special Tournament Rules & Match Regulations */}
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

      {/* Footer Branding */}
      <div className="tournament-footer-banner">
        <div className="footer-line" />
        <span className="footer-tagline">
          OFFICIAL T10 CRICKET CHAMPIONSHIP • TEAM ASSASINS vs TEAM BATTLE • 2026
        </span>
      </div>
    </div>
  );
}
