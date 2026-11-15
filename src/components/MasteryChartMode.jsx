import React, { useState } from 'react';
import { Star, Trophy, Sparkles, Trash2, CheckCircle2, Info } from 'lucide-react';
import { getFactStars, getOverallMasteryStats } from '../utils/storage';
import { sound } from '../utils/sound';

export default function MasteryChartMode({ progress, onResetProgress }) {
  const [selectedCell, setSelectedCell] = useState({ r: 6, c: 7 });
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = getOverallMasteryStats(progress);

  const activeFactKey = `${selectedCell.r}x${selectedCell.c}`;
  const activeFactData = progress.facts[activeFactKey] || {
    correct: 0,
    attempts: 0,
    stars: 0,
  };

  const getCellStyle = (stars) => {
    if (stars >= 3) {
      return 'bg-gradient-to-b from-amber-300 to-amber-500 text-indigo-950 border-amber-600 font-extrabold shadow-sm';
    }
    if (stars === 2) {
      return 'bg-emerald-500 text-emerald-950 border-emerald-700 font-bold';
    }
    if (stars === 1) {
      return 'bg-sky-500/80 text-white border-sky-700 font-semibold';
    }
    return 'bg-indigo-950/60 text-indigo-300/70 border-indigo-900/80 hover:bg-indigo-800/50';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-full min-h-0">
      {/* Left: 12x12 Visual Mastery Heatmap Grid */}
      <div className="flex-1 bg-indigo-900/60 backdrop-blur-md border border-indigo-700/60 rounded-3xl p-2.5 sm:p-4 flex flex-col min-h-0 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>12×12 Mastery Chart</span>
            </span>
            <span className="text-xs sm:text-sm text-indigo-200 hidden sm:inline">
              Tap any square to inspect your stars & visual dot array!
            </span>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs font-bold">
            <span className="flex items-center gap-1 text-indigo-300">
              <span className="w-3 h-3 rounded bg-indigo-950 border border-indigo-700 inline-block" />
              0★
            </span>
            <span className="flex items-center gap-1 text-sky-300">
              <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
              1★ Learning
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              2★ Great
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              3★ Mastered!
            </span>
          </div>
        </div>

        {/* 13x13 Grid */}
        <div className="flex-1 grid grid-cols-13 grid-rows-13 gap-1 sm:gap-1.5 min-h-0">
          <div className="flex items-center justify-center rounded-lg bg-amber-400 text-indigo-950 font-extrabold text-sm sm:text-lg">
            ★
          </div>

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((col) => (
            <div
              key={`m-col-${col}`}
              className={`flex items-center justify-center rounded-lg font-extrabold text-xs sm:text-base ${
                selectedCell.c === col
                  ? 'bg-amber-400 text-indigo-950 ring-2 ring-white'
                  : 'bg-indigo-800 text-indigo-100'
              }`}
            >
              {col}
            </div>
          ))}

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((row) => (
            <React.Fragment key={`m-row-${row}`}>
              <div
                className={`flex items-center justify-center rounded-lg font-extrabold text-xs sm:text-base ${
                  selectedCell.r === row
                    ? 'bg-amber-400 text-indigo-950 ring-2 ring-white'
                    : 'bg-indigo-800 text-indigo-100'
                }`}
              >
                {row}
              </div>

              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((col) => {
                const stars = getFactStars(progress, row, col);
                const isSelected = selectedCell.r === row && selectedCell.c === col;

                return (
                  <button
                    key={`m-${row}x${col}`}
                    onClick={() => {
                      sound.playTap();
                      setSelectedCell({ r: row, c: col });
                    }}
                    className={`btn-tactile relative flex flex-col items-center justify-center rounded-lg border-b-2 text-[11px] sm:text-sm transition-all ${getCellStyle(
                      stars
                    )} ${isSelected ? 'ring-2 sm:ring-4 ring-white scale-110 z-10' : ''}`}
                  >
                    <span>{row * col}</span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Panel: Overall Stats + Selected Fact Inspector */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-3 min-h-0">
        {/* Overall Progress Summary Card */}
        <div className="bg-indigo-900/80 backdrop-blur-md border border-indigo-700/60 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Overall Star Collection</span>
            </h3>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400 text-indigo-950">
              {stats.totalStars} / {stats.maxStars} ★
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 bg-indigo-950 rounded-full overflow-hidden border border-indigo-800 mb-3">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(2, Math.round((stats.totalStars / stats.maxStars) * 100))}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-indigo-950/70 rounded-2xl p-2 border border-indigo-800/80">
              <div className="text-lg sm:text-xl font-extrabold text-amber-300">
                {stats.masteredCount}
              </div>
              <div className="text-[11px] text-indigo-300 font-semibold">3★ Mastered</div>
            </div>
            <div className="bg-indigo-950/70 rounded-2xl p-2 border border-indigo-800/80">
              <div className="text-lg sm:text-xl font-extrabold text-sky-300">
                {stats.startedCount}
              </div>
              <div className="text-[11px] text-indigo-300 font-semibold">Facts Practiced</div>
            </div>
            <div className="bg-indigo-950/70 rounded-2xl p-2 border border-indigo-800/80">
              <div className="text-lg sm:text-xl font-extrabold text-emerald-300">
                {progress.bestStreak || 0}
              </div>
              <div className="text-[11px] text-indigo-300 font-semibold">Best Streak</div>
            </div>
          </div>
        </div>

        {/* Selected Fact Inspector */}
        <div className="flex-1 bg-indigo-900/80 backdrop-blur-md border border-indigo-700/60 rounded-3xl p-4 shadow-xl flex flex-col justify-between min-h-0">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Fact Inspector
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      activeFactData.stars >= s
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-indigo-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="py-3 px-4 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-center mb-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">
                {selectedCell.r} × {selectedCell.c} ={' '}
                <span className="text-amber-300">{selectedCell.r * selectedCell.c}</span>
              </div>
              <div className="text-xs text-indigo-300 mt-1 font-medium">
                Solved {activeFactData.correct} times ({activeFactData.stars} / 3 Stars)
              </div>
            </div>

            {/* Visual Array representation */}
            <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/70 flex flex-col items-center">
              <span className="text-xs text-indigo-200 mb-2 font-semibold">
                {selectedCell.r} groups of {selectedCell.c} = {selectedCell.r * selectedCell.c}
              </span>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${selectedCell.c}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: selectedCell.r * selectedCell.c }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Reset Progress Control */}
          <div className="pt-3 border-t border-indigo-800/80 flex items-center justify-between">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="text-xs font-semibold text-indigo-300 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Saved Progress</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="text-xs text-rose-300 font-bold">Erase all stars?</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      sound.playTap();
                      onResetProgress();
                      setConfirmReset(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-800 text-indigo-200 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
