import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Puzzle, RotateCcw, Sparkles, Trophy, Flame, Layers } from 'lucide-react';
import { getFactStars } from '../utils/storage';
import { sound } from '../utils/sound';

const PAIR_COUNTS = [
  { label: '6 Pairs (12 Cards)', pairs: 6 },
  { label: '8 Pairs (16 Cards)', pairs: 8 },
  { label: '10 Pairs (20 Cards)', pairs: 10 },
];

export default function PairMatchMode({ selectedTables, progress, onRecordAttempt }) {
  const [pairCount, setPairCount] = useState(8);
  const [cards, setCards] = useState([]); // Array of { id, pairId, type: 'eq' | 'ans', label, r, c, answer, matched }
  const [selectedCard, setSelectedCard] = useState(null);
  const [wrongPairIds, setWrongPairIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);

  const generateDeck = useCallback(
    (numPairs = pairCount) => {
      const activeSet = new Set(selectedTables);
      const candidates = [];

      for (let r = 1; r <= 12; r++) {
        for (let c = 1; c <= 12; c++) {
          if (activeSet.has(r)) {
            const stars = getFactStars(progress, r, c);
            const weight = stars === 0 ? 4 : stars === 1 ? 3 : stars === 2 ? 2 : 1;
            candidates.push({ r, c, answer: r * c, weight });
          }
        }
      }

      // Pick facts with UNIQUE product answers so there is never an ambiguous pair match!
      const chosenFacts = [];
      const usedAnswers = new Set();
      const pool = [...candidates];

      while (chosenFacts.length < numPairs && pool.length > 0) {
        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let rand = Math.random() * totalWeight;
        let idx = 0;
        for (let i = 0; i < pool.length; i++) {
          rand -= pool[i].weight;
          if (rand <= 0) {
            idx = i;
            break;
          }
        }
        const [picked] = pool.splice(idx, 1);
        if (!usedAnswers.has(picked.answer)) {
          usedAnswers.add(picked.answer);
          chosenFacts.push(picked);
        }
      }

      // If user selected only 1 table (which has 12 unique products), we always have at least 12 unique answers.
      // Build equation cards and answer cards
      const rawCards = [];
      chosenFacts.forEach((fact, index) => {
        const pairId = `pair-${index}-${fact.r}x${fact.c}`;
        rawCards.push({
          id: `${pairId}-eq`,
          pairId,
          type: 'eq',
          label: `${fact.r} × ${fact.c}`,
          r: fact.r,
          c: fact.c,
          answer: fact.answer,
          matched: false,
        });
        rawCards.push({
          id: `${pairId}-ans`,
          pairId,
          type: 'ans',
          label: `${fact.answer}`,
          r: fact.r,
          c: fact.c,
          answer: fact.answer,
          matched: false,
        });
      });

      // Fisher-Yates shuffle
      for (let i = rawCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rawCards[i], rawCards[j]] = [rawCards[j], rawCards[i]];
      }

      setCards(rawCards);
      setSelectedCard(null);
      setWrongPairIds([]);
      setMoves(0);
      setMatchesFound(0);
    },
    [pairCount, selectedTables]
  );

  useEffect(() => {
    generateDeck(pairCount);
  }, [generateDeck, pairCount]);

  const handleCardTap = (card) => {
    if (card.matched || wrongPairIds.length > 0) return;

    // Tapping the same card deselects it
    if (selectedCard?.id === card.id) {
      sound.playTap();
      setSelectedCard(null);
      return;
    }

    // Tapping another card of the SAME type (e.g., switching from one equation to another equation)
    if (selectedCard && selectedCard.type === card.type) {
      sound.playSelect();
      setSelectedCard(card);
      return;
    }

    // First card selected
    if (!selectedCard) {
      sound.playSelect();
      setSelectedCard(card);
      return;
    }

    // Second card of complementary type (Equation + Answer) selected!
    setMoves((m) => m + 1);

    if (selectedCard.answer === card.answer) {
      // Match!
      const eqCard = selectedCard.type === 'eq' ? selectedCard : card;
      sound.playCorrect(progress.currentStreak + 1);
      onRecordAttempt(eqCard.r, eqCard.c, true);

      const nextCards = cards.map((c) =>
        c.id === selectedCard.id || c.id === card.id ? { ...c, matched: true } : c
      );
      const nextMatches = matchesFound + 1;

      setCards(nextCards);
      setSelectedCard(null);
      setMatchesFound(nextMatches);

      if (nextMatches === cards.length / 2) {
        sound.playFanfare();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } else {
      // Mismatch
      const eqCard = selectedCard.type === 'eq' ? selectedCard : card;
      sound.playWrong();
      onRecordAttempt(eqCard.r, eqCard.c, false);
      setWrongPairIds([selectedCard.id, card.id]);

      setTimeout(() => {
        setWrongPairIds([]);
        setSelectedCard(null);
      }, 550);
    }
  };

  const totalPairs = cards.length / 2;
  const isAllCleared = totalPairs > 0 && matchesFound === totalPairs;

  return (
    <div className="flex flex-col h-full min-h-0 bg-indigo-900/60 backdrop-blur-md border border-indigo-700/60 rounded-3xl p-3 sm:p-5 shadow-xl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30 flex items-center gap-1.5">
            <Puzzle className="w-4 h-4" />
            <span>Puzzle Pair Match</span>
          </span>
          <span className="text-xs sm:text-sm text-indigo-200 hidden md:inline">
            Match each <strong className="text-sky-300">Blue Equation</strong> card with its{' '}
            <strong className="text-amber-300">Gold Answer</strong> card!
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-indigo-950/80 p-1 rounded-xl border border-indigo-800">
            {PAIR_COUNTS.map((opt) => (
              <button
                key={opt.pairs}
                onClick={() => {
                  sound.playTap();
                  setPairCount(opt.pairs);
                }}
                className={`btn-tactile px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  pairCount === opt.pairs
                    ? 'bg-amber-400 text-indigo-950'
                    : 'text-indigo-300 hover:text-white'
                }`}
              >
                {opt.pairs} Pairs
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              sound.playSelect();
              generateDeck(pairCount);
            }}
            className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-indigo-100 text-xs sm:text-sm font-bold border border-indigo-600"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Shuffle New</span>
          </button>
        </div>
      </div>

      {/* Card Grid or Victory Banner */}
      {!isAllCleared ? (
        <div
          className={`flex-1 grid gap-2.5 sm:gap-3.5 min-h-0 ${
            pairCount === 6
              ? 'grid-cols-3 sm:grid-cols-4 grid-rows-4 sm:grid-rows-3'
              : pairCount === 8
              ? 'grid-cols-4 grid-rows-4'
              : 'grid-cols-4 sm:grid-cols-5 grid-rows-5 sm:grid-rows-4'
          }`}
        >
          {cards.map((card) => {
            const isSelected = selectedCard?.id === card.id;
            const isWrong = wrongPairIds.includes(card.id);
            const isEq = card.type === 'eq';

            if (card.matched) {
              return (
                <div
                  key={card.id}
                  className="animate-pop rounded-2xl bg-emerald-500/15 border-2 border-dashed border-emerald-400/40 flex flex-col items-center justify-center p-2 text-emerald-300/80"
                >
                  <span className="text-xs sm:text-sm font-bold">✓ Matched</span>
                  <span className="text-sm sm:text-lg font-extrabold">
                    {card.r} × {card.c} = {card.answer}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={card.id}
                onClick={() => handleCardTap(card)}
                className={`btn-tactile relative rounded-2xl font-extrabold flex flex-col items-center justify-center p-2 transition-all border-b-4 shadow-lg ${
                  isWrong
                    ? 'animate-shake bg-rose-500 text-white border-rose-700 ring-4 ring-rose-300'
                    : isSelected
                    ? 'bg-white text-indigo-950 border-amber-400 ring-4 ring-amber-400 scale-[1.04] z-10'
                    : isEq
                    ? 'bg-gradient-to-b from-sky-400 to-blue-600 text-white border-blue-800 hover:from-sky-300 hover:to-blue-500'
                    : 'bg-gradient-to-b from-amber-300 to-amber-500 text-indigo-950 border-amber-700 hover:from-amber-200 hover:to-amber-400'
                }`}
              >
                <span
                  className={`text-[10px] sm:text-xs uppercase tracking-wider font-bold mb-0.5 px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-indigo-100 text-indigo-800'
                      : isEq
                      ? 'bg-blue-900/40 text-sky-100'
                      : 'bg-amber-900/20 text-indigo-950'
                  }`}
                >
                  {isEq ? 'Fact' : 'Answer'}
                </span>
                <span className="text-xl sm:text-3xl md:text-4xl tracking-tight">
                  {card.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-indigo-950/50 rounded-3xl border border-indigo-800">
          <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 mb-4 animate-float">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
            All {totalPairs} Pairs Matched!
          </h2>
          <p className="text-indigo-200 text-sm sm:text-base mb-6 max-w-md">
            You cleared the board in <strong className="text-amber-300">{moves}</strong> moves and
            earned stars on your Multiplication Mastery Chart!
          </p>
          <button
            onClick={() => {
              sound.playSelect();
              generateDeck(pairCount);
            }}
            className="btn-tactile px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-500 text-indigo-950 font-extrabold text-lg sm:text-xl shadow-xl border-b-4 border-amber-700 flex items-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            <span>Deal Another Round!</span>
          </button>
        </div>
      )}
    </div>
  );
}
