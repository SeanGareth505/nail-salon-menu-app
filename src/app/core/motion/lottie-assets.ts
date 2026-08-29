export type LottieAssetKey =
  | 'splash'
  | 'success'
  | 'successCompact'
  | 'emptyGeneric'
  | 'emptyTreatments'
  | 'emptySearch'
  | 'emptySpecials'
  | 'emptyConsultations'
  | 'offline';

export const LOTTIE_ASSETS: Record<LottieAssetKey, string> = {
  splash: '/assets/lottie/splash.json',
  success: '/assets/lottie/success.json',
  successCompact: '/assets/lottie/success-check.json',
  emptyGeneric: '/assets/lottie/empty-generic.json',
  emptyTreatments: '/assets/lottie/empty-treatments.json',
  emptySearch: '/assets/lottie/empty-search.json',
  emptySpecials: '/assets/lottie/empty-specials.json',
  emptyConsultations: '/assets/lottie/empty-consultations.json',
  offline: '/assets/lottie/offline-wifi.json',
};

export const EMPTY_MOTIF_ASSET: Record<string, LottieAssetKey> = {
  generic: 'emptyGeneric',
  treatments: 'emptyTreatments',
  specials: 'emptySpecials',
  consultations: 'emptyConsultations',
  clients: 'emptyGeneric',
  search: 'emptySearch',
};
