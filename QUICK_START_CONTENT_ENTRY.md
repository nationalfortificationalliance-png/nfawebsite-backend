# Quick Start: Adding Content to Strapi

✅ **Strapi is running at:** http://localhost:1337/admin

## 🚀 First Time Setup

### Step 1: Create Admin Account
1. Open http://localhost:1337/admin
2. Fill in the admin registration form:
   - **First name:** Your name
   - **Last name:** Your last name  
   - **Email:** Your email
   - **Password:** Strong password (min 8 characters)
3. Click "Let's start"

### Step 2: Set Public Permissions
1. Go to **Settings** (⚙️ icon in sidebar) → **Users & Permissions Plugin** → **Roles**
2. Click on **Public**
3. Enable permissions for each content type:
   - **Carousel:** ✅ find, ✅ findOne
   - **About-page:** ✅ find
   - **News-event:** ✅ find, ✅ findOne
   - **Partner:** ✅ find, ✅ findOne
   - **Team-member:** ✅ find, ✅ findOne
   - **Guideline-document:** ✅ find, ✅ findOne
   - **Global-setting:** ✅ find
4. Click **Save**

---

## 📝 Content Entry Order (Recommended)

### 1️⃣ Hero Carousel (5 Slides)

**Go to:** Content Manager → Carousel → Create new entry

#### Slide 1
- **Title:** `Combating Hidden Hunger in Nigeria Through Food Fortification`
- **Subtitle:** `The National Fortification Alliance (NFA) is driving coordinated national efforts to improve nutrition outcomes through the production, regulation, monitoring, and promotion of adequately fortified foods across Nigeria.`
- **Link Text:** `Learn More`
- **Link URL:** `/about`
- **Order:** `1`
- **Is Active:** ✅ Yes
- **Image:** Upload a relevant image (recommended size: 1920x800px)
- Click **Save** then **Publish**

#### Slide 2
- **Title:** `Strengthening National Food Systems for Better Nutrition`
- **Subtitle:** `The NFA works with government agencies, industries, development partners, academia, and civil society to improve compliance, quality assurance, and accessibility of fortified foods nationwide.`
- **Link Text:** `Our Work`
- **Link URL:** `/projects`
- **Order:** `2`
- **Is Active:** ✅ Yes
- **Image:** Upload image
- Click **Save** then **Publish**

#### Slide 3
- **Title:** `Partnerships Driving Sustainable Nutrition Impact`
- **Subtitle:** `Through strategic collaboration, innovation, and evidence-based interventions, the NFA supports Nigeria's efforts to reduce micronutrient deficiencies and improve public health outcomes.`
- **Link Text:** `Partners`
- **Link URL:** `/partners`
- **Order:** `3`
- **Is Active:** ✅ Yes
- **Image:** Upload image
- Click **Save** then **Publish**

#### Slide 4
- **Title:** `Advancing Regulatory Compliance and Food Quality`
- **Subtitle:** `The Alliance supports coordinated monitoring, standards enforcement, laboratory strengthening, and digital compliance systems for fortified foods in Nigeria.`
- **Link Text:** `Regulatory Framework`
- **Link URL:** `/guidelines`
- **Order:** `4`
- **Is Active:** ✅ Yes
- **Image:** Upload image
- Click **Save** then **Publish**

#### Slide 5
- **Title:** `Innovation and Research for Nutrition Improvement`
- **Subtitle:** `The NFA supports emerging initiatives including bouillon fortification, rice fortification, digital traceability systems, laboratory strengthening, and micronutrient innovation projects.`
- **Link Text:** `Projects & Initiatives`
- **Link URL:** `/projects`
- **Order:** `5`
- **Is Active:** ✅ Yes
- **Image:** Upload image
- Click **Save** then **Publish**

---

### 2️⃣ About Page

**Go to:** Content Manager → About Page (Single Type)

**Copy from content-data.json or type:**

- **Mission:** 
```
To coordinate and strengthen national efforts in food fortification through multi-sectoral collaboration, regulatory support, stakeholder engagement, quality assurance systems, and evidence-based interventions aimed at reducing micronutrient deficiencies in Nigeria.
```

- **Vision:**
```
A Nigeria free from preventable micronutrient deficiencies through sustainable access to safe, quality, and adequately fortified foods.
```

- **Background:** (Copy full text from content-data.json)

- **Objectives:** (Copy full text from content-data.json)

- **Body:** (Use rich text editor - copy from CONTENT_IMPLEMENTATION_GUIDE.md)

- **Hero Tagline:** `About the National Fortification Alliance`

- **Hero Image:** Upload a relevant hero image

Click **Save** then **Publish**

---

### 3️⃣ Partners (21 Total)

**Go to:** Content Manager → Partner → Create new entry

Add each partner one by one. Use this format:

**Government Partners (11):**
1. Name: `Federal Ministry of Health and Social Welfare`, Category: `Government`
2. Name: `Federal Ministry of Education`, Category: `Government`
3. Name: `Federal Ministry of Industry, Trade and Investment`, Category: `Government`
4. (Continue with all 11...)

**Development Partners (7):**
1. Name: `Global Alliance for Improved Nutrition (GAIN)`, Category: `Development Partner`, Logo: Upload if available
2. Name: `Helen Keller International (HKI)`, Category: `Development Partner`
3. (Continue with all 7...)

**Professional Bodies (3):**
1. Name: `Nutrition Society of Nigeria (NSN)`, Category: `Professional Body`
2. (Continue with all 3...)

---

### 4️⃣ Team Members (2)

**Go to:** Content Manager → Team Member → Create new entry

**Member 1:**
- **Name:** `Mr. Abubakar Tanimu Umar`
- **Role:** `Programme Officer`
- **Department:** `NFA Secretariat`
- **Bio:** `Programme Officer at the National Fortification Alliance Secretariat`
- **Photo:** Upload if available

**Member 2:**
- **Name:** `Mrs. Joy Haanya`
- **Role:** `Programme Officer`
- **Department:** `NFA Secretariat`
- **Bio:** `Programme Officer at the National Fortification Alliance Secretariat`
- **Photo:** Upload if available

---

### 5️⃣ Guidelines & Documents (5)

**Go to:** Content Manager → Guideline Document → Create new entry

1. **Title:** `Vegetable Oil Fortification Guidelines`, **File:** Upload PDF if available
2. **Title:** `Wheat Flour Fortification Standards`, **File:** Upload PDF
3. **Title:** `Salt Iodization Regulations`, **File:** Upload PDF
4. **Title:** `Sugar Fortification Guidelines`, **File:** Upload PDF
5. **Title:** `Bouillon Fortification Framework`, **File:** Upload PDF

---

### 6️⃣ News & Events (1+)

**Go to:** Content Manager → News Event → Create new entry

**First Event:**
- **Title:** `National Fortification Alliance 2025 Meeting`
- **Excerpt:** `NFA brings together stakeholders to review progress and strengthen Nigeria's food fortification programme`
- **Content:** (Copy from content-data.json or CONTENT_IMPLEMENTATION_GUIDE.md)
- **Category:** `Event`
- **Featured:** ✅ Yes
- **Published At:** Set to recent date
- **Image:** Upload event photo if available

---

## ✅ Testing Your Content

### View on Frontend
1. Make sure frontend is running:
   ```bash
   cd /Users/mac/Documents/apps/wfp-nfp-website/wfp-nfp-frontend
   npm run dev
   ```

2. Open http://localhost:3000
3. Check:
   - **Home page** - Hero carousel should show your 5 slides
   - **About page** - Mission, vision, background should display
   - **News page** - Your events should appear
   - **Partners page** - All partners should list
   - **Team page** - Programme officers should show

---

## 🎯 Priority Content (Add First)

For quickest visible results, add in this order:

1. ✅ **Carousel** (5 slides) - Shows on homepage immediately
2. ✅ **About Page** - Core content
3. ✅ **News Event** (1 article) - Tests news page
4. ✅ **Partners** (Just add 3-4 first) - Tests partners page

Then add the rest when ready.

---

## 💡 Tips

- **Save often** - Click save button frequently
- **Don't forget to Publish** - Content is draft by default
- **Preview before publishing** - Check how it looks
- **Use content-data.json** - Copy-paste ready content from this file
- **Upload images** - Makes content more engaging
- **Test the frontend** - Refresh your Next.js site to see changes

---

## 🐛 Troubleshooting

### Content not showing on frontend?
1. Check content is **Published** (not draft)
2. Check **Public permissions** are enabled (Settings → Roles → Public)
3. Refresh the frontend page (Ctrl+R or Cmd+R)
4. Check browser console for API errors (F12)

### Images not loading?
- Make sure image is uploaded in Strapi
- Check image URL in frontend: should be `http://localhost:1337/uploads/...`
- Verify NEXT_PUBLIC_STRAPI_URL is set correctly

---

## 📞 Need Help?

- Review [CONTENT_IMPLEMENTATION_GUIDE.md](./CONTENT_IMPLEMENTATION_GUIDE.md) for full content
- Check [content-data.json](./content-data.json) for copy-paste ready data
- Strapi docs: https://docs.strapi.io

---

**Good luck! 🎉 Start with the carousel slides for immediate visual impact on the homepage.**
