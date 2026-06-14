import type { AppDB } from './db';

declare global {
  interface Window {
    __APP_DB__?: AppDB;
  }

  var __APP_DB__: AppDB | undefined;
}

export {};
