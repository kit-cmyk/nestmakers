import React from 'react';
import { View } from 'react-native';
import { PORTRAIT_PALETTES_RECT } from '@/constants/tokens';

interface Props {
  seed?: number;
  height?: number;
  width?: number | string;
  radius?: number;
  style?: object;
}

export default function PortraitRect({ seed = 0, height = 280, width, radius = 20, style }: Props) {
  const [a, b, c] = PORTRAIT_PALETTES_RECT[seed % PORTRAIT_PALETTES_RECT.length];
  return (
    <View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: a,
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '80%',
          height: '80%',
          backgroundColor: b,
          opacity: 0.6,
          borderTopLeftRadius: 999,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '55%',
          height: '55%',
          borderRadius: 999,
          backgroundColor: c,
          opacity: 0.5,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '5%',
          right: '10%',
          width: '35%',
          height: '35%',
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.35)',
        }}
      />
    </View>
  );
}
