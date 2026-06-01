# NFA Website Content Implementation Guide

This guide maps the content from "1st draft NATIONAL FORTIFICATION ALLIANCE WEB CONTENT.docx.pdf" to your Strapi content types.

## 🎯 Content Checklist

### 1. Hero Carousel Slides (5 slides)

**Content Type:** `carousel`

**Location:** Home Page Hero Section

#### Slide 1
- **title:** "Combating Hidden Hunger in Nigeria Through Food Fortification"
- **subtitle:** "The National Fortification Alliance (NFA) is driving coordinated national efforts to improve nutrition outcomes through the production, regulation, monitoring, and promotion of adequately fortified foods across Nigeria."
- **link_text:** "Learn More"
- **link_url:** "/about"
- **order:** 1
- **is_active:** true
- **image:** [Upload relevant image]

#### Slide 2
- **title:** "Strengthening National Food Systems for Better Nutrition"
- **subtitle:** "The NFA works with government agencies, industries, development partners, academia, and civil society to improve compliance, quality assurance, and accessibility of fortified foods nationwide."
- **link_text:** "Our Work"
- **link_url:** "/projects"
- **order:** 2
- **is_active:** true
- **image:** [Upload relevant image]

#### Slide 3
- **title:** "Partnerships Driving Sustainable Nutrition Impact"
- **subtitle:** "Through strategic collaboration, innovation, and evidence-based interventions, the NFA supports Nigeria's efforts to reduce micronutrient deficiencies and improve public health outcomes."
- **link_text:** "Partners"
- **link_url:** "/partners"
- **order:** 3
- **is_active:** true
- **image:** [Upload relevant image]

#### Slide 4
- **title:** "Advancing Regulatory Compliance and Food Quality"
- **subtitle:** "The Alliance supports coordinated monitoring, standards enforcement, laboratory strengthening, and digital compliance systems for fortified foods in Nigeria."
- **link_text:** "Regulatory Framework"
- **link_url:** "/guidelines"
- **order:** 4
- **is_active:** true
- **image:** [Upload relevant image]

#### Slide 5
- **title:** "Innovation and Research for Nutrition Improvement"
- **subtitle:** "The NFA supports emerging initiatives including bouillon fortification, rice fortification, digital traceability systems, laboratory strengthening, and micronutrient innovation projects."
- **link_text:** "Projects & Initiatives"
- **link_url:** "/projects"
- **order:** 5
- **is_active:** true
- **image:** [Upload relevant image]

---

### 2. About Page Content

**Content Type:** `about-page` (Single Type)

**Fields to populate:**

#### mission
```
To coordinate and strengthen national efforts in food fortification through multi-sectoral collaboration, regulatory support, stakeholder engagement, quality assurance systems, and evidence-based interventions aimed at reducing micronutrient deficiencies in Nigeria.
```

#### vision
```
A Nigeria free from preventable micronutrient deficiencies through sustainable access to safe, quality, and adequately fortified foods.
```

#### background
```
The National Fortification Alliance (NFA) is a multi-sectoral coordination platform established to strengthen the implementation of food fortification programmes in Nigeria through collaboration among government agencies, regulatory institutions, private sector stakeholders, development partners, academia, professional associations, civil society organizations, and the media.

Mandatory food fortification of selected staple food vehicles including wheat flour, maize flour, sugar, and vegetable oil commenced in Nigeria in 2002 as one of the national strategies for combating micronutrient deficiencies and improving public health outcomes.

In 2004, the National Fortification Alliance was formally established under the chairmanship of the then National Planning Commission (currently the Federal Ministry of Finance, Budget and National Planning) to mobilize stakeholders for coordinated implementation of the national fortification programme.

The Alliance provides a platform for policy dialogue, technical coordination, compliance monitoring, stakeholder engagement, advocacy, laboratory strengthening, public awareness creation, and nutrition programme implementation.
```

#### objectives
```
The objectives of the NFA include:

• Providing a platform for collaboration between government and industry
• Supporting implementation of mandatory food fortification
• Strengthening compliance with national fortification standards
• Supporting monitoring and evaluation systems
• Promoting stakeholder coordination
• Improving laboratory capacity
• Supporting evidence-based nutrition interventions
• Expanding fortification to additional food vehicles
• Promoting public awareness on fortified foods
• Supporting innovation and digital traceability systems
```

#### body (Rich Text)
```markdown
## About the National Fortification Alliance

The NFA supports strategic initiatives aimed at:

- improving compliance with fortification standards
- strengthening quality assurance systems
- supporting industry capacity
- promoting innovation
- enhancing traceability and digital monitoring
- expanding food fortification to additional food vehicles
- improving nutrition outcomes for Nigerians

## Governance Structure

The National Fortification Alliance operates through a collaborative governance framework involving regulators, policymakers, industry representatives, development partners, academia, professional associations, and civil society stakeholders.

### Leadership Structure

- **Chair:** Industry Representative
- **Vice Chair:** Standards Organisation of Nigeria (SON)
- **Secretariat:** National Agency for Food and Drug Administration and Control (NAFDAC)
- **Core Officials:**
  - Federal Ministry of Health and Social Welfare (FMoHSW)
  - Federal Competition and Consumer Protection Commission (FCCPC)

## Current Priority Areas

The National Fortification Alliance is currently focused on:

- Strengthening Vitamin A fortification compliance
- Expanding rice fortification programmes
- Assessing feasibility of bouillon fortification
- Improving laboratory capacity for micronutrient analysis
- Strengthening digital compliance systems through DFQT+
- Supporting local premix production
- Strengthening household-level monitoring
- Supporting regulatory harmonization
- Enhancing public awareness and behavioural change communication
- Improving shelf-life studies and packaging systems
- Addressing fortification challenges at MSME and retail levels
```

---

### 3. News & Events

**Content Type:** `news-event`

#### Event 1: NFA 2025 Meeting
- **title:** "National Fortification Alliance 2025 Meeting"
- **excerpt:** "NFA brings together stakeholders to review progress and strengthen Nigeria's food fortification programme"
- **content:** 
```markdown
The National Fortification Alliance held its 2025 meeting in Lagos bringing together stakeholders across government, industry, development partners, and academia to review progress and strengthen Nigeria's food fortification programme.

## Key Discussion Areas

Key discussions focused on:

- national compliance performance
- premix quality
- laboratory strengthening
- imported product monitoring
- digital compliance systems
- rice fortification
- bouillon fortification
- and sustainability strategies

The meeting reaffirmed the commitment of stakeholders to improving nutrition outcomes through strengthened collaboration and regulatory coordination.
```
- **publishedAt:** [Set appropriate date]
- **featured:** true

---

### 4. Partners

**Content Type:** `partner`

Add all partners from the PDF in their respective categories:

#### Government MDAs (11 partners)
1. Federal Ministry of Health and Social Welfare
2. Federal Ministry of Education
3. Federal Ministry of Industry, Trade and Investment
4. Federal Ministry of Finance, Budget and National Planning
5. Standards Organisation of Nigeria
6. National Agency for Food and Drug Administration and Control
7. Federal Competition and Consumer Protection Commission
8. Nigerian Customs Service
9. National Primary Health Care Development Agency
10. Federal Ministry of Agriculture and Food Security
11. Federal Ministry of Information and National Orientation

#### Development Partners (7 partners)
1. Global Alliance for Improved Nutrition (GAIN)
2. Helen Keller International (HKI)
3. World Food Programme (WFP)
4. UNICEF
5. TechnoServe
6. World Health Organization (WHO)
7. Particle for Humanity (PFH)

#### Professional Bodies (3)
1. Nutrition Society of Nigeria (NSN)
2. Nigerian Institute of Food Science and Technology (NIFST)
3. Association of Food Beverage Tobacco Employees (AFBTE)

---

### 5. Team Members

**Content Type:** `team-member`

#### Programme Officers

**Officer 1:**
- **name:** "Mr. Abubakar Tanimu Umar"
- **role:** "Programme Officer"
- **department:** "NFA Secretariat"
- **bio:** "Programme Officer at the National Fortification Alliance Secretariat"

**Officer 2:**
- **name:** "Mrs. Joy Haanya"
- **role:** "Programme Officer"
- **department:** "NFA Secretariat"
- **bio:** "Programme Officer at the National Fortification Alliance Secretariat"

---

### 6. Guidelines & Documents

**Content Type:** `guideline-document`

Add these documents:

1. **Vegetable Oil Fortification Guidelines**
2. **Wheat Flour Fortification Standards**
3. **Salt Iodization Regulations**
4. **Sugar Fortification Guidelines**
5. **Bouillon Fortification Framework**

---

### 7. Key Statistics (Needs Content Type)

**⚠️ ACTION NEEDED:** Create a new content type called `statistic` or add to `global-setting`

#### Statistics to Add:
- Mandatory food fortification programme initiated in Nigeria in 2002
- National Fortification Alliance established in 2004
- National fortification compliance approximately 57%
- Salt iodization compliance approximately 67%
- Vegetable oil Vitamin A compliance approximately 58%
- Flour Vitamin A compliance approximately 48%
- Child stunting prevalence approximately 37%
- Vitamin A deficiency in children approximately 30%
- Anaemia among women of reproductive age estimated between 60–70%
- Calcium inadequacy:
  - 95% among non-pregnant women
  - 92% among pregnant women
  - 92% among children

---

## 📋 Implementation Steps

### Step 1: Start Strapi Locally
```bash
cd wfp-nfp-backend
npm run develop
```

### Step 2: Access Admin Panel
Open: http://localhost:1337/admin

### Step 3: Add Content in This Order

1. **Carousel** - Add all 5 hero slides
2. **About Page** - Fill in all fields (mission, vision, background, objectives, body)
3. **Partners** - Add all government, development, and professional partners
4. **Team Members** - Add the 2 programme officers
5. **Guidelines** - Add the 5 guideline documents
6. **News & Events** - Add the NFA 2025 Meeting
7. **Statistics** - (After creating the content type)

### Step 4: Publish Content
Make sure to click "Publish" on all content items.

### Step 5: Set Permissions
Go to Settings → Roles → Public → Enable find and findOne for all content types

---

## 🔄 Export/Transfer to Railway

Once you've added all content locally:

1. **Using Strapi Transfer:**
```bash
# Export from local
npm run strapi transfer -- --to destination-url

# OR manually export/import via Admin UI
```

2. **Database Backup Method:**
```bash
# Export PostgreSQL data
pg_dump your_local_db > nfa_content.sql

# Import to Railway PostgreSQL
psql $DATABASE_URL < nfa_content.sql
```

---

## ✅ Content Checklist

- [ ] 5 Carousel/Hero Slides added
- [ ] About Page content filled
- [ ] Mission statement added
- [ ] Vision statement added
- [ ] Background text added
- [ ] Objectives listed
- [ ] All Government Partners added (11)
- [ ] All Development Partners added (7)
- [ ] All Professional Bodies added (3)
- [ ] Team members added (2)
- [ ] Guidelines documents added (5)
- [ ] NFA 2025 Meeting event added
- [ ] Statistics content type created
- [ ] All statistics added
- [ ] All content published
- [ ] Public permissions set
- [ ] Content exported to Railway

---

## 📝 Notes

- The PDF mentions approved laboratories - you may want to create a `laboratory` content type for these
- Consider creating a `project` content type for the initiatives (Rice Fortification, Bouillon, DFQT+)
- The rotational hosting structure and meeting schedule could be added to a `meeting-schedule` content type
- Contact information should be added to the contact page or global settings

