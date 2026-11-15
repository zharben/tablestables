# TablesTables ✖️🌟

**TablesTables** is a tablet-optimized multiplication game designed to help kids memorize multiplication facts from **1×1 up to 12×12** through interactive grid puzzles, pair matching, and a visual mastery chart.

## Features

1. **Grid Detective Mode (12×12 Puzzle Board)**
   - Fill in missing `?` spots on the interactive 12×12 multiplication table.
   - Row and column headers highlight dynamically so kids can see how rows and columns intersect.
   - Optional **Visual Dots Hint** shows an array of dots ($r \times c$) for conceptual understanding.
2. **Pair Match Mode (Equation ↔ Answer Matching)**
   - Match blue multiplication fact cards (`6 × 7`) with their corresponding gold answer cards (`42`).
   - Configurable board sizes (`6 Pairs`, `8 Pairs`, or `10 Pairs`).
3. **12×12 Mastery Chart & Star Tracker**
   - Visual color-coded 12×12 heatmap tracking progress from `0★` to `3★ Mastered!` for all 144 facts.
   - Automatically saves progress in `localStorage` on the tablet.
4. **Customizable Active Tables (1× to 12×)**
   - Toggle individual multiplication tables or choose quick presets (*Starter 1, 2, 5, 10*, *Medium 3, 4, 6*, *Tricky 7, 8, 9*, *Big Kids 11, 12*, or *All 1–12*).
5. **Tablet-First Design**
   - Full-viewport (`100dvh`) zero-scroll layout, large tactile buttons, `touch-action: manipulation` (no double-tap zoom), and synthesized Web Audio sound effects.

## Local Development

```bash
npm install
npm run dev
```

## Building & Deploying to GitHub Pages

This project includes a ready-to-use GitHub Actions workflow in `.github/workflows/deploy.yml`.

1. Push this repository to GitHub (`main` branch).
2. In your GitHub repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Every push to `main` will automatically build and deploy the app to GitHub Pages!
