export const SigfoxModels = {
  TD1208: 'TD1208',
  ERIC: 'ERIC'
} as const;
export type SigfoxModels = (typeof SigfoxModels)[keyof typeof SigfoxModels];
