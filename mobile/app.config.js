module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!googleMapsApiKey) {
    return config;
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ["react-native-maps", { androidGoogleMapsApiKey: googleMapsApiKey }],
    ],
  };
};
