#!/usr/bin/env node

/**
 * NFA Content Import Script with i18n Support
 * Creates content in English, Hausa, Igbo, and Yoruba
 */

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

// Load content data
const contentDataPath = path.join(__dirname, '..', 'content-data.json');
const contentData = JSON.parse(fs.readFileSync(contentDataPath, 'utf8'));

// Translation dictionaries for common terms
const translations = {
    carousel: {
        'Learn More': { ha: 'Koyi Ƙari', ig: 'Mụtakwuo', yo: 'Kọ́ Síi' },
        'Our Work': { ha: 'Aikinmu', ig: 'Ọrụ Anyị', yo: 'Iṣẹ́ Wa' },
        'Partners': { ha: 'Abokan Hulɗa', ig: 'Ndị Mmekọ', yo: 'Àwọn Alábàápín' },
        'Regulatory Framework': { ha: 'Tsarin Doka', ig: 'Usoro Iwu', yo: 'Ìlànà Ìṣàkóso' },
        'Projects & Initiatives': { ha: 'Ayyuka & Shirye-shirye', ig: 'Ọrụ & Atụmatụ', yo: 'Àwọn Iṣẹ́ & Ètò' }
    }
};

// Simple translation function (for demonstration - in production, use proper translation service)
function translateText(text, targetLang) {
    // Check if we have a direct translation
    for (const category in translations) {
        if (translations[category][text]) {
            return translations[category][text][targetLang] || text;
        }
    }
    // Return original if no translation (content manager will translate manually)
    return `[${targetLang.toUpperCase()}] ${text}`;
}

console.log('🌍 NFA Multi-Language Content Import');
console.log('=====================================\n');

async function strapiRequest(endpoint, method = 'GET', data = null, locale = 'en') {
    const url = `${STRAPI_URL}/api${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(STRAPI_TOKEN && { 'Authorization': `Bearer ${STRAPI_TOKEN}` })
        }
    };

    if (data) {
        // Add locale to the data
        options.body = JSON.stringify({
            data: { ...data, locale }
        });
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

async function importCarouselMultiLang() {
    console.log('\n📸 Importing Carousel Slides (4 languages)...');

    const locales = ['en', 'ha', 'ig', 'yo'];
    const localeNames = { en: 'English', ha: 'Hausa', ig: 'Igbo', yo: 'Yoruba' };

    for (const slide of contentData.carousel_slides) {
        for (const locale of locales) {
            try {
                const translatedSlide = {
                    title: locale === 'en' ? slide.title : translateText(slide.title, locale),
                    subtitle: locale === 'en' ? slide.subtitle : translateText(slide.subtitle, locale),
                    link_text: translateText(slide.link_text || 'Learn More', locale),
                    link_url: slide.link_url,
                    order: slide.order,
                    is_active: slide.is_active,
                    publishedAt: new Date().toISOString()
                };

                await strapiRequest('/carousels', 'POST', translatedSlide, locale);
                console.log(`   ✅ ${localeNames[locale]}: "${translatedSlide.title.substring(0, 40)}..."`);
            } catch (error) {
                console.error(`   ❌ Failed (${localeNames[locale]}): ${slide.title}`);
            }
        }
    }
}

async function importAboutPageMultiLang() {
    console.log('\n📄 Importing About Page (4 languages)...');

    const locales = ['en', 'ha', 'ig', 'yo'];
    const localeNames = { en: 'English', ha: 'Hausa', ig: 'Igbo', yo: 'Yoruba' };

    for (const locale of locales) {
        try {
            const aboutData = {
                mission: locale === 'en' ? contentData.about_page.mission : translateText(contentData.about_page.mission, locale),
                vision: locale === 'en' ? contentData.about_page.vision : translateText(contentData.about_page.vision, locale),
                background: locale === 'en' ? contentData.about_page.background : translateText(contentData.about_page.background, locale),
                objectives: locale === 'en' ? contentData.about_page.objectives : translateText(contentData.about_page.objectives, locale),
                publishedAt: new Date().toISOString()
            };

            await strapiRequest('/about-page', 'PUT', aboutData, locale);
            console.log(`   ✅ ${localeNames[locale]}: About page updated`);
        } catch (error) {
            console.error(`   ❌ Failed (${localeNames[locale]}): About page`);
        }
    }
}

async function main() {
    try {
        console.log(`📡 Connecting to Strapi at: ${STRAPI_URL}\n`);
        console.log('⚠️  Note: Auto-translations are marked with [LANG] prefix.');
        console.log('   Please translate these manually in Strapi admin.\n');

        await importCarouselMultiLang();
        await importAboutPageMultiLang();

        console.log('\n\n✅ ==========================================');
        console.log('✅  MULTI-LANGUAGE IMPORT COMPLETE!');
        console.log('✅ ==========================================\n');
        console.log('📊 Created content in 4 languages:');
        console.log('   • English (en)');
        console.log('   • Hausa (ha)');
        console.log('   • Igbo (ig)');
        console.log('   • Yoruba (yo)\n');
        console.log('📝 Next steps:');
        console.log('   1. Login to Strapi admin');
        console.log('   2. Go to Settings → Internationalization');
        console.log('   3. Verify all 4 locales are added');
        console.log('   4. Review and translate items marked with [LANG] prefix\n');

    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
    console.error('❌ This script requires Node.js 18+ with built-in fetch');
    process.exit(1);
}

main();
