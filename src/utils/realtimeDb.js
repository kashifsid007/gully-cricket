import { getApp, getApps, initializeApp } from '@firebase/app';
import { getDatabase, onValue, ref, remove, set } from '@firebase/database';

const ROOT_PATH = 'gully-cricket';

export const STORAGE_KEYS = {
  matches: 'gully_cricket_matches',
  players: 'gully_cricket_players',
  tournament: 'gully_cricket_tournament_data',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let database = null;

if (hasFirebaseConfig) {
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    database = getDatabase(app);
  } catch (error) {
    console.error('Firebase could not be initialized. Using local storage only.', error);
  }
} else {
  console.info('Firebase is not configured. The app is using local storage only.');
}

const clientId = (() => {
  const key = 'gully_cricket_client_id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  const generated = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(key, generated);
  return generated;
})();

const channels = {
  matches: { listeners: new Set(), unsubscribe: null, seeded: false, fallback: [] },
  players: { listeners: new Set(), unsubscribe: null, seeded: false, fallback: [] },
  tournament: { listeners: new Set(), unsubscribe: null, seeded: false, fallback: null },
};

const cloneForDatabase = (value) => JSON.parse(JSON.stringify(value));

const readLocal = (type, fallback = channels[type].fallback) => {
  try {
    const value = localStorage.getItem(STORAGE_KEYS[type]);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Could not read ${type} data from local storage.`, error);
    return fallback;
  }
};

const writeLocal = (type, value) => {
  try {
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(value));
  } catch (error) {
    console.error(`Could not cache ${type} data locally.`, error);
  }
};

const notify = (type, value) => {
  channels[type].listeners.forEach((listener) => listener(value));
};

const cacheAndNotify = (type, value) => {
  writeLocal(type, value);
  notify(type, value);
};

const sortMatches = (matches) => [...matches].sort((a, b) => {
  const aTime = Number(a.id) || a._updatedAt || 0;
  const bTime = Number(b.id) || b._updatedAt || 0;
  return bTime - aTime;
});

const sortPlayers = (players) => [...players].sort((a, b) =>
  String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
);

const serialize = (type, value) => {
  if (type === 'tournament') return cloneForDatabase(value);

  return {
    _initialized: true,
    ...Object.fromEntries(value
      .filter((item) => item?.id)
      .map((item) => [String(item.id), cloneForDatabase(item)])
    ),
  };
};

const deserialize = (type, value) => {
  if (type === 'tournament') return value;

  const records = (Array.isArray(value) ? value.filter(Boolean) : Object.values(value || {}))
    .filter((item) => item && typeof item === 'object' && item.id);
  return type === 'matches' ? sortMatches(records) : sortPlayers(records);
};

const startRemoteListener = (type) => {
  const channel = channels[type];
  if (!database || channel.unsubscribe) return;

  const dataRef = ref(database, `${ROOT_PATH}/${type}`);
  channel.unsubscribe = onValue(dataRef, (snapshot) => {
    if (!snapshot.exists()) {
      if (!channel.seeded) {
        channel.seeded = true;
        const localValue = readLocal(type, channel.fallback);
        if (type !== 'tournament' || localValue) {
          set(dataRef, serialize(type, localValue)).catch((error) => {
            console.error(`Could not migrate local ${type} data to Firebase.`, error);
          });
        }
      }
      return;
    }

    if (type !== 'tournament' && snapshot.val()?._initialized !== true) {
      void set(ref(database, `${ROOT_PATH}/${type}/_initialized`), true);
    }

    const value = deserialize(type, snapshot.val());
    cacheAndNotify(type, value);
  }, (error) => {
    console.error(`Realtime ${type} subscription failed.`, error);
  });
};

const subscribe = (type, listener, fallback) => {
  const channel = channels[type];
  if (fallback !== undefined) channel.fallback = fallback;

  channel.listeners.add(listener);
  listener(readLocal(type, channel.fallback));
  startRemoteListener(type);

  return () => {
    channel.listeners.delete(listener);
  };
};

const writeRemote = (path, value) => {
  if (!database) return Promise.resolve();
  return set(ref(database, `${ROOT_PATH}/${path}`), cloneForDatabase(value)).catch((error) => {
    console.error(`Firebase write failed for ${path}.`, error);
  });
};

export const isRealtimeEnabled = () => Boolean(database);
export const getSyncClientId = () => clientId;

export const getMatches = () => readLocal('matches', []);
export const subscribeToMatches = (listener) => subscribe('matches', listener, []);

export const upsertMatch = (match) => {
  const matches = getMatches();
  const existingMatch = matches.find((item) => item.id === match.id);
  const syncedMatch = {
    ...match,
    date: match.date || existingMatch?.date || new Date().toLocaleString(),
    _updatedAt: Date.now(),
    _updatedBy: clientId,
  };
  const index = matches.findIndex((item) => item.id === syncedMatch.id);
  const nextMatches = [...matches];

  if (index >= 0) nextMatches[index] = syncedMatch;
  else nextMatches.unshift(syncedMatch);

  cacheAndNotify('matches', nextMatches);
  void writeRemote(`matches/${syncedMatch.id}`, syncedMatch);
  return syncedMatch;
};

export const deleteMatch = (matchId) => {
  const nextMatches = getMatches().filter((match) => match.id !== matchId);
  cacheAndNotify('matches', nextMatches);

  if (database) {
    void remove(ref(database, `${ROOT_PATH}/matches/${matchId}`)).catch((error) => {
      console.error(`Could not delete match ${matchId} from Firebase.`, error);
    });
  }
};

export const getPlayers = () => readLocal('players', []);
export const subscribeToPlayers = (listener) => subscribe('players', listener, []);

export const syncPlayer = (player) => {
  const players = getPlayers();
  const index = players.findIndex((item) => item.id === player.id);
  const nextPlayers = [...players];

  if (index >= 0) nextPlayers[index] = player;
  else nextPlayers.push(player);

  cacheAndNotify('players', nextPlayers);
  void writeRemote(`players/${player.id}`, player);
  return player;
};

export const deletePlayerRecord = (playerId) => {
  const nextPlayers = getPlayers().filter((player) => player.id !== playerId);
  cacheAndNotify('players', nextPlayers);

  if (database) {
    void remove(ref(database, `${ROOT_PATH}/players/${playerId}`)).catch((error) => {
      console.error(`Could not delete player ${playerId} from Firebase.`, error);
    });
  }
};

export const getTournamentData = (fallback) => readLocal('tournament', fallback);
export const subscribeToTournament = (listener, fallback) =>
  subscribe('tournament', listener, fallback);

export const saveTournamentData = (data) => {
  cacheAndNotify('tournament', data);
  void writeRemote('tournament', data);
  return data;
};

export const updateTournamentMatchResult = (tournamentId, tournamentMatchId, winner, resultSummary) => {
  const store = getTournamentData(null);
  if (!store || !Array.isArray(store.tournaments)) return;

  const updatedTournaments = store.tournaments.map((tournament) => {
    if (tournament.id === tournamentId) {
      const updatedMatches = (tournament.matches || []).map((m) => {
        if (String(m.id) === String(tournamentMatchId)) {
          return {
            ...m,
            winner,
            resultSummary: resultSummary || m.resultSummary || (
              winner === 'team1' ? `${tournament.teams?.team1?.name || 'Team 1'} won`
                : winner === 'team2' ? `${tournament.teams?.team2?.name || 'Team 2'} won`
                  : 'Match Tied'
            ),
          };
        }
        return m;
      });
      return { ...tournament, matches: updatedMatches };
    }
    return tournament;
  });

  const nextStore = { ...store, tournaments: updatedTournaments };
  saveTournamentData(nextStore);
  return nextStore;
};
