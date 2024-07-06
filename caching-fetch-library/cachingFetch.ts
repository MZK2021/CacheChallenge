// You may edit this file, add new files to support this file,
// and/or add new dependencies to the project as you see fit.
// However, you must not change the surface API presented from this file,
// and you should not need to change any other files in the project to complete the challenge

import { useEffect, useState } from 'react';

type UseCachingFetch = (url: string) => {
  isLoading: boolean;
  data: unknown;
  error: Error | null;
};

interface CacheEntry {
  data: unknown;
  timestamp: number;
}
/**
 * 1. Implement a caching fetch hook. The hook should return an object with the following properties:
 * - isLoading: a boolean that is true when the fetch is in progress and false otherwise
 * - data: the data returned from the fetch, or null if the fetch has not completed
 * - error: an error object if the fetch fails, or null if the fetch is successful
 *
 * This hook is called three times on the client:
 *  - 1 in App.tsx
 *  - 2 in Person.tsx
 *  - 3 in Name.tsx
 *
 * Acceptance Criteria:
 * 1. The application at /appWithoutSSRData should properly render, with JavaScript enabled, you should see a list of people.
 * 2. You should only see 1 network request in the browser's network tab when visiting the /appWithoutSSRData route.
 * 3. You have not changed any code outside of this file to achieve this.
 * 4. This file passes a type-check.
 *
 */

const cache: Map<string, CacheEntry> = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

export const useCachingFetch: UseCachingFetch = (url) => {
  const [data, setData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const cachedEntry = cache.get(url);
      const now = Date.now();

      if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
        setData(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(url);
        const result = await response.json();

        cache.set(url, { data: result, timestamp: now });
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { isLoading, data, error };
};

/**
 * 2. Implement a preloading caching fetch function. The function should fetch the data.
 *
 * This function will be called once on the server before any rendering occurs.
 *
 * Any subsequent call to useCachingFetch should result in the returned data being available immediately.
 * Meaning that the page should be completely serverside rendered on /appWithSSRData
 *
 * Acceptance Criteria:
 * 1. The application at /appWithSSRData should properly render, with JavaScript disabled, you should see a list of people.
 * 2. You have not changed any code outside of this file to achieve this.
 * 3. This file passes a type-check.
 *
 */
export const preloadCachingFetch = async (url: string): Promise<void> => {
  const now = Date.now();

  if (cache.has(url) && now - cache.get(url)!.timestamp < CACHE_DURATION) {
    return;
  }

  const response = await fetch(url);
  const data = await response.json();

  cache.set(url, { data, timestamp: now });
};

/**
 * 3.1 Implement a serializeCache function that serializes the cache to a string.
 * 3.2 Implement an initializeCache function that initializes the cache from a serialized cache string.
 *
 * Together, these two functions will help the framework transfer your cache to the browser.
 *
 * The framework will call `serializeCache` on the server to serialize the cache to a string and inject it into the dom.
 * The framework will then call `initializeCache` on the browser with the serialized cache string to initialize the cache.
 *
 * Acceptance Criteria:
 * 1. The application at /appWithSSRData should properly render, with JavaScript enabled, you should see a list of people.
 * 2. You should not see any network calls to the people API when visiting the /appWithSSRData route.
 * 3. You have not changed any code outside of this file to achieve this.
 * 4. This file passes a type-check.
 *
 */
export const serializeCache = (): string => {
  const serializedCache = Array.from(cache.entries()).map(([url, entry]) => ({
    url,
    data: entry.data,
    timestamp: entry.timestamp,
  }));
  return JSON.stringify(serializedCache);
};

export const initializeCache = (serializedCache: string): void => {
  const parsedCache = JSON.parse(serializedCache) as Array<{
    url: string;
    data: unknown;
    timestamp: number;
  }>;
  parsedCache.forEach(({ url, data, timestamp }) => {
    cache.set(url, { data, timestamp });
  });
};

export const wipeCache = (): void => {
  cache.clear();
};
