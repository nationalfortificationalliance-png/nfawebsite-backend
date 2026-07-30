import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::faq.faq', ({ strapi }) => ({
    async incrementView(ctx) {
        const { id } = ctx.params;

        const faq = await strapi.documents('api::faq.faq').findOne({ documentId: id });
        if (!faq) {
            return ctx.notFound();
        }

        const updated = await strapi.documents('api::faq.faq').update({
            documentId: id,
            data: { view_count: (faq.view_count || 0) + 1 },
        });

        ctx.body = { view_count: updated.view_count };
    },
}));
