import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'swim-travel',
  brand: {
    primaryColor: '#0A7EA4', // 게임 배경 그라데이션과 맞춘 바다색
  },
  permissions: [],
  webBundleDir: 'dist',
});
