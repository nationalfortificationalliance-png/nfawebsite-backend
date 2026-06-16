import type { Core } from '@strapi/strapi';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
    // Set public role permissions for read-only access on all published content
    const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    const contentTypes = [
        'api::carousel.carousel',
        'api::news-event.news-event',
        'api::guideline-document.guideline-document',
        'api::partner.partner',
        'api::about-page.about-page',
        'api::global-setting.global-setting',
        'api::quote.quote',
        'api::statistic.statistic',
        'api::team-member.team-member',
        'api::project.project',
        'api::laboratory.laboratory',
        'api::page-setting.page-setting',
        'api::subscriber.subscriber',
        'api::contact-message.contact-message',
    ];

    const readActions = ['find', 'findOne'];

    for (const contentType of contentTypes) {
        for (const action of readActions) {
            const permission = await strapi
                .query('plugin::users-permissions.permission')
                .findOne({
                    where: {
                        role: publicRole.id,
                        action: `${contentType}.${action}`,
                    },
                });

            if (!permission) {
                // Create permission if it doesn't exist
                await strapi.query('plugin::users-permissions.permission').create({
                    data: {
                        action: `${contentType}.${action}`,
                        role: publicRole.id,
                        enabled: true,
                    },
                });
            } else if (!permission.enabled) {
                // Enable permission if it exists but is disabled
                await strapi.query('plugin::users-permissions.permission').update({
                    where: { id: permission.id },
                    data: { enabled: true },
                });
            }
        }
    }

    console.log('✅ Public permissions configured for all NFA content types');

    // Seed sample data if environment is development and DB is empty
    if (process.env.NODE_ENV === 'development') {
        await seedSampleData(strapi);
    }
};

async function seedSampleData(strapi: Core.Strapi) {
    // Seed Global Settings
    const existingSettings = await strapi.entityService.findMany(
        'api::global-setting.global-setting',
        {}
    );
    if (!existingSettings || Object.keys(existingSettings).length === 0) {
        await strapi.entityService.create('api::global-setting.global-setting', {
            data: {
                site_name: 'National Fortification Alliance',
                site_tagline: 'Nourishing Nigeria Through Food Fortification',
                contact_email: 'info@nfa.gov.ng',
                contact_phone: '+234 9 123 4567',
                address: '31 Olusegun Obasanjo Way, Wuse, Abuja, Nigeria',
                footer_text: '© 2024 National Fortification Alliance. Supported by WFP Nigeria.',
                twitter_url: 'https://twitter.com/WFP_Nigeria',
                facebook_url: 'https://facebook.com/WFPNigeria',
                linkedin_url: 'https://linkedin.com/company/wfp-nigeria',
            },
        });
        console.log('✅ Global settings seeded');
    }

    // Seed About Page
    const existingAbout = await strapi.entityService.findMany(
        'api::about-page.about-page',
        {}
    );
    if (!existingAbout || Object.keys(existingAbout).length === 0) {
        await strapi.entityService.create('api::about-page.about-page', {
            data: {
                hero_tagline: 'Building a Healthier Nigeria Through Fortification',
                mission:
                    'To coordinate and champion the fortification of staple foods with essential vitamins and minerals in Nigeria, ensuring every citizen has access to nutritious food.',
                vision:
                    'A Nigeria where micronutrient malnutrition is eliminated through sustainable large-scale food fortification programs.',
                background:
                    'The National Fortification Project (NFP) Nigeria was established in response to the growing burden of micronutrient deficiencies affecting millions of Nigerians. Supported by the World Food Programme (WFP) and regulatory oversight from NAFDAC, the NFP brings together government agencies, UN bodies, and the private sector.',
                objectives:
                    '1. Increase coverage of fortified staple foods to at least 90% of the population\n2. Strengthen regulatory frameworks for food fortification\n3. Build capacity of food processors and millers\n4. Promote consumer awareness through behaviour change communication\n5. Establish monitoring and evaluation systems for fortification quality',
                publishedAt: new Date(),
            },
        });
        console.log('✅ About page seeded');
    }

    // (Carousels require images, skipping automated seeding)

    // Seed News & Events
    const existingNews = await strapi.entityService.findMany(
        'api::news-event.news-event',
        {}
    );
    if (!existingNews || (existingNews as any[]).length === 0) {
        const newsData = [
            {
                title: 'Nigeria Launches Nationwide Maize Fortification Program',
                excerpt: 'WFP Nigeria and NAFDAC announce expansion of mandatory fortification of maize flour to cover all certified millers nationwide.',
                body: '<p>Abuja, Nigeria – The National Fortification Alliance, supported by the World Food Programme (WFP) Nigeria, has officially launched an expanded mandatory maize fortification program targeting all licensed millers across Nigeria\'s 36 states and FCT.</p><p>The initiative, which builds on the success of the vitamin A fortification pilot in five states, will ensure that maize flour — a dietary staple for over 60% of Nigerian households — is enriched with iron, folic acid, zinc, and vitamins B1, B2, B3, and B12.</p>',
                category: 'news',
                date: '2024-11-15',
                is_featured: true,
                slug: 'nigeria-launches-nationwide-maize-fortification',
                publishedAt: new Date(),
            },
            {
                title: 'Stakeholder Workshop on Fortification Quality Assurance – Abuja',
                excerpt: 'A two-day workshop bringing together millers, regulators, and development partners to strengthen quality control mechanisms.',
                body: '<p>The National Fortification Alliance is hosting a two-day stakeholder workshop in Abuja focused on strengthening quality assurance systems across the fortification value chain. Participants include representatives from NAFDAC, State Ministries of Health, the millers\' association, and international technical partners.</p>',
                category: 'event',
                date: '2024-12-05',
                is_featured: true,
                slug: 'stakeholder-workshop-fortification-abuja',
                publishedAt: new Date(),
            },
            {
                title: 'NAFDAC Certifies 45 Additional Food Processors for Fortification',
                excerpt: 'The regulatory agency grants certification to forty-five new food processors, bringing the total to over 200 certified operations.',
                body: '<p>NAFDAC has issued fortification certification to 45 additional food processing companies following successful compliance assessments. This expansion increases the estimated reach of compliant fortified foods to an additional 12 million consumers.</p>',
                category: 'announcement',
                date: '2024-10-22',
                is_featured: false,
                slug: 'nafdac-certifies-45-additional-food-processors',
                publishedAt: new Date(),
            },
            {
                title: 'Mid-Year Fortification Coverage Survey Results Released',
                excerpt: 'New survey data shows significant improvements in household access to fortified staple foods compared to the 2023 baseline.',
                body: '<p>The 2024 mid-year fortification coverage survey, conducted in partnership with UNICEF and the Federal Ministry of Health, reveals that 68% of households in target states are now consuming adequately fortified staple foods — up from 41% in the 2023 baseline survey.</p>',
                category: 'report',
                date: '2024-09-10',
                is_featured: false,
                slug: 'mid-year-fortification-coverage-survey-results',
                publishedAt: new Date(),
            },
            {
                title: 'WFP Nigeria Launches Consumer Awareness Campaign on Food Fortification',
                excerpt: '"Eat Right, Grow Strong" campaign targets urban and rural households to increase demand for and recognition of fortified foods.',
                body: '<p>WFP Nigeria has launched the "Eat Right, Grow Strong" mass media campaign, delivered across radio, television, social media, and community sensitisation events. The campaign educates consumers on how to identify fortified foods and why fortification matters for child nutrition and maternal health.</p>',
                category: 'news',
                date: '2024-08-20',
                is_featured: false,
                slug: 'wfp-nigeria-launches-consumer-awareness-campaign',
                publishedAt: new Date(),
            },
        ];

        for (const article of newsData) {
            await strapi.entityService.create('api::news-event.news-event', { data: article as any });
        }
        console.log('✅ News & Events seeded');
    }

    // Seed Guideline Documents
    const existingDocs = await strapi.entityService.findMany(
        'api::guideline-document.guideline-document',
        {}
    );
    if (!existingDocs || (existingDocs as any[]).length === 0) {
        const docsData = [
            {
                title: 'Nigeria Food Fortification Standards (2024 Edition)',
                description: 'Comprehensive standards document covering mandatory fortification levels for wheat flour, maize flour, sugar, vegetable oil, and salt.',
                category: 'General',
                published_date: '2024-01-15',
                is_featured: true,
                publishedAt: new Date(),
            },
            {
                title: 'NAFDAC Certification Guide for Food Fortification',
                description: 'Step-by-step guide for food processors to obtain and maintain NAFDAC certification for producing fortified foods.',
                category: 'General',
                published_date: '2024-03-20',
                is_featured: true,
                publishedAt: new Date(),
            },
            {
                title: 'Premix Procurement and Quality Control Manual',
                description: 'Technical guidance on sourcing, testing, and applying vitamin and mineral premixes in food production.',
                category: 'General',
                published_date: '2024-02-10',
                is_featured: false,
                publishedAt: new Date(),
            },
            {
                title: 'Small-Scale Miller Fortification Starter Guide',
                description: 'Practical, simplified guide for small and medium-scale millers beginning the fortification journey.',
                category: 'General',
                published_date: '2024-04-05',
                is_featured: false,
                publishedAt: new Date(),
            },
        ];

        for (const doc of docsData) {
            await strapi.entityService.create('api::guideline-document.guideline-document', { data: doc as any });
        }
        console.log('✅ Guideline documents seeded');
    }

    // Seed Partners
    const existingPartners = await strapi.entityService.findMany(
        'api::partner.partner',
        {}
    );
    if (!existingPartners || (existingPartners as any[]).length === 0) {
        const partnersData = [
            {
                name: 'World Food Programme (WFP) Nigeria',
                website_url: 'https://www.wfp.org/countries/nigeria',
                description: 'WFP Nigeria leads the National Fortification Project, providing technical assistance, capacity building, and coordination support to strengthen the food fortification ecosystem.',
                order: 1,
                is_active: true,
                partner_type: 'lead',
                publishedAt: new Date(),
            },
            {
                name: 'NAFDAC',
                website_url: 'https://www.nafdac.gov.ng',
                description: 'The National Agency for Food and Drug Administration and Control (NAFDAC) is the regulatory authority responsible for certifying food processors and enforcing fortification standards in Nigeria.',
                order: 2,
                is_active: true,
                partner_type: 'government',
                publishedAt: new Date(),
            },
            {
                name: 'UNICEF Nigeria',
                website_url: 'https://www.unicef.org/nigeria',
                description: 'UNICEF supports the monitoring and evaluation framework for food fortification coverage, with particular focus on improving child nutrition outcomes.',
                order: 3,
                is_active: true,
                partner_type: 'un-agency',
                publishedAt: new Date(),
            },
            {
                name: 'Federal Ministry of Health',
                website_url: 'https://health.gov.ng',
                description: 'The Federal Ministry of Health provides policy direction and integrates food fortification into national nutrition strategies and health programs.',
                order: 4,
                is_active: true,
                partner_type: 'government',
                publishedAt: new Date(),
            },
            {
                name: 'Gates Foundation',
                website_url: 'https://www.gatesfoundation.org',
                description: 'Providing grant funding and strategic technical support for large-scale food fortification programs in sub-Saharan Africa, including Nigeria.',
                order: 5,
                is_active: true,
                partner_type: 'donor',
                publishedAt: new Date(),
            },
        ];

        for (const partner of partnersData) {
            await strapi.entityService.create('api::partner.partner', { data: partner as any });
        }
        console.log('✅ Partners seeded');
    }
}

export default bootstrap;
