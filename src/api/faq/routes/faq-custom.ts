export default {
    routes: [
        {
            method: 'POST',
            path: '/faqs/:id/view',
            handler: 'faq.incrementView',
            config: {
                auth: false,
            },
        },
    ],
};
