import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.efsin.dokscanner',
  appName: 'Dokument Scanner v1.5.9',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  android: {
    buildOptions: {
      versionCode: 9,
      versionName: '1.5.9'
    }
  }
};

export default config;
