/**
 * Development mode checker for Google Sign-In
 * Determines if we're running in Expo Go vs Development Build
 */

import Constants from 'expo-constants';

export const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

export const isDevelopmentBuild = (): boolean => {
  return !isExpoGo();
};

export const canUseGoogleSignIn = (): boolean => {
  // Google Sign-In only works in development builds, not Expo Go
  return !isExpoGo();
};