import type { FruitConfig } from '@/types/game';

export const FRUITS: FruitConfig[] = [
  { name: '체리',     radius: 17,  color: '#FF3855', highlight: '#FF7A8A', scoreValue: 1,  level: 0,  decorations: ['stem'],                    decoColor: '#5A8F3C' },
  { name: '딸기',     radius: 25,  color: '#FF5278', highlight: '#FF8FA0', scoreValue: 3,  level: 1,  decorations: ['stem', 'seeds'],            decoColor: '#4A9E3F' },
  { name: '포도',     radius: 33,  color: '#B44DE8', highlight: '#D49AFF', scoreValue: 6,  level: 2,  decorations: ['stem', 'grapeTexture'],     decoColor: '#8030C0' },
  { name: '데코폰',   radius: 40,  color: '#FFB020', highlight: '#FFD060', scoreValue: 10, level: 3,  decorations: ['bumpy', 'stem', 'leaf'],    decoColor: '#4A9E3F' },
  { name: '감',       radius: 50,  color: '#FF8830', highlight: '#FFB060', scoreValue: 15, level: 4,  decorations: ['stem', 'leaf', 'divisions'], decoColor: '#4A9E3F' },
  { name: '사과',     radius: 58,  color: '#FF2D40', highlight: '#FF7080', scoreValue: 21, level: 5,  decorations: ['stem', 'leaf'],             decoColor: '#4A9E3F' },
  { name: '배',       radius: 68,  color: '#B8E848', highlight: '#D5FF80', scoreValue: 28, level: 6,  decorations: ['stem', 'leaf'],             decoColor: '#3D7A2E' },
  { name: '복숭아',   radius: 78,  color: '#FFA0B8', highlight: '#FFD0E0', scoreValue: 36, level: 7,  decorations: ['stem', 'leaf', 'heartCrease'], decoColor: '#4A9E3F' },
  { name: '파인애플', radius: 90,  color: '#FFD018', highlight: '#FFEA60', scoreValue: 45, level: 8,  decorations: ['crownLeaves'],              decoColor: '#4A9E3F' },
  { name: '멜론',     radius: 104, color: '#40E878', highlight: '#88FFB8', scoreValue: 55, level: 9,  decorations: ['netPattern', 'stem'],       decoColor: '#20B050' },
  { name: '수박',     radius: 120, color: '#30C860', highlight: '#68F098', scoreValue: 66, level: 10, decorations: ['stripes'],                  decoColor: '#208848' },
];

export const MAX_DROP_LEVEL = 4;

export function getRandomDropLevel(): number {
  return Math.floor(Math.random() * (MAX_DROP_LEVEL + 1));
}
