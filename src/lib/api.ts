import Constants from "expo-constants";

const publicApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function isAbsoluteUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getApiUrl(path: string) {
  if (publicApiBaseUrl) {
    if (!isAbsoluteUrl(publicApiBaseUrl)) {
      throw new Error("EXPO_PUBLIC_API_BASE_URL must be an absolute URL");
    }

    return `${publicApiBaseUrl}${path}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (__DEV__ && hostUri) {
    return `http://${hostUri}${path}`;
  }

  if (!__DEV__) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must be set to an absolute URL in production");
  }

  return path;
}
