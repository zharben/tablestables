import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PairMatchMode from '../components/PairMatchMode';
import TableSelectorBar from '../components/TableSelectorBar';
import App from '../App';
import { createDefaultProgress } from '../utils/storage';

describe('PairMatchMode', () => {
  it('renders unique equation and answer pairs and matches them accurately', () => {
    const onRecordAttempt = vi.fn();
    const progress = createDefaultProgress();

    render(
      <PairMatchMode
        selectedTables={[2, 3, 4]}
        progress={progress}
        onRecordAttempt={onRecordAttempt}
      />
    );

    // Default is 8 pairs = 16 cards (8 "Fact" cards + 8 "Answer" cards)
    const factBadges = screen.getAllByText('Fact');
    const answerBadges = screen.getAllByText('Answer');
    expect(factBadges.length).toBe(8);
    expect(answerBadges.length).toBe(8);

    // Pick the first Fact card, compute its product, and click its matching Answer card
    const firstFactButton = factBadges[0].closest('button');
    const eqMatch = firstFactButton.textContent.match(/(\d+)\s*×\s*(\d+)/);
    expect(eqMatch).not.toBeNull();
    const expectedProduct = String(Number(eqMatch[1]) * Number(eqMatch[2]));

    const matchingAnswerButton = answerBadges
      .map((badge) => badge.closest('button'))
      .find((btn) => btn.textContent.replace('Answer', '').trim() === expectedProduct);

    expect(matchingAnswerButton).toBeDefined();

    fireEvent.click(firstFactButton);
    fireEvent.click(matchingAnswerButton);

    expect(onRecordAttempt).toHaveBeenCalledWith(
      Number(eqMatch[1]),
      Number(eqMatch[2]),
      true
    );
    expect(screen.getAllByText('✓ Matched').length).toBe(2);
  });

  it('allows switching between 6, 8, and 10 pairs', () => {
    const progress = createDefaultProgress();
    render(
      <PairMatchMode
        selectedTables={[5, 10]}
        progress={progress}
        onRecordAttempt={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('6 Pairs'));
    expect(screen.getAllByText('Fact').length).toBe(6);

    fireEvent.click(screen.getByText('10 Pairs'));
    expect(screen.getAllByText('Fact').length).toBe(10);
  });
});

describe('TableSelectorBar & App navigation', () => {
  it('toggles multiplication tables and prevents deselecting the last remaining table', () => {
    const onChangeTables = vi.fn();
    const progress = createDefaultProgress();

    render(
      <TableSelectorBar
        selectedTables={[5]}
        onChangeTables={onChangeTables}
        progress={progress}
      />
    );

    // Clicking the only active table (5x) should not empty the selection
    fireEvent.click(screen.getByText('5×'));
    expect(onChangeTables).not.toHaveBeenCalled();

    // Clicking 7x adds it to the selection
    fireEvent.click(screen.getByText('7×'));
    expect(onChangeTables).toHaveBeenCalledWith([5, 7]);
  });

  it('switches cleanly between Grid Detective, Pair Match, and Mastery Chart tabs', () => {
    render(<App />);

    expect(screen.getByText('12×12 Puzzle Board')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Pair Match'));
    expect(screen.getByText('Puzzle Pair Match')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mastery Chart'));
    expect(screen.getByText('Overall Star Collection')).toBeInTheDocument();
  });
});
