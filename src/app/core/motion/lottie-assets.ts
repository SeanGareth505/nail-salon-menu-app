export type LottieAssetKey =
  | 'splash'
  | 'success'
  | 'successCompact'
  | 'offline';

export const LOTTIE_ASSETS: Record<LottieAssetKey, string> = {
  splash: '/assets/lottie/splash.json',
  success: '/assets/lottie/success.json',
  successCompact: '/assets/lottie/success-check.json',
  offline: '/assets/lottie/offline-wifi.json',
};
