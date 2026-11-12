import React, { useState } from 'react';
import { Trophy, RefreshCw, Calendar, Share2 } from 'lucide-react';
import BroadcastScorecard from './BroadcastScorecard';
import ShareModal from './ShareModal';
import { getPlayerByName, getPlayerInitials } from '../utils/playerDb';

export default function SummaryScreen({
  inningsList,
  matchSettings,
  toss,
  onResetMatch,
  onGoToHistory,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // Calculate result text
  const getMatchResult = () => {
    const isTest = matchSettings?.format === 'test';
    
    if (isTest) {
      const playedInnings = inningsList.filter(inn => inn.balls > 0 || inn.declared || inn.wickets > 0 || inn.allOutForce);
      const numInnings = playedInnings.length;

      if (numInnings < 2) {
        return "Match drawn (Incomplete data)";
      }

      let team1Total = 0;
      let team2Total = 0;

      inningsList.forEach(inn => {
        if (inn.team === toss?.battingFirst) {
          team1Total += inn.runs;
        } else {
          team2Total += inn.runs;
        }
      });

      const team1Name = toss?.battingFirst || 'Team A';
      const team2Name = toss?.bowlingFirst || 'Team B';

      const lastInningsIndex = playedInnings.length - 1;
      const lastInnings = playedInnings[lastInningsIndex];
      
      if (lastInningsIndex === 3) {
        const chasingTeam = lastInnings.team;
        const defendingTeam = lastInnings.bowlingTeam;
        
        const chasingTeamTotal = chasingTeam === team1Name ? team1Total : team2Total;
        const defendingTeamTotal = defendingTeam === team1Name ? team1Total : team2Total;
        
        if (chasingTeamTotal > defendingTeamTotal) {
          const wicketsLeft = 10 - lastInnings.wickets;
          return `${chasingTeam} won by ${wicketsLeft} wickets!`;
        } else {
          const isFinished = lastInnings.wickets === 10 || lastInnings.declared || lastInnings.allOutForce;
          if (isFinished) {
            if (chasingTeamTotal < defendingTeamTotal) {
              const margin = defendingTeamTotal - chasingTeamTotal;
              return `${defendingTeam} won by ${margin} runs!`;
            } else {
              return "Match Tied!";
            }
          }
        }
      }

      if (lastInningsIndex === 2) {
        const thirdInnings = playedInnings[2];
        const isFinished = thirdInnings.wickets === 10 || thirdInnings.declared || thirdInnings.allOutForce;
        if (isFinished) {
          if (thirdInnings.team === team2Name) {
            if (team2Total < team1Total) {
              const margin = team1Total - team2Total;
              return `${team1Name} won by an innings and ${margin} runs!`;
            }
          } else {
            if (team1Total < team2Total) {
              const margin = team2Total - team1Total;
              return `${team2Name} won by an innings and ${margin} runs!`;
            }
          }
        }
      }

      if (team1Total > team2Total) {
        return `${team1Name} led by ${team1Total - team2Total} runs (Match Ended)`;
      } else if (team2Total > team1Total) {
        return `${team2Name} led by ${team2Total - team1Total} runs (Match Ended)`;
      } else {
        return "Match Tied / Drawn!";
      }

    } else {
      if (inningsList.length < 2) return "Match Incomplete";
      
      const firstInnings = inningsList[0];
      const secondInnings = inningsList[1];
      
      const team1Name = firstInnings.team;
      const team2Name = secondInnings.team;
      
      if (secondInnings.runs > firstInnings.runs) {
        const wicketsLeft = 10 - secondInnings.wickets;
        return `${team2Name} won by ${wicketsLeft} wickets!`;
      } else if (secondInnings.wickets === 10 || secondInnings.declared || secondInnings.allOutForce || (secondInnings.balls === (matchSettings?.overs * 6))) {
        if (firstInnings.runs > secondInnings.runs) {
          const margin = firstInnings.runs - secondInnings.runs;
          return `${team1Name} won by ${margin} runs!`;
        } else {
          return "Match Tied!";
        }
      }
      return "Match Incomplete";
    }
  };

  const getFormatLabel = () => {
    return matchSettings?.format === 'test' ? 'Test Match' : `${matchSettings?.overs || 5} Overs Match`;
  };

  const renderInningsDetails = (innings, index) => {
    const batsmen = Object.entries(innings?.batsmen || {});
    const bowlers = Object.entries(innings?.bowlers || {});
    const totalBalls = innings?.balls || 0;
    const oversStr = `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;
    const extras = innings?.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0 };

    return (
      <div key={index} style={{ animation: 'pop-in 0.3s ease' }}>
        {/* TV Graphic Scorecard View */}
        <BroadcastScorecard
          teamName={innings.team}
          runs={innings.runs}
          wickets={innings.wickets}
          balls={innings.balls}
          isTest={matchSettings?.format === 'test'}
          inningsIndex={index}
          inningsList={inningsList}
        />

        {/* Batsmen Table */}
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', marginTop: '16px', textTransform: 'uppercase' }}>
          Batting Scorecard
        </h4>
        <div className="table-container card" style={{ padding: '10px', marginBottom: '16px' }}>
          <table className="scorecard-table">
            <thead>
              <tr>
                <th>Batter</th>
                <th>Dismissal</th>
                <th className="runs-col">R</th>
                <th className="stat-col">B</th>
                <th className="stat-col">4s</th>
                <th className="stat-col">6s</th>
                <th className="stat-col">SR</th>
              </tr>
            </thead>
            <tbody>
              {batsmen.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No batting stats available</td>
                </tr>
              ) : (
                batsmen.map(([name, stats]) => {
                  const p = getPlayerByName(name);
                  return (
                    <tr key={name}>
                      <td style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="player-avatar-wrapper small">
                          {p && p.photo ? (
                            <img src={p.photo} alt={name} className="player-avatar-img" />
                          ) : (
                            <div className="player-avatar-initials">
                              {getPlayerInitials(name)}
                            </div>
                          )}
                        </div>
                        {name}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {stats.out ? `out (${stats.howOut || 'b'})` : 'not out'}
                      </td>
                      <td className="runs-col">{stats.runs}</td>
                      <td className="stat-col">{stats.balls}</td>
                      <td className="stat-col">{stats.fours}</td>
                      <td className="stat-col">{stats.sixes}</td>
                      <td className="stat-col">
                        {stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Extras Row */}
        <div className="extras-row">
          <span>Extras: <strong>{(extras.wide || 0) + (extras.noBall || 0) + (extras.bye || 0) + (extras.legBye || 0)}</strong></span>
          <span style={{ fontSize: '0.75rem' }}>
            Wd: {extras.wide || 0} | Nb: {extras.noBall || 0} | B: {extras.bye || 0} | Lb: {extras.legBye || 0}
          </span>
        </div>

        {/* Bowlers Table */}
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Bowling Scorecard
        </h4>
        <div className="table-container card" style={{ padding: '10px' }}>
          <table className="scorecard-table">
            <thead>
              <tr>
                <th>Bowler</th>
                <th className="stat-col">O</th>
                <th className="stat-col">M</th>
                <th className="stat-col">R</th>
                <th className="stat-col font-bold">W</th>
                <th className="stat-col">Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowlers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bowling stats available</td>
                </tr>
              ) : (
                bowlers.map(([name, stats]) => {
                  const oversStr = `${Math.floor(stats.balls / 6)}.${stats.balls % 6}`;
                  const econ = stats.balls > 0 ? ((stats.runs / stats.balls) * 6).toFixed(2) : '0.00';
                  const p = getPlayerByName(name);
                  return (
                    <tr key={name}>
                      <td style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="player-avatar-wrapper small">
                          {p && p.photo ? (
                            <img src={p.photo} alt={name} className="player-avatar-img" />
                          ) : (
                            <div className="player-avatar-initials bowler">
                              {getPlayerInitials(name)}
                            </div>
                          )}
                        </div>
                        {name}
                      </td>
                      <td className="stat-col">{oversStr}</td>
                      <td className="stat-col">{stats.maidens}</td>
                      <td className="stat-col">{stats.runs}</td>
                      <td className="stat-col" style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{stats.wickets}</td>
                      <td className="stat-col">{econ}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const activeInningsList = inningsList.filter((inn, idx) => inn.balls > 0 || inn.declared || inn.wickets > 0 || idx === 0);
  const currentDisplayedInnings = activeInningsList[activeTab] || inningsList[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '70px' }}>
      {/* Trophy Header Section */}
      <div style={{ textAlign: 'center', margin: '12px 0' }}>
        <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '50%', marginBottom: '8px' }}>
          <Trophy size={36} color="#00ff88" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 136, 0.5))' }} />
        </div>
        
        {/* Match Result Banner */}
        <div className="summary-result-banner">
          <h2 className="summary-result-title">{getMatchResult()}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span className="summary-result-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> {getFormatLabel()}
            </span>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowShareModal(true)}
              style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px', background: 'rgba(0, 229, 255, 0.15)', color: 'var(--secondary)' }}
            >
              <Share2 size={12} /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Scorecard Tabs */}
      <div>
        <div className="tabs-header" style={{ marginBottom: '12px' }}>
          {activeInningsList.map((inn, idx) => (
            <button
              key={idx}
              className={`tab-btn ${activeTab === idx ? 'active' : ''}`}
              onClick={() => setActiveTab(idx)}
            >
              Inn {idx + 1}
              <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.8 }}>
                {inn.team.substring(0, 8)}
              </span>
            </button>
          ))}
        </div>

        {/* Display scorecard for active tab */}
        {currentDisplayedInnings && renderInningsDetails(currentDisplayedInnings, activeTab)}
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="btn btn-primary" onClick={onResetMatch}>
          <RefreshCw size={16} /> Score New Match
        </button>
        <button className="btn btn-secondary" onClick={onGoToHistory}>
          📂 View Match History Archive
        </button>
      </div>

      {/* SHARE SCORECARD MODAL */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        matchSettings={matchSettings}
        currentInnings={currentDisplayedInnings}
        stumpsStatus={null}
        resultText={getMatchResult()}
        inningsList={inningsList}
        currentInningsIndex={activeTab}
      />
    </div>
  );
}
