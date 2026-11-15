import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock canvas-confetti so tests don't require HTMLCanvasElement context
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));
