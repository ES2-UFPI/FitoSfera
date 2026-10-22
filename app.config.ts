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
    // Android 12+ usa BLUETOOTH_SCAN e BLUETOOTH_CONNECT; até o 11, a busca BLE exige localização.
    permissions: [
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
  },
  plugins: [
    'expo-router',
    ['react-native-ble-plx', { isBackgroundEnabled: false, neverForLocation: true }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FCF5EA',
        // O splash nativo só segura o fundo creme; a marca é desenhada pela abertura animada do app.
        image: './assets/splash-transparente.png',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
