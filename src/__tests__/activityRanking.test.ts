import { ActivityRankingService } from '../utils/activityRanking';
const today = new Date().toISOString().split('T')[0];

describe('ActivityRankingService', () => {
  let service: ActivityRankingService;

  beforeEach(() => {
    service = new ActivityRankingService();
  });

  describe('rankActivitiesForDay', () => {
    it('should return only top 1 activity by default', () => {
      const weather = {
        date: today,
        maxTemp: 22,
        minTemp: 18,
        conditions: 'Clear sky',
        precipitation: 0,
        windSpeed: 5,
      };

      const activities = service.rankActivitiesForDay(weather);

      expect(activities).toHaveLength(1);
      expect(activities[0].name).toBe('outdoor_sightseeing');
      expect(activities[0].suitabilityScore).toBeGreaterThan(80);
    });

    it('should return all 4 activities when top=4', () => {
      const weather = {
        date: today,
        maxTemp: 22,
        minTemp: 18,
        conditions: 'Clear sky',
        precipitation: 0,
        windSpeed: 5,
      };

      const activities = service.rankActivitiesForDay(weather, 4);

      expect(activities).toHaveLength(4);
      expect(activities[0].name).toBe('outdoor_sightseeing');

      const activityNames = activities.map(a => a.name);
      expect(activityNames).toContain('skiing');
      expect(activityNames).toContain('surfing');
      expect(activityNames).toContain('indoor_sightseeing');
      expect(activityNames).toContain('outdoor_sightseeing');
    });

    it('should return activities sorted by score (highest first)', () => {
      const weather = {
        date: today,
        maxTemp: 20,
        minTemp: 15,
        conditions: 'Clear sky',
        precipitation: 0,
        windSpeed: 10,
      };

      const activities = service.rankActivitiesForDay(weather, 4);

      for (let i = 0; i < activities.length - 1; i++) {
        expect(activities[i].suitabilityScore).toBeGreaterThanOrEqual(
          activities[i + 1].suitabilityScore
        );
      }
    });

    it('should rank indoor sightseeing highest on rainy days', () => {
      const rainyWeather = {
        date: today,
        maxTemp: 18,
        minTemp: 15,
        conditions: 'Heavy rain',
        precipitation: 15,
        windSpeed: 10,
      };

      const activities = service.rankActivitiesForDay(rainyWeather, 2);

      expect(activities).toHaveLength(2);
      expect(activities[0].name).toBe('indoor_sightseeing');
      expect(activities[0].suitabilityScore).toBeGreaterThan(70);
    });

    it('should rank skiing higher in cold weather', () => {
      const coldWeather = {
        date: today,
        maxTemp: -2,
        minTemp: -8,
        conditions: 'Snow',
        precipitation: 3,
        windSpeed: 8,
      };

      const activities = service.rankActivitiesForDay(coldWeather, 4);
      const skiing = activities.find(a => a.name === 'skiing');

      expect(skiing).toBeDefined();
      expect(skiing!.suitabilityScore).toBeGreaterThan(50);

      expect(skiing!.reasoning).toContain('ideal temperature');

      const warmWeather = {
        date: today,
        maxTemp: 25,
        minTemp: 20,
        conditions: 'Clear sky',
        precipitation: 0,
        windSpeed: 5,
      };

      const warmActivities = service.rankActivitiesForDay(warmWeather, 4);
      const warmSkiing = warmActivities.find(a => a.name === 'skiing');

      expect(skiing!.suitabilityScore).toBeGreaterThan(warmSkiing!.suitabilityScore);
    });

    it('should handle top parameter correctly', () => {
      const weather = {
        date: today,
        maxTemp: 20,
        minTemp: 15,
        conditions: 'Clear sky',
        precipitation: 0,
        windSpeed: 10,
      };

      expect(service.rankActivitiesForDay(weather, 1)).toHaveLength(1);
      expect(service.rankActivitiesForDay(weather, 2)).toHaveLength(2);
      expect(service.rankActivitiesForDay(weather, 3)).toHaveLength(3);
      expect(service.rankActivitiesForDay(weather, 4)).toHaveLength(4);
    });

    it('should ensure all scores are within valid range', () => {
      const extremeWeather = {
        date: today,
        maxTemp: 45,
        minTemp: 40,
        conditions: 'Thunderstorm',
        precipitation: 50,
        windSpeed: 80,
      };

      const activities = service.rankActivitiesForDay(extremeWeather, 4);

      activities.forEach(activity => {
        expect(activity.suitabilityScore).toBeGreaterThanOrEqual(0);
        expect(activity.suitabilityScore).toBeLessThanOrEqual(100);
        expect(activity.reasoning).toBeTruthy();
      });
    });

    it('should provide meaningful reasoning for all activities', () => {
      const weather = {
        date: today,
        maxTemp: 20,
        minTemp: 15,
        conditions: 'Overcast',
        precipitation: 1,
        windSpeed: 15,
      };

      const activities = service.rankActivitiesForDay(weather, 4);

      activities.forEach(activity => {
        expect(activity.reasoning).toBeTruthy();
        expect(activity.reasoning.length).toBeGreaterThan(0);
        expect(typeof activity.reasoning).toBe('string');
      });
    });
  });
});
