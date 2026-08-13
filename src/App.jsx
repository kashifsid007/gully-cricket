import React, { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import TossScreen from './components/TossScreen';
import StrikerSetupScreen from './components/StrikerSetupScreen';
import GameScreen from './components/GameScreen';
import SummaryScreen from './components/SummaryScreen';
import HistoryScreen from './components/HistoryScreen';
import PlayersTab from './components/PlayersTab';
import IncompleteMatchesTab from './components/IncompleteMatchesTab';
import Navbar from './components/Navbar';

// Deep cloning helper
const cloneState = (stateObj) => JSON.parse(JSON.stringify(stateObj));

const createInnings = (battingTeam, bowlingTeam) => ({
  team: battingTeam,
  bowlingTeam: bowlingTeam,
  runs: 0,
  wickets: 0,
  balls: 0,
  declared: false,
  allOutForce: false,
  extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
  batsmen: {},
  bowlers: {},
  fallOfWickets: [],
  overHistory: [],
});

export default function App() {
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard', 'players', 'incomplete', 'history'
  const [screen, setScreen] = useState('SETUP'); // SETUP, TOSS, STRIKER_SETUP, GAME, SUMMARY, HISTORY
  const [prevScreen, setPrevScreen] = useState('SETUP');
  const [matchSettings, setMatchSettings] = useState(null);
  const [toss, setToss] = useState(null);
  
  const [inningsList, setInningsList] = useState([]);
  const [currentInningsIndex, setCurrentInningsIndex] = useState(0);
  
  const [strikerName, setStrikerName] = useState('');
  const [nonStrikerName, setNonStrikerName] = useState('');
  const [bowlerName, setBowlerName] = useState('');
  const [stumpsStatus, setStumpsStatus] = useState(null);
  
  // History stack for Undo
  const [history, setHistory] = useState([]);

  // Active match ID for history
  const [currentMatchId, setCurrentMatchId] = useState(null);

  // Incomplete matches count for navbar badge
  const [incompleteCount, setIncompleteCount] = useState(0);

  // Count incomplete matches for badge
  const updateIncompleteCount = () => {
    try {
      const matches = JSON.parse(localStorage.getItem('gully_cricket_matches') || '[]');
      const count = matches.filter(m => m.status !== 'Completed' && m.screen !== 'SUMMARY').length;
      setIncompleteCount(count);
    } catch (err) {
      setIncompleteCount(0);
    }
  };

  useEffect(() => {
    updateIncompleteCount();
  }, [screen, activeTab]);

  // Auto-save game to local storage
  useEffect(() => {
    if (currentMatchId && screen !== 'SETUP' && screen !== 'HISTORY') {
      const matches = JSON.parse(localStorage.getItem('gully_cricket_matches') || '[]');
      const matchIndex = matches.findIndex(m => m.id === currentMatchId);

      const matchData = {
        id: currentMatchId,
        date: matchIndex >= 0 ? matches[matchIndex].date : new Date().toLocaleString(),
        matchSettings,
        toss,
        inningsList,
        currentInningsIndex,
        strikerName,
        nonStrikerName,
        bowlerName,
        stumpsStatus,
        history,
        screen,
        status: screen === 'SUMMARY' ? 'Completed' : (stumpsStatus || 'Incomplete')
      };

      if (matchIndex >= 0) {
        matches[matchIndex] = matchData;
      } else {
        matches.unshift(matchData);
      }
      localStorage.setItem('gully_cricket_matches', JSON.stringify(matches));
      updateIncompleteCount();
    }
  }, [currentMatchId, screen, inningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName, stumpsStatus, history, matchSettings, toss]);

  // Save currentState to history
  const pushHistory = (currentList, currentIndex, striker, nonStriker, bowler) => {
    setHistory(prev => [
      ...prev,
      {
        inningsList: cloneState(currentList),
        currentInningsIndex: currentIndex,
        strikerName: striker,
        nonStrikerName: nonStriker,
        bowlerName: bowler
      }
    ]);
  };

  // 1. Setup completed
  const handleSetupComplete = (settings) => {
    setMatchSettings(settings);
    setCurrentMatchId(Date.now().toString());
    setStumpsStatus(null);
    setScreen('TOSS');
  };

  // 2. Toss completed
  const handleTossComplete = (tossData) => {
    setToss(tossData);
    
    // Initialize innings list based on format
    const isTest = matchSettings.format === 'test';
    const initialInningsList = [];
    
    if (isTest) {
      initialInningsList.push(createInnings(tossData.battingFirst, tossData.bowlingFirst));
      initialInningsList.push(createInnings(tossData.bowlingFirst, tossData.battingFirst));
      initialInningsList.push(createInnings(tossData.battingFirst, tossData.bowlingFirst));
      initialInningsList.push(createInnings(tossData.bowlingFirst, tossData.battingFirst));
    } else {
      initialInningsList.push(createInnings(tossData.battingFirst, tossData.bowlingFirst));
      initialInningsList.push(createInnings(tossData.bowlingFirst, tossData.battingFirst));
    }
    
    setInningsList(initialInningsList);
    setCurrentInningsIndex(0);
    setScreen('STRIKER_SETUP');
  };

  // 3. Lineup setup completed
  const handleStartGame = (lineup) => {
    setStrikerName(lineup.striker);
    setNonStrikerName(lineup.nonStriker);
    setBowlerName(lineup.bowler);
    
    setInningsList(prev => {
      const copy = cloneState(prev);
      const cur = copy[currentInningsIndex];
      if (!cur.batsmen[lineup.striker]) {
        cur.batsmen[lineup.striker] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
      }
      if (!cur.batsmen[lineup.nonStriker]) {
        cur.batsmen[lineup.nonStriker] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
      }
      if (!cur.bowlers[lineup.bowler]) {
        cur.bowlers[lineup.bowler] = { balls: 0, maidens: 0, runs: 0, wickets: 0 };
      }
      return copy;
    });

    setScreen('GAME');
  };

  // Swap strike manually
  const handleSwapBatsmen = () => {
    pushHistory(inningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName);
    const temp = strikerName;
    setStrikerName(nonStrikerName);
    setNonStrikerName(temp);
  };

  // Rename a player mid-game
  const handleRenamePlayer = (type, oldName, newName) => {
    if (!newName || !newName.trim()) return;
    const trimmedNewName = newName.trim();
    if (trimmedNewName === oldName) return;

    pushHistory(inningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName);

    setInningsList(prev => {
      const copy = cloneState(prev);
      const cur = copy[currentInningsIndex];
      
      if ((type === 'striker' || type === 'nonStriker') && cur.batsmen[oldName]) {
        cur.batsmen[trimmedNewName] = { ...cur.batsmen[oldName] };
        delete cur.batsmen[oldName];
      }

      if (type === 'bowler' && cur.bowlers[oldName]) {
        cur.bowlers[trimmedNewName] = { ...cur.bowlers[oldName] };
        delete cur.bowlers[oldName];
      }

      return copy;
    });

    if (type === 'striker') setStrikerName(trimmedNewName);
    if (type === 'nonStriker') setNonStrikerName(trimmedNewName);
    if (type === 'bowler') setBowlerName(trimmedNewName);
  };

  // Declare current innings as "All Out"
  const handleAllOut = () => {
    pushHistory(inningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName);

    const updatedInningsList = cloneState(inningsList);
    const curInnings = updatedInningsList[currentInningsIndex];
    curInnings.allOutForce = true;
    
    setInningsList(updatedInningsList);
    checkInningsAndMatchStatus(updatedInningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName, true);
  };

  // Handle Day Stumps label update
  const handleDayStumps = (label) => {
    setStumpsStatus(label);
  };

  // Ball Scored engine
  const handleBallScored = (action) => {
    const updatedInningsList = cloneState(inningsList);
    const curInnings = updatedInningsList[currentInningsIndex];
    let nextStriker = strikerName;
    let nextNonStriker = nonStrikerName;
    let nextBowler = bowlerName;

    if (action.type !== 'bowler_change') {
      pushHistory(inningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName);
    }

    if (!curInnings.batsmen[strikerName]) {
      curInnings.batsmen[strikerName] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
    }
    if (!curInnings.batsmen[nonStrikerName]) {
      curInnings.batsmen[nonStrikerName] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
    }
    if (!curInnings.bowlers[bowlerName]) {
      curInnings.bowlers[bowlerName] = { balls: 0, maidens: 0, runs: 0, wickets: 0 };
    }

    const striker = curInnings.batsmen[strikerName];
    const bowler = curInnings.bowlers[bowlerName];

    switch (action.type) {
      case 'runs': {
        const runs = action.value;
        curInnings.runs += runs;
        curInnings.balls += 1;
        
        striker.runs += runs;
        striker.balls += 1;
        if (runs === 4) striker.fours += 1;
        if (runs === 6) striker.sixes += 1;
        
        bowler.balls += 1;
        bowler.runs += runs;
        
        curInnings.overHistory.push(runs.toString());
        
        if (runs === 1 || runs === 3) {
          nextStriker = nonStrikerName;
          nextNonStriker = strikerName;
        }
        break;
      }
      
      case 'extras': {
        const { subType, value = 0 } = action;
        if (subType === 'wd') {
          curInnings.runs += 1;
          curInnings.extras.wide += 1;
          bowler.runs += 1;
          curInnings.overHistory.push('wd');
        } else if (subType === 'nb') {
          curInnings.runs += 1;
          curInnings.extras.noBall += 1;
          bowler.runs += 1;
          striker.balls += 1;
          curInnings.overHistory.push('nb');
        } else if (subType === 'b') {
          curInnings.runs += value;
          curInnings.extras.bye += value;
          curInnings.balls += 1;
          striker.balls += 1;
          bowler.balls += 1;
          curInnings.overHistory.push(`${value}b`);
          if (value === 1 || value === 3) {
            nextStriker = nonStrikerName;
            nextNonStriker = strikerName;
          }
        } else if (subType === 'lb') {
          curInnings.runs += value;
          curInnings.extras.legBye += value;
          curInnings.balls += 1;
          striker.balls += 1;
          bowler.balls += 1;
          curInnings.overHistory.push(`${value}lb`);
          if (value === 1 || value === 3) {
            nextStriker = nonStrikerName;
            nextNonStriker = strikerName;
          }
        }
        break;
      }
      
      case 'wicket': {
        const { wicketType, whoIsOut, newBatsman } = action;
        curInnings.wickets += 1;
        curInnings.balls += 1;
        
        const outBatsmanName = whoIsOut === 'striker' ? strikerName : nonStrikerName;
        curInnings.batsmen[outBatsmanName].out = true;
        curInnings.batsmen[outBatsmanName].howOut = wicketType;
        
        striker.balls += 1;
        bowler.balls += 1;
        if (wicketType !== 'run out') {
          bowler.wickets += 1;
        }
        
        curInnings.overHistory.push('W');
        
        curInnings.fallOfWickets.push({
          score: curInnings.runs,
          wickets: curInnings.wickets,
          overs: `${Math.floor(curInnings.balls / 6)}.${curInnings.balls % 6}`
        });

        curInnings.batsmen[newBatsman] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
        
        if (whoIsOut === 'striker') {
          nextStriker = newBatsman;
        } else {
          nextNonStriker = newBatsman;
        }
        break;
      }
      
      case 'bowler_change': {
        pushHistory(inningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName);

        const { nextBowler: newBowler } = action;
        
        const prevOverHistory = curInnings.overHistory;
        const runsConcededInOver = prevOverHistory.reduce((acc, ball) => {
          if (ball.includes('wd') || ball.includes('nb')) return acc + 1;
          const r = parseInt(ball);
          return !isNaN(r) ? acc + r : acc;
        }, 0);
        
        if (runsConcededInOver === 0 && prevOverHistory.length > 0) {
          bowler.maidens += 1;
        }
        
        curInnings.overHistory = [];
        nextBowler = newBowler;
        
        if (!curInnings.bowlers[newBowler]) {
          curInnings.bowlers[newBowler] = { balls: 0, maidens: 0, runs: 0, wickets: 0 };
        }
        
        nextStriker = nonStrikerName;
        nextNonStriker = strikerName;
        break;
      }
      
      default:
        break;
    }

    setStrikerName(nextStriker);
    setNonStrikerName(nextNonStriker);
    setBowlerName(nextBowler);
    setInningsList(updatedInningsList);

    checkInningsAndMatchStatus(updatedInningsList, currentInningsIndex, nextStriker, nextNonStriker, nextBowler);
  };

  // Declare Innings action
  const handleDeclare = () => {
    const updatedInningsList = cloneState(inningsList);
    updatedInningsList[currentInningsIndex].declared = true;
    setInningsList(updatedInningsList);
    
    pushHistory(inningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName);
    
    checkInningsAndMatchStatus(updatedInningsList, currentInningsIndex, strikerName, nonStrikerName, bowlerName);
  };

  // State undo pop action
  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    
    setInningsList(previousState.inningsList);
    setCurrentInningsIndex(previousState.currentInningsIndex);
    setStrikerName(previousState.strikerName);
    setNonStrikerName(previousState.nonStrikerName);
    setBowlerName(previousState.bowlerName);
    setHistory(prev => prev.slice(0, -1));
  };

  // Engine transition check
  const checkInningsAndMatchStatus = (updatedInningsList, index, striker, nonStriker, bowler, forcedAllOut = false) => {
    const isTest = matchSettings.format === 'test';
    const curInnings = updatedInningsList[index];
    const team1Name = toss.battingFirst;
    const team2Name = toss.bowlingFirst;
    
    if (isTest) {
      const allOut = curInnings.wickets === 10 || forcedAllOut || curInnings.allOutForce;
      const declared = curInnings.declared;

      if (allOut || declared) {
        if (index === 0) {
          setCurrentInningsIndex(1);
          setInningsList(updatedInningsList);
          setScreen('STRIKER_SETUP');
          return;
        }
        
        if (index === 1) {
          const teamAScore1 = updatedInningsList[0].runs;
          const teamBScore1 = updatedInningsList[1].runs;
          
          if (teamAScore1 - teamBScore1 >= 100) {
            const wantFollowOn = window.confirm(
              `Follow-on option: ${team1Name} leads by ${teamAScore1 - teamBScore1} runs. Enforce follow-on on ${team2Name}?`
            );
            if (wantFollowOn) {
              updatedInningsList[2].team = team2Name;
              updatedInningsList[2].bowlingTeam = team1Name;
              
              updatedInningsList[3].team = team1Name;
              updatedInningsList[3].bowlingTeam = team2Name;
              
              setCurrentInningsIndex(2);
              setInningsList(updatedInningsList);
              setScreen('STRIKER_SETUP');
              return;
            }
          }
          
          setCurrentInningsIndex(2);
          setInningsList(updatedInningsList);
          setScreen('STRIKER_SETUP');
          return;
        }

        if (index === 2) {
          const isFollowOn = updatedInningsList[2].team === team2Name;
          const teamAScore1 = updatedInningsList[0].runs;
          const teamBScore1 = updatedInningsList[1].runs;
          const runs3 = updatedInningsList[2].runs;

          if (isFollowOn) {
            const teamBTotal = teamBScore1 + runs3;
            if (teamBTotal < teamAScore1) {
              setInningsList(updatedInningsList);
              setScreen('SUMMARY');
              return;
            }
          } else {
            const teamATotal = teamAScore1 + runs3;
            if (teamATotal < teamBScore1) {
              setInningsList(updatedInningsList);
              setScreen('SUMMARY');
              return;
            }
          }

          setCurrentInningsIndex(3);
          setInningsList(updatedInningsList);
          setScreen('STRIKER_SETUP');
          return;
        }

        if (index === 3) {
          setInningsList(updatedInningsList);
          setScreen('SUMMARY');
          return;
        }
      }

      if (index === 3) {
        let team1Total = 0;
        let team2Total = 0;
        
        updatedInningsList.forEach((inn, i) => {
          if (i <= index) {
            if (inn.team === team1Name) team1Total += inn.runs;
            else team2Total += inn.runs;
          }
        });

        if (curInnings.team === team2Name && team2Total > team1Total) {
          setInningsList(updatedInningsList);
          setScreen('SUMMARY');
        } else if (curInnings.team === team1Name && team1Total > team2Total) {
          setInningsList(updatedInningsList);
          setScreen('SUMMARY');
        }
      }

    } else {
      const allOut = curInnings.wickets === 10 || forcedAllOut || curInnings.allOutForce;
      const oversCompleted = curInnings.balls >= (matchSettings.overs * 6);

      if (index === 0) {
        if (allOut || oversCompleted) {
          setCurrentInningsIndex(1);
          setInningsList(updatedInningsList);
          setScreen('STRIKER_SETUP');
        }
      } else if (index === 1) {
        const target = updatedInningsList[0].runs + 1;
        if (curInnings.runs >= target) {
          setInningsList(updatedInningsList);
          setScreen('SUMMARY');
        } else if (allOut || oversCompleted) {
          setInningsList(updatedInningsList);
          setScreen('SUMMARY');
        }
      }
    }
  };

  // Reset Match State
  const handleResetMatch = () => {
    setScreen('SETUP');
    setActiveTab('scorecard');
    setMatchSettings(null);
    setToss(null);
    setInningsList([]);
    setCurrentInningsIndex(0);
    setStrikerName('');
    setNonStrikerName('');
    setBowlerName('');
    setStumpsStatus(null);
    setHistory([]);
    setCurrentMatchId(null);
  };

  // Continue a match from History Screen or Incomplete Matches
  const handleContinueMatch = (match) => {
    setCurrentMatchId(match.id);
    setMatchSettings(match.matchSettings);
    setToss(match.toss);
    setInningsList(match.inningsList);
    setCurrentInningsIndex(match.currentInningsIndex);
    setStrikerName(match.strikerName);
    setNonStrikerName(match.nonStrikerName);
    setBowlerName(match.bowlerName);
    setStumpsStatus(match.stumpsStatus || null);
    setHistory(match.history || []);
    setScreen(match.screen === 'SUMMARY' ? 'SUMMARY' : (match.screen || 'GAME'));
    setActiveTab('scorecard');
  };

  // View Scorecard of a match
  const handleViewStats = (match) => {
    setCurrentMatchId(match.id);
    setMatchSettings(match.matchSettings);
    setToss(match.toss);
    setInningsList(match.inningsList);
    setCurrentInningsIndex(match.currentInningsIndex);
    setStrikerName(match.strikerName);
    setNonStrikerName(match.nonStrikerName);
    setBowlerName(match.bowlerName);
    setStumpsStatus(match.stumpsStatus || null);
    setHistory(match.history || []);
    setScreen('SUMMARY');
    setActiveTab('scorecard');
  };

  return (
    <div className="app-container">
      {/* Main Viewport Content based on active Tab */}
      {activeTab === 'scorecard' && (
        <>
          {screen === 'SETUP' && (
            <SetupScreen 
              onSetupComplete={handleSetupComplete} 
              onViewHistory={() => { setPrevScreen('SETUP'); setActiveTab('history'); }} 
            />
          )}
          
          {screen === 'TOSS' && (
            <TossScreen 
              team1={matchSettings.team1} 
              team2={matchSettings.team2} 
              onTossComplete={handleTossComplete} 
            />
          )}
          
          {screen === 'STRIKER_SETUP' && (
            <StrikerSetupScreen 
              battingTeam={inningsList[currentInningsIndex].team} 
              bowlingTeam={inningsList[currentInningsIndex].bowlingTeam} 
              onStartGame={handleStartGame} 
            />
          )}
          
          {screen === 'GAME' && (
            <GameScreen
              matchSettings={matchSettings}
              toss={toss}
              inningsList={inningsList}
              currentInningsIndex={currentInningsIndex}
              strikerName={strikerName}
              nonStrikerName={nonStrikerName}
              bowlerName={bowlerName}
              onBallScored={handleBallScored}
              onUndo={handleUndo}
              onDeclare={handleDeclare}
              onSwapBatsmen={handleSwapBatsmen}
              onRenamePlayer={handleRenamePlayer}
              onAllOut={handleAllOut}
              team1={matchSettings.team1}
              team2={matchSettings.team2}
              onDayStumps={handleDayStumps}
            />
          )}
          
          {screen === 'SUMMARY' && (
            <SummaryScreen
              inningsList={inningsList}
              matchSettings={matchSettings}
              toss={toss}
              onResetMatch={handleResetMatch}
              onGoToHistory={() => setActiveTab('history')}
            />
          )}
        </>
      )}

      {activeTab === 'players' && (
        <PlayersTab />
      )}

      {activeTab === 'incomplete' && (
        <IncompleteMatchesTab onResumeMatch={handleContinueMatch} />
      )}

      {activeTab === 'history' && (
        <HistoryScreen 
          onContinueMatch={handleContinueMatch}
          onViewStats={handleViewStats}
          onBack={() => setActiveTab('scorecard')}
        />
      )}

      {/* Persistent Bottom Navbar */}
      <Navbar 
        activeTab={activeTab} 
        onTabChange={(tabId) => setActiveTab(tabId)} 
        incompleteCount={incompleteCount}
      />
    </div>
  );
}
