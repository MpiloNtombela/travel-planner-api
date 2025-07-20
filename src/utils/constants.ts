/**
 * Weather code mappings for human-readable conditions
 */
export const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
} as const;

/**
 * Activity configuration type
 * @param name - The name of the activity
 * @param idealTempMin - The minimum ideal temperature for the activity
 * @param idealTempMax - The maximum ideal temperature for the activity
 * @param rainTolerance - The tolerance for rain (0 = hates rain, 1 = loves rain)
 * @param windPreference - The preference for wind (0 = hates wind, 1 = loves wind)
 */
export type ActivityConfig = {
  name: string;
  idealTempMin: number;
  idealTempMax: number;
  rainTolerance: number;
  windPreference: number;
};

export const ACTIVITY_CONFIGS: ActivityConfig[] = [
  {
    name: 'skiing',
    idealTempMin: -10,
    idealTempMax: 2,
    rainTolerance: 0.1,
    windPreference: 0.2,
  },
  {
    name: 'surfing',
    idealTempMin: 18,
    idealTempMax: 28,
    rainTolerance: 0.7,
    windPreference: 0.8,
  },
  {
    name: 'indoor_sightseeing',
    idealTempMin: 10,
    idealTempMax: 30,
    rainTolerance: 1.0,
    windPreference: 0.5,
  },
  {
    name: 'outdoor_sightseeing',
    idealTempMin: 15,
    idealTempMax: 25,
    rainTolerance: 0.1,
    windPreference: 0.3,
  },
];

/**
 * Error codes for the application
 */
export const ERROR_CODES: Record<string, Record<string, string>> = {
  API_ERROR: {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    TIMEOUT: 'TIMEOUT',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },
  INTERNAL_ERROR: {
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  },
  USER_ERROR: {
    INVALID_COORDINATES: 'INVALID_COORDINATES',
    BAD_USER_INPUT: 'BAD_USER_INPUT',
  },
} as const;

export const ERROR_CODES_MAP = new Map(Object.entries(ERROR_CODES));
