import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDefaultProgress,
  loadProgress,
  saveProgress,
  recordFactAttempt,
  getFactStars,
  getOverallMasteryStats,
  getTableMastery,
} from '../utils/storage';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates default progress with starter tables [2, 3, 4, 5, 10]', () => {
    const progress = createDefaultProgress();
    expect(progress.selectedTables).toEqual([2, 3, 4, 5, 10]);
    expect(progress.totalSolved).toBe(0);
    expect(progress.facts).toEqual({});
  });

  it('loads default progress when localStorage is empty or corrupted', () => {
    expect(loadProgress().selectedTables).toEqual([2, 3, 4, 5, 10]);

    localStorage.setItem('tablestables_mastery_v1', '{invalid-json');
    expect(loadProgress().selectedTables).toEqual([2, 3, 4, 5, 10]);
  });

  it('saves and reloads progress from localStorage', () => {
    const progress = createDefaultProgress();
    progress.selectedTables = [7, 8, 9];
    saveProgress(progress);

    const loaded = loadProgress();
    expect(loaded.selectedTables).toEqual([7, 8, 9]);
  });

  it('records correct attempts, awards up to 3 stars, and credits symmetric facts', () => {
    let progress = createDefaultProgress();

    // First correct attempt on 3 x 4
    progress = recordFactAttempt(progress, 3, 4, true);
    expect(getFactStars(progress, 3, 4)).toBe(1);
    expect(getFactStars(progress, 4, 3)).toBe(1); // Symmetric credit
    expect(progress.totalSolved).toBe(1);
    expect(progress.currentStreak).toBe(1);

    // Second and third correct attempts on 3 x 4
    progress = recordFactAttempt(progress, 3, 4, true);
    progress = recordFactAttempt(progress, 3, 4, true);
    expect(getFactStars(progress, 3, 4)).toBe(3);

    // Fourth attempt stays capped at 3 stars
    progress = recordFactAttempt(progress, 3, 4, true);
    expect(getFactStars(progress, 3, 4)).toBe(3);
    expect(progress.bestStreak).toBe(4);
  });

  it('handles wrong attempts by resetting streak and gently reducing stars (minimum 1)', () => {
    let progress = createDefaultProgress();
    progress = recordFactAttempt(progress, 6, 7, true);
    progress = recordFactAttempt(progress, 6, 7, true);
    expect(getFactStars(progress, 6, 7)).toBe(2);
    expect(progress.currentStreak).toBe(2);

    // Wrong attempt
    progress = recordFactAttempt(progress, 6, 7, false);
    expect(getFactStars(progress, 6, 7)).toBe(1);
    expect(progress.currentStreak).toBe(0);
    expect(progress.bestStreak).toBe(2);
  });

  it('computes overall mastery stats and table mastery percentages accurately', () => {
    let progress = createDefaultProgress();

    // Master all of 2x table (2x1 .. 2x12) 3 times each
    for (let c = 1; c <= 12; c++) {
      progress = recordFactAttempt(progress, 2, c, true);
      progress = recordFactAttempt(progress, 2, c, true);
      progress = recordFactAttempt(progress, 2, c, true);
    }

    const table2 = getTableMastery(progress, 2);
    expect(table2.stars).toBe(36);
    expect(table2.isMastered).toBe(true);
    expect(table2.percent).toBe(100);

    const overall = getOverallMasteryStats(progress);
    expect(overall.totalFacts).toBe(144);
    expect(overall.maxStars).toBe(432);
    // 12 facts in 2x row + 11 symmetric facts in 2x column = 23 mastered facts
    expect(overall.masteredCount).toBe(23);
    expect(overall.totalStars).toBe(23 * 3);
  });
});
