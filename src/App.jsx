import React, { useState } from 'react';
import {
  Grid,
  Puzzle,
  Trophy,
  Volume2,
  VolumeX,
  Flame,
  Star,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import GridDetectiveMode from './components/GridDetectiveMode';
import PairMatchMode from './components/PairMatchMode';
import MasteryChartMode from './components/MasteryChartMode';
import TableSelectorBar from './components/TableSelectorBar';
import {
  loadProgress,
  saveProgress,
  recordFactAttempt,
  createDefaultProgress,
  getOverallMasteryStats,
} from './utils/storage';
import { sound } from './utils/sound';

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'pairs' | 'mastery'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTablePicker, setShowTablePicker] = useState(true);

  const selectedTables = progress.selectedTables || [2, 3, 4, 5, 10];
  const stats = getOverallMasteryStats(progress);

  const handleUpdateTables = (newTables) => {
    const updated = {
      ...progress,
      selectedTables: newTables,
    };
    setProgress(updated);
    saveProgress(updated);
  };

  const handleRecordAttempt = (r, c, isCorrect) => {
    setProgress((prev) => recordFactAttempt(prev, r, c, isCorrect));
  };

  const handleResetProgress = () => {
    const fresh = createDefaultProgress();
    saveProgress(fresh);
    setProgress(fresh);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playTap();
  };

  return (
    <div className="h-dvh w-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 text-white flex flex-col p-2.5 sm:p-4 gap-2.5 sm:gap-3 select-none">
      {/* Top Tablet Navigation Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 bg-indigo-900/80 backdrop-blur-md border border-indigo-700/70 rounded-2xl px-3 sm:px-4 py-2 shadow-lg shrink-0">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-indigo-950 font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-md border-b-2 border-amber-700">
            ×
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight leading-none text-white">
              Tables<span className="text-amber-300">Tables</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-indigo-300 font-medium hidden sm:block">
              Multiplication Grid & Puzzle Match
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs (Big Tablet Touch Targets) */}
        <nav className="flex items-center gap-1.5 sm:gap-2 bg-indigo-950/80 p-1 rounded-2xl border border-indigo-800">
          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('grid');
            }}
            className={`btn-tactile flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'grid'
                ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-indigo-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Grid Detective</span>
          </button>

          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('pairs');
            }}
            className={`btn-tactile flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'pairs'
                ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-indigo-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
            }`}
          >
            <Puzzle className="w-4 h-4" />
            <span>Pair Match</span>
          </button>

          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('mastery');
            }}
            className={`btn-tactile flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'mastery'
                ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-indigo-950 shadow-md'
                : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Mastery Chart</span>
            <span
              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${
                activeTab === 'mastery'
                  ? 'bg-indigo-950 text-amber-300'
                  : 'bg-amber-400/20 text-amber-300'
              }`}
            >
              {stats.totalStars}★
            </span>
          </button>
        </nav>

        {/* Right Status Badges: Streak, Table Filter Toggle & Sound */}
        <div className="flex items-center gap-2">
          {/* Streak Badge */}
          <div
            title="Current Correct Streak"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-950/90 border border-indigo-800 text-xs sm:text-sm font-extrabold text-amber-300"
          >
            <Flame
              className={`w-4 h-4 ${
                (progress.currentStreak || 0) > 0
                  ? 'text-orange-400 fill-orange-400 animate-bounce'
                  : 'text-indigo-500'
              }`}
            />
            <span>{progress.currentStreak || 0}</span>
          </div>

          {/* Toggle Table Selector Bar button (when in game modes) */}
          {activeTab !== 'mastery' && (
            <button
              onClick={() => {
                sound.playTap();
                setShowTablePicker((v) => !v);
              }}
              className={`btn-tactile flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${
                showTablePicker
                  ? 'bg-indigo-800 text-amber-300 border-amber-400/40'
                  : 'bg-indigo-950/90 text-indigo-200 border-indigo-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">Tables ({selectedTables.length})</span>
              {showTablePicker ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Mute / Unmute Sound */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="btn-tactile p-2 rounded-xl bg-indigo-950/90 hover:bg-indigo-800 border border-indigo-800 text-indigo-200"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
            )}
          </button>
        </div>
      </header>

      {/* Collapsible 1x-12x Table Selector Bar */}
      {activeTab !== 'mastery' && showTablePicker && (
        <div className="shrink-0">
          <TableSelectorBar
            selectedTables={selectedTables}
            onChangeTables={handleUpdateTables}
            progress={progress}
            compact
          />
        </div>
      )}

      {/* Main Game / Chart Workspace */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'grid' && (
          <GridDetectiveMode
            selectedTables={selectedTables}
            progress={progress}
            onRecordAttempt={handleRecordAttempt}
          />
        )}
        {activeTab === 'pairs' && (
          <PairMatchMode
            selectedTables={selectedTables}
            progress={progress}
            onRecordAttempt={handleRecordAttempt}
          />
        )}
        {activeTab === 'mastery' && (
          <MasteryChartMode
            progress={progress}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>
    </div>
  );
}
