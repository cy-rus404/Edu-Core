import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { responsiveScreenFontSize } from './responsive';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EDUCORE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
});