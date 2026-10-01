const emptyStats = () => ({
  matches: 0,
  runs: 0,
  wickets: 0,
  highestScore: 0,
});

const ensurePlayer = (statsByPlayer, name) => {
  const key = name.trim().toLowerCase();
  if (!statsByPlayer[key]) {
    statsByPlayer[key] = {
      overall: emptyStats(),
      limited: emptyStats(),
      test: emptyStats(),
      tournament: emptyStats(),
      tournaments: {},
    };
  }
  return statsByPlayer[key];
};

const addInningsStats = (bucket, runs, wickets) => {
  bucket.runs += runs;
  bucket.wickets += wickets;
  bucket.highestScore = Math.max(bucket.highestScore, runs);
};

export const buildPlayerStats = (matches) => {
  const statsByPlayer = {};

  matches
    .filter((match) => match.status === 'Completed' || match.screen === 'SUMMARY')
    .forEach((match) => {
      const format = match.matchSettings?.format === 'test' ? 'test' : 'limited';
      const tournamentId = match.matchSettings?.tournamentId;
      const tournamentName = match.matchSettings?.tournamentName || 'Tournament';
      const participants = new Set();

      (match.inningsList || []).forEach((innings) => {
        Object.entries(innings.batsmen || {}).forEach(([name, batting]) => {
          if (!name?.trim()) return;
          const player = ensurePlayer(statsByPlayer, name);
          const runs = Number(batting.runs) || 0;
          participants.add(name.trim().toLowerCase());
          addInningsStats(player.overall, runs, 0);
          addInningsStats(player[format], runs, 0);

          if (tournamentId) {
            addInningsStats(player.tournament, runs, 0);
            player.tournaments[tournamentId] ||= {
              name: tournamentName,
              ...emptyStats(),
            };
            addInningsStats(player.tournaments[tournamentId], runs, 0);
          }
        });

        Object.entries(innings.bowlers || {}).forEach(([name, bowling]) => {
          if (!name?.trim()) return;
          const player = ensurePlayer(statsByPlayer, name);
          const wickets = Number(bowling.wickets) || 0;
          participants.add(name.trim().toLowerCase());
          addInningsStats(player.overall, 0, wickets);
          addInningsStats(player[format], 0, wickets);

          if (tournamentId) {
            addInningsStats(player.tournament, 0, wickets);
            player.tournaments[tournamentId] ||= {
              name: tournamentName,
              ...emptyStats(),
            };
            addInningsStats(player.tournaments[tournamentId], 0, wickets);
          }
        });
      });

      participants.forEach((key) => {
        const player = statsByPlayer[key];
        player.overall.matches += 1;
        player[format].matches += 1;
        if (tournamentId) {
          player.tournament.matches += 1;
          player.tournaments[tournamentId].matches += 1;
        }
      });
    });

  return statsByPlayer;
};

export const getEmptyPlayerStats = () => ({
  overall: emptyStats(),
  limited: emptyStats(),
  test: emptyStats(),
  tournament: emptyStats(),
  tournaments: {},
});
