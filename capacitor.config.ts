import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.shodsshop.app',
  appName: 'SHODS SHOP',
  webDir: 'dist',
  // UI is bundled inside APK; requests go to HTTPS API via src/App.jsx.
  // Do not use server.url for production APKs.
  server: { androidScheme: 'https' },
  android: { allowMixedContent: false },
  plugins: { SplashScreen: { launchShowDuration: 1200, backgroundColor: '#0e3a79', showSpinner: false } }
};

export default config;
