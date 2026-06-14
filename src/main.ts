import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { db } from './app/database/db';

// Expose the Dexie instance for Cypress E2E tests (seed/reset/read the real DB).
// Guarded by isDevMode() so the bridge is never bundled into production builds.
if (isDevMode()) {
  globalThis.__APP_DB__ = db;
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
