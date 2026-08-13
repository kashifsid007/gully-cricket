// Helper module for managing player storage and photos in localStorage

const STORAGE_KEY = 'gully_cricket_players';

// Get all players from DB
export const getAllPlayers = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error loading players:', err);
    return [];
  }
};

// Find player by name (case-insensitive)
export const getPlayerByName = (name) => {
  if (!name || !name.trim()) return null;
  const players = getAllPlayers();
  const search = name.trim().toLowerCase();
  return players.find(p => p.name.toLowerCase() === search) || null;
};

// Auto-register player by name if not already existing
export const autoRegisterPlayer = (name) => {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  let player = getPlayerByName(trimmed);
  if (!player) {
    player = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      name: trimmed,
      photo: null,
      matches: 0,
      runs: 0,
      wickets: 0,
      highestScore: 0,
      createdAt: new Date().toISOString()
    };
    const players = getAllPlayers();
    players.push(player);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }
  return player;
};

// Save or update player profile (e.g. photo upload or name edit)
export const savePlayer = (playerData) => {
  if (!playerData || !playerData.name || !playerData.name.trim()) return null;
  const players = getAllPlayers();
  const trimmedName = playerData.name.trim();
  const existingIndex = players.findIndex(
    p => p.id === playerData.id || p.name.toLowerCase() === trimmedName.toLowerCase()
  );

  let updatedPlayer;
  if (existingIndex >= 0) {
    updatedPlayer = {
      ...players[existingIndex],
      ...playerData,
      name: trimmedName,
    };
    players[existingIndex] = updatedPlayer;
  } else {
    updatedPlayer = {
      id: playerData.id || Date.now().toString(),
      name: trimmedName,
      photo: playerData.photo || null,
      matches: playerData.matches || 0,
      runs: playerData.runs || 0,
      wickets: playerData.wickets || 0,
      highestScore: playerData.highestScore || 0,
      createdAt: new Date().toISOString()
    };
    players.push(updatedPlayer);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  return updatedPlayer;
};

// Update photo specifically for a player by name
export const updatePlayerPhoto = (name, base64Photo) => {
  const player = autoRegisterPlayer(name);
  if (player) {
    return savePlayer({ ...player, photo: base64Photo });
  }
  return null;
};

// Get initials helper
export const getPlayerInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().substr(0, 2).toUpperCase();
};
