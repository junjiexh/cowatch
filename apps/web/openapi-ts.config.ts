import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../../api-specs/openapi.yaml',
  output: {
    path: './src/client',
  },
  plugins: [
    '@hey-api/client-fetch',
    '@hey-api/sdk',
    {
      name: '@hey-api/typescript',
      enums: 'javascript',
    },
  ],
});
