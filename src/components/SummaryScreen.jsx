import React, { useState } from 'react';
import { Trophy, RefreshCw, Calendar, Award, Star } from 'lucide-react';

export default function SummaryScreen({
  inningsList,
  matchSettings,
  toss,
  onResetMatch,
  onGoToHistory,
}) {
  const [activeTab, setActiveTab] = useState(0); // Index of the selected innings in tabs

  // Calculate result text
  const getMatchResult = () => {
    const isTest = matchSettings.format === 'test';
    
    if (isTest) {
      const playedInnings = inningsList.filter(inn => inn.balls > 0 || inn.declared || inn.wickets > 0 || inn.allOutForce);
      const numInnings = playedInnings.length;

      if (numInnings < 2) {
        return "Match drawn (Incomplete data)";
      }

      let team1Total = 0;
      let team2Total = 0;

      inningsList.forEach(inn => {
        if (inn.team === toss.battingFirst) {
          team1Total += inn.runs;
        } else {
          team2Total += inn.runs;
        }
      });

      const team1Name = toss.battingFirst;
      const team2Name = toss.bowlingFirst;

      const lastInningsIndex = playedInnings.length - 1;
      const lastInnings = playedInnings[lastInningsIndex];
      
      if (lastInningsIndex === 3) {
        // 4th Innings played
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

      // Check for Innings defeat:
      if (lastInningsIndex === 2) {
        const thirdInnings = playedInnings[2];
        const isFinished = thirdInnings.wickets === 10 || thirdInnings.declared || thirdInnings.allOutForce;
        if (isFinished) {
          if (thirdInnings.team === team2Name) {
            // Team 2 batted in 3rd innings (Follow-on scenario)
            if (team2Total < team1Total) {
              const margin = team1Total - team2Total;
              return `${team1Name} won by an innings and ${margin} runs!`;
            }
          } else {
            // Team 1 batted in 3rd innings (Normal scenario)
            if (team1Total < team2Total) {
              const margin = team2Total - team1Total;
              return `${team2Name} won by an innings and ${margin} runs!`;
            }
          }
        }
      }

      // Default fallback for incomplete/ongoing Test match
      if (team1Total > team2Total) {
        return `${team1Name} led by ${team1Total - team2Total} runs (Match Ended)`;
      } else if (team2Total > team1Total) {
        return `${team2Name} led by ${team2Total - team1Total} runs (Match Ended)`;
      } else {
        return "Match Tied / Drawn!";
      }

    } else {
      // Limited Overs scoring calculation
      if (inningsList.length < 2) return "Match Incomplete";
      
      const firstInnings = inningsList[0];
      const secondInnings = inningsList[1];
      
      const team1Name = firstInnings.team;
      const team2Name = secondInnings.team;
      
      if (secondInnings.runs > firstInnings.runs) {
        const wicketsLeft = 10 - secondInnings.wickets;
        return `${team2Name} won by ${wicketsLeft} wickets!`;
      } else if (secondInnings.wickets === 10 || secondInnings.declared || secondInnings.allOutForce || (secondInnings.balls === (matchSettings.overs * 6))) {
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
    return matchSettings.format === 'test' ? 'Test Match' : `${matchSettings.overs} Overs Match`;
  };

  const renderInningsDetails = (innings, index) => {
    const batsmen = Object.entries(innings.batsmen);
    const bowlers = Object.entries(innings.bowlers);
    const totalBalls = innings.balls;
    const oversStr = `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;

    return (
      <div key={index} style={{ animation: 'pop-in 0.3s ease' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--card-border)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div>
            <h4 style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
              {innings.runs}/{innings.wickets}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Overs: {oversStr} | RR: {totalBalls > 0 ? ((innings.runs / totalBalls) * 6).toFixed(2) : '0.00'}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
              {innings.team}
            </span>
            {innings.declared && (
              <span className="badge badge-active" style={{ fontSize: '0.7rem', marginLeft: '6px', background: 'rgba(255, 23, 68, 0.15)', borderColor: 'rgba(255, 23, 68, 0.4)', color: 'var(--error)' }}>
                Declared
              </span>
            )}
          </div>
        </div>

        {/* Batsmen Table */}
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Batting Scorecard
        </h4>
        <div className="table-container card" style={{ padding: '12px', marginBottom: '16px' }}>
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
                batsmen.map(([name, stats]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: '500' }}>{name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {stats.out ? `dismissed (${stats.howOut || 'out'})` : 'not out'}
                    </td>
                    <td className="runs-col">{stats.runs}</td>
                    <td className="stat-col">{stats.balls}</td>
                    <td className="stat-col">{stats.fours}</td>
                    <td className="stat-col">{stats.sixes}</td>
                    <td className="stat-col">
                      {stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Extras Row */}
        <div className="extras-row">
          <span>Extras: <strong>{innings.extras.wide + innings.extras.noBall + innings.extras.bye + innings.extras.legBye}</strong></span>
          <span style={{ fontSize: '0.75rem' }}>
            Wd: {innings.extras.wide} | Nb: {innings.extras.noBall} | B: {innings.extras.bye} | Lb: {innings.extras.legBye}
          </span>
        </div>

        {/* Bowlers Table */}
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Bowling Scorecard
        </h4>
        <div className="table-container card" style={{ padding: '12px' }}>
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
                  return (
                    <tr key={name}>
                      <td style={{ fontWeight: '500' }}>{name}</td>
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

  // Filter out innings that haven't started yet
  const activeInningsList = inningsList.filter((inn, idx) => inn.balls > 0 || inn.declared || inn.wickets > 0 || idx === 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Trophy Section */}
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(0, 255, 136, 0.1)', borderRadius: '50%', marginBottom: '12px' }}>
          <Trophy size={44} color="#00ff88" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 136, 0.5))' }} />
        </div>
        
        {/* Match Result Banner */}
        <div className="summary-result-banner">
          <h2 className="summary-result-title">{getMatchResult()}</h2>
          <span className="summary-result-subtitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
            <Calendar size={14} /> {getFormatLabel()}
          </span>
        </div>
      </div>

      {/* Scorecard Tabs */}
      <div>
        <div className="tabs-header">
          {activeInningsList.map((inn, idx) => (
            <button
              key={idx}
              className={`tab-btn ${activeTab === idx ? 'active' : ''}`}
              onClick={() => setActiveTab(idx)}
            >
              {matchSettings.format === 'test' ? `Innings ${idx+1}` : `Innings ${idx+1}`}
              <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.8 }}>
                {inn.team.substring(0, 10)}
              </span>
            </button>
          ))}
        </div>

        {/* Display scorecard for active tab */}
        {activeInningsList[activeTab] && renderInningsDetails(activeInningsList[activeTab], activeTab)}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className="btn btn-primary" onClick={onResetMatch}>
          <RefreshCw size={18} /> Score New Match
        </button>
        <button className="btn btn-secondary" onClick={onGoToHistory}>
          📂 View Match History
        </button>
      </div>
    </div>
  );
}
