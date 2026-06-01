# NFA Content Import Scripts

## Bulk Import Script

### What It Does

The `import-nfa-content.js` script automatically imports ALL NFA content from `content-data.json` into your Strapi database via the REST API.

**It will import:**
- ✅ 5 Hero carousel slides
- ✅ About page content (mission, vision, background, objectives)
- ✅ 21 Partners (Government, Development, Professional)
- ✅ 2 Team members (Programme officers)
- ✅ 5 Guidelines & documents
- ✅ 1 News event (NFA 2025 Meeting)

### Prerequisites

1. ✅ Strapi is running at http://localhost:1337
2. ✅ You've created an admin account
3. ✅ Public permissions are enabled (or you have an API token)

### How to Run

#### Option A: Simple (No Authentication Required for Local)

```bash
# From the backend directory
cd /Users/mac/Documents/apps/wfp-nfp-website/wfp-nfp-backend

# Run the import script
node scripts/import-nfa-content.js
```

#### Option B: With API Token (More Secure)

If you need authentication:

1. **Generate an API Token in Strapi:**
   - Login to http://localhost:1337/admin
   - Go to Settings → API Tokens → Create new API Token
   - Name: "Import Script"
   - Token type: Full access
   - Copy the token

2. **Run with token:**
   ```bash
   STRAPI_TOKEN=your-token-here node scripts/import-nfa-content.js
   ```

### What Happens During Import

The script will:

1. **Delete existing content** in each category
2. **Import new content** from `content-data.json`
3. **Publish all content** automatically
4. **Show progress** for each item

### Expected Output

```
🚀 NFA Content Import Script
================================

📡 Connecting to Strapi at: http://localhost:1337

📸 Importing Carousel Slides...
   Deleted 0 existing slides
   ✅ Created: "Combating Hidden Hunger in Nigeria Through Food..."
   ✅ Created: "Strengthening National Food Systems for Better..."
   ✅ Created: "Partnerships Driving Sustainable Nutrition Imp..."
   ✅ Created: "Advancing Regulatory Compliance and Food Quali..."
   ✅ Created: "Innovation and Research for Nutrition Improve..."

📄 Importing About Page...
   ✅ About page updated successfully

🤝 Importing Partners...
   Deleted 0 existing partners
   ✅ Created: Federal Ministry of Health and Social Welfare
   ✅ Created: Federal Ministry of Education
   ... (21 total)

👥 Importing Team Members...
   ✅ Created: Mr. Abubakar Tanimu Umar
   ✅ Created: Mrs. Joy Haanya

📚 Importing Guidelines...
   ✅ Created: Vegetable Oil Fortification Guidelines
   ... (5 total)

📰 Importing News & Events...
   ✅ Created: National Fortification Alliance 2025 Meeting

✅ ====================================
✅  IMPORT COMPLETE!
✅ ====================================

🎉 All NFA content has been imported successfully!
```

### After Import

1. **Visit Strapi Admin:** http://localhost:1337/admin
2. **Review imported content** in Content Manager
3. **Upload images:**
   - Carousel slides need hero images
   - Partners may need logos
   - Team members may need photos
4. **Upload PDFs** for guideline documents
5. **Check frontend:** http://localhost:3000

### Troubleshooting

#### Error: "fetch is not defined"

**Cause:** You're using Node.js < 18

**Solution:**
```bash
# Check Node version
node --version

# Upgrade to Node 18+ or use the manual method
```

#### Error: "HTTP 403: Forbidden"

**Cause:** API permissions not enabled

**Solution:**
1. Go to Settings → Users & Permissions → Roles → Public
2. Enable `find`, `findOne`, `create` for all content types
3. Or use an API token (Option B above)

#### Error: "Connection refused"

**Cause:** Strapi is not running

**Solution:**
```bash
# Start Strapi first
npm run develop
```

#### Some items failed to import

**Cause:** Schema mismatch or required fields missing

**Solution:**
- Check the error message for which field is missing
- Update `content-data.json` with the required field
- Run the script again

### Re-running the Script

You can run the script multiple times. It will:
- Delete all existing content
- Re-import everything fresh

**⚠️ Warning:** This will delete any content you manually added!

### Customizing the Import

To modify what gets imported, edit:
```
wfp-nfp-backend/content-data.json
```

Then run the script again.

---

## Manual Import Alternative

If the script doesn't work, you can import manually:

1. Open Strapi admin
2. Use the Content Manager
3. Copy-paste from `content-data.json`
4. See `QUICK_START_CONTENT_ENTRY.md` for step-by-step guide

