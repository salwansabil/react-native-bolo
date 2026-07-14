import Constants from "expo-constants";

const publicApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export function getApiUrl(path: string) {
  if (publicApiBaseUrl) {
    return `${publicApiBaseUrl}${path}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (__DEV__ && hostUri) {
    return `http://${hostUri}${path}`;
  }

  return path;
}
