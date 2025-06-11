import React from 'react';
import { View, StyleSheet } from 'react-native';

const ColorCircle = ({ color, brightness }) => {
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

  let adjustedColor = 'rgba(0,0,0,1)';

  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    adjustedColor = `rgba(${r}, ${g}, ${b}, ${brightness})`;
  }

  return (
    <View style={[styles.circle, { backgroundColor: adjustedColor }]} />
  );
};

const styles = StyleSheet.create({
  circle: {
    width: 230,            // büyütüldü
    height: 230,
    marginTop: 90,         // aşağıya indirildi
    marginBottom: 30,
    alignSelf: 'center',
  },
});

export default ColorCircle;