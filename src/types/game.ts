import type Matter from 'matter-js';

export interface FruitBody extends Matter.Body {
  fruitLevel: number;
  isMerging: boolean;
}

export enum GamePhase {
  READY = 'READY',
  DROPPING = 'DROPPING',
  GAME_OVER = 'GAME_OVER',
}

export interface GameState {
  phase: GamePhase;
  score: number;
  currentFruitLevel: number;
  nextFruitLevel: number;
}

export type DecoType =
  | 'stem'
  | 'leaf'
  | 'seeds'
  | 'grapeTexture'
  | 'bumpy'
  | 'divisions'
  | 'heartCrease'
  | 'crownLeaves'
  | 'netPattern'
  | 'stripes';

export interface FruitConfig {
  name: string;
  radius: number;
  color: string;
  highlight: string;
  scoreValue: number;
  level: number;
  decorations: DecoType[];
  decoColor?: string;
}

export interface MergeEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}
