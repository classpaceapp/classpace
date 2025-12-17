import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import vitePrerender from "vite-plugin-prerender";

// Key public routes to prerender for SEO/sitelinks
const routesToPrerender = [
  '/',
  '/login',
  '/pricing',
  '/our-journey',
  '/careers',
  '/investors',
  '/support',
  '/refunds',
  '/terms',
  '/privacy',
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && vitePrerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: routesToPrerender,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
