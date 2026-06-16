import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::news-event.news-event', (context) => ({
  // Get upcoming events (events with date >= today)
  async findUpcoming(ctx) {
    const today = new Date().toISOString().split('T')[0];

    const { query } = ctx;
    const existingFilters = (query.filters || {}) as Record<string, any>;
    const filters: any = {
      ...existingFilters,
      category: 'event' as const,
      date: {
        $gte: today,
      },
    };

    const entities = await context.strapi.entityService.findMany('api::news-event.news-event', {
      ...query,
      filters,
      sort: { date: 'asc' }, // Upcoming events sorted by soonest first
      populate: query.populate || ['image', 'gallery'],
    });

    return { data: entities, meta: {} };
  },

  // Get past events (events with date < today)
  async findPast(ctx) {
    const today = new Date().toISOString().split('T')[0];

    const { query } = ctx;
    const existingFilters = (query.filters || {}) as Record<string, any>;
    const filters: any = {
      ...existingFilters,
      category: 'event' as const,
      date: {
        $lt: today,
      },
    };

    const entities = await context.strapi.entityService.findMany('api::news-event.news-event', {
      ...query,
      filters,
      sort: { date: 'desc' }, // Past events sorted by most recent first
      populate: query.populate || ['image', 'gallery'],
    });

    return { data: entities, meta: {} };
  },
}));
