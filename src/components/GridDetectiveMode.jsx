import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Sparkles, CheckCircle2, Award } from 'lucide-react';
import { getFactStars } from '../utils/storage';
import { sound } from '../utils/sound';

const ROUND_SIZE = 10; // 10 missing puzzle cells per round

export default function GridDetectiveMode({ selectedTables, progress, onRecordAttempt }) {
  const [targets, setTargets] = useState([]); // Array of { r, c, answer, solved, wrongCount }
  const [activeTargetIdx, setActiveTargetIdx] = useState(0);
  const [selectedTileValue, setSelectedTileValue] = useState(null);
  const [tileOptions, setTileOptions] = useState([]); // Array of { id, value, used }
  const [shakeCell, setShakeCell] = useState(null);
  const [roundComplete, setRoundComplete] = useState(false);

  // Generate a new round of missing cells on the 12x12 multiplication board
  const startNewRound = useCallback(() => {
    const candidateCells = [];
    const activeSet = new Set(selectedTables);

    for (let r = 1; r <= 12; r++) {
      for (let c = 1; c <= 12; c++) {
        // Prioritize cells where at least one factor (or row) is in selectedTables
        if (activeSet.has(r) || activeSet.has(c)) {
          const stars = getFactStars(progress, r, c);
          // Weight unmastered facts higher so kids practice what they need
          const weight = stars === 0 ? 4 : stars === 1 ? 3 : stars === 2 ? 2 : 1;
          candidateCells.push({ r, c, answer: r * c, weight, isPrimaryRow: activeSet.has(r) });
        }
      }
    }

    // Prefer cells whose ROW is in selectedTables first
    const primaryCells = candidateCells.filter((item) => item.isPrimaryRow);
    const pool = primaryCells.length >= ROUND_SIZE ? primaryCells : candidateCells;

    // Weighted random selection without duplicates
    const chosen = [];
    const poolCopy = [...pool];

    while (chosen.length < ROUND_SIZE && poolCopy.length > 0) {
      const totalWeight = poolCopy.reduce((acc, item) => acc + item.weight, 0);
      let rand = Math.random() * totalWeight;
      let chosenIndex = 0;

      for (let i = 0; i < poolCopy.length; i++) {
        rand -= poolCopy[i].weight;
        if (rand <= 0) {
          chosenIndex = i;
          break;
        }
      }

      const [picked] = poolCopy.splice(chosenIndex, 1);
      chosen.push({
        r: picked.r,
        c: picked.c,
        answer: picked.answer,
        solved: false,
        wrongCount: 0,
      });
    }

    // Sort targets in reading order or keep shuffled; shuffled order for auto-advance feels fun,
    // let's sort by row then col so scanning the grid is super intuitive for kids!
    chosen.sort((a, b) => (a.r !== b.r ? a.r - b.r : a.c - b.c));

    // Create answer tiles (exact 10 answers + 2 distractors for extra thinking, or exact 10 puzzle tiles)
    // Exact 10 puzzle tiles makes it a true 1-to-1 board completion puzzle where every tile has a home!
    const tiles = chosen
      .map((t, idx) => ({
        id: `tile-${idx}-${t.r}x${t.c}`,
        value: t.answer,
        used: false,
      }))
      .sort((a, b) => a.value - b.value);

    setTargets(chosen);
    setActiveTargetIdx(0);
    setSelectedTileValue(null);
    setTileOptions(tiles);
    setRoundComplete(false);
  }, [selectedTables]); // Intentionally only re-seed when selectedTables changes or manual reset

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const activeTarget = targets[activeTargetIdx] || null;

  // Map for fast lookup of target cells in the 12x12 grid
  const targetMap = useMemo(() => {
    const map = {};
    targets.forEach((t, idx) => {
      map[`${t.r}x${t.c}`] = { ...t, idx };
    });
    return map;
  }, [targets]);

  const attemptMatch = (targetIdx, tileObj) => {
    const target = targets[targetIdx];
    if (!target || target.solved || !tileObj || tileObj.used) return;

    if (tileObj.value === target.answer) {
      // Correct match!
      sound.playCorrect(progress.currentStreak + 1);
      onRecordAttempt(target.r, target.c, true);

      const nextTargets = targets.map((t, i) =>
        i === targetIdx ? { ...t, solved: true } : t
      );
      const nextTiles = tileOptions.map((tile) =>
        tile.id === tileObj.id ? { ...tile, used: true } : tile
      );

      setTargets(nextTargets);
      setTileOptions(nextTiles);
      setSelectedTileValue(null);

      // Find next unsolved target
      const nextUnsolvedIdx = nextTargets.findIndex((t, i) => i > targetIdx && !t.solved);
      const fallbackUnsolvedIdx = nextTargets.findIndex((t) => !t.solved);

      if (nextUnsolvedIdx !== -1) {
        setActiveTargetIdx(nextUnsolvedIdx);
      } else if (fallbackUnsolvedIdx !== -1) {
        setActiveTargetIdx(fallbackUnsolvedIdx);
      } else {
        // Round complete!
        setRoundComplete(true);
        sound.playFanfare();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      // Wrong match
      sound.playWrong();
      onRecordAttempt(target.r, target.c, false);
      setShakeCell(`${target.r}x${target.c}`);
      setTimeout(() => setShakeCell(null), 450);
    }
  };

  // When user taps a puzzle cell on the 12x12 grid
  const handleCellTap = (r, c) => {
    const key = `${r}x${c}`;
    const targetInfo = targetMap[key];

    if (!targetInfo || targetInfo.solved) {
      sound.playTap();
      return;
    }

    sound.playSelect();
    setActiveTargetIdx(targetInfo.idx);

    // If the child had already selected a number tile from the tray, place it into this cell!
    if (selectedTileValue) {
      attemptMatch(targetInfo.idx, selectedTileValue);
    }
  };

  // When user taps a number tile in the right-hand tray
  const handleTileTap = (tile) => {
    if (tile.used) return;

    // If there is an active unsolved target cell on the board, immediately try placing the tile there!
    if (activeTarget && !activeTarget.solved) {
      attemptMatch(activeTargetIdx, tile);
    } else {
      sound.playSelect();
      setSelectedTileValue(tile);
    }
  };

  const solvedCount = targets.filter((t) => t.solved).length;

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-full min-h-0">
      {/* Left/Center: Interactive 12x12 Multiplication Grid */}
      <div className="flex-1 bg-indigo-900/60 backdrop-blur-md border border-indigo-700/60 rounded-3xl p-2 sm:p-3.5 flex flex-col min-h-0 shadow-xl">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              12×12 Puzzle Board
            </span>
            <span className="text-xs sm:text-sm text-indigo-200 hidden sm:inline">
              Tap any glowing <strong className="text-amber-300">?</strong> box, then tap its matching answer tile!
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {solvedCount} / {targets.length} Filled
            </span>
          </div>
        </div>

        {/* 13x13 CSS Grid (1 header row/col + 12x12 cells) */}
        <div className="flex-1 grid grid-cols-13 grid-rows-13 gap-1 sm:gap-1.5 min-h-0">
          {/* Top-left corner symbol */}
          <div className="flex items-center justify-center rounded-lg bg-amber-400 text-indigo-950 font-extrabold text-sm sm:text-lg shadow">
            ×
          </div>

          {/* Column Headers (1..12) */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((col) => {
            const isHighlightedCol = activeTarget && !activeTarget.solved && activeTarget.c === col;
            return (
              <div
                key={`col-${col}`}
                className={`flex items-center justify-center rounded-lg font-extrabold text-xs sm:text-base transition-all ${
                  isHighlightedCol
                    ? 'bg-amber-400 text-indigo-950 scale-105 shadow-md ring-2 ring-white'
                    : 'bg-indigo-800 text-indigo-100'
                }`}
              >
                {col}
              </div>
            );
          })}

          {/* Rows 1..12 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((row) => {
            const isHighlightedRow = activeTarget && !activeTarget.solved && activeTarget.r === row;
            const isRowSelectedTable = selectedTables.includes(row);

            return (
              <React.Fragment key={`row-group-${row}`}>
                {/* Row Header */}
                <div
                  className={`flex items-center justify-center rounded-lg font-extrabold text-xs sm:text-base transition-all ${
                    isHighlightedRow
                      ? 'bg-amber-400 text-indigo-950 scale-105 shadow-md ring-2 ring-white'
                      : isRowSelectedTable
                      ? 'bg-indigo-700 text-amber-300'
                      : 'bg-indigo-800 text-indigo-100'
                  }`}
                >
                  {row}
                </div>

                {/* 12 Cells in this Row */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((col) => {
                  const key = `${row}x${col}`;
                  const targetInfo = targetMap[key];
                  const isActiveTarget =
                    activeTarget &&
                    !activeTarget.solved &&
                    activeTarget.r === row &&
                    activeTarget.c === col;
                  const isCrosshair =
                    activeTarget &&
                    !activeTarget.solved &&
                    ((activeTarget.r === row && col < activeTarget.c) ||
                      (activeTarget.c === col && row < activeTarget.r));
                  const isShaking = shakeCell === key;

                  if (targetInfo && !targetInfo.solved) {
                    // Missing puzzle cell!
                    return (
                      <button
                        key={key}
                        onClick={() => handleCellTap(row, col)}
                        className={`btn-tactile relative flex items-center justify-center rounded-lg font-extrabold text-xs sm:text-base transition-all ${
                          isShaking ? 'animate-shake bg-rose-500 text-white' : ''
                        } ${
                          isActiveTarget
                            ? 'bg-amber-400 text-indigo-950 ring-2 sm:ring-4 ring-white shadow-lg scale-110 z-10'
                            : 'bg-indigo-600/90 hover:bg-indigo-500 text-amber-300 border-2 border-dashed border-amber-300/80'
                        }`}
                      >
                        ?
                      </button>
                    );
                  }

                  if (targetInfo && targetInfo.solved) {
                    // Newly solved cell in this round!
                    return (
                      <div
                        key={key}
                        className="animate-pop flex items-center justify-center rounded-lg bg-emerald-400 text-emerald-950 font-extrabold text-xs sm:text-base shadow-md ring-1 ring-emerald-200"
                      >
                        {row * col}
                      </div>
                    );
                  }

                  // Prefilled reference cell on the board
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-center rounded-lg font-semibold text-[11px] sm:text-sm transition-colors ${
                        isCrosshair
                          ? 'bg-amber-400/25 text-amber-200 font-bold'
                          : isRowSelectedTable || selectedTables.includes(col)
                          ? 'bg-indigo-950/65 text-indigo-200'
                          : 'bg-indigo-950/35 text-indigo-400/60'
                      }`}
                    >
                      {row * col}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Active Equation Prompt & Number Tiles Tray */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-3 min-h-0 max-h-[42%] lg:max-h-none shrink-0">
        {/* Current Active Clue Card */}
        <div className="bg-indigo-900/80 backdrop-blur-md border border-indigo-700/60 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col justify-between shrink-0">
          {!roundComplete && activeTarget ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Selected Grid Spot
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 py-2 my-1 bg-indigo-950/70 rounded-2xl border border-indigo-800/80">
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-300">
                  {activeTarget.r}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-indigo-400">×</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-300">
                  {activeTarget.c}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-indigo-400">=</span>
                <span className="w-14 sm:w-16 h-11 sm:h-12 rounded-xl bg-amber-400/20 border-2 border-dashed border-amber-400 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-amber-300">
                  ?
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-3">
              <div className="inline-flex p-2.5 rounded-full bg-emerald-400/20 text-emerald-300 mb-2">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Board Complete!</h3>
              <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
                Awesome job filling in all {ROUND_SIZE} missing numbers!
              </p>
            </div>
          )}
        </div>

        {/* Answer Tiles Tray */}
        <div className="flex-1 bg-indigo-900/80 backdrop-blur-md border border-indigo-700/60 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2.5 shrink-0">
            <span className="text-xs sm:text-sm font-bold text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Answer Tiles (Tap to place)</span>
            </span>
            <button
              onClick={() => {
                sound.playSelect();
                startNewRound();
              }}
              className="btn-tactile flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-indigo-200 text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Board</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 -mr-1 py-1">
            <div className="grid grid-cols-5 lg:grid-cols-2 gap-2 sm:gap-2.5 pb-1">
              {tileOptions
                .filter((tile) => !tile.used)
                .map((tile) => {
                  const isSelected = selectedTileValue?.id === tile.id;
                  return (
                    <button
                      key={tile.id}
                      onClick={() => handleTileTap(tile)}
                      className={`btn-tactile h-12 sm:h-14 rounded-2xl font-extrabold text-lg sm:text-2xl flex items-center justify-center transition-all border-b-4 ${
                        isSelected
                          ? 'bg-amber-400 text-indigo-950 border-amber-600 ring-2 ring-white scale-105 shadow-lg'
                          : 'bg-gradient-to-b from-white to-indigo-100 text-indigo-950 border-indigo-300 hover:from-amber-200 hover:to-amber-300 hover:border-amber-500 shadow-md'
                      }`}
                    >
                      {tile.value}
                    </button>
                  );
                })}
            </div>
          </div>

          {roundComplete && (
            <button
              onClick={() => {
                sound.playSelect();
                startNewRound();
              }}
              className="btn-tactile mt-3 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 font-extrabold text-base sm:text-lg shadow-lg border-b-4 border-emerald-600 flex items-center justify-center gap-2 shrink-0"
            >
              <Sparkles className="w-5 h-5" />
              <span>Play Next Board!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
