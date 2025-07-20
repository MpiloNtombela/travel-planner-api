
import { Resolvers } from '../__generated__/resolvers-types.js';
import { openMeteoAPI, OpenMeteoAPIError } from '../services/openMeteoAPI.js';
import { GraphQLError } from 'graphql';
import { ERROR_CODES } from '../utils/constants.js';

export const resolvers: Resolvers = {
  Query: {
    searchCities: async (_parent, { input }) => {
      try {
        console.log('Searching for cities with input:', input);

        const cities = await openMeteoAPI.searchCities(input);

        console.log(`Found ${cities.length} cities for query: "${input}"`);
        return cities;
      } catch (error) {
        console.error('Error searching cities:', error);

        if (error instanceof OpenMeteoAPIError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.code,
              service: 'OpenMeteo Geocoding API',
            },
          });
        }

        throw new GraphQLError('Failed to search cities', {
          extensions: {
            code: ERROR_CODES.INTERNAL_ERROR.INTERNAL_SERVER_ERROR,
          },
        });
      }
    },

    getCityWeather: async (_parent, { cityId }) => {
      try {
        console.log('Getting weather for city ID:', cityId);

        const { weather, cityInfo } = await openMeteoAPI.getWeatherByCityId(cityId);

        const city = {
          id: cityId,
          ...cityInfo,
        };

        console.log(`Successfully fetched weather for ${city.name}, ${city.country}`);

        return {
          city,
          weather,
        };
      } catch (error) {
        console.error('Error getting city weather:', error);

        if (error instanceof GraphQLError) {
          throw error;
        }

        if (error instanceof OpenMeteoAPIError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.code,
              service: 'OpenMeteo Weather API',
            },
          });
        }

        throw new GraphQLError('Failed to get weather data', {
          extensions: {
            code: ERROR_CODES.INTERNAL_ERROR.INTERNAL_SERVER_ERROR,
          },
        });
      }
    },
  },
};
