#!/usr/bin/env node

/**
 * FAQ Import Script
 * Replaces all FAQ entries with the revised FAQ content
 * (8 categories: General, Certification & Compliance, Laboratories & Testing,
 * Regulations & Standards, Industry, Consumers, Partnerships, About the NFA).
 *
 * Keep this list in sync with frontend/src/lib/faq-data.ts.
 *
 * Usage:
 *   STRAPI_URL=https://your-strapi-host STRAPI_TOKEN=xxxx node scripts/import-faqs.js
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

async function strapiRequest(endpoint, method = 'GET', data = null) {
    const url = `${STRAPI_URL}/api${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(STRAPI_TOKEN && { 'Authorization': `Bearer ${STRAPI_TOKEN}` })
        }
    };
    if (data) options.body = JSON.stringify({ data });

    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
    }
    return await response.json();
}

const faqs = [
    // GENERAL
    { category: 'General', order: 1, question: 'What is food fortification?', answer: 'Food fortification is the deliberate addition of essential vitamins and minerals to commonly consumed foods to improve their nutritional value and help prevent micronutrient deficiencies. In Nigeria, mandatory food fortification is implemented as a public health strategy to improve nutrition and reduce vitamin and mineral deficiencies across the population.' },
    { category: 'General', order: 2, question: 'Why is food fortification important?', answer: 'Micronutrient deficiencies, often referred to as "hidden hunger," can lead to impaired growth, weakened immunity, poor cognitive development, birth defects, and reduced productivity. Food fortification helps address these deficiencies by improving the nutritional quality of staple foods consumed daily.' },
    { category: 'General', order: 3, question: 'Which foods are mandated for fortification in Nigeria?', answer: 'Nigeria currently mandates the fortification of selected staple foods, including:\n• Flour (Wheat, Maize, Composite)\n• Vegetable Oil\n• Sugar\n• Salt\n• Margarine\nEach food vehicle is fortified with specific micronutrients as prescribed under national regulations and standards.' },
    { category: 'General', order: 4, question: 'Is food fortification safe?', answer: 'Yes. Food fortification follows internationally accepted scientific standards and is implemented under national regulations. Only approved micronutrients are added in carefully controlled quantities to ensure safety and effectiveness.' },
    { category: 'General', order: 5, question: 'Who benefits from food fortification?', answer: 'Food fortification benefits the entire population, particularly:\n• Children\n• Pregnant and lactating women\n• Adolescents\n• Women of reproductive age\n• Vulnerable populations\n• The general public' },

    // CERTIFICATION & COMPLIANCE
    { category: 'Certification & Compliance', order: 1, question: 'How can my company become a certified fortification processor?', answer: 'Food processors should:\n• Register with NAFDAC.\n• Obtain all required product approvals.\n• Install appropriate fortification equipment.\n• Source approved vitamin and mineral premixes.\n• Implement quality assurance and quality control systems.\n• Train relevant personnel.\n• Comply with national fortification regulations.\n• Successfully pass facility inspections and product verification.' },
    { category: 'Certification & Compliance', order: 2, question: 'What quality assurance measures are required?', answer: 'Manufacturers are expected to maintain documented quality management systems, perform routine process monitoring, calibrate equipment, conduct laboratory testing, and maintain traceable production records.' },
    { category: 'Certification & Compliance', order: 3, question: 'How is compliance monitored?', answer: 'Compliance is monitored through routine inspections, factory audits, market surveillance, product sampling, laboratory analysis, and regulatory enforcement activities coordinated by relevant government agencies.' },
    { category: 'Certification & Compliance', order: 4, question: 'What happens if a company fails compliance testing?', answer: 'Products that fail to meet regulatory requirements may be subject to regulatory actions, including corrective measures, additional inspections, sanctions, product recalls, or other enforcement actions in accordance with applicable laws.' },
    { category: 'Certification & Compliance', order: 5, question: 'How often are fortified foods tested?', answer: 'Testing frequency depends on regulatory requirements, manufacturer quality control programmes, and routine compliance monitoring conducted by regulatory authorities.' },

    // LABORATORIES & TESTING
    { category: 'Laboratories & Testing', order: 1, question: 'Where can I find approved micronutrient laboratories?', answer: 'The National Fortification Alliance maintains a directory of recognized laboratories supporting micronutrient analysis and compliance monitoring. The directory is available under the Resources section of this website.' },
    { category: 'Laboratories & Testing', order: 2, question: 'Why is laboratory testing important?', answer: 'Laboratory analysis confirms that fortified foods contain the required micronutrients at prescribed levels and supports regulatory compliance, product quality, and consumer safety.' },
    { category: 'Laboratories & Testing', order: 3, question: 'Can any laboratory perform micronutrient analysis?', answer: 'Only laboratories with the required technical capacity, validated methods, qualified personnel, and appropriate equipment should perform micronutrient analysis for regulatory purposes.' },
    { category: 'Laboratories & Testing', order: 4, question: 'How can laboratories become recognized?', answer: 'Laboratories seeking recognition should demonstrate technical competence, maintain appropriate quality management systems, participate in proficiency testing where applicable, and satisfy established technical requirements.' },

    // REGULATIONS & STANDARDS
    { category: 'Regulations & Standards', order: 1, question: 'Which regulations govern food fortification in Nigeria?', answer: 'Food fortification is governed by national regulations, standards, and technical guidelines developed by relevant government institutions, including NAFDAC and the Standards Organisation of Nigeria (SON), in collaboration with other stakeholders.' },
    { category: 'Regulations & Standards', order: 2, question: 'Where can I access official fortification guidelines?', answer: 'Official technical guidelines, standards, regulations, manuals, and reference documents are available in the Resources section of this website.' },
    { category: 'Regulations & Standards', order: 3, question: 'Are Nigerian regulations aligned with international standards?', answer: "Nigeria's fortification programme is informed by international best practices and scientific recommendations while addressing national nutrition priorities and local consumption patterns." },

    // INDUSTRY
    { category: 'Industry', order: 1, question: 'Where can manufacturers obtain vitamin premixes?', answer: 'Vitamin and mineral premixes should be sourced from reputable suppliers that meet national regulatory requirements and recognized quality standards.' },
    { category: 'Industry', order: 2, question: 'What equipment is required for fortification?', answer: 'The required equipment depends on the specific food vehicle but generally includes dosing systems, mixers, monitoring devices, quality control equipment, and appropriate storage facilities.' },
    { category: 'Industry', order: 3, question: 'What are the most common challenges affecting food fortification?', answer: 'Common challenges include:\n• High cost of premixes\n• Foreign exchange constraints\n• Equipment maintenance\n• Laboratory testing costs\n• Supply chain disruptions\n• Capacity gaps\n• Quality assurance challenges' },
    { category: 'Industry', order: 4, question: 'Does the NFA provide technical support?', answer: 'Yes. The National Fortification Alliance facilitates technical guidance, stakeholder coordination, knowledge sharing, capacity building, and collaboration among programme partners.' },

    // CONSUMERS
    { category: 'Consumers', order: 1, question: 'How can I identify fortified food products?', answer: 'Consumers should purchase products that are properly registered with NAFDAC, bear the required product labeling (Fortification logo), and comply with national food regulations. Always read product labels before purchase.' },
    { category: 'Consumers', order: 2, question: 'Can fortified foods replace a balanced diet?', answer: 'No. Food fortification complements a healthy and balanced diet but does not replace good nutrition or healthy eating practices.' },
    { category: 'Consumers', order: 3, question: 'How can I report suspected non-compliance?', answer: 'Suspected cases of non-compliance may be reported to NAFDAC through its established consumer complaint channels or by contacting the National Fortification Alliance Secretariat.' },
    { category: 'Consumers', order: 4, question: 'Are fortified foods more expensive?', answer: 'Food fortification is designed to provide significant public health benefits at a relatively low cost while minimizing any impact on product affordability.' },

    // PARTNERSHIPS
    { category: 'Partnerships', order: 1, question: 'What is the National Fortification Alliance?', answer: "The National Fortification Alliance (NFA) is Nigeria's national multi-sectoral coordination platform for food fortification. It brings together government institutions, industry, academia, professional bodies, development partners, civil society organizations, and other stakeholders to strengthen and sustain food fortification programmes." },
    { category: 'Partnerships', order: 2, question: 'Who are the members of the Alliance?', answer: 'Membership includes representatives from:\n• Government Ministries, Departments and Agencies (MDAs)\n• Regulatory authorities\n• Food industry stakeholders\n• Development partners\n• Professional associations\n• Academic and research institutions\n• Civil society organizations\n• Consumer advocacy groups' },
    { category: 'Partnerships', order: 3, question: 'How can my organization become a partner?', answer: "Organizations interested in supporting Nigeria's food fortification programme may submit an Expression of Interest through the Partnership section of this website or contact the Secretariat for further guidance." },
    { category: 'Partnerships', order: 4, question: 'What benefits do partners receive?', answer: 'Partners benefit from:\n• Technical collaboration\n• Policy dialogue\n• Access to stakeholder networks\n• Capacity-building opportunities\n• Knowledge sharing\n• Programme coordination\n• Joint implementation initiatives' },

    // ABOUT THE NFA
    { category: 'About the NFA', order: 1, question: 'What is the role of the NFA Secretariat?', answer: 'The Secretariat coordinates the day-to-day operations of the Alliance, organizes meetings, facilitates stakeholder engagement, supports programme implementation, manages communications, maintains documentation, and monitors implementation of Alliance decisions.' },
    { category: 'About the NFA', order: 2, question: 'Which organization hosts the Secretariat?', answer: 'The National Fortification Alliance Secretariat is hosted by the National Agency for Food and Drug Administration and Control (NAFDAC).' },
    { category: 'About the NFA', order: 3, question: 'How often does the Alliance meet?', answer: 'The Alliance convenes bi-annual Steering Committee meetings, technical working sessions, stakeholder consultations, and bi-annual meetings to review progress and guide programme implementation.' },
    { category: 'About the NFA', order: 4, question: 'Does the NFA publish reports and communiqués?', answer: 'Yes. Meeting communiqués, technical resources, reports, and other official publications are made available through the News & Events and Resources sections of this website.' },
    { category: 'About the NFA', order: 5, question: 'How can I contact the Secretariat?', answer: 'You may contact the Secretariat through the Contact page using the published email address, telephone numbers, or office address. Organizations may also submit partnership inquiries, technical requests, or general enquiries through the official contact channels.' },
];

async function main() {
    console.log(`📡 Connecting to Strapi at: ${STRAPI_URL}\n`);
    console.log('❓ Importing FAQs...');

    try {
        const existing = await strapiRequest('/faqs?pagination[pageSize]=100');
        for (const item of existing.data) {
            await strapiRequest(`/faqs/${item.documentId}`, 'DELETE');
        }
        console.log(`   Deleted ${existing.data.length} existing FAQs`);
    } catch (err) {
        console.log('   No existing FAQs to delete');
    }

    let created = 0;
    for (const faq of faqs) {
        try {
            await strapiRequest('/faqs', 'POST', {
                ...faq,
                is_active: true,
                publishedAt: new Date().toISOString(),
            });
            created += 1;
            console.log(`   ✅ Created [${faq.category}] ${faq.question}`);
        } catch (error) {
            console.error(`   ❌ Failed: ${faq.question} — ${error.message}`);
        }
    }

    console.log(`\n✅ FAQ import complete: ${created}/${faqs.length} created.\n`);
}

if (typeof fetch === 'undefined') {
    console.error('❌ This script requires Node.js 18+ with built-in fetch');
    process.exit(1);
}

main().catch((err) => {
    console.error('\n❌ Import failed:', err.message);
    process.exit(1);
});
