import { defineConfig } from 'vitest/config';

export default defineConfig({
  optimizeDeps: {
    include: ['dexie', 'fake-indexeddb', 'fake-indexeddb/auto'],
  },
  test: {
    pool: 'forks',
  },
});
