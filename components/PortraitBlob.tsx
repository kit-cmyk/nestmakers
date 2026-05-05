import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PORTRAIT_PALETTES } from '@/constants/tokens';

interface Props {
  seed?: number;
  size?: number;
  style?: object;
}

export default function PortraitBlob({ seed = 0, size = 80, style }: Props) {
  const [a, b] = PORTRAIT_PALETTES[seed % PORTRAIT_PALETTES.length];
  // React Native doesn't support conic-gradient so we use a two-stop linear gradient fallback
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
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
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: size * 0.35,
          backgroundColor: b,
          opacity: 0.7,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.1,
          left: size * 0.1,
          width: size * 0.45,
          height: size * 0.45,
          borderRadius: size * 0.225,
          backgroundColor: 'rgba(255,255,255,0.4)',
        }}
      />
    </View>
  );
}
