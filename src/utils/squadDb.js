// Squad Database Helper
// Provides default tournament squads and retrieves squads for respective teams

import { getAllPlayers } from './playerDb';

const TOURNAMENT_KEY = 'gully_cricket_tournament_data';

export const DEFAULT_SQUADS = {
  assasins: {
    teamName: 'Team Assasins',
    captain: 'Kashif',
    players: [
      { name: 'Kashif', isCaptain: true, role: 'Captain & All-Rounder' },
      { name: 'Shad', isCaptain: false, role: 'Batsman' },
      { name: 'Nadir', isCaptain: false, role: 'All-Rounder' },
      { name: 'Arish', isCaptain: false, role: 'Bowler' },
      { name: 'Noraiz', isCaptain: false, role: 'Wicket-Keeper / Batsman' },
    ]
  },
  battle: {
    teamName: 'Team Battle',
    captain: 'Ayan',
    players: [
      { name: 'Ayan', isCaptain: true, role: 'Captain & All-Rounder' },
      { name: 'Ani', isCaptain: false, role: 'Batsman' },
      { name: 'Kamran', isCaptain: false, role: 'All-Rounder' },
      { name: 'Rafique', isCaptain: false, role: 'Bowler' },
      { name: 'Almas', isCaptain: false, role: 'Wicket-Keeper / Batsman' },
    ]
  }
};

/**
 * Get squad array for a given team name
 * @param {string} teamName 
 * @returns {Array<{name: string, isCaptain: boolean, role: string}>}
 */
export const getTeamSquad = (teamName) => {
  if (!teamName) return [];
  const normalized = teamName.trim().toLowerCase();

  // 1. Match Team Assasins
  if (normalized.includes('assasin')) {
    return DEFAULT_SQUADS.assasins.players;
  }

  // 2. Match Team Battle
  if (normalized.includes('battle')) {
    return DEFAULT_SQUADS.battle.players;
  }

  // 3. Check tournament data in localStorage
  try {
    const tourneyRaw = localStorage.getItem(TOURNAMENT_KEY);
    if (tourneyRaw) {
      const tourney = JSON.parse(tourneyRaw);
      if (tourney.teams) {
        for (const key of Object.keys(tourney.teams)) {
          const t = tourney.teams[key];
          if (t && t.name && (t.name.toLowerCase() === normalized || normalized.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(normalized))) {
            if (Array.isArray(t.squad) && t.squad.length > 0) {
              return t.squad.map(p => ({
                name: p.name,
                isCaptain: !!p.isCaptain,
                role: p.role || (p.isCaptain ? 'Captain' : 'Player')
              }));
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error reading tournament squads:', err);
  }

  // 4. Fallback to registered players from Player DB
  const allDbPlayers = getAllPlayers();
  if (allDbPlayers && allDbPlayers.length > 0) {
    // Return registered players if available
    return allDbPlayers.slice(0, 7).map((p, idx) => ({
      name: p.name,
      isCaptain: idx === 0,
      role: idx === 0 ? 'Captain' : 'Player'
    }));
  }

  // 5. Default generic squad if nothing exists yet
  return [
    { name: `${teamName} Batter 1`, isCaptain: true, role: 'Captain' },
    { name: `${teamName} Batter 2`, isCaptain: false, role: 'Batsman' },
    { name: `${teamName} All-Rounder`, isCaptain: false, role: 'All-Rounder' },
    { name: `${teamName} Bowler 1`, isCaptain: false, role: 'Bowler' },
    { name: `${teamName} Bowler 2`, isCaptain: false, role: 'Bowler' },
  ];
};
