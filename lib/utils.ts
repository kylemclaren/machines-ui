import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRegionFlag(region: string | undefined): string {
  if (!region) return '🌍'; // Default global emoji for undefined regions
  
  const regionCode = region.toLowerCase();
  
  switch (regionCode) {
    case 'ams': return '🇳🇱'; // Netherlands
    case 'arn': return '🇸🇪'; // Sweden
    case 'atl':
    case 'bos':
    case 'den':
    case 'dfw':
    case 'ewr':
    case 'iad':
    case 'lax':
    case 'mia':
    case 'ord':
    case 'phx':
    case 'sea':
    case 'sjc': return '🇺🇸'; // USA
    case 'bog': return '🇨🇴'; // Colombia
    case 'bom': return '🇮🇳'; // India
    case 'cdg': return '🇫🇷'; // France
    case 'eze': return '🇦🇷'; // Argentina
    case 'fra': return '🇩🇪'; // Germany
    case 'gdl':
    case 'qro': return '🇲🇽'; // Mexico
    case 'gig':
    case 'gru': return '🇧🇷'; // Brazil
    case 'hkg': return '🇭🇰'; // Hong Kong
    case 'jnb': return '🇿🇦'; // South Africa
    case 'lhr': return '🇬🇧'; // UK
    case 'mad': return '🇪🇸'; // Spain
    case 'nrt': return '🇯🇵'; // Japan
    case 'otp': return '🇷🇴'; // Romania
    case 'scl': return '🇨🇱'; // Chile
    case 'sin': return '🇸🇬'; // Singapore
    case 'syd': return '🇦🇺'; // Australia
    case 'waw': return '🇵🇱'; // Poland
    case 'yul':
    case 'yyz': return '🇨🇦'; // Canada
    default: return '🌍'; // Default global emoji for unknown regions
  }
}

export function formatMemory(memoryMb: number): string {
  if (memoryMb >= 1024) {
    return `${(memoryMb / 1024).toFixed(1)} GB`;
  }
  return `${memoryMb} MB`;
}

export function capitalizeMachineState(state: string): string {
  return state.charAt(0).toUpperCase() + state.slice(1);
}
