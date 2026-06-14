import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://192.168.50.110:3001',
    setupNodeEvents(on, config) {
    },
  },
});