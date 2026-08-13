import React from 'react';

export default function BroadcastScorecard({
  teamName,
  runs,
  wickets,
  balls,
  isTest = false,
  inningsIndex = 0,
  stumpsStatus = null, // e.g. "Day 1 Stumps"
  targetInfo = null,   // e.g. { runsNeeded, ballsRemaining, reqRunRate }
  inningsList = [],
}) {
  const oversStr = `${Math.floor(balls / 6)}.${balls % 6}`;
  const runRate = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

  // Get short 3-4 letter team code (e.g. India -> IND, Kashif XI -> KASH)
  const getTeamCode = (name) => {
    if (!name) return 'TEAM';
    const clean = name.trim();
    if (clean.length <= 4) return clean.toUpperCase();
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1].substring(0, 2)).toUpperCase();
    }
    return clean.substring(0, 4).toUpperCase();
  };

  const teamCode = getTeamCode(teamName);

  return (
    <div className="broadcast-scorecard-container">
      {/* Decorative Diagonal Vector Accents */}
      <div className="broadcast-accent-stripe-top"></div>
      <div className="broadcast-accent-stripe-bottom"></div>

      {/* Main Broadcast Header Box */}
      <div className="broadcast-card">
        {/* ROW 1: TEAM CODE & SCORE */}
        <div className="broadcast-row primary-row">
          <div className="broadcast-team-code">
            <span className="team-badge-icon">🏏</span>
            <span className="team-code-text">{teamCode}</span>
          </div>
          <div className="broadcast-score-value">
            {runs}-{wickets}
          </div>
        </div>

        {/* ROW 2: OVERS */}
        <div className="broadcast-row secondary-row">
          <div className="broadcast-label">OVERS</div>
          <div className="broadcast-value">{oversStr}</div>
        </div>

        {/* ROW 3: RUN RATE */}
        <div className="broadcast-row tertiary-row">
          <div className="broadcast-runrate-label">RUN RATE</div>
          <div className="broadcast-runrate-value">{runRate}</div>
        </div>

        {/* Stumps Banner (If declared Stumps in Test match) */}
        {stumpsStatus && (
          <div className="broadcast-stumps-badge">
            <span>🌙 {stumpsStatus.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Target Chasing Bar (if applicable) */}
      {targetInfo && targetInfo.runsNeeded > 0 && (
        <div className="broadcast-target-bar">
          🎯 {targetInfo.runsNeeded} runs needed {targetInfo.ballsRemaining ? `from ${targetInfo.ballsRemaining} balls (Req RR: ${targetInfo.reqRunRate})` : 'to win'}
        </div>
      )}

      {/* Test Match Innings Summary Pills */}
      {isTest && inningsList && inningsList.length > 0 && (
        <div className="broadcast-test-summary">
          {inningsList.map((inn, idx) => (
            <div 
              key={idx} 
              className={`test-inn-pill ${idx === inningsIndex ? 'active' : ''}`}
            >
              <span className="inn-num">Inn {idx + 1}:</span>
              <span className="inn-val">
                {inn.runs}/{inn.wickets}{inn.declared ? 'd' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
