#!/usr/bin/env node

/**
 * Enable i18n for all Strapi content types
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const apiDir = path.join(__dirname, '..', 'src', 'api');

// Find all schema.json files
const schemaFiles = glob.sync(`${apiDir}/**/schema.json`);

console.log(`Found ${schemaFiles.length} schema files\n`);

schemaFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const schema = JSON.parse(content);

        // Check if already has i18n enabled
        if (schema.pluginOptions?.i18n?.localized) {
            console.log(`⏭️  Skipping ${path.basename(path.dirname(file))} - already enabled`);
            return;
        }

        // Enable i18n
        schema.pluginOptions = {
            ...schema.pluginOptions,
            i18n: {
                localized: true
            }
        };

        // Write back
        fs.writeFileSync(file, JSON.stringify(schema, null, 4) + '\n');
        console.log(`✅ Enabled i18n for ${path.basename(path.dirname(file))}`);

    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log('\n✅ Done! Restart Strapi to apply changes.');
