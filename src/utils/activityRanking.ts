import type { Activity, DailyForecast } from '../__generated__/resolvers-types.js';

/**
 * Activity configuration type
 * @param name - The name of the activity
 * @param idealTempMin - The minimum ideal temperature for the activity
 * @param idealTempMax - The maximum ideal temperature for the activity
 * @param rainTolerance - The tolerance for rain (0 = hates rain, 1 = loves rain)
 * @param windPreference - The preference for wind (0 = hates wind, 1 = loves wind)
 */
type ActivityConfig = {
  name: string;
  idealTempMin: number;
  idealTempMax: number;
  rainTolerance: number;
  windPreference: number;
};

const ACTIVITY_CONFIGS: ActivityConfig[] = [
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

export class ActivityRankingService {
  private static instance: ActivityRankingService;

  public static getInstance(): ActivityRankingService {
    if (!ActivityRankingService.instance) {
      ActivityRankingService.instance = new ActivityRankingService();
    }
    return ActivityRankingService.instance;
  }

  /**
   * Rank all activities for a day using the same scoring logic
   * @param forecast - The daily forecast
   * @param top - The number of activities to return (default is 1)
   * @returns The ranked activities
   */
  public rankActivitiesForDay(forecast: Omit<DailyForecast, 'activities'>, top: number = 1): Activity[] {
    const avgTemp = (forecast.maxTemp + forecast.minTemp) / 2;
    const hasRain = forecast.precipitation > 1;
    const isWindy = forecast.windSpeed > 20;

    const activities: Activity[] = ACTIVITY_CONFIGS.map((config) => this.scoreActivity(config, avgTemp, hasRain, isWindy, forecast.precipitation, forecast.windSpeed));

    return activities.sort((a, b) => b.suitabilityScore - a.suitabilityScore).slice(0, top);
  }

  /**
   * Generic scoring function that works for any activity
   * @param config - The activity configuration
   * @param avgTemp - The average temperature
   * @param hasRain - Whether it is raining
   * @param isWindy - Whether it is windy
   * @param precipitation - The precipitation
   * @param windSpeed - The wind speed
   * @returns The activity score
   */
  private scoreActivity(config: ActivityConfig, avgTemp: number, hasRain: boolean, isWindy: boolean, precipitation: number, windSpeed: number): Activity {
    let score = 50;
    const reasons: string[] = [];

    if (avgTemp >= config.idealTempMin && avgTemp <= config.idealTempMax) {
      score += 30;
      reasons.push('ideal temperature');
    } else if (avgTemp < config.idealTempMin) {
      const penalty = Math.min(30, (config.idealTempMin - avgTemp) * 5);
      score -= penalty;
      reasons.push('too cold');
    } else {
      const penalty = Math.min(30, (avgTemp - config.idealTempMax) * 5);
      score -= penalty;
      reasons.push('too warm');
    }

    if (hasRain) {
      const rainImpact = (1 - config.rainTolerance) * 20;
      score -= rainImpact;
      if (config.rainTolerance > 0.8) {
        score += 10;
        reasons.push('rain makes it more appealing');
      } else if (config.rainTolerance < 0.3) {
        reasons.push('rain not ideal');
      }
    } else {
      if (config.rainTolerance < 0.3) {
        score += 10;
        reasons.push('no rain');
      }
    }

    if (isWindy) {
      const windImpact = config.windPreference * 15 - 7.5;
      score += windImpact;
      if (config.windPreference > 0.6) {
        reasons.push('good wind conditions');
      } else if (config.windPreference < 0.4) {
        reasons.push('windy conditions');
      }
    }

    if (config.name.includes('indoor')) {
      if (avgTemp < 10 || avgTemp > 30) {
        score += 15;
        reasons.push('extreme weather favors indoor activities');
      }
    }

    return {
      name: config.name,
      suitabilityScore: Math.max(0, Math.min(100, Math.round(score))),
      reasoning: reasons.join(', ') || 'standard conditions',
    };
  }
}

export const activityRankingService = ActivityRankingService.getInstance();
