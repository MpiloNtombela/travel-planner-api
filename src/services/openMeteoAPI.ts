import axios from 'axios';
import type { City, Weather, DailyForecast } from '../__generated__/resolvers-types.js';
import { ERROR_CODES, WEATHER_CODES } from '../utils/constants.js';
import { activityRankingService } from '../utils/activityRanking.js';

/**
 * Geocoding result type from the OpenMeteo API
 */
type GeocodingResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  feature_code: string;
  country_code: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  timezone: string;
  population?: number;
  country_id: number;
  country: string;
  admin1_id?: number;
  admin2_id?: number;
  admin3_id?: number;
  admin4_id?: number;
};

/**
 * Geocoding response type from the OpenMeteo API
 */
type GeocodingResponse = {
  results?: GeocodingResult[];
  generationtime_ms: number;
};

/**
 * Current weather type from the OpenMeteo API
 */
type CurrentWeather = {
  time: string;
  interval: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
};

/**
 * Daily weather type from the OpenMeteo API
 */
type DailyWeather = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  sunrise: string[];
  sunset: string[];
  daylight_duration: number[];
  sunshine_duration: number[];
  uv_index_max: number[];
  uv_index_clear_sky_max: number[];
  precipitation_sum: number[];
  rain_sum: number[];
  showers_sum: number[];
  snowfall_sum: number[];
  precipitation_hours: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
  wind_direction_10m_dominant: number[];
  shortwave_radiation_sum: number[];
};

/**
 * Weather response type from the OpenMeteo API
 */
type WeatherResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: Record<string, string>;
  current: CurrentWeather;
  daily_units: Record<string, string>;
  daily: DailyWeather;
};

/**
 * Custom error class for OpenMeteo API errors, this helps differentiate between errors from the API and errors from the application
 * @param message - The error message
 * @param cause - The cause of the error
 */
export class OpenMeteoAPIError extends Error {
  constructor(message: string, public code?: string, public cause?: Error) {
    super(message);
    this.name = 'OpenMeteoAPIError';
    this.code = code;
  }
}

/**
 * OpenMeteoAPI class for interacting with the OpenMeteo API
 */
export class OpenMeteoAPI {
  private static instance: OpenMeteoAPI;
  private readonly GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1';
  private readonly WEATHER_BASE_URL = 'https://api.open-meteo.com/v1';
  private readonly REQUEST_TIMEOUT_MS = 10000;
  private readonly MAX_RESULTS = 10;

  /**
   * Get the singleton instance of the OpenMeteoAPI class
   * @returns The singleton instance of the OpenMeteoAPI class
   */
  public static getInstance(): OpenMeteoAPI {
    if (!OpenMeteoAPI.instance) {
      OpenMeteoAPI.instance = new OpenMeteoAPI();
    }
    return OpenMeteoAPI.instance;
  }

  /**
   * Search for cities based on partial input
   * @param query - The query to search for
   * @returns The cities that match the query (e.g. "Cape Town")
   */
  async searchCities(query: string): Promise<City[]> {
    if (!query || query.trim().length < 2) {
      throw new OpenMeteoAPIError('Query must be at least 2 characters long', ERROR_CODES.USER_ERROR.BAD_USER_INPUT);
    }

    try {
      const response = await axios.get<GeocodingResponse>(`${this.GEOCODING_BASE_URL}/search`, {
        params: {
          name: query.trim(),
          count: this.MAX_RESULTS,
          language: 'en',
          format: 'json',
        },
        timeout: this.REQUEST_TIMEOUT_MS,
      });

      if (!response.data.results) {
        return [];
      }

      const filteredResults = response.data.results.filter(
        (result) =>
          result.feature_code === 'PPLA' ||
          result.feature_code === 'PPLA2' ||
          result.feature_code === 'PPLA3' ||
          result.feature_code === 'PPLA4' ||
          result.feature_code === 'PPLC' ||
          result.feature_code === 'PPL' ||
          result.feature_code === 'PPLF' ||
          result.feature_code === 'PPLG' ||
          result.feature_code === 'PPLL' ||
          result.feature_code === 'PPLR' ||
          result.feature_code === 'PPLS' ||
          result.feature_code === 'PPLW'
      );

      return filteredResults.map(
        (result): City => ({
          id: `${result.latitude},${result.longitude}:${result.name}:${result.country}`,
          name: result.name,
          country: result.country,
          latitude: result.latitude,
          longitude: result.longitude,
        })
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new OpenMeteoAPIError('Request timeout while searching cities', ERROR_CODES.API_ERROR.TIMEOUT);
        }
        if (error.response?.status === 429) {
          throw new OpenMeteoAPIError('Rate limit exceeded. Please try again later.', ERROR_CODES.API_ERROR.RATE_LIMIT_EXCEEDED);
        }
        throw new OpenMeteoAPIError(`Failed to search cities: ${error.response?.statusText || error.message}`, ERROR_CODES.API_ERROR.UNKNOWN_ERROR, error);
      }
      throw new OpenMeteoAPIError('Unknown error occurred while searching cities', ERROR_CODES.API_ERROR.UNKNOWN_ERROR, error as Error);
    }
  }

  /**
   * Get weather data for a specific location
   * @param latitude - The latitude of the location
   * @param longitude - The longitude of the location
   * @returns The weather data for the location
   */
  async getWeatherData(latitude: number, longitude: number): Promise<Weather> {
    if (!this.isValidCoordinate(latitude, longitude)) {
      throw new OpenMeteoAPIError('Invalid coordinates provided', ERROR_CODES.USER_ERROR.INVALID_COORDINATES);
    }

    try {
      const response = await axios.get<WeatherResponse>(`${this.WEATHER_BASE_URL}/forecast`, {
        params: {
          latitude,
          longitude,
          current: ['temperature_2m', 'relative_humidity_2m', 'precipitation', 'weather_code', 'wind_speed_10m'].join(','),
          daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'wind_speed_10m_max'].join(','),
          timezone: 'auto',
          forecast_days: 7,
        },
        timeout: this.REQUEST_TIMEOUT_MS,
      });

      const { current, daily } = response.data;

      const forecast: DailyForecast[] = daily.time.map((date, index): DailyForecast => {
        const forecastDay = {
          date,
          maxTemp: daily.temperature_2m_max[index],
          minTemp: daily.temperature_2m_min[index],
          conditions: this.getWeatherCondition(daily.weather_code[index]),
          precipitation: daily.precipitation_sum[index],
          windSpeed: daily.wind_speed_10m_max[index],
        };

        const activities = activityRankingService.rankActivitiesForDay(forecastDay, 1);

        return {
          ...forecastDay,
          activities,
        };
      });

      return {
        temperature: current.temperature_2m,
        conditions: this.getWeatherCondition(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        forecast,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new OpenMeteoAPIError('Request timeout while fetching weather data', ERROR_CODES.API_ERROR.TIMEOUT);
        }
        if (error.response?.status === 429) {
          throw new OpenMeteoAPIError('Rate limit exceeded. Please try again later.', ERROR_CODES.API_ERROR.RATE_LIMIT_EXCEEDED);
        }
        throw new OpenMeteoAPIError(`Failed to fetch weather data: ${error.response?.statusText || error.message}`, ERROR_CODES.API_ERROR.UNKNOWN_ERROR, error);
      }
      throw new OpenMeteoAPIError('Unknown error occurred while fetching weather data', ERROR_CODES.API_ERROR.UNKNOWN_ERROR, error as Error);
    }
  }

  /**
   * Get weather data by city ID (coordinates)
   * @param cityId - The ID of the city e.g. "-33.92584,18.42322:Cape Town:South Africa"
   * @returns The weather data for the city
   */
  async getWeatherByCityId(cityId: string): Promise<{ weather: Weather; cityInfo: Omit<City, 'id'> }> {
    const { latitude, longitude, name, country } = this.parseCityId(cityId);
    const weather = await this.getWeatherData(latitude, longitude);
    return { weather, cityInfo: { name, country, latitude, longitude } };
  }

  /**
   * Parse city ID back to coordinates (latitude and longitude)
   * @param cityId - The ID of the city e.g. "-33.92584,18.42322:Cape Town:South Africa"
   * @returns The coordinates of the city {latitude: number, longitude: number}
   */
  private parseCityId(cityId: string): { latitude: number; longitude: number; name: string; country: string } {
    const parts = cityId.split(':');
    if (parts.length !== 3) {
      throw new OpenMeteoAPIError('Invalid city ID format. Expected format: "lat,lon:name:country"', ERROR_CODES.USER_ERROR.INVALID_COORDINATES);
    }

    const [coords, name, country] = parts;
    const [latStr, lonStr] = coords.split(',');

    if (!latStr || !lonStr) {
      throw new OpenMeteoAPIError('Invalid coordinates in city ID. Expected format: "lat,lon"', ERROR_CODES.USER_ERROR.INVALID_COORDINATES);
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);

    if (!this.isValidCoordinate(latitude, longitude)) {
      throw new OpenMeteoAPIError('Invalid coordinates in city ID. Expected valid coordinates in the format: "lat,lon"', ERROR_CODES.USER_ERROR.INVALID_COORDINATES);
    }

    return { latitude, longitude, name, country };
  }

  /**
   * Validate coordinates (latitude and longitude) to prevent hitting the API with invalid coordinates
   * @param latitude - The latitude of the location
   * @param longitude - The longitude of the location
   * @returns True if the coordinates are valid, false otherwise
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return !isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Convert weather code to human-readable condition
   * @param code - The weather code (e.g. 0 for clear sky, 1 for mainly clear, 2 for partly cloudy, etc.)
   * @returns The human-readable condition
   */
  private getWeatherCondition(code: number): string {
    return WEATHER_CODES[code] || `Unknown condition (${code})`;
  }
}

/**
 * Create and export a singleton instance
 */
export const openMeteoAPI = OpenMeteoAPI.getInstance();
