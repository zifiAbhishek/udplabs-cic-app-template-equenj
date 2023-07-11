const defaultAuthConfig = {
  cacheLocation: 'localstorage',
};

const config = {
  auth: {
    ...defaultAuthConfig,
    domain: 'auth-rocks-agreeable-forest.cic-demo-platform.auth0app.com',
    clientId: 'OedEh5XnwcyPmthFGzS69Z0j4uJyGlxV',
    // UNCOMMENT the following line to test the private API
    audience: ['api://authrocks/'],
  },
  app: {
    enableSilentAuth: false,
    port: 3000,
  },
  server: {
    permissions: ['scopePermission'],
  },
};

export default config;
