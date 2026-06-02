---
name: agriculture-expert
description: Deep domain knowledge for agriculture, ranching, livestock management, and ag-tech. Use when the user is working on RanchPad, MIA (Meat Image America), or any agriculture-related feature, content, outreach, or business decision. Also use when discussing beef grading, livestock health, ranch operations, USDA standards, or precision agriculture.
metadata:
  version: 1.0.0
---

# Agriculture Domain Expert Skill

Deep knowledge of ranching operations, livestock management, beef grading, and ag-tech — tailored for RanchPad and MIA context.

---

## Ranching Operations

### Ranch Types
| Type | Focus | Scale |
|------|-------|-------|
| Cow-calf | Breeding and producing calves for sale | 50-500+ cows |
| Stocker/backgrounder | Buying calves, grazing to gain weight | Variable |
| Feedlot | Confined finishing on grain rations | 1,000-100,000+ head |
| Seedstock | Purebred genetics, bulls and breeding stock | Small-medium |
| Diversified | Multiple species + crops | Variable |

### Ranch Decision Calendar
| Month | Key Activities |
|-------|---------------|
| Jan-Feb | Calving (spring calving herds), preg checking |
| Mar-Apr | Spring branding, vaccinations, bull turnout |
| May-Jun | Pasture rotation begins, fly control |
| Jul-Aug | Weaning, pregnancy checking cows |
| Sep-Oct | Fall calving, weaning spring calves |
| Nov-Dec | Preg testing, culling decisions, hay inventory |

### Key Ranch Metrics
- **Weaning rate** — % of cows that wean a live calf (target: 85-95%)
- **Weaning weight** — Calf weight at weaning (target: 500-600 lbs for beef breeds)
- **Average daily gain (ADG)** — Lbs of gain per day (stocker: 1.5-2.5 lbs/day)
- **Death loss** — % of herd that dies annually (acceptable: <2%)
- **Conception rate** — % of cows that conceived in breeding season (target: 90%+)
- **Days on feed** — Time in feedlot (typically 120-180 days)

---

## Livestock Health

### Cattle Disease Reference
| Disease | Cause | Signs | Prevention |
|---------|-------|-------|-----------|
| BRD (Bovine Respiratory Disease) | Viral + bacterial | Fever, nasal discharge, labored breathing | MLV vaccine, minimize stress |
| Pinkeye (IBK) | Moraxella bovis bacteria | Eye cloudiness, tearing, closed eye | Vaccination, fly control |
| Blackleg | Clostridium chauvoei | Sudden death, swelling | 7-way vaccine |
| Anaplasmosis | Tick-borne parasite | Anemia, weakness, jaundice | Tick control, oxytetracycline |
| Foot rot | Bacterial infection | Lameness, swelling between hooves | Clean environments, zinc |
| Pink Eye | Moraxella bovis | Eye cloudiness | IBK vaccine |
| Scours (calf diarrhea) | Viral, bacterial, protozoan | Diarrhea, dehydration | E. coli/rotavirus vaccines in cows |

### Standard Vaccination Protocol (cow-calf)
**Calves at branding (2-3 months):**
- 7-way Clostridial (Blackleg)
- IBR/BVD/PI3/BRSV (MLV respiratory)
- Optional: Pinkeye

**Calves at weaning:**
- Booster respiratory vaccine
- Dewormer (pour-on or injectable)
- Fly control start

**Cows pre-calving (60 days out):**
- Scour vaccines (E. coli, rotavirus, coronavirus)
- Clostridial booster

---

## Beef Grading Standards

### USDA Quality Grades (US Standard)
| Grade | Marbling | Age | % of Fed Cattle |
|-------|---------|-----|----------------|
| Prime | Abundant+ | A (under 30 months) | ~3% |
| Choice | Modest to Slightly Abundant | A | ~70% |
| Select | Slight | A | ~25% |
| Standard | Traces | A or B | ~2% |
| Commercial | Any | B+ (older) | Rare |
| Utility/Cull | Any | Any | Slaughter cows |

### AUSMEAT Marble Score (Australian/MIA Context)
| Score | Description | Fat % | US Equivalent |
|-------|-------------|-------|--------------|
| 0 | No visible marbling | 8% | Standard/Select |
| 1 | Slight | 12% | Low Select |
| 2 | Small | 16% | Select |
| 3 | Modest | 20% | Low Choice |
| 4 | Moderate | 26% | Choice |
| 5 | Slightly Abundant | 32% | High Choice |
| 6 | Moderately Abundant | 38% | Low Prime |
| 7 | Abundant | 44% | Prime |
| 8 | Very Abundant | 50% | High Prime |
| 9+ | Exceptional | 56%+ | Wagyu |

### MIA (Meat Image America) Grade Mapping
From codebase: Roboflow classes → AUSMEAT → Medal
- Class 0 → Score 1-2 → Bronze (8% fat, minimal)
- Class 1 → Score 3-4 → Silver (16% fat, slight)
- Class 2 → Score 5-6 → Gold (28% fat, moderate)
- Class 3 → Score 7-8 → Platinum (38% fat, high)
- Class 4 → Score 9+ → Platinum (48% fat, exceptional)

### Yield Grades (USDA)
1-5 scale (1 = most lean, most yield)
- YG 1-2: 80%+ lean cuts
- YG 3: Typical fed cattle
- YG 4-5: Heavy fat cover, discounted

---

## Ag-Tech Landscape

### Key Players (2025)
| Category | Companies |
|----------|----------|
| Ranch management software | Ranch Manager, CattleMax, Herdtrax, AgriWebb |
| Livestock health monitoring | Allflex (SCR), Quantified Ag, Moocall |
| Precision feeding | Feedlot software: FeedBunk, Apprion |
| Land/grazing | Terrain View, Trimble Ag |
| Cattle genetics | Angus Association GeneMax, Genomics |
| Market intelligence | Cattle-Fax, CME futures, USDA AMS |

### RanchPad Competitive Context
**Direct competitors:** CattleMax, AgriWebb, Ranch Manager
**Adjacent competitors:** Spreadsheets, paper records (largest segment)
**ICP:** Cow-calf ranchers, 200-500 head, family-operated, limited tech adoption

**What ranchers actually want:**
- Simple — works with gloves on, one hand, outside
- Fast — fewer taps than a clipboard
- Reliable — works offline in remote pastures
- Useful immediately — not after months of data entry

### Technology Adoption Barriers in Ag
- Connectivity: Limited cell service in pastures/feedlots
- Age: Average US farmer age is 57
- Trust: "If it ain't broke don't fix it" mentality
- ROI skepticism: Show the dollar value, not features
- Learning curve: No time for training during busy season

---

## Regulatory & Compliance

### Animal Identification
- **USDA RFID tags** — Required for interstate commerce (cattle, bison, sheep, goats)
- **Premise ID** — Required for all livestock operations
- **NUES (National Uniform Eartagging System)** — 15-digit official ID

### Food Safety
- **FSMA (Food Safety Modernization Act)** — Applies to produce, some overlap with livestock
- **BQA (Beef Quality Assurance)** — Industry voluntary certification
- **Withdrawal periods** — Every drug has a withdrawal period before slaughter (critical for feedlots)

### Environmental
- **CAFO regulations** — Concentrated Animal Feeding Operations >1,000 AU require permits
- **EQIP (Environmental Quality Incentive Program)** — USDA cost-share for conservation practices

---

## Language & Terminology

Use this vocabulary when writing for or about ranchers:

| Use this | Not this |
|----------|---------|
| Head (of cattle) | Animals, units |
| Calf/calves | Baby cow |
| Bull | Male bovine (intact) |
| Steer | Castrated male |
| Heifer | Young female, not yet calved |
| Cow | Female that has calved |
| Weaning | Separating calves from cows |
| Backgrounding | Grazing calves post-weaning |
| Finishing | Feedlot phase before slaughter |
| Preg check | Pregnancy examination |
| Culling | Removing animals from herd |
| Turnout | Putting bulls with cows for breeding |
| AUM (Animal Unit Month) | Forage consumed by one cow per month |

---

## Related Skills

- **market-research** — For validating RanchPad/MIA market assumptions
- **ux-research** — For understanding rancher workflows before building
- **cold-email** — For outreach to ranchers and feedlot operators
- **grant-writing** — USDA NIFA SBIR grants available for ag-tech tools
- **pm-framework** — For speccing features specific to ranch workflows
