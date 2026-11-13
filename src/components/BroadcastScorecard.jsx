import React from 'react';

export default function BroadcastScorecard({
  teamName,
  runs,
  wickets,
  balls,
  isTest = false,
  inningsIndex = 0,
  stumpsStatus = null, // e.g. "Day 1 Stumps"
  targetInfo = null,   // e.g. { target, runsNeeded, ballsRemaining, reqRunRate, isChasing, isFirstInnings, ... }
  inningsList = [],
}) {
  const oversStr = `${Math.floor(balls / 6)}.${balls % 6}`;
  const runRate = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';
  const hasBallLimit = Number.isFinite(targetInfo?.ballsRemaining);

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
        {/* Top live badge bar matching pro mobile cricket broadcast */}
        <div className="broadcast-live-row">
          <span className="broadcast-live-badge">🔴 LIVE</span>
          <span className="broadcast-corner-arrow" title="Live scorecard">↗</span>
        </div>

        {/* ROW 1: TEAM CODE, SCORE & OVERS */}
        <div className="broadcast-row primary-row">
          <div className="broadcast-team-code">
            <span className="team-badge-icon">🏏</span>
            <span className="team-code-text">{teamCode}</span>
          </div>
          <div className="broadcast-score-with-overs">
            <span className="broadcast-score-value">{runs}-{wickets}</span>
            <span className="broadcast-overs-pill">({oversStr} ov)</span>
          </div>
        </div>

        {/* ROW 2: RATES DISPLAY */}
        <div className="broadcast-row rates-row">
          <div className="rate-item">
            <span className="rate-label">CRR</span>
            <span className="rate-value">{runRate}</span>
          </div>
          {targetInfo?.target != null && (
            <div className="rate-item target-item">
              <span className="rate-label">TARGET</span>
              <span className="rate-value">{targetInfo.target}</span>
            </div>
          )}
          {targetInfo?.isChasing && targetInfo?.reqRunRate && (
            <div className="rate-item req-item">
              <span className="rate-label">REQ RR</span>
              <span className="rate-value">{targetInfo.reqRunRate}</span>
            </div>
          )}
        </div>

        {/* ROW 3: INTEGRATED LIVE STATUS BANNER INSIDE CARD */}
        <div className={`broadcast-live-status-bar ${targetInfo?.isChasing ? 'is-chasing' : ''}`}>
          {targetInfo?.isChasing ? (
            <div className="broadcast-chase-status">
              <span className="chase-pulse-dot" aria-hidden="true" />
              <span className="chase-main-text">
                {targetInfo.runsNeeded > 0 ? (
                  <>
                    <strong>{teamName}</strong> need <strong className="chase-highlight-runs">{targetInfo.runsNeeded}</strong> {targetInfo.runsNeeded === 1 ? 'run' : 'runs'} in <strong className="chase-highlight-balls">{targetInfo.ballsRemaining}</strong> {targetInfo.ballsRemaining === 1 ? 'ball' : 'balls'}
                    {hasBallLimit && targetInfo.ballsRemaining > 0 && (
                      <span className="chase-sub-detail">
                        {' '}({Math.floor(targetInfo.ballsRemaining / 6)}.{targetInfo.ballsRemaining % 6} ov)
                      </span>
                    )}
                  </>
                ) : targetInfo.runsNeeded === 0 ? (
                  <>
                    ⚖️ <strong>Scores Level!</strong> Need 1 run in {targetInfo.ballsRemaining} balls to win
                  </>
                ) : (
                  <>
                    🏆 <strong>Target Achieved!</strong> {teamName} won the match!
                  </>
                )}
              </span>
            </div>
          ) : targetInfo?.isFirstInnings ? (
            <div className="broadcast-chase-status first-inn">
              <span className="chase-pulse-dot first-inn" aria-hidden="true" />
              <span className="chase-main-text">
                1st Innings: <strong>{targetInfo.firstInnBallsLeft}</strong> balls left • Projected: <strong>{targetInfo.projectedScore}</strong>
              </span>
            </div>
          ) : targetInfo?.chaseStatusText ? (
            <div className="broadcast-chase-status">
              <span className="chase-pulse-dot" aria-hidden="true" />
              <span className="chase-main-text">{targetInfo.chaseStatusText}</span>
            </div>
          ) : (
            <div className="broadcast-chase-status">
              <span className="chase-pulse-dot" aria-hidden="true" />
              <span className="chase-main-text">Live Match • Run Rate: {runRate}</span>
            </div>
          )}
        </div>

        {/* Stumps Banner (If declared Stumps in Test match) */}
        {stumpsStatus && (
          <div className="broadcast-stumps-badge">
            <span>🌙 {stumpsStatus.toUpperCase()}</span>
          </div>
        )}
      </div>

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
