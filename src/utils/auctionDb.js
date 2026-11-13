// Auction Database & State Management for Gully Cricket
import { getAllPlayers } from './playerDb';

const AUCTION_STORAGE_KEY = 'gully-cricket-auction-v1';

export const DEFAULT_AUCTION_TEAMS = [
  {
    id: 'team_assasins',
    name: 'Team Assasins',
    color: '#5ec8f8',
    initialPurse: 1000,
    purse: 1000,
    isStopped: false,
    squad: [],
  },
  {
    id: 'team_battle',
    name: 'Team Battle',
    color: '#ff4766',
    initialPurse: 1000,
    purse: 1000,
    isStopped: false,
    squad: [],
  },
];

export const getDefaultPlayerRole = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('kashif') || n.includes('ayan') || n.includes('nadir') || n.includes('kamran')) return 'All-Rounder';
  if (n.includes('arish') || n.includes('rafique') || n.includes('bowler')) return 'Bowler';
  if (n.includes('noraiz') || n.includes('almas') || n.includes('wk') || n.includes('keeper')) return 'Wicketkeeper';
  return 'Batsman';
};

export const generateInitialAuctionPool = () => {
  const registered = getAllPlayers();
  if (registered && registered.length > 0) {
    return registered.map((p, idx) => ({
      id: p.id || `auction_p_${idx}_${Date.now()}`,
      name: p.name,
      role: getDefaultPlayerRole(p.name),
      basePrice: 50,
      photo: p.photo || null,
      matches: p.matches || 0,
      runs: p.runs || 0,
      wickets: p.wickets || 0,
      highestScore: p.highestScore || 0,
      status: 'available', // 'available', 'sold', 'unsold'
      soldToTeamId: null,
      soldToTeamName: null,
      soldPrice: null,
    }));
  }

  // Fallback defaults if player DB is empty
  const defaultNames = [
    'Kashif', 'Ayan', 'Shad', 'Ani', 'Nadir', 'Kamran', 
    'Arish', 'Rafique', 'Noraiz', 'Almas', 'Hamza', 'Bilal'
  ];

  return defaultNames.map((name, idx) => ({
    id: `auction_p_default_${idx}`,
    name,
    role: getDefaultPlayerRole(name),
    basePrice: 50,
    photo: null,
    matches: 0,
    runs: 0,
    wickets: 0,
    highestScore: 0,
    status: 'available',
    soldToTeamId: null,
    soldToTeamName: null,
    soldPrice: null,
  }));
};

export const getInitialAuctionData = () => {
  if (typeof window === 'undefined') {
    return {
      title: 'Mega Cricket Auction',
      defaultPurse: 1000,
      teams: DEFAULT_AUCTION_TEAMS,
      pool: generateInitialAuctionPool(),
      currentPlayerId: null,
      currentBid: 0,
      leadingTeamId: null,
      bidHistory: [],
      completed: false,
    };
  }

  try {
    const saved = localStorage.getItem(AUCTION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.teams) && Array.isArray(parsed.pool)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse auction data from localStorage', err);
  }

  const initialData = {
    title: 'Mega Cricket Auction',
    defaultPurse: 1000,
    teams: DEFAULT_AUCTION_TEAMS,
    pool: generateInitialAuctionPool(),
    currentPlayerId: null,
    currentBid: 0,
    leadingTeamId: null,
    bidHistory: [],
    completed: false,
  };

  try {
    localStorage.setItem(AUCTION_STORAGE_KEY, JSON.stringify(initialData));
  } catch {
    // Ignore storage quota
  }

  return initialData;
};

export const saveAuctionData = (data) => {
  if (typeof window === 'undefined' || !data) return;
  try {
    localStorage.setItem(AUCTION_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save auction to localStorage', e);
  }
};
