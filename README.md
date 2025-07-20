# Travel Planner GraphQL API

A scalable GraphQL API that helps travelers plan activities based on real-time weather conditions. Get dynamic city suggestions, weather forecasts, and intelligent activity recommendations.

## Features

- 🌍 **City Search**: Dynamic suggestions with global coverage
- 🌦️ **Weather Forecasts**: 7-day detailed weather data
- 🎯 **Smart Activity Ranking**: AI-powered recommendations based on weather conditions
- 📊 **Rich Data**: Activities ranked per day with detailed reasoning
- ⚡ **Real-time**: Live weather data from OpenMeteo API
- 🔒 **Type Safe**: Full TypeScript integration with generated types

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit GraphQL Playground
open http://localhost:4000
```

## Example Queries

### Search Cities
```graphql
query SearchCities {
  searchCities(input: "London") {
    id
    name
    country
    latitude
    longitude
  }
}
```

### Get Weather with Activity Rankings
```graphql
query GetWeatherAndActivities {
  getCityWeather(cityId: "51.5074,-0.1278:London:United Kingdom") {
    city {
      name
      country
    }
    weather {
      temperature
      conditions
      humidity
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
```

## Architecture Overview

### Core Components

```
src/
├── schema/
│   └── resolvers.ts
├── services/
│   └── openMeteoAPI.ts
├── utils/
│   └── activityRanking.ts    # Activity scoring algorithm
├── __generated__/
│   └── resolvers-types.ts
├── __tests__/
│   └── activityRanking.tests.ts
│   └── openMeteoAPI.tests.ts
│   └── resolvers.integration.tests.ts
└── schema.graphql
```

### GraphQL Schema Design
- **Schema-first approach** with generated TypeScript types
- **Rich city IDs** encoding coordinates, name, and country for efficient lookups
- **Daily activity rankings** integrated into weather forecasts

### Activity Ranking Algorithm

The system ranks 4 activity types based on weather conditions:

- **🎿 Skiing**: Prefers cold temperatures (< 5°C), minimal precipitation
- **🏄 Surfing**: Optimal in warm weather (18-28°C) with moderate wind
- **🏛️ Indoor Sightseeing**: Scores higher during poor weather conditions
- **🚶 Outdoor Sightseeing**: Best in mild temperatures (15-25°C) with clear skies

#### Scoring Factors
- **Temperature Range**: Each activity has ideal temperature zones
- **Precipitation Impact**: Rain/snow affects outdoor activities differently
- **Wind Conditions**: Some activities benefit from wind, others prefer calm
- **Weather Conditions**: Clear skies, fog, storms impact suitability

### Data Flow
1. **Client queries** cities via GraphQL
2. **Geocoding service** fetches matching cities from OpenMeteo
3. **Rich city IDs** generated with embedded location data
4. **Weather service** retrieves forecast data for selected city
5. **Activity ranking** algorithm processes weather per day
6. **GraphQL response** returns weather + ranked activities per day

## Technical Choices

### Rich City ID Format
Instead of simple numeric IDs, we use rich identifiers:
```
"51.5074,-0.1278:London:United Kingdom"
```

**Benefits:**
- **Self-contained**: Contains coordinates, name, and country
- **No reverse geocoding**: Eliminates need for additional API calls
- **Efficient**: Single ID provides all context needed
- **Debuggable**: Human-readable for development

### Configuration-Driven Activity Ranking
**Scalable approach** allows easy expansion:
```typescript
const ACTIVITY_CONFIGS = [
  {
    name: 'skiing',
    idealTempMin: -10,
    idealTempMax: 2,
    rainTolerance: 0.1,
    windPreference: 0.2,
  },
];
```

### Schema-First Development
- **Type generation** from GraphQL schema ensures consistency
- **Generated TypeScript types** prevent runtime errors
- **Single source of truth** for API contracts

### Testing Strategy
<img width="1058" height="420" alt="image" src="https://github.com/user-attachments/assets/903e78e6-180f-4184-8887-6d189f814d7e" />


## Omissions & Trade-offs

### What Was Skipped

| Feature Area | What Was Omitted | Why | Impact |
|--------------|------------------|-----|---------|
| **City Search** | Search filters (population, region), autocomplete, search history | Time constraint, focused on basic search functionality | Users get all matching cities without filtering options |
| **Weather Data** | Hourly forecasts, UV index, sunrise/sunset times, weather alerts | Focused on daily forecasts sufficient for activity planning | Less granular weather data, but adequate for activity decisions |
| **Activity Types** | User-defined activities, difficulty levels, equipment requirements | Time constraint, implemented 4 core activities to prove concept | Fixed activity set, but architecture supports easy expansion |
| **Ranking Algorithm** | Seasonal adjustments, location-specific factors, user preferences | Focused on core weather-based ranking algorithm | Generic scoring without personalization or geographic context |

**Single Service vs Microservices**
- ✅ **Chosen**: Monolithic service with clear module separation
- ❌ **Alternative**: Separate services for weather, geocoding, ranking
- **Reasoning**: Simpler deployment, faster development for MVP scope

## How to Improve/Extend with More Time

### Performance Enhancements
- **Redis caching** for weather data (5-15 minute TTL)
- **Request batching** for multiple city queries
- **Pagination** for large city search results
- **GraphQL query complexity** analysis and limiting
- **CDN integration** for global edge caching

### Feature Extensions
- **User preferences** for activity weighting and filtering
- **Historical weather data** for seasonal insights
- **Location-based search** using device GPS
- **Weather alerts** and notifications
- **Multi-day trip planning** with route optimization
- **Social features** for sharing trip plans

### Database Integration
- **Activity management**: Store custom user-defined activities with personal scoring preferences
- **User profiles**: Save activity preferences, difficulty levels, equipment availability
- **Trip history**: Track past searches and recommendations for personalized suggestions
- **Activity database**: Expand beyond 4 basic activities to hundreds of location-specific options
- **Seasonal data**: Store historical activity popularity by location and season
- **User-generated content**: Reviews and ratings for activities by location and weather conditions

## Development

### Commands
```bash
npm run dev          # Start development server with hot reload
npm run build        # Generate types and compile TypeScript
npm start           # Run production server
npm test            # Run all tests
npm run test:coverage # Run tests with coverage report
npm run generate    # Generate types from GraphQL schema
```

### API Endpoints
**GraphQL Playground**: Available at `http://localhost:4000`

---

**Made with ❤️ by Mpilo Ntombela**
