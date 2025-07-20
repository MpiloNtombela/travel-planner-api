import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { resolvers } from '../schema/resolvers.js';
import axios from 'axios';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;
const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

describe('GraphQL Resolvers Integration Tests', () => {
  let server: ApolloServer;

  beforeAll(async () => {
    const typeDefs = readFileSync('./schema.graphql', { encoding: 'utf-8' });

    server = new ApolloServer({
      typeDefs,
      resolvers,
    });
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCities Query', () => {
    const SEARCH_CITIES_QUERY = `
      query SearchCities($input: String!) {
        searchCities(input: $input) {
          id
          name
          country
          latitude
          longitude
        }
      }
    `;

    it('should return cities when valid search input is provided', async () => {
      const mockGeocodingResponse = {
        data: {
          results: [
            {
              id: 1,
              name: 'London',
              latitude: 51.5074,
              longitude: -0.1278,
              country: 'United Kingdom',
              feature_code: 'PPLC',
              elevation: 35,
              timezone: 'Europe/London',
              population: 8982000,
              country_code: 'GB',
              country_id: 1,
            },
            {
              id: 2,
              name: 'London',
              latitude: 42.9834,
              longitude: -81.2330,
              country: 'Canada',
              feature_code: 'PPLA',
              elevation: 251,
              timezone: 'America/Toronto',
              population: 383000,
              country_code: 'CA',
              country_id: 2,
            },
          ],
          generationtime_ms: 1.2,
        },
      };

      mockAxios.get.mockResolvedValueOnce(mockGeocodingResponse);

      const response = await server.executeOperation({
        query: SEARCH_CITIES_QUERY,
        variables: { input: 'London' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeUndefined();
      expect(result.data?.searchCities).toHaveLength(2);

      const cities = result.data?.searchCities;
      expect(cities?.[0]).toEqual({
        id: '51.5074,-0.1278:London:United Kingdom',
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
      });
      expect(cities?.[1]).toEqual({
        id: '42.9834,-81.233:London:Canada',
        name: 'London',
        country: 'Canada',
        latitude: 42.9834,
        longitude: -81.233,
      });
    });

    it('should return empty array when no cities found', async () => {
      const mockEmptyResponse = {
        data: {
          results: undefined,
          generationtime_ms: 0.5,
        },
      };

      mockAxios.get.mockResolvedValueOnce(mockEmptyResponse);

      const response = await server.executeOperation({
        query: SEARCH_CITIES_QUERY,
        variables: { input: 'NonExistentCity' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeUndefined();
      expect(result.data?.searchCities).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout',
        isAxiosError: true,
      };

      mockAxios.get.mockRejectedValueOnce(timeoutError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      const response = await server.executeOperation({
        query: SEARCH_CITIES_QUERY,
        variables: { input: 'Paris' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain('Request timeout');
      expect(result.errors?.[0].extensions?.code).toBe('TIMEOUT');
    });

    it('should validate minimum input length', async () => {
      const response = await server.executeOperation({
        query: SEARCH_CITIES_QUERY,
        variables: { input: 'a' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain('at least 2 characters');
    });
  });

  describe('getCityWeather Query', () => {
    const GET_CITY_WEATHER_QUERY = `
      query GetCityWeather($cityId: String!) {
        getCityWeather(cityId: $cityId) {
          city {
            id
            name
            country
            latitude
            longitude
          }
          weather {
            temperature
            conditions
            humidity
            windSpeed
            precipitation
            forecast {
              date
              maxTemp
              minTemp
              conditions
              precipitation
              windSpeed
              activities {
                name
                suitabilityScore
                reasoning
              }
            }
          }
        }
      }
    `;

    it('should return complete weather data with activity rankings', async () => {
      const mockWeatherResponse = {
        data: {
          latitude: 51.5074,
          longitude: -0.1278,
          timezone: 'Europe/London',
          current: {
            time: new Date().toISOString(),
            temperature_2m: 20.5,
            relative_humidity_2m: 65,
            precipitation: 0,
            weather_code: 1,
            wind_speed_10m: 12,
          },
          daily: {
            time: [today, tomorrow],
            weather_code: [1, 3],
            temperature_2m_max: [22, 24],
            temperature_2m_min: [18, 20],
            precipitation_sum: [0, 2],
            wind_speed_10m_max: [15, 18],
          },
        },
      };

      mockAxios.get.mockResolvedValueOnce(mockWeatherResponse);

      const response = await server.executeOperation({
        query: GET_CITY_WEATHER_QUERY,
        variables: { cityId: '51.5074,-0.1278:London:United Kingdom' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeUndefined();

      const weatherData = result.data?.getCityWeather;
      expect(weatherData?.city).toEqual({
        id: '51.5074,-0.1278:London:United Kingdom',
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
      });

      expect(weatherData?.weather.temperature).toBe(20.5);
      expect(weatherData?.weather.conditions).toBe('Mainly clear');
      expect(weatherData?.weather.humidity).toBe(65);
      expect(weatherData?.weather.windSpeed).toBe(12);
      expect(weatherData?.weather.precipitation).toBe(0);

      expect(weatherData?.weather.forecast).toHaveLength(2);

      const firstDay = weatherData?.weather.forecast[0];
      expect(firstDay?.date).toBe(today);
      expect(firstDay?.maxTemp).toBe(22);
      expect(firstDay?.minTemp).toBe(18);
      expect(firstDay?.conditions).toBe('Mainly clear');
      expect(firstDay?.precipitation).toBe(0);
      expect(firstDay?.windSpeed).toBe(15);

      expect(firstDay?.activities).toHaveLength(1);
      expect(firstDay?.activities[0].name).toBeDefined();
      expect(firstDay?.activities[0].suitabilityScore).toBeGreaterThan(0);
      expect(firstDay?.activities[0].suitabilityScore).toBeLessThanOrEqual(100);
      expect(firstDay?.activities[0].reasoning).toBeTruthy();
    });

    it('should handle invalid city ID format', async () => {
      const response = await server.executeOperation({
        query: GET_CITY_WEATHER_QUERY,
        variables: { cityId: 'invalid-format' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain('Invalid city ID format');
    });

    it('should handle invalid coordinates', async () => {
      const response = await server.executeOperation({
        query: GET_CITY_WEATHER_QUERY,
        variables: { cityId: '999,999:InvalidCity:InvalidCountry' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain('Invalid coordinates');
    });

    it('should handle weather API errors', async () => {
      const apiError = {
        response: {
          status: 429,
          statusText: 'Too Many Requests',
        },
        isAxiosError: true,
      };

      mockAxios.get.mockRejectedValueOnce(apiError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      const response = await server.executeOperation({
        query: GET_CITY_WEATHER_QUERY,
        variables: { cityId: '51.5074,-0.1278:London:United Kingdom' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain('Rate limit exceeded');
      expect(result.errors?.[0].extensions?.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should handle weather API timeouts', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout',
        isAxiosError: true,
      };

      mockAxios.get.mockRejectedValueOnce(timeoutError);
      mockAxios.isAxiosError.mockReturnValueOnce(true);

      const response = await server.executeOperation({
        query: GET_CITY_WEATHER_QUERY,
        variables: { cityId: '51.5074,-0.1278:London:United Kingdom' },
      });

      const result = (response as any).body.singleResult;
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain('Request timeout');
      expect(result.errors?.[0].extensions?.code).toBe('TIMEOUT');
    });
  });

  describe('Complex Queries', () => {
    it('should handle multiple queries in sequence', async () => {
      const mockSearchResponse = {
        data: {
          results: [
            {
              id: 1,
              name: 'Paris',
              latitude: 48.8566,
              longitude: 2.3522,
              country: 'France',
              feature_code: 'PPLC',
              elevation: 35,
              timezone: 'Europe/Paris',
              population: 2161000,
              country_code: 'FR',
              country_id: 1,
            },
          ],
          generationtime_ms: 1.0,
        },
      };

      const mockWeatherResponse = {
        data: {
          latitude: 48.8566,
          longitude: 2.3522,
          timezone: 'Europe/Paris',
          current: {
            time: new Date().toISOString(),
            temperature_2m: 18.5,
            relative_humidity_2m: 70,
            precipitation: 0,
            weather_code: 1,
            wind_speed_10m: 8,
          },
          daily: {
            time: [today],
            weather_code: [1],
            temperature_2m_max: [20],
            temperature_2m_min: [16],
            precipitation_sum: [0],
            wind_speed_10m_max: [10],
          },
        },
      };

      mockAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockWeatherResponse);

      const searchResponse = await server.executeOperation({
        query: `
          query SearchCities($input: String!) {
            searchCities(input: $input) {
              id
              name
              country
            }
          }
        `,
        variables: { input: 'Paris' },
      });

      const searchResult = (searchResponse as any).body.singleResult;
      expect(searchResult.errors).toBeUndefined();
      const cityId = searchResult.data?.searchCities[0].id;

      const weatherResponse = await server.executeOperation({
        query: `
          query GetCityWeather($cityId: String!) {
            getCityWeather(cityId: $cityId) {
              city {
                name
                country
              }
              weather {
                temperature
                conditions
                forecast {
                  date
                  activities {
                    name
                    suitabilityScore
                  }
                }
              }
            }
          }
        `,
        variables: { cityId },
      });

      const weatherResult = (weatherResponse as any).body.singleResult;
      expect(weatherResult.errors).toBeUndefined();
      expect(weatherResult.data?.getCityWeather.city.name).toBe('Paris');
      expect(weatherResult.data?.getCityWeather.weather.temperature).toBe(18.5);
    });
  });
});
