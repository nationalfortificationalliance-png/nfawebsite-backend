import type { Core } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';
import { sendNewsItemNotification, sendReportNotification, sendBroadcast } from './utils/newsletter';

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
        'api::contact-page.contact-page',
        'api::governance-representative.governance-representative',
        'api::meeting-schedule.meeting-schedule',
        'api::industry-challenge.industry-challenge',
        'api::member-organization.member-organization',
        'api::compliance-report.compliance-report',
        'api::faq.faq',
        'api::report.report',
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
        'api::privacy-policy.privacy-policy',
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

    // Seed a placeholder Privacy Policy so the page has content in every environment,
    // including production — real legal copy will replace this later.
    await seedPrivacyPolicy(strapi);

    // Seed/backfill the About Page (history, stats, timeline) so this real content
    // reaches production too, instead of relying on the frontend's hardcoded fallback text.
    await seedAboutPage(strapi);

    // Seed sample data if environment is development and DB is empty
    if (process.env.NODE_ENV === 'development') {
        await seedSampleData(strapi);
    }

    // Add plain-language field descriptions to the admin edit views so a
    // non-technical editor understands what each field does and where it
    // appears on the live site. Purely cosmetic — never hides or reorders
    // fields, only fills in the "description" hint text under each one.
    await configureContentManagerFieldHints(strapi);

    // Newsletter: publishing an entry is the "send" trigger. News/Report items
    // only send if the editor opted in via notify_subscribers (publishing an
    // ordinary news item must never spam subscribers). Broadcasts always send
    // on publish. Both are guarded by a "notified" flag so republishing/editing
    // afterwards never re-sends.
    strapi.eventHub.on('entry.publish', async (event: { uid: string; entry: Record<string, unknown> }) => {
        const { uid, entry } = event;
        try {
            if (uid === 'api::news-event.news-event') {
                if (entry.notify_subscribers && !entry.subscribers_notified) {
                    const count = await sendNewsItemNotification(strapi, {
                        title: entry.title as string,
                        excerpt: entry.excerpt as string | undefined,
                        slug: entry.slug as string,
                        category: entry.category as string,
                    });
                    await strapi.documents('api::news-event.news-event').update({
                        documentId: entry.documentId as string,
                        data: { subscribers_notified: true },
                        status: 'published',
                    });
                    strapi.log.info(`Newsletter: notified ${count} subscriber(s) about news item "${entry.title}".`);
                }
            } else if (uid === 'api::report.report') {
                if (entry.notify_subscribers && !entry.subscribers_notified) {
                    const count = await sendReportNotification(strapi, {
                        title: entry.title as string,
                        description: entry.description as string | undefined,
                    });
                    await strapi.documents('api::report.report').update({
                        documentId: entry.documentId as string,
                        data: { subscribers_notified: true },
                        status: 'published',
                    });
                    strapi.log.info(`Newsletter: notified ${count} subscriber(s) about report "${entry.title}".`);
                }
            } else if (uid === 'api::newsletter-broadcast.newsletter-broadcast') {
                if (!entry.sent) {
                    const count = await sendBroadcast(strapi, {
                        subject: entry.subject as string,
                        body: entry.body as string,
                    });
                    await strapi.documents('api::newsletter-broadcast.newsletter-broadcast').update({
                        documentId: entry.documentId as string,
                        data: { sent: true, sent_at: new Date().toISOString(), recipient_count: count },
                        status: 'published',
                    });
                    strapi.log.info(`Newsletter: broadcast "${entry.subject}" sent to ${count} subscriber(s).`);
                }
            }
        } catch (err) {
            strapi.log.error(`Newsletter send failed for ${uid}: ${(err as Error).message}`);
        }
    });
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

async function seedPrivacyPolicy(strapi: Core.Strapi) {
    const uid = 'api::privacy-policy.privacy-policy';

    const existing = await strapi.entityService.findMany(uid, {});
    if (existing && Object.keys(existing).length > 0) {
        return;
    }

    await strapi.entityService.create(uid, {
        data: {
            title: 'Privacy Policy',
            last_updated: new Date().toISOString().slice(0, 10),
            body:
                '<p><em>This is placeholder content. The National Fortification Alliance\'s full Privacy Policy is being finalised and will replace this text.</em></p>' +
                '<h2>Overview</h2>' +
                '<p>The National Fortification Alliance (NFA) respects your privacy and is committed to protecting any personal information you share with us through this website, including via our contact and subscription forms.</p>' +
                '<h2>Information We Collect</h2>' +
                '<p>We may collect basic contact details (such as name, email address, and phone number) when you voluntarily submit them through forms on this site.</p>' +
                '<h2>How We Use Information</h2>' +
                '<p>Information submitted to us is used solely to respond to enquiries, share updates you have requested, and improve our services. We do not sell or rent personal information to third parties.</p>' +
                '<h2>Contact Us</h2>' +
                '<p>If you have questions about this policy, please reach out via the Contact page.</p>',
            publishedAt: new Date(),
        },
    });
    console.log('✅ Privacy policy placeholder seeded');
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
            last_updated: '2026-07-29',
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
            last_updated: '2026-07-29',
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
            last_updated: '2026-07-29',
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
            last_updated: '2026-07-29',
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

    // Remove placeholder reps (no name) for orgs no longer displayed on the Governance page.
    const placeholders = await strapi.db.query(uid).findMany({
        where: { organization_key: { $in: ['FMOHSW', 'Development Partners'] }, name: '' },
    }) as any[];
    for (const placeholder of placeholders) {
        await strapi.documents(uid).delete({ documentId: placeholder.documentId });
    }
    if (placeholders.length > 0) {
        console.log(`✅ Removed ${placeholders.length} placeholder governance representative(s)`);
    }

    console.log('✅ Governance representative profiles seeded');
}

async function seedAboutPage(strapi: Core.Strapi) {
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
        populate: ['timeline_items'],
    });
    const aboutNeedsBackfill = aboutRows.some(
        (row: any) =>
            (!row.timeline_items || row.timeline_items.length === 0) ||
            !row.history_intro
    );
    if (aboutRows.length > 0 && aboutNeedsBackfill) {
        const row = aboutRows[0] as any;
        const documentId = row.documentId;
        const data: Record<string, any> = {};

        if (!row.history_intro) {
            data.history_intro =
                "What began as a regulatory mandate to fortify Nigeria's staple foods has grown into a coordinated, multi-stakeholder programme — spanning government, industry, and development partners — reaching millions of households with essential vitamins and minerals.";
        }

        if (!row.timeline_items || row.timeline_items.length === 0) {
            data.timeline_items = [
                { year: '2004', event: 'Nigeria enacts the Food, Drugs and Related Products (Fortification) Regulation, making fortification mandatory for key staple foods.' },
                { year: '2011', event: 'WFP Nigeria launches the National Fortification Alliance with NAFDAC to strengthen enforcement and processor capacity across 6 key food vehicles.' },
                { year: '2016', event: 'Coverage of Vitamin A-fortified vegetable oil reaches 70% of households. NFA introduces the national quality mark seal for certified products.' },
                { year: '2020', event: "NFA expands to include Maize Flour and Wheat Flour in NAFDAC's mass fortification mandate. Premix fund established for small processors." },
                { year: '2024', event: 'Over 200 processors certified across 36 states, reaching 12M+ consumers. NFA achieves 68% household coverage of fortified staple foods.' },
            ] as any;
        }

        if (Object.keys(data).length > 0) {
            await strapi.documents('api::about-page.about-page').update({ documentId, data });
            await strapi.documents('api::about-page.about-page').publish({ documentId });
            console.log('✅ About page stats/timeline backfilled');
        }
    }
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

    // Seed Meeting Schedule
    const existingMeetings = await strapi.entityService.findMany(
        'api::meeting-schedule.meeting-schedule',
        {}
    );
    if (!existingMeetings || (existingMeetings as any[]).length === 0) {
        const meetingsData = [
            { year: '2026', june_host: 'NAFDAC', december_host: 'Industry', order: 1 },
            { year: '2027', june_host: 'SON', december_host: 'FCCPC', order: 2 },
            { year: '2028', june_host: 'FMoHSW', december_host: 'NAFDAC', order: 3 },
        ];
        for (const meeting of meetingsData) {
            await strapi.entityService.create('api::meeting-schedule.meeting-schedule', {
                data: { ...meeting, publishedAt: new Date() },
            });
        }
        console.log('✅ Meeting schedule seeded');
    }

    // Seed Compliance Reports (relocated from About Page key_stats — updatable
    // year by year here instead of requiring a code change on the About Page).
    const existingComplianceReports = await strapi.entityService.findMany(
        'api::compliance-report.compliance-report',
        {}
    );
    if (!existingComplianceReports || (existingComplianceReports as any[]).length === 0) {
        await strapi.entityService.create('api::compliance-report.compliance-report', {
            data: {
                year: '2024',
                national_compliance: '57%',
                salt_compliance: '67%',
                veg_oil_compliance: '58%',
                flour_compliance: '48%',
                source: 'NAFDAC Compliance Monitoring Report',
                order: 1,
                publishedAt: new Date(),
            },
        });
        console.log('✅ Compliance report seeded');
    }

    // Seed FAQs
    const existingFAQs = await strapi.entityService.findMany('api::faq.faq', {});
    if (!existingFAQs || (existingFAQs as any[]).length === 0) {
        const faqsData = [
            {
                question: 'What is food fortification?',
                answer: 'Food fortification is the process of adding essential vitamins and minerals to commonly consumed foods to improve their nutritional value. In Nigeria, fortification is mandatory for wheat flour, vegetable oil, sugar, and salt to combat micronutrient deficiencies.',
                category: 'General',
                order: 1,
            },
            {
                question: 'Which foods are mandated for fortification in Nigeria?',
                answer: 'Nigeria mandates fortification of six key food vehicles: wheat flour (with iron, folic acid, zinc, vitamin B12), vegetable oil (with vitamin A), sugar (with vitamin A), and salt (with iodine). These foods were chosen based on consumption patterns and their ability to reach large populations.',
                category: 'General',
                order: 2,
            },
            {
                question: 'How do I become a certified fortification processor?',
                answer: 'To become certified, food processors must: (1) Register with NAFDAC, (2) Install appropriate fortification equipment, (3) Implement quality assurance and quality control systems, (4) Train staff on fortification protocols, (5) Pass NAFDAC facility inspections, and (6) Demonstrate consistent compliance through product testing.',
                category: 'Certification',
                order: 3,
            },
            {
                question: 'What is the role of the National Fortification Alliance?',
                answer: "The NFA serves as the coordination platform bringing together government agencies (NAFDAC, SON, FMoH), industry partners, development organizations (WFP, GAIN), academia, and civil society to strengthen Nigeria's food fortification program through policy advocacy, capacity building, monitoring, and stakeholder engagement.",
                category: 'About NFA',
                order: 4,
            },
            {
                question: 'How can I verify if a product is properly fortified?',
                answer: 'Look for the NAFDAC fortification logo/seal on product packaging. Certified products must display this mark. Consumers can also report suspected non-compliance to NAFDAC through their hotline or the NFA secretariat.',
                category: 'General',
                order: 5,
            },
            {
                question: 'Where can I access fortification guidelines and standards?',
                answer: 'All technical guidelines, regulatory standards, and compliance documents are available on our Guidelines page. This includes NAFDAC regulations, SON standards, WHO recommendations, and operational manuals for processors.',
                category: 'Resources',
                order: 6,
            },
        ];
        for (const faq of faqsData) {
            await strapi.entityService.create('api::faq.faq', {
                data: { ...faq, is_active: true, publishedAt: new Date() },
            });
        }
        console.log('✅ FAQs seeded');
    }

    // Seed Initiatives (Project & Initiative content type, shown on the Initiatives page)
    const existingInitiatives = await strapi.entityService.findMany('api::project.project', {});
    if (!existingInitiatives || (existingInitiatives as any[]).length === 0) {
        const initiativesData = [
            {
                title: 'Rice Fortification',
                icon: 'trending-up',
                description: 'Partnering with millers, regulators and distributors to make fortified rice more available, affordable and trusted across Nigeria.',
                highlights: [
                    { text: 'Scale fortified rice production and distribution' },
                    { text: 'Strengthen regulatory compliance and lab checks' },
                    { text: 'Support premix market development' },
                    { text: 'Build industry and laboratory capacity' },
                    { text: 'Raise consumer awareness and demand' },
                ],
                category: 'Fortification',
                status: 'Active',
                order: 1,
            },
            {
                title: 'Bouillon Fortification',
                icon: 'search',
                description: 'Evaluating bouillon cubes as a strategic fortification vehicle while balancing nutrition benefit and sodium reduction priorities.',
                highlights: [
                    { text: 'Conduct nutrient profiling and taste studies' },
                    { text: 'Assess iodine and sodium impacts' },
                    { text: 'Analyze consumer behavior' },
                    { text: 'Develop draft standards and codes of practice' },
                    { text: 'Coordinate industry engagement' },
                ],
                category: 'Research',
                status: 'Active',
                order: 2,
            },
            {
                title: 'DFQT+ Digital Monitoring',
                icon: 'activity',
                description: 'Deploying digital traceability and quality monitoring systems that help regulators and producers track fortified products in near real time.',
                highlights: [
                    { text: 'Support digital compliance workflows' },
                    { text: 'Chart premix and product traceability' },
                    { text: 'Improve audit efficiency' },
                    { text: 'Drive informed enforcement' },
                    { text: 'Strengthen governance and transparency' },
                ],
                category: 'Technology',
                status: 'Active',
                order: 3,
            },
        ];
        for (const initiative of initiativesData) {
            await strapi.entityService.create('api::project.project', {
                data: { ...initiative, is_active: true, is_featured: true, publishedAt: new Date() } as any,
            });
        }
        console.log('✅ Initiatives seeded');
    }

    // Backfill: any project rows created before the is_active field existed
    // default to null, which would hide them under the new is_active filter.
    const projectRows = await strapi.db.query('api::project.project').findMany({});
    const inactiveProjectRows = (projectRows as any[]).filter((row) => row.is_active === null);
    for (const row of inactiveProjectRows) {
        await strapi.documents('api::project.project').update({
            documentId: row.documentId,
            data: { is_active: true },
        });
        await strapi.documents('api::project.project').publish({ documentId: row.documentId });
    }
    if (inactiveProjectRows.length > 0) {
        console.log(`✅ Backfilled is_active on ${inactiveProjectRows.length} existing initiative(s)`);
    }

    // Seed Industry Challenges
    type ChallengeCategory = 'Supply Chain' | 'Technical & Equipment' | 'Quality & Compliance' | 'Regulatory & Customs';
    const challengesData: { text: string; category: ChallengeCategory }[] = [
        { text: 'Scarcity of Vitamin A Palmitate', category: 'Supply Chain' },
        { text: 'Foreign exchange constraints affecting premix supply', category: 'Supply Chain' },
        { text: 'Technical limitations in fortification equipment', category: 'Technical & Equipment' },
        { text: 'Challenges with shelf-life stability studies', category: 'Technical & Equipment' },
        { text: 'Technical capacity gaps in micronutrient testing', category: 'Technical & Equipment' },
        { text: 'Inconsistencies in laboratory analytical results', category: 'Quality & Compliance' },
        { text: 'Packaging and storage limitations', category: 'Quality & Compliance' },
        { text: 'Informal retail packaging challenges', category: 'Quality & Compliance' },
        { text: 'Inconsistent customs tariff implementation', category: 'Regulatory & Customs' },
        { text: 'Inadequate monitoring of imported products', category: 'Regulatory & Customs' },
    ];
    const existingChallenges = await strapi.entityService.findMany(
        'api::industry-challenge.industry-challenge',
        {}
    );
    if (!existingChallenges || (existingChallenges as any[]).length === 0) {
        for (let i = 0; i < challengesData.length; i++) {
            await strapi.entityService.create('api::industry-challenge.industry-challenge', {
                data: { ...challengesData[i], order: i + 1, publishedAt: new Date() },
            });
        }
        console.log('✅ Industry challenges seeded');
    } else {
        // Backfill category on rows created before the category field existed
        const challengeRows = await strapi.db.query('api::industry-challenge.industry-challenge').findMany({});
        const needsCategoryBackfill = challengeRows.some((row: any) => !row.category);
        if (needsCategoryBackfill) {
            for (const row of challengeRows as any[]) {
                const match = challengesData.find((c) => c.text === row.text);
                if (match && !row.category) {
                    await strapi.documents('api::industry-challenge.industry-challenge').update({
                        documentId: row.documentId,
                        data: { category: match.category },
                    });
                    await strapi.documents('api::industry-challenge.industry-challenge').publish({ documentId: row.documentId });
                }
            }
            console.log('✅ Industry challenge categories backfilled');
        }
    }

    // Seed Member Organizations
    const membersData: { name: string; category: string; logoKey?: string }[] = [
        { name: 'Standards Organisation of Nigeria (SON)', category: 'Core Members', logoKey: 'SON' },
        { name: 'National Agency for Food and Drug Administration and Control (NAFDAC)', category: 'Core Members', logoKey: 'NAFDAC' },
        { name: 'Federal Ministry of Education (FME)', category: 'Core Members' },
        { name: 'Federal Competition and Consumer Protection Commission (FCCPC)', category: 'Core Members', logoKey: 'FCCPC' },
        { name: 'Federal Ministry of Health and Social Welfare (FMoHSW) — Nutrition Department', category: 'Core Members', logoKey: 'FMOHSW' },
        { name: 'Federal Ministry of Agriculture and Food Security (FMAFS)', category: 'Core Members' },
        { name: 'Federal Ministry of Budget and Economic Planning (FMBEP)', category: 'Core Members' },
        { name: 'Institute of Public Analysts of Nigeria (IPAN)', category: 'Core Members' },
        { name: 'Federal Ministry of Information and National Orientation (FMINO)', category: 'Core Members' },
        { name: 'Industry', category: 'Core Members' },
        { name: 'Development Partners (GAIN, HKI, TechnoServe, WFP, UNICEF, etc.)', category: 'Stakeholders' },
        { name: 'Academia', category: 'Stakeholders' },
        { name: 'Professional Associations (e.g., NIFST, NSN)', category: 'Stakeholders' },
        { name: 'Civil Society Organisations (CSOs) / Non-Governmental Organisations (NGOs)', category: 'Stakeholders' },
        { name: 'Media', category: 'Stakeholders' },
    ];
    const existingMembers = await strapi.entityService.findMany(
        'api::member-organization.member-organization',
        {}
    );
    if (!existingMembers || (existingMembers as any[]).length === 0) {
        for (let i = 0; i < membersData.length; i++) {
            const { logoKey, ...rest } = membersData[i];
            const logo = logoKey ? (await uploadLocalImage(strapi, ORG_LOGO_FILES[logoKey])).id : undefined;
            await strapi.entityService.create('api::member-organization.member-organization', {
                data: { ...rest, logo, order: i + 1, publishedAt: new Date() } as any,
            });
        }
        console.log('✅ Member organizations seeded');
    } else {
        // Backfill logo media on rows created before the logo field existed
        const memberRows = await strapi.db.query('api::member-organization.member-organization').findMany({
            populate: ['logo'],
        });
        for (const row of memberRows as any[]) {
            const match = membersData.find((m) => m.name === row.name);
            if (match?.logoKey && !row.logo) {
                const logo = (await uploadLocalImage(strapi, ORG_LOGO_FILES[match.logoKey])).id;
                await strapi.documents('api::member-organization.member-organization').update({
                    documentId: row.documentId,
                    data: { logo } as any,
                });
                await strapi.documents('api::member-organization.member-organization').publish({ documentId: row.documentId });
            }
        }
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
                category: 'report',
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

// Plain-language hint text shown under each field in the admin edit view,
// keyed by content-type/component uid, then field name. Only fills in the
// `description` shown to the editor — never touches field order or visibility.
const FIELD_HINTS: Record<string, Record<string, string>> = {
    'api::about-page.about-page': {
        mission: "The Alliance's core mission statement, shown near the top of the About page.",
        vision: 'The long-term vision statement shown on the About page.',
        hero_tagline: 'Short tagline shown over the banner image at the top of the About page.',
        hero_image: 'Background photo for the banner at the top of the About page.',
        body: "Main introductory text describing the Alliance's work.",
        objectives: 'The list of strategic objectives shown on the About page.',
        background: 'Background/context paragraph explaining why the Alliance was formed.',
        history_intro: 'Short introduction shown above the History timeline. Leave blank to hide this text.',
        timeline_items: 'The year-by-year History timeline. Add one entry per milestone.',
        seo: "Search engine title/description for this page (optional — improves how it appears in Google search results).",
    },
    'api::carousel.carousel': {
        title: 'Main heading shown on this homepage hero slide.',
        subtitle: 'Supporting text shown below the heading on this slide.',
        image: 'Background photo for this hero slide.',
        link_url: "Where the slide's button links to, e.g. /about.",
        link_text: "Text shown on the slide's button, e.g. 'Learn More'.",
        order: 'Controls the order slides appear in (lower numbers show first).',
        is_active: 'Turn off to hide this slide from the homepage without deleting it.',
    },
    'api::compliance-report.compliance-report': {
        year: 'The year this compliance data covers, e.g. 2024.',
        national_compliance: 'Overall national compliance percentage for that year, e.g. 57%.',
        salt_compliance: 'Iodized salt compliance percentage.',
        veg_oil_compliance: 'Vitamin A vegetable oil compliance percentage.',
        flour_compliance: 'Fortified flour compliance percentage.',
        source: 'Where this data came from, e.g. NAFDAC Compliance Monitoring Report.',
        is_active: "Turn off to hide this year's report without deleting it.",
        order: 'Controls display order on the News & Events page (lower numbers show first).',
    },
    'api::contact-message.contact-message': {
        name: 'Name entered by the visitor who submitted the contact form.',
        email: 'Email address of the visitor.',
        subject: 'Subject line of the message.',
        message: 'The message content submitted by the visitor.',
        attachments: 'Any file the visitor attached to their message.',
        isRead: 'Whether this message has been marked as read.',
    },
    'api::contact-page.contact-page': {
        hero_title: 'Main heading on the Contact page banner.',
        hero_description: 'Supporting text shown under the heading on the Contact page.',
        hero_image: 'Background photo for the Contact page banner.',
        office_name: 'Name of the office shown in the address block, e.g. NAFDAC Office.',
        address_line_1: 'First line of the office address.',
        address_line_2: 'Second line of the office address.',
        address_line_3: 'Third line of the office address.',
        address_line_4: 'Fourth line of the office address.',
        address_line_5: 'Fifth line of the office address (e.g. country).',
        email_contacts: 'List of email contacts shown on the Contact page. Advanced field — must stay in JSON format, e.g. [{"label":"General Inquiries","email":"info@example.com"}].',
        phone_contacts: 'List of phone contacts shown on the Contact page. Advanced field — must stay in JSON format, e.g. [{"label":"NFA Secretariat","phone":"08000000000"}].',
        office_hours: 'Office opening hours text, one line per day/range.',
        office_hours_note: 'Small note shown under office hours, e.g. holiday closures.',
    },
    'api::faq.faq': {
        question: 'The question text shown on the FAQ page.',
        answer: 'The answer shown when the question is expanded.',
        category: 'Groups related questions together under a heading, e.g. General, Certification.',
        order: 'Controls display order within its category (lower numbers show first).',
        is_active: 'Turn off to hide this question without deleting it.',
    },
    'api::global-setting.global-setting': {
        site_name: 'The name of the website/organisation, used across the site and in the browser tab.',
        site_tagline: 'Short tagline shown alongside the site name.',
        contact_email: 'Main contact email address used site-wide.',
        contact_phone: 'Main contact phone number used site-wide.',
        address: 'Main office address used site-wide (e.g. in the footer).',
        twitter_url: "Link to the organisation's X/Twitter page.",
        facebook_url: "Link to the organisation's Facebook page.",
        linkedin_url: "Link to the organisation's LinkedIn page.",
        footer_text: 'Text shown in the website footer, e.g. copyright line.',
        stats_source: 'Citation shown under the nutrition statistics on the Home and About pages.',
        logo: "The organisation's logo, shown in the site header.",
        seo: "Default search engine title/description used when a page doesn't set its own.",
    },
    'api::governance-representative.governance-representative': {
        name: 'Full name of the representative.',
        title: 'Their job title or role.',
        organization_name: 'Full name of the organisation they represent.',
        organization_short_name: 'Short name/acronym of the organisation, e.g. NAFDAC.',
        organization_logo: 'Logo of the organisation they represent.',
        organization_key: 'Which organisation this representative belongs to — used to group representatives on the Governance page.',
        photo: 'Photo of the representative.',
        bio: 'Short biography of the representative.',
        organization_profile: "Short description of the organisation's role within the Alliance.",
        key_contributions: "Bullet list of this organisation's key contributions/responsibilities.",
        order: 'Controls display order (lower numbers show first).',
        is_active: 'Turn off to hide this representative without deleting them.',
        last_updated: "Date this entry's information was last verified/updated.",
    },
    'api::guideline-document.guideline-document': {
        title: 'Name of the document as shown on the Resources page.',
        description: 'Short description of what the document contains.',
        file: 'The document file itself (PDF, Word, etc.) for visitors to download.',
        category: 'Which section of the Resources page this document appears under.',
        published_date: 'Date the document was published — used for sorting, newest first.',
        file_size: "File size shown next to the download link, e.g. '2.4 MB'.",
        is_featured: 'Highlight this document at the top of its category.',
        document_type: 'What kind of document this is (Guideline, Standard, Regulation, etc.) — used as a filter on the Resources page.',
        food_vehicles: 'Which fortified foods this document relates to, comma-separated, e.g. "Salt, Vegetable Oil" — used as a filter.',
        agency: 'Which agency published or owns this document — used as a filter.',
        status: 'Whether this document is the current version, a revision, or archived — used as a filter.',
    },
    'api::report.report': {
        title: 'Title of the report as shown on the Reports & Data page.',
        description: 'Short summary of what the report covers.',
        file: 'The report file itself (PDF, Word, etc.) for visitors to download.',
        year: 'The year this report covers, e.g. 2026.',
        agency: 'Which agency published this report — used as a filter.',
        report_type: 'What kind of report this is — used as a filter.',
        food_vehicles: 'Which fortified foods this report relates to, comma-separated, e.g. "Salt, Vegetable Oil" — used as a filter.',
        topics: 'Topics this report covers, comma-separated, e.g. "Compliance, Vitamin A" — used as a filter.',
        published_date: 'Date the report was published — used for sorting, newest first.',
        file_size: "File size shown next to the download link, e.g. '2.4 MB'.",
        is_featured: 'Highlight this report at the top of the list.',
        download_count: 'Number of times this report has been downloaded.',
        order: 'Controls display order (lower numbers show first).',
        notify_subscribers: 'Check this box, then Publish, to email newsletter subscribers about this report.',
        subscribers_notified: 'Set automatically once the notification email has been sent. Do not edit.',
    },
    'api::newsletter-broadcast.newsletter-broadcast': {
        subject: 'Email subject line sent to all active subscribers.',
        body: 'Email content sent to all active subscribers.',
        sent: 'Set automatically once this broadcast has been emailed. Do not edit.',
        sent_at: 'Set automatically to the date/time this broadcast was sent. Do not edit.',
        recipient_count: 'Set automatically to how many subscribers received this broadcast.',
    },
    'api::industry-challenge.industry-challenge': {
        text: 'Description of the challenge, shown as a single bullet point.',
        category: 'Which group of challenges this belongs to on the Resources page.',
        is_active: 'Turn off to hide this item without deleting it.',
        order: 'Controls display order within its category (lower numbers show first).',
    },
    'api::laboratory.laboratory': {
        name: 'Name of the approved laboratory.',
        location: 'City or state where the laboratory is located.',
        contact: 'Phone number for the laboratory.',
        email: 'Email address for the laboratory.',
        address: 'Full postal address of the laboratory.',
        services: 'List of testing services the laboratory offers.',
        accreditation: 'Accreditation body/certificate reference, if any.',
        is_active: 'Turn off to hide this laboratory without deleting it.',
        order: 'Controls display order (lower numbers show first).',
        latitude: 'Approximate latitude for the map pin (decimal degrees, e.g. 6.5244).',
        longitude: 'Approximate longitude for the map pin (decimal degrees, e.g. 3.3792).',
    },
    'api::meeting-schedule.meeting-schedule': {
        year: 'The year this meeting schedule covers, e.g. 2026.',
        june_host: 'Organisation hosting the mid-year (June) meeting.',
        december_host: 'Organisation hosting the year-end (December) meeting.',
        is_active: "Turn off to hide this year's schedule without deleting it.",
        order: 'Controls display order (lower numbers show first).',
    },
    'api::member-organization.member-organization': {
        name: 'Name of the member organisation.',
        category: 'Whether this organisation is a Core Member or wider Stakeholder.',
        logo: 'Logo of the member organisation.',
        is_active: 'Turn off to hide this organisation without deleting it.',
        order: 'Controls display order (lower numbers show first).',
    },
    'api::news-event.news-event': {
        title: 'Headline of the news article or event.',
        slug: 'Auto-generated web address for this article — usually leave as is.',
        excerpt: 'Short summary shown in article listing cards.',
        body: 'Full article content.',
        date: 'Publish date, or the date of the event.',
        image: 'Main image shown with the article.',
        gallery: 'Extra photos shown within the article, if any.',
        category: 'Whether this is a news article, event, communique, or report.',
        file: 'Optional attached document, e.g. a communique PDF.',
        is_featured: 'Highlight this article at the top of the News page.',
        tags: 'Optional keywords, separated by commas, to help group related articles.',
        seo: 'Search engine title/description for this specific article.',
        notify_subscribers: 'Check this box, then Publish, to email newsletter subscribers about this article.',
        subscribers_notified: 'Set automatically once the notification email has been sent. Do not edit.',
    },
    'api::partner.partner': {
        name: 'Name of the partner organisation.',
        logo: "Partner's logo image.",
        website_url: "Link to the partner's website.",
        description: 'Short description of the partnership.',
        order: 'Controls display order (lower numbers show first).',
        is_active: 'Turn off to hide this partner without deleting it.',
        partner_type: 'Category used to group partners on the Partners page.',
    },
    'api::privacy-policy.privacy-policy': {
        title: 'Page title shown at the top of the Privacy Policy page.',
        last_updated: 'Date the policy was last revised — shown to visitors.',
        body: 'Full text of the privacy policy.',
    },
    'api::project.project': {
        title: 'Name of the initiative, shown as the card heading.',
        slug: 'Auto-generated web address for this initiative — usually leave as is.',
        description: "Summary paragraph shown on the initiative's card.",
        icon: "Small icon shown at the top of the initiative's card.",
        highlights: 'Bullet list of key activities shown under the description.',
        objectives: 'Optional extended objectives text (not currently shown on the public site).',
        image: 'Optional image for this initiative (not currently shown on the public site).',
        category: 'Internal grouping category for this initiative (not currently shown on the public site).',
        status: 'Current status of the initiative (not currently shown on the public site).',
        start_date: 'Date the initiative started (not currently shown on the public site).',
        is_featured: 'Highlight this initiative (not currently shown on the public site).',
        is_active: 'Turn off to hide this initiative from the Initiatives page without deleting it.',
        order: 'Controls display order (lower numbers show first).',
    },
    'api::quote.quote': {
        text: 'The quote text shown on the Home page.',
        author_name: 'Name of the person being quoted.',
        author_title: 'Their job title.',
        author_organization: 'Their organisation.',
        author_image: 'Photo of the person being quoted.',
        is_active: 'Turn off to hide this quote without deleting it. Only one active quote is shown at a time.',
    },
    'api::statistic.statistic': {
        label: "Short label for this statistic, e.g. 'Child Stunting Rate'.",
        value: "The headline number, e.g. '37%'.",
        description: 'One sentence explaining the statistic, shown alongside it.',
        order: 'Controls display order (lower numbers show first).',
        category: 'Groups related statistics together.',
        is_featured: 'Include this statistic in the featured set shown on the Home and About pages.',
    },
    'api::subscriber.subscriber': {
        email: 'Email address of the newsletter subscriber.',
        isActive: 'Whether this subscriber is currently active.',
    },
    'api::team-member.team-member': {
        name: 'Full name of the team member.',
        role: 'Their job title/role.',
        bio: 'Short biography.',
        image: 'Photo of the team member.',
        order: 'Controls display order (lower numbers show first).',
        organization: 'Organisation they belong to, if different from NFA.',
        category: 'Which group they appear under on the Secretariat page: Leadership, Secretariat, or Focal Point.',
        phone: 'Contact phone number.',
        email: 'Contact email address.',
    },
    'about.timeline-item': {
        year: 'Year of this milestone, e.g. 2004.',
        event: 'Description of what happened that year.',
    },
    'shared.seo': {
        metaTitle: 'Page title shown in Google search results and browser tabs (max ~60 characters).',
        metaDescription: 'Short summary shown under the title in Google search results (max ~160 characters).',
        shareImage: 'Image shown when this page is shared on social media.',
    },
    'shared.bullet-point': {
        text: 'The bullet point text.',
    },
};

async function configureContentManagerFieldHints(strapi: Core.Strapi) {
    const contentTypesService = strapi.plugin('content-manager').service('content-types');
    const componentsService = strapi.plugin('content-manager').service('components');

    for (const [uid, hints] of Object.entries(FIELD_HINTS)) {
        const isComponent = !uid.startsWith('api::');
        try {
            const model = isComponent
                ? componentsService.findComponent(uid)
                : contentTypesService.findContentType(uid);
            if (!model) continue;

            const current = isComponent
                ? await componentsService.findConfiguration(model)
                : await contentTypesService.findConfiguration(model);

            const metadatas = { ...current.metadatas };
            let changed = false;
            for (const [field, description] of Object.entries(hints)) {
                if (!metadatas[field]) continue;
                const existingDescription = metadatas[field]?.edit?.description;
                if (existingDescription === description) continue;
                metadatas[field] = {
                    ...metadatas[field],
                    edit: { ...metadatas[field].edit, description },
                };
                changed = true;
            }
            if (!changed) continue;

            const newConfig = {
                settings: current.settings,
                metadatas,
                layouts: current.layouts,
            };

            if (isComponent) {
                await componentsService.updateConfiguration(model, newConfig);
            } else {
                await contentTypesService.updateConfiguration(model, newConfig);
            }
        } catch (err) {
            strapi.log.warn(`Could not set admin field hints for ${uid}: ${(err as Error).message}`);
        }
    }
    console.log('✅ Admin field descriptions configured');
}

export default bootstrap;
