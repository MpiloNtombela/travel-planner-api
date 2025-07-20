import type { Activity, DailyForecast } from '../__generated__/resolvers-types.js';
import { ACTIVITY_CONFIGS, type ActivityConfig } from './constants.js';

/**
 * ActivityRankingService class for ranking activities based on weather conditions
 */
export class ActivityRankingService {
  private static instance: ActivityRankingService;
  private readonly BASE_SCORE = 50;
  private readonly IDEAL_TEMP_BONUS = 30;
  private readonly COLD_PENALTY_MULTIPLIER = 5;
  private readonly WARM_PENALTY_MULTIPLIER = 5;
  private readonly MAX_TEMP_PENALTY = 30;
  private readonly RAIN_IMPACT_MULTIPLIER = 20;
  private readonly HIGH_TOLERANCE_BONUS = 10;
  private readonly LOW_TOLERANCE_BONUS = 10;
  private readonly HIGH_TOLERANCE_THRESHOLD = 0.8;
  private readonly LOW_TOLERANCE_THRESHOLD = 0.3;
  private readonly WIND_IMPACT_MULTIPLIER = 15;
  private readonly WIND_OFFSET = 7.5;
  private readonly HIGH_PREFERENCE_THRESHOLD = 0.6;
  private readonly LOW_PREFERENCE_THRESHOLD = 0.4;
  private readonly EXTREME_WEATHER_BONUS = 15;
  private readonly COLD_THRESHOLD = 10;
  private readonly HOT_THRESHOLD = 30;
  private readonly RAIN_THRESHOLD = 1;
  private readonly WIND_THRESHOLD = 20;
  private readonly MIN_SCORE = 0;
  private readonly MAX_SCORE = 100;

  /**
   * Get the singleton instance of the ActivityRankingService class
   * @returns The singleton instance of the ActivityRankingService class
   */
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
  rankActivitiesForDay(forecast: Omit<DailyForecast, 'activities'>, top: number = 1): Activity[] {
    const avgTemp = (forecast.maxTemp + forecast.minTemp) / 2;
    const hasRain = forecast.precipitation > this.RAIN_THRESHOLD;
    const isWindy = forecast.windSpeed > this.WIND_THRESHOLD;

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
    let score = this.BASE_SCORE;
    const reasons: string[] = [];

    if (avgTemp >= config.idealTempMin && avgTemp <= config.idealTempMax) {
      score += this.IDEAL_TEMP_BONUS;
      reasons.push('ideal temperature');
    } else if (avgTemp < config.idealTempMin) {
      const penalty = Math.min(this.MAX_TEMP_PENALTY, (config.idealTempMin - avgTemp) * this.COLD_PENALTY_MULTIPLIER);
      score -= penalty;
      reasons.push('too cold');
    } else {
      const penalty = Math.min(this.MAX_TEMP_PENALTY, (avgTemp - config.idealTempMax) * this.WARM_PENALTY_MULTIPLIER);
      score -= penalty;
      reasons.push('too warm');
    }

    if (hasRain) {
      const rainImpact = (1 - config.rainTolerance) * this.RAIN_IMPACT_MULTIPLIER;
      score -= rainImpact;
      if (config.rainTolerance > this.HIGH_TOLERANCE_THRESHOLD) {
        score += this.HIGH_TOLERANCE_BONUS;
        reasons.push('rain makes it more appealing');
      } else if (config.rainTolerance < this.LOW_TOLERANCE_THRESHOLD) {
        reasons.push('rain not ideal');
      }
    } else {
      if (config.rainTolerance < this.LOW_TOLERANCE_THRESHOLD) {
        score += this.LOW_TOLERANCE_BONUS;
        reasons.push('no rain');
      }
    }

    if (isWindy) {
      const windImpact = config.windPreference * this.WIND_IMPACT_MULTIPLIER - this.WIND_OFFSET;
      score += windImpact;
      if (config.windPreference > this.HIGH_PREFERENCE_THRESHOLD) {
        reasons.push('good wind conditions');
      } else if (config.windPreference < this.LOW_PREFERENCE_THRESHOLD) {
        reasons.push('windy conditions');
      }
    }

    if (config.name.includes('indoor')) {
      if (avgTemp < this.COLD_THRESHOLD || avgTemp > this.HOT_THRESHOLD) {
        score += this.EXTREME_WEATHER_BONUS;
        reasons.push('extreme weather favors indoor activities');
      }
    }

    return {
      name: config.name,
      suitabilityScore: Math.max(this.MIN_SCORE, Math.min(this.MAX_SCORE, Math.round(score))),
      reasoning: reasons.join(', ') || 'standard conditions',
    };
  }
}

export const activityRankingService = ActivityRankingService.getInstance();
