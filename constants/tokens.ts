import { StyleSheet } from 'react-native';

export const NM = {
  // Backgrounds
  cream: '#FBF7F1',
  cream2: '#F5EFE6',
  ink: '#2A1F3D',
  ink2: '#4A3D5E',
  ink3: '#7A6E8A',
  hair: 'rgba(42,31,61,0.08)',
  hair2: 'rgba(42,31,61,0.14)',

  // Pastels
  lavender: '#C7B8E8',
  lavenderSoft: '#E8DFF7',
  lavenderDeep: '#8B6FC5',
  peach: '#F4C7A8',
  peachSoft: '#FBE4D2',
  peachDeep: '#D88B5E',
  butter: '#F6E6A8',
  butterSoft: '#FCF4D4',
  sage: '#C6DAB8',
  sageSoft: '#E4EED9',
  rose: '#F0B8C4',
  roseSoft: '#F9DDE2',
  sky: '#B8D4E8',
  skySoft: '#DCE9F3',

  // Signals
  danger: '#C25A5A',
  dangerSoft: '#F5D9D9',
  gold: '#B8893A',

  // Radii
  r: { sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, pill: 999 },

  // Shadows (iOS)
  shadow: {
    card: {
      shadowColor: '#2A1F3D',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lift: {
      shadowColor: '#2A1F3D',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    soft: {
      shadowColor: '#2A1F3D',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
  },
};

// Palette arrays for deterministic portrait blobs
export const PORTRAIT_PALETTES: [string, string][] = [
  ['#C7B8E8', '#F4C7A8'],
  ['#F6E6A8', '#C6DAB8'],
  ['#F0B8C4', '#C7B8E8'],
  ['#B8D4E8', '#F4C7A8'],
  ['#E8DFF7', '#F6E6A8'],
  ['#C6DAB8', '#B8D4E8'],
  ['#F4C7A8', '#F0B8C4'],
  ['#8B6FC5', '#F4C7A8'],
];

export const PORTRAIT_PALETTES_RECT: [string, string, string][] = [
  ['#C7B8E8', '#F4C7A8', '#F6E6A8'],
  ['#F6E6A8', '#C6DAB8', '#B8D4E8'],
  ['#F0B8C4', '#C7B8E8', '#E8DFF7'],
  ['#B8D4E8', '#F4C7A8', '#F0B8C4'],
  ['#E8DFF7', '#F6E6A8', '#C6DAB8'],
  ['#C6DAB8', '#B8D4E8', '#E8DFF7'],
  ['#F4C7A8', '#F0B8C4', '#C7B8E8'],
  ['#8B6FC5', '#F4C7A8', '#F6E6A8'],
];
