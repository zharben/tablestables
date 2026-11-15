import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { getTableMastery } from '../utils/storage';
import { sound } from '../utils/sound';

const PRESETS = [
  { label: 'Starter (1, 2, 5, 10)', tables: [1, 2, 5, 10] },
  { label: 'Medium (3, 4, 6)', tables: [3, 4, 6] },
  { label: 'Tricky (7, 8, 9)', tables: [7, 8, 9] },
  { label: 'Big Kids (11, 12)', tables: [11, 12] },
  { label: 'All 1–12', tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
];

export default function TableSelectorBar({ selectedTables, onChangeTables, progress, compact = false }) {
  const toggleTable = (num) => {
    sound.playTap();
    if (selectedTables.includes(num)) {
      if (selectedTables.length > 1) {
        onChangeTables(selectedTables.filter((n) => n !== num));
      }
    } else {
      onChangeTables([...selectedTables, num].sort((a, b) => a - b));
    }
  };

  const applyPreset = (tables) => {
    sound.playSelect();
    onChangeTables(tables);
  };

  return (
    <div className="bg-indigo-900/75 backdrop-blur-md border border-indigo-700/60 rounded-2xl p-2.5 sm:p-3 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Active Tables (Tap to toggle):</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => {
            const isMatch =
              preset.tables.length === selectedTables.length &&
              preset.tables.every((t) => selectedTables.includes(t));
            return (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.tables)}
                className={`btn-tactile px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  isMatch
                    ? 'bg-amber-400 text-indigo-950 shadow-sm'
                    : 'bg-indigo-800/80 text-indigo-200 hover:bg-indigo-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
          const isSelected = selectedTables.includes(num);
          const mastery = getTableMastery(progress, num);

          return (
            <button
              key={num}
              onClick={() => toggleTable(num)}
              className={`btn-tactile relative flex flex-col items-center justify-center ${
                compact ? 'py-1.5' : 'py-2'
              } rounded-xl font-bold transition-all border-b-4 ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-indigo-950 border-amber-600 shadow-md scale-[1.02]'
                  : 'bg-indigo-950/70 text-indigo-300 border-indigo-950 hover:bg-indigo-800/60'
              }`}
            >
              <span className="text-sm sm:text-base leading-none">{num}×</span>
              {/* Mini mastery progress bar at bottom of chip */}
              <div className="w-4/5 h-1 bg-black/20 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    mastery.isMastered
                      ? 'bg-emerald-500'
                      : isSelected
                      ? 'bg-indigo-900'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${mastery.percent}%` }}
                />
              </div>
              {mastery.isMastered && (
                <span
                  title={`${num}× Table Mastered!`}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center shadow"
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
