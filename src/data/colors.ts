import { GoalColor } from '../types';

export const GOAL_COLORS: GoalColor[] = [
  {
    name: 'Dourado Imperial',
    gradient: 'from-amber-400 to-yellow-500',
    glow: 'shadow-amber-400/50',
    accentHex: '#f59e0b',
  },
  {
    name: 'Esmeralda Prosper',
    gradient: 'from-emerald-400 to-teal-500',
    glow: 'shadow-emerald-400/50',
    accentHex: '#10b981',
  },
  {
    name: 'Rubi Real',
    gradient: 'from-rose-500 to-pink-500',
    glow: 'shadow-rose-500/50',
    accentHex: '#f43f5e',
  },
  {
    name: 'Safira Cósmica',
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/50',
    accentHex: '#3b82f6',
  },
  {
    name: 'Ametista Mística',
    gradient: 'from-purple-500 to-fuchsia-600',
    glow: 'shadow-purple-500/50',
    accentHex: '#a855f7',
  },
  {
    name: 'Ciber Ciano',
    gradient: 'from-cyan-400 to-blue-500',
    glow: 'shadow-cyan-400/50',
    accentHex: '#06b6d4',
  },
];

export const GOAL_EMOJIS = [
  '🚗', '🏠', '✈️', '💻', '🏖️',
  '🎓', '💍', '🎮', '📱', '💰',
  '🛥️', '🏍️', '🎸', '⌚', '💎',
];

export const PRESET_GOALS = [
  { name: 'Reserva de Emergência', amount: 5000, emoji: '🛡️', color: 'from-emerald-400 to-teal-500' },
  { name: 'Viagem dos Sonhos', amount: 8000, emoji: '✈️', color: 'from-cyan-400 to-blue-500' },
  { name: 'Carro Novo', amount: 35000, emoji: '🚗', color: 'from-amber-400 to-yellow-500' },
  { name: 'Setup Gamer Ultra', amount: 7500, emoji: '🎮', color: 'from-purple-500 to-fuchsia-600' },
  { name: 'Entrada da Casa Própria', amount: 50000, emoji: '🏠', color: 'from-blue-500 to-indigo-600' },
];
