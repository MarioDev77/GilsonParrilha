import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      // Banco de TESTES separado do de produção/desenvolvimento.
      DATABASE_URL: 'postgresql://test:test@localhost:5432/gilson_parrilha_test?schema=public',
      FRONTEND_ORIGIN: 'http://localhost:3000',
      SESSION_SECRET: 'segredo-de-teste-segredo-de-teste-1234567890',
    },
  },
});
