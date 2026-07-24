import type { Core } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
    // Set public role permissions for read-only access on all published content
    const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    // Collection types (support find and findOne)
    const collectionTypes = [
        'api::carousel.carousel',
        'api::news-event.news-event',
        'api::guideline-document.guideline-document',
        'api::partner.partner',
        'api::quote.quote',
        'api::statistic.statistic',
        'api::team-member.team-member',
        'api::project.project',
        'api::laboratory.laboratory',
        'api::page-setting.page-setting',
        'api::contact-page.contact-page',
        'api::governance-representative.governance-representative',
    ];

    // Form-submission types: the public may create entries but must never
    // read them back (they contain visitor names, emails, and messages)
    const submitOnlyTypes = [
        'api::contact-message.contact-message',
        'api::subscriber.subscriber',
    ];

    // Single types (only support find, not findOne)
    const singleTypes = [
        'api::about-page.about-page',
        'api::global-setting.global-setting',
    ];

    // Helper function to create/enable permission
    const ensurePermission = async (contentType: string, action: string) => {
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
    };

    // Helper function to revoke a permission. In Strapi v5 a permission is
    // granted by the row's existence, so revoking means deleting the row.
    const revokePermission = async (contentType: string, action: string) => {
        const permission = await strapi
            .query('plugin::users-permissions.permission')
            .findOne({
                where: {
                    role: publicRole.id,
                    action: `${contentType}.${action}`,
                },
            });

        if (permission) {
            await strapi.query('plugin::users-permissions.permission').delete({
                where: { id: permission.id },
            });
        }
    };

    // Enable permissions for collection types (find + findOne)
    for (const contentType of collectionTypes) {
        await ensurePermission(contentType, 'find');
        await ensurePermission(contentType, 'findOne');
    }

    // Enable permissions for single types (only find)
    for (const contentType of singleTypes) {
        await ensurePermission(contentType, 'find');
    }

    // Form-submission types: create only; revoke any read access granted
    // by earlier bootstrap versions
    for (const contentType of submitOnlyTypes) {
        await ensurePermission(contentType, 'create');
        await revokePermission(contentType, 'find');
        await revokePermission(contentType, 'findOne');
    }

    console.log('✅ Public permissions configured for all NFA content types');

    // Seed real governance representative profiles (idempotent, runs in all environments)
    await seedGovernanceRepresentatives(strapi);

    // Seed sample data if environment is development and DB is empty
    if (process.env.NODE_ENV === 'development') {
        await seedSampleData(strapi);
    }
};

const ORG_LOGO_FILES: Record<string, string> = {
    NAFDAC: 'NAFDAC_emblem.png',
    SON: 'son_png.png',
    FMOHSW: 'Nigeria_Federal_Ministry_of_Health_Logo.png',
    FCCPC: 'fccpc_logo.png',
};

const MIME_TYPES: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
};

async function uploadLocalImage(strapi: Core.Strapi, fileName: string) {
    const filepath = path.join(process.cwd(), 'src', 'seed-assets', 'org-logos', fileName);
    const { size } = fs.statSync(filepath);
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const [uploaded] = await strapi.plugin('upload').service('upload').upload({
        data: {},
        files: {
            filepath,
            originalFilename: fileName,
            mimetype: MIME_TYPES[ext] || 'application/octet-stream',
            size,
        },
    });
    return uploaded;
}

async function seedGovernanceRepresentatives(strapi: Core.Strapi) {
    const uid = 'api::governance-representative.governance-representative';

    const bullets = (items: string[]) => items.map((text) => ({ text }));

    const representatives = [
        {
            name: 'Mr. Fred Chiazor',
            title: 'Chairman, National Fortification Alliance',
            organization_name: 'Association of Food, Beverage and Tobacco Employers (AFBTE)',
            organization_short_name: 'AFBTE',
            organization_key: 'Industry',
            bio: 'Mr. Fred Chiazor, FNIFST, serves as the Chairman of the National Fortification Alliance (NFA), where he provides strategic leadership for Nigeria\'s multi-sectoral food fortification programme. He is also the Chairman of the Association of Food, Beverage and Tobacco Employers (AFBTE) and a seasoned regulatory and technical affairs professional with extensive experience in the food and beverage industry. A Fellow of the Nigerian Institute of Food Science and Technology (FNIFST), he has championed industry collaboration, regulatory compliance, food standards, sustainability, and public-private partnerships. Through his leadership, he continues to foster constructive engagement between industry, government, and development partners to strengthen food fortification, improve nutrition outcomes, and advance food safety in Nigeria.',
            organization_profile: 'The Association of Food, Beverage and Tobacco Employers (AFBTE) is a leading industry body representing manufacturers in Nigeria\'s food, beverage, and tobacco sectors. The Association promotes responsible manufacturing, regulatory compliance, quality assurance, and sustainable industry growth through constructive engagement with government institutions, regulatory agencies, and other stakeholders. As a key member of the National Fortification Alliance (NFA), AFBTE provides industry leadership, supports the implementation of mandatory food fortification standards, advocates for enabling policies, and facilitates collaboration to strengthen food systems, improve product quality, and contribute to better nutrition and public health outcomes in Nigeria.',
            key_contributions: bullets([
                'Provides strategic leadership as Chairman of the National Fortification Alliance',
                'Represents the food manufacturing industry within the Alliance through AFBTE',
                'Promotes public-private collaboration to strengthen food fortification programmes',
                'Advocates for industry compliance with national food fortification standards',
                'Supports policy dialogue, technical coordination, and stakeholder engagement',
                'Champions initiatives that improve food quality, nutrition, and consumer health',
                'Leads the industry on production and distribution of adequately fortified foods',
                'Commitment to co-sponsoring NFA meetings',
                'Support for food fortification research',
                'Social marketing and awareness creation on the consumption of fortified foods',
            ]),
            order: 1,
            is_active: true,
            publishedAt: new Date(),
        },
        {
            name: 'Yunusa B. Mohammed',
            title: 'Vice Chair, National Fortification Alliance / Director, Standards Development Department',
            organization_name: 'Standards Organisation of Nigeria (SON)',
            organization_short_name: 'SON',
            organization_key: 'SON',
            bio: 'Yunusa B. Mohammed represents the Standards Organisation of Nigeria (SON) as the Vice Chair of the National Fortification Alliance (NFA) and currently serves as the Director of the Standards Development Department. A biochemistry graduate from Bayero University, Kano, Yunusa (fondly known as YB) is an accomplished lead auditor specializing in Food Safety Management Systems (FSMS) and Quality Management Systems (QMS). With a distinguished career beginning in SON\'s Food and Chemistry Laboratory, he has developed profound expertise in standard elaboration and regulatory compliance. Notably, he initiated SON\'s Vitamin A Laboratory and is a trained ISO/IEC 17025 Laboratory Assessor and ISO 27001 Lead Auditor. As a driving force in national nutrition and standardization, YB serves on the Regulatory Core Group, the National Technical Advisory Group on Large-Scale Food Fortification (LSFF), and the Country Working Group on Bouillon Fortification, and heads the National Codex Contact Point.',
            organization_profile: 'Established under the SON Act of 2015, as amended, the Standards Organisation of Nigeria (SON) is the apex national statutory body mandated to prepare, implement, enforce and regulate standards for all products, processes, systems, measurements, and materials nationwide. In food fortification, SON leads initiatives to combat malnutrition by formulating strict regulatory standards, including factory monitoring and micronutrient laboratory testing, in partnership with NAFDAC, FCCPC, FMOHSW, industry, and development partners.',
            key_contributions: bullets([
                'Vice Chair of the NFA',
                'Elaboration, review, and adoption of standards in collaboration with stakeholders',
                'Monitoring and testing of fortified foods at the factory level for compliance',
                'Funding of monitoring activities and laboratory testing',
                'Capacity building of SON staff and stakeholders on food fortification',
                'Serves as Secretariat for the USI/IDD Taskforce',
                'Hosting of USI/IDD Taskforce meetings',
                'Collaboration and support to IPAN to ensure proper laboratory certification',
                'Sponsoring participation of SON members in NFA meetings',
            ]),
            order: 2,
            is_active: true,
            publishedAt: new Date(),
        },
        {
            name: 'Mrs. Eva O. Edwards',
            title: 'Secretariat, National Fortification Alliance / Director, Food Safety and Applied Nutrition (FSAN)',
            organization_name: 'National Agency for Food and Drug Administration and Control (NAFDAC)',
            organization_short_name: 'NAFDAC',
            organization_key: 'NAFDAC',
            bio: 'Mrs. Eva O. Edwards represents the National Agency for Food and Drug Administration and Control (NAFDAC) as the Secretariat of the National Fortification Alliance (NFA) and currently serves as Director of the Food Safety and Applied Nutrition (FSAN) Directorate. She is a distinguished food safety and nutrition expert with over 25 years of regulatory experience spanning food legislation, food fortification, Codex standards, nutrition policy, and public health. She serves on several national and international technical committees, including the WHO Technical Advisory Group on Food Safety, and is Nigeria\'s FAO/WHO INFOSAN Emergency Contact Point. Over the years as a regulator in NAFDAC, Eva has garnered an advanced level of technical knowledge and experience across food legislation, food standards, food labelling, GHP/GMP inspections, HACCP, food fortification, micronutrient deficiencies, and infant and young child nutrition.',
            organization_profile: 'The National Agency for Food and Drug Administration and Control (NAFDAC) is Nigeria\'s apex regulatory authority established by the NAFDAC Act, Cap N1, Laws of the Federation of Nigeria (LFN) 2004, to regulate and control the manufacture, importation, exportation, distribution, advertisement, sale, and use of food, drugs, cosmetics, medical devices, chemicals, packaged water, and related regulated products. As the Secretariat of the National Fortification Alliance (NFA), NAFDAC provides regulatory leadership for Nigeria\'s food fortification programme through policy and regulatory development, product registration, premix import control, compliance monitoring, laboratory analysis, stakeholder coordination, capacity building, and enforcement of mandatory food fortification standards.',
            key_contributions: bullets([
                'Serves as the Secretariat of the National Fortification Alliance',
                'Issuance of marketing authorization to fortified food products',
                'Registration of micronutrient premix and provision of updated lists of approved premix suppliers',
                'Provision of updated lists of approved single micronutrient suppliers',
                'Monitoring and testing of fortified foods at distributor, retail, and port levels for compliance',
                'Funding of monitoring and laboratory testing',
                'Capacity building of NAFDAC staff on food fortification',
                'Review, revision, and drafting of regulations for fortified food products',
                'Sponsoring participation of NAFDAC members in NFA meetings',
            ]),
            order: 3,
            is_active: true,
            publishedAt: new Date(),
        },
        {
            name: 'Dr. Nkechi Mba',
            title: 'Director, Quality Assurance and Development',
            organization_name: 'Federal Competition and Consumer Protection Commission (FCCPC)',
            organization_short_name: 'FCCPC',
            organization_key: 'FCCPC',
            bio: 'Dr. Nkechi Mba represents the Federal Competition and Consumer Protection Commission (FCCPC) on the National Fortification Alliance (NFA) and currently serves as Director, Quality Assurance and Development. She is an experienced consumer protection and quality assurance professional with expertise in food quality, consumer rights, regulatory compliance, stakeholder engagement, and public awareness. Through her leadership, she has championed initiatives that promote safe, nutritious, and quality food products while strengthening consumer confidence in Nigeria\'s food system. Within the NFA, Dr. Mba provides strategic support for consumer-focused food fortification initiatives, household monitoring, public sensitization, and multi-sectoral collaboration aimed at improving nutrition outcomes and protecting consumer welfare.',
            organization_profile: 'The Federal Competition and Consumer Protection Commission (FCCPC) is established under the Federal Competition and Consumer Protection Act, 2018, as Nigeria\'s apex consumer protection and competition regulator. The Commission is mandated to promote fair competition, protect consumer rights, eliminate unsafe and unfair trade practices, and ensure access to safe, quality goods and services. As a member of the National Fortification Alliance (NFA), FCCPC promotes consumer awareness of fortified foods, supports household-level monitoring, advocates compliance with mandatory food fortification standards, and safeguards consumers by ensuring they receive safe, nutritious, and value-for-money food products.',
            key_contributions: bullets([
                'Represents consumer interests in the governance of the National Fortification Alliance',
                'Promotes consumer awareness and public sensitization on fortified foods',
                'Supports household monitoring of fortified food products',
                'Contributes to stakeholder engagement and behaviour change communication',
                'Supports implementation of digital food fortification monitoring initiatives (DFQT+)',
                'Advocates compliance with mandatory food fortification standards to protect consumer welfare',
                'Sponsoring participation of members in NFA meetings',
            ]),
            order: 4,
            is_active: true,
            publishedAt: new Date(),
        },
        {
            name: '',
            title: '',
            organization_name: 'Federal Ministry of Health and Social Welfare (FMOHSW)',
            organization_short_name: 'FMOHSW',
            organization_key: 'FMOHSW',
            bio: '',
            organization_profile: '',
            key_contributions: bullets([
                'Nutrition policy development',
                'Advocate for an enabling environment to promote local production of micronutrients in Nigeria',
                'Support for NFA coordination and activities',
                'Advocacy activities with relevant bodies in the area of food fortification in Nigeria',
                'Provide support for NFA meetings',
            ]),
            order: 5,
            is_active: true,
            publishedAt: new Date(),
        },
        {
            name: '',
            title: '',
            organization_name: 'Development Partners',
            organization_short_name: '',
            organization_key: 'Development Partners',
            bio: '',
            organization_profile: '',
            key_contributions: bullets([
                'Technical assistance',
                'Capacity building',
                'Laboratory strengthening',
                'Financial support',
                'Public awareness creation',
            ]),
            order: 6,
            is_active: true,
            publishedAt: new Date(),
        },
    ];

    for (const rep of representatives) {
        const existing = await strapi.db.query(uid).findMany({
            where: { organization_key: rep.organization_key },
            populate: ['organization_logo'],
        }) as any[];

        const logoFileName = ORG_LOGO_FILES[rep.organization_key];

        if (existing && existing.length > 0) {
            const entry = existing[0] as any;
            const missingLogo = existing.some((e) => !e.organization_logo);
            if (logoFileName && missingLogo) {
                const uploaded = await uploadLocalImage(strapi, logoFileName);
                await strapi.documents(uid).update({
                    documentId: entry.documentId,
                    data: { organization_logo: uploaded.id } as any,
                });
                await strapi.documents(uid).publish({ documentId: entry.documentId });
            }
            continue;
        }

        const organization_logo = logoFileName
            ? (await uploadLocalImage(strapi, logoFileName)).id
            : undefined;

        await strapi.entityService.create(uid, {
            data: { ...rep, organization_logo } as any,
        });
    }
    console.log('✅ Governance representative profiles seeded');
}

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
                    'The National Fortification Alliance (NFA) Nigeria was established in response to the growing burden of micronutrient deficiencies affecting millions of Nigerians. Supported by the World Food Programme (WFP) and regulatory oversight from NAFDAC, the NFA brings together government agencies, UN bodies, and the private sector.',
                objectives:
                    '1. Increase coverage of fortified staple foods to at least 90% of the population\n2. Strengthen regulatory frameworks for food fortification\n3. Build capacity of food processors and millers\n4. Promote consumer awareness through behaviour change communication\n5. Establish monitoring and evaluation systems for fortification quality',
                publishedAt: new Date(),
            },
        });
        console.log('✅ About page seeded');
    }

    // Backfill About Page stats/timeline sections (added after initial seed above,
    // so existing entries need an explicit update rather than a create-if-missing check).
    // Uses the Document Service API + explicit publish so both the draft and published
    // rows get the new component data — entityService.update only touches whichever
    // single row entityService.findMany happens to return (see governance-representative
    // backfill above for the same gotcha).
    const aboutRows = await strapi.db.query('api::about-page.about-page').findMany({
        populate: ['challenge_stats', 'key_stats', 'key_stats.sub_stats', 'timeline_items'],
    });
    const aboutNeedsBackfill = aboutRows.some(
        (row: any) =>
            (!row.challenge_stats || row.challenge_stats.length === 0) ||
            (!row.key_stats || row.key_stats.length === 0) ||
            (!row.timeline_items || row.timeline_items.length === 0)
    );
    if (aboutRows.length > 0 && aboutNeedsBackfill) {
        const documentId = (aboutRows[0] as any).documentId;
        await strapi.documents('api::about-page.about-page').update({
            documentId,
            data: {
                history_intro:
                    "Mandatory food fortification of selected staple food vehicles—including wheat flour, maize flour, sugar, and vegetable oil—commenced in Nigeria in 2002 as a core national strategy for combating micronutrient deficiencies. In 2004, the NFA was formally established under the chairmanship of the then National Planning Commission to mobilize stakeholders for coordinated implementation.",
                challenge_eyebrow: 'The Scale of the Problem',
                challenge_heading: "Nigeria's Hidden Hunger Crisis",
                challenge_stats: [
                    {
                        value: '37%',
                        label: 'Child Stunting Rate',
                        description: '37% of children under 5 are stunted — one of the highest rates in sub-Saharan Africa.',
                        source: 'National Nutrition and Health Survey',
                    },
                    {
                        value: '30%',
                        label: 'Vitamin A Deficiency',
                        description: 'Nearly 1 in 3 children are Vitamin A deficient, risking blindness, immune weakness, and developmental impact.',
                        source: 'National Nutrition and Health Survey',
                    },
                    {
                        value: '72%',
                        label: 'Women with Anaemia',
                        description: '72% of women of reproductive age are anaemic, primarily due to iron deficiency — with serious maternal and infant health consequences.',
                        source: 'National Nutrition and Health Survey',
                    },
                ] as any,
                key_stats: [
                    {
                        value: '2002',
                        title: 'Programme Initiation',
                        description: "The year Nigeria's mandatory food fortification programme was officially launched.",
                        accent_color: 'none',
                        source: 'NFA Programme Records',
                        sub_stats: [
                            { label: 'NFA Established', value: '2004' },
                        ],
                    },
                    {
                        value: '57%',
                        title: 'National Compliance',
                        description: 'Average compliance across all mandatory food vehicles in Nigeria.',
                        accent_color: 'blue',
                        source: 'NAFDAC Compliance Monitoring Report',
                        sub_stats: [
                            { label: 'Salt (Iodized)', value: '67%' },
                            { label: 'Veg Oil (Vit A)', value: '58%' },
                            { label: 'Flour (Vit A)', value: '48%' },
                        ],
                    },
                    {
                        value: '37%',
                        title: 'Child Stunting',
                        description: 'Prevalence of stunting among children under five years of age.',
                        accent_color: 'gold',
                        source: 'National Nutrition and Health Survey',
                        sub_stats: [
                            { label: 'Vitamin A Deficiency', value: '~30%' },
                            { label: 'Anaemia (Women)', value: '60–70%' },
                        ],
                    },
                    {
                        value: '92%',
                        title: 'Calcium Inadequacy',
                        description: 'High prevalence of calcium deficiency across children and pregnant women.',
                        accent_color: 'green',
                        source: 'National Nutrition and Health Survey',
                        sub_stats: [
                            { label: 'Non-Pregnant Women', value: '95%' },
                            { label: 'Pregnant Women', value: '92%' },
                            { label: 'Children', value: '92%' },
                        ],
                    },
                ] as any,
                timeline_items: [
                    { year: '2004', event: 'Nigeria enacts the Food, Drugs and Related Products (Fortification) Regulation, making fortification mandatory for key staple foods.' },
                    { year: '2011', event: 'WFP Nigeria launches the National Fortification Alliance with NAFDAC to strengthen enforcement and processor capacity across 6 key food vehicles.' },
                    { year: '2016', event: 'Coverage of Vitamin A-fortified vegetable oil reaches 70% of households. NFA introduces the national quality mark seal for certified products.' },
                    { year: '2020', event: "NFA expands to include Maize Flour and Wheat Flour in NAFDAC's mass fortification mandate. Premix fund established for small processors." },
                    { year: '2024', event: 'Over 200 processors certified across 36 states, reaching 12M+ consumers. NFA achieves 68% household coverage of fortified staple foods.' },
                ] as any,
            },
        });
        await strapi.documents('api::about-page.about-page').publish({ documentId });
        console.log('✅ About page stats/timeline backfilled');
    }

    // Seed Approved Laboratories
    const existingLabs = await strapi.entityService.findMany(
        'api::laboratory.laboratory',
        {}
    );
    if (!existingLabs || (existingLabs as any[]).length === 0) {
        const labsData = [
            { name: 'Saag Chemicals', location: 'Lagos', contact: '08025589200', order: 1 },
            { name: 'Remaben Scientific Services Ltd', location: 'Ikeja', contact: '08023037743', order: 2 },
            { name: 'Bato Chemical Labs Ltd', location: 'Ogun State', contact: '08091972222', order: 3 },
            { name: 'Jawura Environmental Services Ltd', location: 'Lagos', contact: '09058592802', order: 4 },
            { name: 'LS Scientific Limited', location: 'Ikeja', contact: '08094709004', order: 5 },
            { name: 'Alfa Laboratories', location: 'Lagos', contact: '08023093103', order: 6 },
            { name: 'Katchey Laboratory', location: 'Ikeja', contact: '08036209410', order: 7 },
            { name: 'Bureau Veritas Nigeria Ltd', location: 'Ogun State', contact: '08095559245', order: 8 },
        ];
        for (const lab of labsData) {
            await strapi.entityService.create('api::laboratory.laboratory', {
                data: { ...lab, publishedAt: new Date() },
            });
        }
        console.log('✅ Approved laboratories seeded');
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
                description: 'WFP Nigeria leads the National Fortification Alliance, providing technical assistance, capacity building, and coordination support to strengthen the food fortification ecosystem.',
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
