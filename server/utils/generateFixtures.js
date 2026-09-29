/**
 * Shuffles an array in place
 */
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Generate a knockout fixture schedule
 * Pairs up teams for Round 1 and creates TBD placeholders for later rounds
 * @param {Array} teams Array of team IDs
 * @returns {Array} Fixture templates
 */
const generateKnockout = (teams) => {
  if (!teams || teams.length < 2) {
    throw new Error('Need at least 2 teams to generate knockout fixtures');
  }

  const shuffledTeams = shuffle(teams);
  const fixtures = [];
  let round = 1;
  let matchNumber = 1;

  // Round 1 Pairings
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      fixtures.push({
        round,
        matchNumber,
        team1: shuffledTeams[i],
        team2: shuffledTeams[i + 1]
      });
    } else {
      // Bye match: goes automatically to round 2
      fixtures.push({
        round,
        matchNumber,
        team1: shuffledTeams[i],
        team2: null
      });
    }
    matchNumber++;
  }

  // Generate blank placeholder fixtures for subsequent rounds (Quarter, Semi, Final etc)
  let roundMatchesCount = fixtures.length;
  while (roundMatchesCount > 1) {
    round++;
    const nextRoundMatchesCount = Math.ceil(roundMatchesCount / 2);
    for (let m = 1; m <= nextRoundMatchesCount; m++) {
      fixtures.push({
        round,
        matchNumber: m,
        team1: null,
        team2: null
      });
    }
    roundMatchesCount = nextRoundMatchesCount;
  }

  return fixtures;
};

/**
 * Generate a round-robin league schedule
 * Every team plays every other team once (Berger tables rotation algorithm)
 * @param {Array} teams Array of team IDs
 * @returns {Array} Fixture templates
 */
const generateLeague = (teams) => {
  if (!teams || teams.length < 2) {
    throw new Error('Need at least 2 teams to generate league fixtures');
  }

  const pool = [...teams];
  const hasBye = pool.length % 2 !== 0;
  if (hasBye) {
    pool.push(null); // Add bye placeholder to make it even
  }

  const n = pool.length;
  const rounds = n - 1;
  const fixtures = [];
  let matchCounter = 1;

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const team1 = pool[i];
      const team2 = pool[n - 1 - i];

      // Only schedule the fixture if it's not a bye match
      if (team1 !== null && team2 !== null) {
        fixtures.push({
          round,
          matchNumber: matchCounter,
          team1,
          team2
        });
        matchCounter++;
      }
    }
    // Rotate pool: keep first index fixed, shift rest clockwise
    pool.splice(1, 0, pool.pop());
  }

  return fixtures;
};

module.exports = {
  generateKnockout,
  generateLeague,
  generateRoundRobin: generateLeague // Round Robin is synonymous with League here
};
