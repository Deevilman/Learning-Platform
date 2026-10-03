import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'

// Use the preinstalled Chromium when present (cloud containers), else Playwright's own.
const local = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  retries: 0,
  use: {
    locale: 'da-DK',
    baseURL: 'http://localhost:4174',
    launchOptions: existsSync(local) ? { executablePath: local } : {},
  },
  webServer: {
    command: 'npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
