import { GamePhase } from '@/types/game';
import type { GameState } from '@/types/game';
import { getRandomDropLevel } from './fruits';

export function createInitialState(): GameState {
  return {
    phase: GamePhase.READY,
    score: 0,
    currentFruitLevel: getRandomDropLevel(),
    nextFruitLevel: getRandomDropLevel(),
  };
}

export function advanceToNextFruit(state: GameState): GameState {
  return {
    ...state,
    phase: GamePhase.READY,
    currentFruitLevel: state.nextFruitLevel,
    nextFruitLevel: getRandomDropLevel(),
  };
}

export function addScore(state: GameState, points: number): GameState {
  return {
    ...state,
    score: state.score + points,
  };
}

export function setGameOver(state: GameState): GameState {
  return {
    ...state,
    phase: GamePhase.GAME_OVER,
  };
}

export function setDropping(state: GameState): GameState {
  return {
    ...state,
    phase: GamePhase.DROPPING,
  };
}
