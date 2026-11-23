import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutrimentor.app',
  appName: 'NutriMentor',
  webDir: 'public',
  server: {
    // Machine Wi-Fi IP address on local network.
    // Ensure your phone is connected to the same Wi-Fi network and Next.js is running.
    url: process.env.CAPACITOR_SERVER_URL || 'http://192.168.29.53:3000',
    cleartext: true,
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
