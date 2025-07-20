import axios from 'axios';
import { OpenMeteoAPI, OpenMeteoAPIError } from '../services/openMeteoAPI';

jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;
const today = new Date().toISOString().split('T')[0];

describe('OpenMeteoAPI', () => {
  let openMeteoAPI: OpenMeteoAPI;

  beforeEach(() => {
    openMeteoAPI = new OpenMeteoAPI();
    jest.clearAllMocks();
  });

  describe('searchCities', () => {
    it('should return cities with rich ID format', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              name: 'London',
              latitude: 51.5074,
              longitude: -0.1278,
              country: 'United Kingdom',
              feature_code: 'PPLC',
            },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const cities = await openMeteoAPI.searchCities('London');

      expect(cities[0]).toEqual({
        id: '51.5074,-0.1278:London:United Kingdom',
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
      });
    });

    it('should validate input length', async () => {
      await expect(openMeteoAPI.searchCities('a')).rejects.toThrow(OpenMeteoAPIError);
    });
  });

  describe('getWeatherByCityId - Core Integration', () => {
    it('should parse rich city ID and return weather with activities', async () => {
      const mockWeatherResponse = {
        data: {
          current: {
            temperature_2m: 20,
            relative_humidity_2m: 65,
            precipitation: 0,
            weather_code: 1,
            wind_speed_10m: 10,
          },
          daily: {
            time: [today],
            weather_code: [1],
            temperature_2m_max: [22],
            temperature_2m_min: [18],
            precipitation_sum: [0],
            wind_speed_10m_max: [12],
          },
        },
      };

      mockAxios.get.mockResolvedValue(mockWeatherResponse);

      const result = await openMeteoAPI.getWeatherByCityId(
        '51.5074,-0.1278:London:United Kingdom'
      );

      expect(result.cityInfo).toEqual({
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
      });

      expect(result.weather.temperature).toBe(20);
      expect(result.weather.forecast).toHaveLength(1);

      expect(result.weather.forecast[0].activities).toBeDefined();
      expect(result.weather.forecast[0].activities.length).toBeGreaterThan(0);
    });

    it('should handle invalid city ID format', async () => {
      await expect(
        openMeteoAPI.getWeatherByCityId('invalid-format')
      ).rejects.toThrow('Invalid city ID format');
    });
  });

  describe('Weather code mapping', () => {
    it('should map weather codes to readable conditions', async () => {
      const mockResponse = {
        data: {
          current: {
            temperature_2m: 20,
            relative_humidity_2m: 65,
            precipitation: 0,
            weather_code: 0,
            wind_speed_10m: 10,
          },
          daily: {
            time: [today],
            weather_code: [61],
            temperature_2m_max: [22],
            temperature_2m_min: [18],
            precipitation_sum: [3],
            wind_speed_10m_max: [12],
          },
        },
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const weather = await openMeteoAPI.getWeatherData(51.5074, -0.1278);

      expect(weather.conditions).toBe('Clear sky');
      expect(weather.forecast[0].conditions).toBe('Slight rain');
    });
  });

  describe('Error handling and edge cases', () => {
    describe('searchCities', () => {
      it('should return an empty array when API returns no results', async () => {
        mockAxios.get.mockResolvedValueOnce({ data: { results: undefined } });

        const cities = await openMeteoAPI.searchCities('Nowhere');

        expect(Array.isArray(cities)).toBe(true);
        expect(cities).toHaveLength(0);
      });

      it('should convert axios timeout error into OpenMeteoAPIError with TIMEOUT code', async () => {
        const timeoutError = { code: 'ECONNABORTED', message: 'timeout' } as any;

        mockAxios.get.mockRejectedValueOnce(timeoutError);
        mockAxios.isAxiosError.mockReturnValueOnce(true);

        await expect(openMeteoAPI.searchCities('Paris')).rejects.toMatchObject({
          code: 'TIMEOUT',
          name: 'OpenMeteoAPIError',
        });
      });
    });

    describe('getWeatherData', () => {
      it('should throw INVALID_COORDINATES error for invalid latitude/longitude', async () => {
        await expect(openMeteoAPI.getWeatherData(120, undefined as any)).rejects.toMatchObject({
          code: 'INVALID_COORDINATES',
        });
      });

      it('should convert axios timeout into OpenMeteoAPIError with TIMEOUT code', async () => {
        const timeoutError = { code: 'ECONNABORTED', message: 'timeout' } as any;

        mockAxios.get.mockRejectedValueOnce(timeoutError);
        mockAxios.isAxiosError.mockReturnValueOnce(true);

        await expect(openMeteoAPI.getWeatherData(48.8566, 2.3522)).rejects.toMatchObject({
          code: 'TIMEOUT',
        });
      });
    });

    describe('getWeatherByCityId', () => {
      it('should handle city IDs with invalid coordinate ranges', async () => {
        await expect(
          openMeteoAPI.getWeatherByCityId('999,999:Atlantis:Ocean')
        ).rejects.toMatchObject({ code: 'INVALID_COORDINATES' });
      });
    });
  });
});
