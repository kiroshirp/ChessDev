import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:5174', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  workers: 1,
  webServer: [
    {
      command: 'npm run dev -w @pixelspace/api',
      url: 'http://127.0.0.1:3001/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -w @pixelspace/world-server',
      url: 'http://127.0.0.1:2567/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -w @pixelspace/web -- --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
