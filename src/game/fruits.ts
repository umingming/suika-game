import type { FruitConfig } from '@/types/game';

export const FRUITS: FruitConfig[] = [
  { name: '체리',     radius: 17,  color: '#E84057', highlight: '#FF6B7A', scoreValue: 1,  level: 0,  decorations: ['stem'],                    decoColor: '#5A8F3C' },
  { name: '딸기',     radius: 25,  color: '#FF6B6B', highlight: '#FF8A94', scoreValue: 3,  level: 1,  decorations: ['stem', 'seeds'],            decoColor: '#4A9E3F' },
  { name: '포도',     radius: 33,  color: '#9B59B6', highlight: '#C39BD3', scoreValue: 6,  level: 2,  decorations: ['stem', 'grapeTexture'],     decoColor: '#6B3FA0' },
  { name: '데코폰',   radius: 40,  color: '#F39C12', highlight: '#F7C948', scoreValue: 10, level: 3,  decorations: ['bumpy', 'stem', 'leaf'],    decoColor: '#4A9E3F' },
  { name: '감',       radius: 50,  color: '#E67E22', highlight: '#F0A04B', scoreValue: 15, level: 4,  decorations: ['stem', 'leaf', 'divisions'], decoColor: '#4A9E3F' },
  { name: '사과',     radius: 58,  color: '#E74C3C', highlight: '#F1948A', scoreValue: 21, level: 5,  decorations: ['stem', 'leaf'],             decoColor: '#4A9E3F' },
  { name: '배',       radius: 68,  color: '#A8D648', highlight: '#C5E87C', scoreValue: 28, level: 6,  decorations: ['stem', 'leaf'],             decoColor: '#3D7A2E' },
  { name: '복숭아',   radius: 78,  color: '#FFB6C1', highlight: '#FFD1DC', scoreValue: 36, level: 7,  decorations: ['stem', 'leaf', 'heartCrease'], decoColor: '#4A9E3F' },
  { name: '파인애플', radius: 90,  color: '#F1C40F', highlight: '#F9E154', scoreValue: 45, level: 8,  decorations: ['crownLeaves'],              decoColor: '#4A9E3F' },
  { name: '멜론',     radius: 104, color: '#2ECC71', highlight: '#82E0AA', scoreValue: 55, level: 9,  decorations: ['netPattern', 'stem'],       decoColor: '#1A9B4A' },
  { name: '수박',     radius: 120, color: '#27AE60', highlight: '#58D68D', scoreValue: 66, level: 10, decorations: ['stripes'],                  decoColor: '#1E8449' },
];

export const MAX_DROP_LEVEL = 4;

export function getRandomDropLevel(): number {
  return Math.floor(Math.random() * (MAX_DROP_LEVEL + 1));
}
