import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Universal scaling based on device type
const baseWidth = Platform.OS === 'ios' ? 375 : 360; // iPhone 6/7/8 vs Android baseline
const scale = SCREEN_WIDTH / baseWidth;

export const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

export const widthPercentageToDP = (widthPercent) => {
  return (widthPercent * SCREEN_WIDTH) / 100;
};

export const heightPercentageToDP = (heightPercent) => {
  return (heightPercent * SCREEN_HEIGHT) / 100;
};

// Cross-platform screen size detection
export const isSmallScreen = () => SCREEN_WIDTH < 360;
export const isVerySmallScreen = () => SCREEN_WIDTH <= 320;
export const isMediumScreen = () => SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414;
export const isLargeScreen = () => SCREEN_WIDTH >= 414;
export const isTablet = () => SCREEN_WIDTH >= 768;

export const getResponsiveWidth = (percentage) => widthPercentageToDP(percentage);
export const getResponsiveHeight = (percentage) => heightPercentageToDP(percentage);

export const responsiveScreenFontSize = (percentage) => {
  const baseSize = Math.round((percentage * Math.min(SCREEN_WIDTH, SCREEN_HEIGHT)) / 100);
  const minSize = Platform.OS === 'ios' ? 14 : 12;
  const scaleFactor = Platform.OS === 'ios' ? 1.4 : 1.2;
  return Math.max(baseSize * scaleFactor, minSize);
};

// Platform-specific padding
export const getPlatformPadding = () => {
  return Platform.OS === 'ios' ? 20 : 16;
};

// Safe area handling
export const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? 44 : 24;
};