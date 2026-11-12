/**
 * Calculates match winner and result summary from inningsList and match settings
 */
export const determineMatchOutcome = (inningsList = [], matchSettings = {}, toss = {}) => {
  if (!Array.isArray(inningsList) || inningsList.length === 0) {
    return { winner: null, summary: '' };
  }

  const isTest = matchSettings?.format === 'test';
  const team1Name = matchSettings?.team1 || toss?.battingFirst || 'Team 1';
  const team2Name = matchSettings?.team2 || toss?.bowlingFirst || 'Team 2';

  if (isTest) {
    const playedInnings = inningsList.filter(
      (inn) => (inn.balls || 0) > 0 || inn.declared || (inn.wickets || 0) > 0 || inn.allOutForce
    );
    if (playedInnings.length < 2) {
      return { winner: null, summary: 'Match Incomplete' };
    }

    let team1Total = 0;
    let team2Total = 0;

    inningsList.forEach((inn) => {
      const runs = Number(inn?.runs) || 0;
      if (inn.team?.toLowerCase() === team1Name.toLowerCase()) {
        team1Total += runs;
      } else {
        team2Total += runs;
      }
    });

    if (team1Total > team2Total) {
      return {
        winner: 'team1',
        winnerName: team1Name,
        summary: `${team1Name} won by ${team1Total - team2Total} runs`,
      };
    } else if (team2Total > team1Total) {
      return {
        winner: 'team2',
        winnerName: team2Name,
        summary: `${team2Name} won by ${team2Total - team1Total} runs`,
      };
    } else {
      return {
        winner: 'tied',
        winnerName: 'Tied',
        summary: 'Match Drawn / Tied',
      };
    }
  }

  // Limited overs match
  if (inningsList.length < 2) {
    return { winner: null, summary: 'Match Incomplete' };
  }

  const inn0 = inningsList[0];
  const inn1 = inningsList[1];
  const inn0Runs = Number(inn0?.runs) || 0;
  const inn1Runs = Number(inn1?.runs) || 0;
  const battingFirstTeam = inn0?.team || team1Name;
  const battingSecondTeam = inn1?.team || team2Name;

  if (inn1Runs > inn0Runs) {
    const isTeam1 = battingSecondTeam.toLowerCase() === team1Name.toLowerCase();
    const wicketsLeft = Math.max(0, 10 - (Number(inn1?.wickets) || 0));
    return {
      winner: isTeam1 ? 'team1' : 'team2',
      winnerName: battingSecondTeam,
      summary: `${battingSecondTeam} won by ${wicketsLeft} wickets`,
    };
  } else if (inn0Runs > inn1Runs) {
    const isTeam1 = battingFirstTeam.toLowerCase() === team1Name.toLowerCase();
    const margin = inn0Runs - inn1Runs;
    return {
      winner: isTeam1 ? 'team1' : 'team2',
      winnerName: battingFirstTeam,
      summary: `${battingFirstTeam} won by ${margin} runs`,
    };
  } else {
    return {
      winner: 'tied',
      winnerName: 'Tied',
      summary: 'Match Tied',
    };
  }
};

export const isTeam1Winner = (winner, team1Name) => {
  if (!winner) return false;
  const w = String(winner).trim().toLowerCase();
  const t1 = String(team1Name || '').trim().toLowerCase();
  return w === 'team1' || w === 'assasins' || (t1 && w === t1);
};

export const isTeam2Winner = (winner, team2Name) => {
  if (!winner) return false;
  const w = String(winner).trim().toLowerCase();
  const t2 = String(team2Name || '').trim().toLowerCase();
  return w === 'team2' || w === 'battle' || (t2 && w === t2);
};

