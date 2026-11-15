import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GridDetectiveMode from '../components/GridDetectiveMode';
import { createDefaultProgress } from '../utils/storage';

describe('GridDetectiveMode', () => {
  it('renders 10 missing (?) cells and 10 answer tiles, and removes used answer tiles as they are matched', () => {
    const onRecordAttempt = vi.fn();
    const progress = createDefaultProgress();

    render(
      <GridDetectiveMode
        selectedTables={[2, 5]}
        progress={progress}
        onRecordAttempt={onRecordAttempt}
      />
    );

    // Should show "0 / 10 Filled" initially
    expect(screen.getByText('0 / 10 Filled')).toBeInTheDocument();

    // Should NOT render the removed Dots Hint button
    expect(screen.queryByText(/Dots Hint/i)).not.toBeInTheDocument();

    // Read the active equation prompt in the Selected Grid Spot card
    const clueSection = screen.getByText('Selected Grid Spot').parentElement.parentElement;
    // The clue card shows r × c = ?
    const textContent = clueSection.textContent;
    const match = textContent.match(/(\d+)×(\d+)=\?/);
    expect(match).not.toBeNull();

    const r = Number(match[1]);
    const c = Number(match[2]);
    const correctAnswer = r * c;

    // Count initial answer tiles inside the Answer Tiles tray
    const answerTray = screen.getByText('Answer Tiles (Tap to place)').closest('div').parentElement;
    const tileButtonsBefore = answerTray.querySelectorAll('div.grid button');
    expect(tileButtonsBefore.length).toBe(10);

    // Find a tile button with the matching answer and click it
    const matchingTile = Array.from(tileButtonsBefore).find(
      (btn) => Number(btn.textContent.trim()) === correctAnswer
    );
    expect(matchingTile).toBeDefined();

    fireEvent.click(matchingTile);

    // Verify attempt was recorded as correct
    expect(onRecordAttempt).toHaveBeenCalledWith(r, c, true);

    // Progress counter should now show "1 / 10 Filled"
    expect(screen.getByText('1 / 10 Filled')).toBeInTheDocument();

    // Remaining answer tiles should shift up and count should decrease from 10 to 9
    const tileButtonsAfter = answerTray.querySelectorAll('div.grid button');
    expect(tileButtonsAfter.length).toBe(9);
  });

  it('completes the round when all 10 missing cells are matched', () => {
    const onRecordAttempt = vi.fn();
    const progress = createDefaultProgress();

    render(
      <GridDetectiveMode
        selectedTables={[3]}
        progress={progress}
        onRecordAttempt={onRecordAttempt}
      />
    );

    const answerTray = screen.getByText('Answer Tiles (Tap to place)').closest('div').parentElement;

    for (let step = 0; step < 10; step++) {
      const clueSection = screen.getByText('Selected Grid Spot').parentElement.parentElement;
      const match = clueSection.textContent.match(/(\d+)×(\d+)=\?/);
      const expected = Number(match[1]) * Number(match[2]);

      const tileButtons = answerTray.querySelectorAll('div.grid button');
      expect(tileButtons.length).toBe(10 - step);

      const correctBtn = Array.from(tileButtons).find(
        (btn) => Number(btn.textContent.trim()) === expected
      );
      fireEvent.click(correctBtn);
    }

    // All 10 tiles are used so 0 tiles remain in the tray
    expect(answerTray.querySelectorAll('div.grid button').length).toBe(0);
    expect(screen.getByText('10 / 10 Filled')).toBeInTheDocument();
    expect(screen.getByText('Board Complete!')).toBeInTheDocument();
    expect(screen.getByText('Play Next Board!')).toBeInTheDocument();
  });
});
