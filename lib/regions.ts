/**
 * Fly.io regions
 * 
 * This file contains data about all available Fly.io regions
 * that can be used throughout the application.
 */

export interface FlyRegion {
  name: string;
  code: string;
}

/**
 * Array of all available Fly.io regions
 */
export const FLY_REGIONS: FlyRegion[] = [
  { name: 'Amsterdam, Netherlands', code: 'ams' },
  { name: 'Ashburn, Virginia', code: 'iad' },
  { name: 'Atlanta, Georgia', code: 'atl' },
  { name: 'Bogotá, Colombia', code: 'bog' },
  { name: 'Boston, Massachusetts', code: 'bos' },
  { name: 'Bucharest, Romania', code: 'otp' },
  { name: 'Chicago, Illinois', code: 'ord' },
  { name: 'Dallas, Texas', code: 'dfw' },
  { name: 'Denver, Colorado', code: 'den' },
  { name: 'Ezeiza, Argentina', code: 'eze' },
  { name: 'Frankfurt, Germany', code: 'fra' },
  { name: 'Guadalajara, Mexico', code: 'gdl' },
  { name: 'Hong Kong, Hong Kong', code: 'hkg' },
  { name: 'Johannesburg, South Africa', code: 'jnb' },
  { name: 'London, United Kingdom', code: 'lhr' },
  { name: 'Los Angeles, California', code: 'lax' },
  { name: 'Madrid, Spain', code: 'mad' },
  { name: 'Miami, Florida', code: 'mia' },
  { name: 'Montreal, Canada', code: 'yul' },
  { name: 'Mumbai, India', code: 'bom' },
  { name: 'Paris, France', code: 'cdg' },
  { name: 'Phoenix, Arizona', code: 'phx' },
  { name: 'Querétaro, Mexico', code: 'qro' },
  { name: 'Rio de Janeiro, Brazil', code: 'gig' },
  { name: 'San Jose, California', code: 'sjc' },
  { name: 'Santiago, Chile', code: 'scl' },
  { name: 'Sao Paulo, Brazil', code: 'gru' },
  { name: 'Seattle, Washington', code: 'sea' },
  { name: 'Secaucus, NJ', code: 'ewr' },
  { name: 'Singapore, Singapore', code: 'sin' },
  { name: 'Stockholm, Sweden', code: 'arn' },
  { name: 'Sydney, Australia', code: 'syd' },
  { name: 'Tokyo, Japan', code: 'nrt' },
  { name: 'Toronto, Canada', code: 'yyz' },
  { name: 'Warsaw, Poland', code: 'waw' }
];

/**
 * Get a region object by its code
 */
export function getRegionByCode(code: string): FlyRegion | undefined {
  return FLY_REGIONS.find(region => region.code === code);
}

/**
 * Get region display name by code
 */
export function getRegionDisplayName(code: string): string {
  const region = getRegionByCode(code);
  return region ? `${region.name} (${region.code})` : code;
} 