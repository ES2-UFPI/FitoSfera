import type { ExpoConfig } from 'expo/config';

/**
 * O FitoSfera é distribuído só para Android. A web entra apenas como prévia de
 * desenvolvimento, ligada por `npm run web` (FITOSFERA_PREVIEW_WEB=1).
 */
const previaWeb = process.env.FITOSFERA_PREVIEW_WEB === '1';

const config: ExpoConfig = {
  name: 'FitoSfera',
  slug: 'fitosfera',
  scheme: 'fitosfera',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  platforms: previaWeb ? ['android', 'web'] : ['android'],
  android: {
    package: 'com.fitosfera.app',
  },
  plugins: ['expo-router', ['expo-splash-screen', { backgroundColor: '#FCF5EA' }]],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
