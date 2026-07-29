import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io'],
          'media-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      // strapi::cors matches origins by exact string, so a literal
      // 'https://*.vercel.app' entry never matches a real request origin.
      // Use a matcher function instead to allow the production domain plus
      // any Vercel preview deployment subdomain.
      origin: (ctx: { get: (header: string) => string }) => {
        const requestOrigin = ctx.get('Origin');
        const allowedExact = [
          'http://localhost:3000',
          'http://localhost:1337',
          'https://nationalfortificationalliance.org.ng',
          'https://www.nationalfortificationalliance.org.ng',
        ];
        if (allowedExact.includes(requestOrigin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(requestOrigin)) {
          return [requestOrigin];
        }
        return [];
      },
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;

