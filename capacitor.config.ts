import type { CapacitorConfig } from '@capacitor/cli';

const remoteServerUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.nutrimentor.app',
  appName: 'NutriMentor',
  webDir: 'out',
  ...(remoteServerUrl
    ? {
        server: {
          url: remoteServerUrl,
          cleartext: true,
          allowNavigation: ['*'],
        },
      }
    : {
        server: {
          androidScheme: 'https',
          cleartext: true,
        },
      }),
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
    },
  },
};

export default config;
