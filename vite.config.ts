import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages projects are served from /<repository-name>/ rather than /.
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS === 'true' && repositoryName ? `/${repositoryName}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
