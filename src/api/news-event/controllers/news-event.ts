import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::news-event.news-event', ({ strapi }) => ({
  // Get upcoming events (events with date >= today)
  async findUpcoming(ctx) {
    const today = new Date().toISOString().split('T')[0];

    const { query } = ctx;
    const filters = {
      ...query.filters,
      category: 'event',
      date: {
        $gte: today,
      },
    };

    const entities = await strapi.entityService.findMany('api::news-event.news-event', {
      ...query,
      filters,
      sort: { date: 'asc' }, // Upcoming events sorted by soonest first
      populate: query.populate || ['image', 'gallery'],
    });

    const sanitized = await this.sanitizeOutput(entities, ctx);
    return this.transformResponse(sanitized);
  },

  // Get past events (events with date < today)
  async findPast(ctx) {
    const today = new Date().toISOString().split('T')[0];

    const { query } = ctx;
    const filters = {
      ...query.filters,
      category: 'event',
      date: {
        $lt: today,
      },
    };

    const entities = await strapi.entityService.findMany('api::news-event.news-event', {
      ...query,
      filters,
      sort: { date: 'desc' }, // Past events sorted by most recent first
      populate: query.populate || ['image', 'gallery'],
    });

    const sanitized = await this.sanitizeOutput(entities, ctx);
    return this.transformResponse(sanitized);
  },
}));
