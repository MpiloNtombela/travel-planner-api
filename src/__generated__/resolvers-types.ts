import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Activity = {
  __typename?: 'Activity';
  name: Scalars['String']['output'];
  reasoning: Scalars['String']['output'];
  suitabilityScore: Scalars['Int']['output'];
};

export type City = {
  __typename?: 'City';
  country: Scalars['String']['output'];
  id: Scalars['String']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  name: Scalars['String']['output'];
};

export type CityWeather = {
  __typename?: 'CityWeather';
  city: City;
  weather: Weather;
};

export type DailyForecast = {
  __typename?: 'DailyForecast';
  activities: Array<Activity>;
  conditions: Scalars['String']['output'];
  date: Scalars['String']['output'];
  maxTemp: Scalars['Float']['output'];
  minTemp: Scalars['Float']['output'];
  precipitation: Scalars['Float']['output'];
  windSpeed: Scalars['Float']['output'];
};

export type Query = {
  __typename?: 'Query';
  getCityWeather: CityWeather;
  searchCities: Array<City>;
};


export type QueryGetCityWeatherArgs = {
  cityId: Scalars['String']['input'];
};


export type QuerySearchCitiesArgs = {
  input: Scalars['String']['input'];
};

export type Weather = {
  __typename?: 'Weather';
  conditions: Scalars['String']['output'];
  forecast: Array<DailyForecast>;
  humidity: Scalars['Float']['output'];
  precipitation: Scalars['Float']['output'];
  temperature: Scalars['Float']['output'];
  windSpeed: Scalars['Float']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Activity: ResolverTypeWrapper<Activity>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  City: ResolverTypeWrapper<City>;
  CityWeather: ResolverTypeWrapper<CityWeather>;
  DailyForecast: ResolverTypeWrapper<DailyForecast>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Weather: ResolverTypeWrapper<Weather>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Activity: Activity;
  Boolean: Scalars['Boolean']['output'];
  City: City;
  CityWeather: CityWeather;
  DailyForecast: DailyForecast;
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  Query: {};
  String: Scalars['String']['output'];
  Weather: Weather;
}>;

export type ActivityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Activity'] = ResolversParentTypes['Activity']> = ResolversObject<{
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reasoning?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  suitabilityScore?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CityResolvers<ContextType = any, ParentType extends ResolversParentTypes['City'] = ResolversParentTypes['City']> = ResolversObject<{
  country?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CityWeatherResolvers<ContextType = any, ParentType extends ResolversParentTypes['CityWeather'] = ResolversParentTypes['CityWeather']> = ResolversObject<{
  city?: Resolver<ResolversTypes['City'], ParentType, ContextType>;
  weather?: Resolver<ResolversTypes['Weather'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type DailyForecastResolvers<ContextType = any, ParentType extends ResolversParentTypes['DailyForecast'] = ResolversParentTypes['DailyForecast']> = ResolversObject<{
  activities?: Resolver<Array<ResolversTypes['Activity']>, ParentType, ContextType>;
  conditions?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  maxTemp?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  minTemp?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  precipitation?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  windSpeed?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  getCityWeather?: Resolver<ResolversTypes['CityWeather'], ParentType, ContextType, RequireFields<QueryGetCityWeatherArgs, 'cityId'>>;
  searchCities?: Resolver<Array<ResolversTypes['City']>, ParentType, ContextType, RequireFields<QuerySearchCitiesArgs, 'input'>>;
}>;

export type WeatherResolvers<ContextType = any, ParentType extends ResolversParentTypes['Weather'] = ResolversParentTypes['Weather']> = ResolversObject<{
  conditions?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  forecast?: Resolver<Array<ResolversTypes['DailyForecast']>, ParentType, ContextType>;
  humidity?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  precipitation?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  temperature?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  windSpeed?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  Activity?: ActivityResolvers<ContextType>;
  City?: CityResolvers<ContextType>;
  CityWeather?: CityWeatherResolvers<ContextType>;
  DailyForecast?: DailyForecastResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Weather?: WeatherResolvers<ContextType>;
}>;

