import { factories } from '@strapi/strapi';

const defaultRouter = factories.createCoreRouter('api::news-event.news-event');

const customRoutes = [
  {
    method: 'GET',
    path: '/news-events/upcoming',
    handler: 'news-event.findUpcoming',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/news-events/past',
    handler: 'news-event.findPast',
    config: {
      auth: false,
    },
  },
];

export default {
  routes: [
    ...customRoutes,
    ...(typeof defaultRouter.routes === 'function' ? defaultRouter.routes() : defaultRouter.routes),
  ],
};
