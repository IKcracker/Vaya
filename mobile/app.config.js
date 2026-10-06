module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!googleMapsApiKey) {
    return config;
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android?.config ?? {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
