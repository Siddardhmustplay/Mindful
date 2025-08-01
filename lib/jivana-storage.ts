// lib/jivana-storage.ts

/**
 * Safely get an item from localStorage
 * @param key The key to retrieve
 * @param defaultValue The value to return if nothing is found or JSON parse fails
 */
export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely set an item in localStorage
 * @param key The key to set
 * @param value The value to store
 */
export const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
  }
};

/**
 * Safely remove an item from localStorage
 * @param key The key to remove
 */
export const removeLocalStorageItem = (key: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};
