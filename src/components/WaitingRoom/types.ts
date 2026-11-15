export type FlowerType =
  | 'blush_rose'
  | 'cream_rose'
  | 'tulip'
  | 'tana_daisy'
  | 'babys_breath'
  | 'eucalyptus';

export type WrapStyle = 'cream' | 'dusty_rose' | 'kraft';
export type RibbonColor = 'soft_pink' | 'wine_red' | 'champagne_gold';

export interface FlowerDefinition {
  type: FlowerType;
  name: string;
  category: 'focal' | 'accent' | 'foliage';
  defaultScale: number;
  description: string;
}

export interface BouquetStem {
  id: string;
  type: FlowerType;
  // Bố cục bó hoa thực tế: góc xoay tỏa nan quạt, độ vươn cao và độ lệch ngang
  angle: number; // -35 độ đến +35 độ
  heightOffset: number; // px so với tâm bó hoa
  lateralOffset: number; // % lệch trái/phải (-30 đến +30)
  scale: number;
  zIndex: number;
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isTimeUp: boolean;
  totalRemainingSeconds: number;
}
