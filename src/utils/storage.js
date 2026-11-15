const STORAGE_KEY = 'tablestables_mastery_v1';

// Mastery levels for each cell "r x c" (1..12 x 1..12):
// 0 = Not started
// 1 = Learning (solved at least once)
// 2 = Practicing (solved 2 times cleanly)
// 3 = Mastered / Gold Star (solved 3+ times cleanly)

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultProgress();
    }
    const parsed = JSON.parse(raw);
    return {
      ...createDefaultProgress(),
      ...parsed,
      facts: parsed.facts || {},
    };
  } catch {
    return createDefaultProgress();
  }
}

export function createDefaultProgress() {
  return {
    facts: {}, // key: `${r}x${c}` -> { correct: 0, attempts: 0, stars: 0, bestStreak: 0 }
    totalSolved: 0,
    CurrentStreak: 0,
    bestStreak: 0,
    selectedTables: [2, 3, 4, 5, 10], // Great starter tables for kids
  };
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

export function recordFactAttempt(progress, r, c, isCorrect) {
  const key = `${r}x${c}`;
  const symKey = `${c}x${r}`; // Multiplication is commutative, boost both or primary
  const existing = progress.facts[key] || { correct: 0, attempts: 0, stars: 0 };

  const updatedFact = {
    attempts: existing.attempts + 1,
    correct: isCorrect ? existing.correct + 1 : existing.correct,
    stars: existing.stars,
  };

  if (isCorrect) {
    // Earn up to 3 stars per fact
    updatedFact.stars = Math.min(3, updatedFact.stars + 1);
  } else {
    // Gentle drop only if not yet 3-star locked, or keep encouraging
    updatedFact.stars = Math.max(1, updatedFact.stars - 1);
  }

  const nextFacts = {
    ...progress.facts,
    [key]: updatedFact,
  };

  // Also gently credit symmetric fact if not yet started so child sees grid progress naturally
  if (isCorrect && r !== c) {
    const symExisting = progress.facts[symKey] || { correct: 0, attempts: 0, stars: 0 };
    if (symExisting.stars < updatedFact.stars) {
      nextFacts[symKey] = {
        ...symExisting,
        correct: symExisting.correct + 1,
        attempts: symExisting.attempts + 1,
        stars: Math.min(3, symExisting.stars + 1),
      };
    }
  }

  const nextStreak = isCorrect ? (progress.currentStreak || 0) + 1 : 0;

  const next = {
    ...progress,
    facts: nextFacts,
    totalSolved: isCorrect ? (progress.totalSolved || 0) + 1 : (progress.totalSolved || 0),
    currentStreak: nextStreak,
    bestStreak: Math.max(progress.bestStreak || 0, nextStreak),
  };

  saveProgress(next);
  return next;
}

export function getFactStars(progress, r, c) {
  return progress?.facts?.[`${r}x${c}`]?.stars || 0;
}

export function getOverallMasteryStats(progress) {
  let totalStars = 0;
  let masteredCount = 0; // 3 stars
  let startedCount = 0;  // >= 1 star

  for (let r = 1; r <= 12; r++) {
    for (let c = 1; c <= 12; c++) {
      const stars = getFactStars(progress, r, c);
      totalStars += stars;
      if (stars >= 3) masteredCount++;
      if (stars >= 1) startedCount++;
    }
  }

  return {
    totalFacts: 144,
    maxStars: 144 * 3,
    totalStars,
    masteredCount,
    startedCount,
    percentMastered: Math.round((masteredCount / 144) * 100),
  };
}

export function getTableMastery(progress, tableNum) {
  let stars = 0;
  for (let c = 1; c <= 12; c++) {
    stars += getFactStars(progress, tableNum, c);
  }
  return {
    stars,
    maxStars: 36,
    isMastered: stars >= 36,
    percent: Math.round((stars / 36) * 100),
  };
}
