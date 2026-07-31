import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed as a GitHub Pages *project* site (https://<org>.github.io/<repo>/),
// so every asset URL needs the repo name as a base path. Update this if the
// repo is ever renamed, or drop it to '/' if this moves to a custom domain
// or a user/org root page instead.
export default defineConfig({
    base: '/gymcord-fantasy-web-app/',
    plugins: [react()],
    server: {
        port: 5173
    },
    build: {
        outDir: 'dist',
        sourcemap: true
    }
});
