export interface HapticsPort {
  impact(intensity: 'light' | 'medium' | 'heavy'): Promise<void>;
}
