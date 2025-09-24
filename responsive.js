import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on standard iPhone 6/7/8 dimensions
const scale = SCREEN_WIDTH / 375;

export const normalize = (size) => {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const widthPercentageToDP = (widthPercent) => {
  return (widthPercent * SCREEN_WIDTH) / 100;
};

export const heightPercentageToDP = (heightPercent) => {
  return (heightPercent * SCREEN_HEIGHT) / 100;
};

export const isSmallScreen = () => SCREEN_WIDTH < 375;
export const isVerySmallScreen = () => SCREEN_WIDTH <= 320; // iPhone 5/SE
export const isMediumScreen = () => SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeScreen = () => SCREEN_WIDTH >= 414;

export const getResponsiveWidth = (percentage) => widthPercentageToDP(percentage);
export const getResponsiveHeight = (percentage) => heightPercentageToDP(percentage);

export const responsiveScreenFontSize = (percentage) => {
  const baseSize = Math.round((percentage * Math.min(SCREEN_WIDTH, SCREEN_HEIGHT)) / 100);
  return Math.max(baseSize * 1.4, 14); // Increase base size by 40% with minimum of 14
};