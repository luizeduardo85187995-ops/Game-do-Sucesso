export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  color: string;
  emoji: string;
}

export type CharacterSkinId = 'executive' | 'astronaut' | 'wizard' | 'ninja' | 'lucky_cat' | 'valkyrie';

export interface CharacterSkin {
  id: CharacterSkinId;
  name: string;
  title: string;
  icon: string;
  accentColor: string;
  description: string;
}

export type CharacterState = 'idle' | 'struggling' | 'walking' | 'running' | 'almost' | 'victory';

export interface GoalColor {
  name: string;
  gradient: string;
  glow: string;
  accentHex: string;
}

export interface ParticleEffect {
  id: number;
  x: number;
  y: number;
  emoji: string;
  delay: number;
  scale?: number;
}
