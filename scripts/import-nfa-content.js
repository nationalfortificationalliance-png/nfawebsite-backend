#!/usr/bin/env node

/**
 * NFA Content Import Script
 * Imports all content from content-data.json into Strapi via REST API
 *
 * Usage: node scripts/import-nfa-content.js
 */

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || ''; // Optional: use API token for production

// Load content data
const contentDataPath = path.join(__dirname, '..', 'content-data.json');
const contentData = JSON.parse(fs.readFileSync(contentDataPath, 'utf8'));

console.log('🚀 NFA Content Import Script');
console.log('================================\n');

/**
 * Make authenticated request to Strapi API
 */
async function strapiRequest(endpoint, method = 'GET', data = null) {
    const url = `${STRAPI_URL}/api${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(STRAPI_TOKEN && { 'Authorization': `Bearer ${STRAPI_TOKEN}` })
        }
    };

    if (data) {
        options.body = JSON.stringify({ data });
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Error calling ${endpoint}:`, error.message);
        throw error;
    }
}

/**
 * Import carousel slides
 */
async function importCarousel() {
    console.log('\n📸 Importing Carousel Slides...');

    // Delete existing carousels
    try {
        const existing = await strapiRequest('/carousels');
        for (const item of existing.data) {
            await strapiRequest(`/carousels/${item.documentId}`, 'DELETE');
        }
        console.log(`   Deleted ${existing.data.length} existing slides`);
    } catch (err) {
        console.log('   No existing slides to delete');
    }

    // Import new slides
    for (const slide of contentData.carousel_slides) {
        try {
            await strapiRequest('/carousels', 'POST', {
                ...slide,
                publishedAt: new Date().toISOString()
            });
            console.log(`   ✅ Created: "${slide.title.substring(0, 50)}..."`);
        } catch (error) {
            console.error(`   ❌ Failed: ${slide.title}`);
        }
    }
}

/**
 * Import/Update About Page
 */
async function importAboutPage() {
    console.log('\n📄 Importing About Page...');

    try {
        const aboutData = {
            ...contentData.about_page,
            publishedAt: new Date().toISOString()
        };

        // About page is a single type, so we update it
        await strapiRequest('/about-page', 'PUT', aboutData);
        console.log('   ✅ About page updated successfully');
    } catch (error) {
        console.error('   ❌ Failed to update about page');
    }
}

/**
 * Import Partners
 */
async function importPartners() {
    console.log('\n🤝 Importing Partners...');

    // Delete existing partners
    try {
        const existing = await strapiRequest('/partners');
        for (const item of existing.data) {
            await strapiRequest(`/partners/${item.documentId}`, 'DELETE');
        }
        console.log(`   Deleted ${existing.data.length} existing partners`);
    } catch (err) {
        console.log('   No existing partners to delete');
    }

    // Import all partners
    const allPartners = [
        ...contentData.government_partners,
        ...contentData.development_partners,
        ...contentData.professional_bodies
    ];

    for (const partner of allPartners) {
        try {
            await strapiRequest('/partners', 'POST', {
                ...partner,
                is_active: true,
                publishedAt: new Date().toISOString()
            });
            console.log(`   ✅ Created: ${partner.name}`);
        } catch (error) {
            console.error(`   ❌ Failed: ${partner.name}`);
        }
    }
}

/**
 * Import Team Members
 */
async function importTeamMembers() {
    console.log('\n👥 Importing Team Members...');

    // Delete existing team members
    try {
        const existing = await strapiRequest('/team-members');
        for (const item of existing.data) {
            await strapiRequest(`/team-members/${item.documentId}`, 'DELETE');
        }
        console.log(`   Deleted ${existing.data.length} existing team members`);
    } catch (err) {
        console.log('   No existing team members to delete');
    }

    // Import new team members
    for (const member of contentData.team_members) {
        try {
            await strapiRequest('/team-members', 'POST', {
                ...member,
                publishedAt: new Date().toISOString()
            });
            console.log(`   ✅ Created: ${member.name}`);
        } catch (error) {
            console.error(`   ❌ Failed: ${member.name}`);
        }
    }
}

/**
 * Import Guidelines
 */
async function importGuidelines() {
    console.log('\n📚 Importing Guidelines...');

    // Delete existing guidelines
    try {
        const existing = await strapiRequest('/guideline-documents');
        for (const item of existing.data) {
            await strapiRequest(`/guideline-documents/${item.documentId}`, 'DELETE');
        }
        console.log(`   Deleted ${existing.data.length} existing guidelines`);
    } catch (err) {
        console.log('   No existing guidelines to delete');
    }

    // Import new guidelines
    for (const guideline of contentData.guidelines) {
        try {
            await strapiRequest('/guideline-documents', 'POST', {
                ...guideline,
                category: 'General',
                is_featured: true,
                published_date: new Date().toISOString().split('T')[0],
                publishedAt: new Date().toISOString()
            });
            console.log(`   ✅ Created: ${guideline.title}`);
        } catch (error) {
            console.error(`   ❌ Failed: ${guideline.title}`);
        }
    }
}

/**
 * Import News & Events
 */
async function importNews() {
    console.log('\n📰 Importing News & Events...');

    // Delete existing news
    try {
        const existing = await strapiRequest('/news-events');
        for (const item of existing.data) {
            await strapiRequest(`/news-events/${item.documentId}`, 'DELETE');
        }
        console.log(`   Deleted ${existing.data.length} existing news items`);
    } catch (err) {
        console.log('   No existing news to delete');
    }

    // Import new news items
    for (const newsItem of contentData.news_events) {
        try {
            await strapiRequest('/news-events', 'POST', {
                ...newsItem,
                category: 'event',
                date: new Date().toISOString().split('T')[0],
                slug: newsItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                publishedAt: new Date().toISOString()
            });
            console.log(`   ✅ Created: ${newsItem.title}`);
        } catch (error) {
            console.error(`   ❌ Failed: ${newsItem.title}`);
        }
    }
}

/**
 * Main import function
 */
async function main() {
    try {
        console.log(`📡 Connecting to Strapi at: ${STRAPI_URL}\n`);

        await importCarousel();
        await importAboutPage();
        await importPartners();
        await importTeamMembers();
        await importGuidelines();
        await importNews();

        console.log('\n\n✅ ====================================');
        console.log('✅  IMPORT COMPLETE!');
        console.log('✅ ====================================\n');
        console.log('🎉 All NFA content has been imported successfully!\n');
        console.log('📝 Next steps:');
        console.log('   1. Visit http://localhost:1337/admin');
        console.log('   2. Review the imported content');
        console.log('   3. Upload images for carousel slides');
        console.log('   4. Upload PDF files for guidelines');
        console.log('   5. Check frontend at http://localhost:3000\n');

    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
    console.error('❌ This script requires Node.js 18+ with built-in fetch');
    console.error('   Please upgrade Node.js or install node-fetch');
    process.exit(1);
}

// Run the import
main();
