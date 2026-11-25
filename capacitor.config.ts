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
    backgroundColor: '#06141B',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
      style: 'DARK',
    },
  },
};

export default config;
