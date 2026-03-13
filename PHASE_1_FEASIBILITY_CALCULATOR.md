# Phase 1: Fast Feasibility Calculator - Design Documentation

## 🎯 Executive Summary

This system enables rapid feasibility analysis across **multiple telecom project types** using a flexible **template-based architecture**. Each project type (Optical Fiber, 5G Tower Conversion, etc.) is defined as a configurable template with unique parameters, cost structures, and revenue models, while sharing a common workflow for analysis, approval, and quotation generation.

**Current Templates:**
- ✅ **Optical Fiber Underground Laying** - Infrastructure deployment projects
- ✅ **4G to 5G Tower Conversion** - Equipment upgrade projects as subcontractor
- 🔜 **Future Templates** - Indoor DAS, BTS installation, microwave links

**Key Innovation:** One system handles all telecom project types without code changes when adding new types.

---

## 📋 Overview

A rapid **multi-template project feasibility analysis system** for various telecom projects in Bangladesh. Supports multiple project types including optical fiber installation, 4G to 5G tower conversions, and future telecom infrastructure projects. Enables quick evaluation of 100+ project opportunities across different categories to identify the 10% that are profitable enough to pursue.

---

## 🎯 Business Objectives

- **Multi-Project Support**: Handle different telecom project types with unique parameters
- **Speed**: Analyze project feasibility in 2-3 minutes regardless of type
- **Accuracy**: Conservative, realistic, and optimistic scenarios for all project types
- **Decision Support**: Clear visual indicators for approve/reject decisions
- **Scale**: Handle 100+ project evaluations efficiently across multiple categories
- **Extensibility**: Easy to add new project types without code changes
- **Integration**: Export approved projects to ERP system

---

## 🏗️ System Architecture: Template-Based Design

### **Core Concept**
Instead of building separate systems for each project type, we use a **template registry system** where each project type is defined as a configurable template with its own:
- Input parameters schema
- Cost calculation logic
- Revenue model
- Form layout

### **Universal Workflow** (Same for All Project Types)
```
Step 1: Select Project Type (Fiber/Tower/Other)
         ↓
Step 2: Enter Type-Specific Parameters
         ↓
Step 3: System Auto-Calculates (using template logic)
         ↓
Step 4: Show Results (3 scenarios)
         ↓
Step 5: Approve/Reject Decision
         ↓
Step 6: Generate Quotation
         ↓
Step 7: Export to ERP
```

### **Project Template Registry**
```
Supported Project Types:

1. OPTICAL_FIBER
   Category: Infrastructure
   Use Case: Underground cable laying projects
   Contractors: Direct client or telecom operators
   Input Parameters: 12 fields (length, rings, links, etc.)
   Cost Categories: 10
   Revenue Model: Per-meter billing + extras
   
2. 5G_TOWER_CONVERSION
   Category: Network Upgrade
   Use Case: 4G to 5G equipment upgrades
   Contractors: Huawei, ZTE, Nokia (as subcontractor)
   Input Parameters: 10 fields (towers, equipment, work scope)
   Cost Categories: 7
   Revenue Model: Per-tower or lump sum
   
3. [FUTURE_TEMPLATES]
   - Indoor DAS systems
   - Base station installation
   - Microwave link setup
   - Radio network optimization
```

---

## 🏗️ System Architecture

```
Quick Input Form (2-3 min)
         ↓
Auto-calculations + Defaults
         ↓
Calculation Engine (3 scenarios)
         ↓
Results Dashboard with Decision
         ↓
Approve → Quotation → ERP
```

---

## � PROJECT TEMPLATES

---

## 🔷 TEMPLATE 1: OPTICAL FIBER UNDERGROUND LAYING

### Project Overview
**Use Case**: Underground optical fiber cable installation projects  
**Typical Client**: Direct clients, telecom operators, ISPs  
**Contract Type**: Main contractor  
**Project Scale**: 5km - 50km typical  
**Analysis Time**: 2-3 minutes

---

## �📝 PART 1: Quick Input Form

### Section A: Project Basics (30 seconds)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Project Name | Text | Yes | e.g., "Dhaka Metro Fiber Network" |
| Client Name | Text | Yes | e.g., "Bangladesh Telecom Ltd" |
| Location | Dropdown | Yes | Dhaka/Chittagong/Sylhet/Rajshabi/Other |
| Date | Auto | Yes | Auto-filled with today's date |

### Section B: Critical Parameters (90 seconds)

#### Underground Work
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Total Underground Length | Number | Yes | - | Meters (e.g., 30000) |
| Number of Rings | Number | Yes | 2 | Range: 1-5 |
| Number of Links | Number | Yes | 10 | Range: 1-50 |

#### Site Complexity
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Number of Bridges | Number | No | 0 | Range: 0-10 |
| Number of Culverts | Number | No | 0 | Range: 0-20 |
| Number of Rivers | Number | No | 0 | Range: 0-5 |

#### Client Provisions
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Cables Provided by Client? | Yes/No | Yes | No | Affects material costs |
| Ducts Provided by Client? | Yes/No | Yes | No | Affects material costs |

#### Duration Estimate
| Field | Type | Required | Default | Formula |
|-------|------|----------|---------|---------|
| Project Duration | Number | Yes | Auto-calculated | Length ÷ 10,000m per month |

**Total Input Fields: 10 (7 mandatory)**

---

## 🤖 PART 2: Auto-Calculated Parameters

System automatically derives these values (visible but not required for input):

| Parameter | Formula/Rule | Notes |
|-----------|--------------|-------|
| Number of Sites | 2 (default), +1 if length >50,000m | Affects mobilization costs |
| Number of Vertical Links | = Number of Links | Standard assumption |
| Avg Vertical Work per Link | 80m (standard) | Editable if needed |
| Total Vertical Work | Links × 80m | For revenue calculation |
| Cores per Link | 52 (standard) | Can be 24, 52, or 96 |
| Total Core Connections | Links × Cores per Link | For splicing costs |
| Field Joints per Link | 8 (standard) | Mid-span connections |
| Working Days per Month | 24 (standard) | For daily cost calculations |
| Total Working Days | Duration × 24 | Total labor days |
| Number of Labourers | 10 (standard) | Daily workers |
| HDD Machines Required | 1 (+1 if length >40,000m) | Equipment rental |
| Hand Holes - Closure Pits | Length ÷ 200m | Every 200m for splicing |
| Hand Holes - Main Access | Length ÷ 1,000m | Every 1km access vault |
| Total Hand Holes | Sum of above | Major cost driver |

---

## 💰 PART 3: Calculation Engine

### Cost Categories

#### 1. One-Time Costs (Fixed)
| Item | Formula | Rate (BDT) |
|------|---------|------------|
| Mobilization | Sites × Rate | 7,000 per site |
| Water Reservoir 1000L | Fixed | 20,000 |
| Site Office Furniture | Fixed | 30,000 |
| PPE & Safety Gear | Fixed | 50,000 |
| OTDR Testing & Commissioning | Fixed | 20,000 |
| Transportation Fixed | Fixed | 30,000 |
| Office Entertainment | Fixed | 50,000 |
| Extra Vertical/Splicing Work | Fixed | 5,000 |
| Slippers | Quantity × Rate | 2,000 × 1.5 |
| **Insurance** | **Total Costs × 1%** | **1%** |

#### 2. Monthly Costs × Duration
| Item | Formula | Rate (BDT/month) |
|------|---------|------------------|
| HDD Machine Rent | Machines × Rate | 500,000 per machine |
| Site Warehouse | Fixed | 10,000 |
| Site Office | Fixed | 15,000 |
| Labour Shade Rent | Fixed | 15,000 |
| Tracker Man Salary | Fixed | 40,000 |
| Operator Salary | Fixed | 40,000 |
| Accountant Salary | Fixed | 25,000 |
| Office Assistant Salary | Fixed | 15,000 |
| Consultant Fees | Fixed | 30,000 |
| Consultant Allowances | Fixed | 6,000 |
| DA Allowances | 5 staff × Rate | 500 per employee |
| Mobile Bills | 5 staff × Rate | 1,000 per employee |
| Head Office Overhead | Fixed | 25,000 |
| Office Stationery | Fixed | 5,000 |
| Project Equipment Repair | Fixed | 3,000 |
| Miscellaneous | Fixed | 20,000 |
| **Performance Bonus** | **Monthly salaries × 20%** | **End of project (one-time)** |

**Multiply by Project Duration (months)**

#### 3. Daily Costs × Working Days
| Item | Formula | Rate (BDT/day) |
|------|---------|----------------|
| Labour | Workers × Rate | 10 × 1,000 |
| Generator + Fuel | Fixed | 1,000 |
| Truck Rent | Fixed | 5,000 |
| Diesel / Oil | Fixed | 2,000 |
| Mini Truck Transport | Fixed | 2,500 |
| Mini Truck Fuel | Fixed | 1,000 |

**Multiply by Working Days (Duration × 24)**

#### 4. Length-Based Costs (per meter)
| Item | Condition | Rate (BDT/m) |
|------|-----------|--------------|
| Cable Cost (Single-Mode) | If self-supplied | 18 |
| HDPE Duct / PLB Cost | If self-supplied | 30 |
| Warning Tape | Always | 5 |
| Design Cost | Always | 1 |
| Documents Preparation | Always | 0.5 |
| Authority Permission | Always | 40 |

**Multiply by Total Underground Length**

#### 5. Quantity-Based Costs
| Item | Quantity Formula | Rate (BDT) |
|------|-----------------|------------|
| Hand Hole Installation | Calculated (closure + main) | 15,000 per hole |
| TJ Box | Links × 4 | 110 per piece |
| Vertical PVC Flexible Pipe | Links × 5m | [rate per meter] |
| Vertical Metal Flexible Pipe | Links × 20m | [rate per meter] |
| Vertical Metal Clump | Links × 4 | [rate per piece] |
| Vertical Work Contractor | Links | 2,700 per link |
| Splicing Subcontractor | Total Cores | 50 per core |
| Closure Price | Calculated | 2,000 per unit |
| ODF (Optical Distribution Frame) | Calculated | 7,000 per unit |
| Pole Installation | If needed | 16,000 per pole |
| Open Trench (fallback) | If HDD not possible | 160 per meter |

#### 6. Financing Costs
| Item | Formula | Rate |
|------|---------|------|
| Bank Loan Interest | (Loan Amount or % of Total Cost) × Interest Rate × (Duration ÷ 12) | 14% per year |

**Default Loan: 2,000,000 BDT or calculate as % of project cost**

#### 7. Backfill Material (if needed)
| Item | Condition | Rate (BDT) |
|------|-----------|------------|
| Backfill Material | If ground conditions require | 500 per sq meter |

---

### Revenue Calculation

#### Gross Revenue
| Item | Formula | Rate (BDT) |
|------|---------|------------|
| Main Underground Laying | Length × Rate | 250 per meter |
| Vertical Link Work | Total Vertical Meters × Rate | 180 per meter |
| Splicing Revenue | Total Cores × Rate | 70 per core |

**Total Gross Revenue = Sum of above**

#### Deductions
| Item | Formula | Rate |
|------|---------|------|
| VAT | Gross Revenue × Rate | 10% |
| Income Tax | Gross Revenue × Rate | 5% |

**Net Revenue = Gross Revenue - VAT - Income Tax**

---

## 🔶 TEMPLATE 2: 4G TO 5G TOWER CONVERSION

### Project Overview
**Use Case**: Upgrading 4G base stations to 5G capability  
**Typical Client**: Huawei, ZTE, Nokia, Ericsson (as their subcontractor)  
**End Client**: Mobile operators (Grameenphone, Banglalink, Robi, Teletalk)  
**Contract Type**: Subcontractor under main equipment vendor  
**Project Scale**: 20-100 towers typical  
**Analysis Time**: 2 minutes

---

### Quick Input Form

#### Section A: Project Basics (30 seconds)
```
• Project Name: ___________
• Main Contractor: [Dropdown: Huawei/ZTE/Nokia/Ericsson/Other]
• Mobile Operator: [Dropdown: Grameenphone/Banglalink/Robi/Teletalk]
• Region: [Dropdown: Dhaka/Chittagong/Sylhet/Rajshahi/Khulna/Other]
• Date: [Auto-filled: Today]
```

#### Section B: Tower Conversion Parameters (90 seconds)
```
Tower Details:
• Number of Towers: _____ (e.g., 50)
• Tower Type: [Dropdown: Rooftop/Ground/Monopole/Mixed]
• Average Tower Height: _____ meters (for safety planning)
• Site Access Difficulty: [Dropdown: Easy/Medium/Hard/Mixed]

Work Scope per Tower (Check all that apply):
☐ Power Unit Replacement (RRU power system)
☐ Microwave Equipment Upgrade (BTS/BBU)
☐ Antenna Installation/Upgrade
☐ Cable Management & Organization
☐ Testing & Commissioning
☐ Site Preparation/Cleaning

Equipment & Materials:
• Equipment Provided by: [Dropdown: Client/Self/Shared]
• Client Supplies Equipment: [Yes/No]
• Client Supplies Materials: [Yes/No]

Project Timeline:
• Project Duration: _____ months [Auto: Towers÷10 per month]
• Work Days per Week: _____ (typically 6)
```

**Total Input Fields: 12 (8 mandatory)**

---

### Auto-Calculated Parameters

| Parameter | Formula/Rule | Notes |
|-----------|--------------|-------|
| Towers per Team | 1-2 per day | Depends on complexity |
| Number of Teams Required | Calculated based on duration | Minimum 2 teams |
| Tower Climbers Needed | Teams × 2 climbers | Safety regulation |
| RF Engineers | 2 per 30 towers | Testing & integration |
| Site Supervisors | 1 per team | Project management |
| Working Days | Duration × Work Days/Week × 4.3 | Monthly calculation |
| Equipment Sets | Towers × checked work scopes | If self-supplied |
| Safety Gear Sets | Climbers + 2 backup | Fall protection equipment |

---

### Cost Categories

#### 1. One-Time Costs (Project Setup)
| Item | Formula | Rate (BDT) |
|------|---------|------------|
| Mobilization | Teams × Rate | 15,000 per team |
| Tower Climbing Safety Training | Climbers × Rate | 5,000 per person |
| Tool & Equipment Setup | Fixed | 50,000 |
| Safety Inspection Certification | Fixed | 30,000 |
| Project Documentation Setup | Fixed | 20,000 |
| Site Survey (initial) | Towers × Rate | 500 per tower |
| Transportation Setup | Fixed | 25,000 |

#### 2. Equipment & Materials (if self-supplied)
| Item | Condition | Rate (BDT/tower) |
|------|-----------|------------------|
| Power Unit | If scope checked & self-supplied | 45,000 |
| Microwave Equipment | If scope checked & self-supplied | 150,000 |
| Antenna & Mounts | If scope checked & self-supplied | 35,000 |
| Cables & Connectors | If scope checked & self-supplied | 15,000 |
| Mounting Hardware | If scope checked & self-supplied | 8,000 |
| Testing Equipment (rental) | Always if scope includes testing | 2,000 per tower |

#### 3. Manpower Costs

**Monthly Staff:**
| Role | Quantity | Rate (BDT/month) |
|------|----------|------------------|
| RF Engineers | Calculated (2 per 30 towers) | 60,000 |
| Site Supervisors | Number of teams | 45,000 |
| Project Manager | 1 | 80,000 |
| Safety Officer | 1 | 40,000 |
| Documentation Officer | 1 | 35,000 |

**Daily Staff:**
| Role | Quantity | Rate (BDT/day) |
|------|----------|----------------|
| Tower Climbers | Calculated | 3,500 per climber |
| Rigging Assistants | Climbers × 0.5 | 1,500 |
| Drivers | Number of vehicles | 1,200 |

**Multiply by Duration (months) or Working Days**

#### 4. Per-Tower Installation Costs
| Work Item | If Scope Checked | Rate (BDT/tower) |
|-----------|------------------|------------------|
| Power Unit Replacement | Yes | 12,000 |
| Microwave Upgrade | Yes | 25,000 |
| Antenna Installation | Yes | 18,000 |
| Cable Management | Yes | 8,000 |
| Testing & Commissioning | Yes | 15,000 |
| Site Preparation | Always | 5,000 |

**Multiply by Number of Towers**

#### 5. Transportation & Logistics (Daily)
| Item | Formula | Rate (BDT/day) |
|------|---------|----------------|
| Vehicle Rental | Teams × 1 vehicle | 6,000 per vehicle |
| Fuel Cost | Vehicles × Rate | 2,500 per vehicle |
| Equipment Transport | Fixed | 3,000 |
| Small Tools Transport | Fixed | 1,000 |

**Multiply by Working Days**

#### 6. Safety & Compliance
| Item | Formula | Rate (BDT) |
|------|---------|------------|
| Fall Protection Equipment | Climbers × Rate | 25,000 per set |
| Personal PPE | Total staff × Rate | 8,000 per person |
| First Aid Kits | Teams × Rate | 3,000 per team |
| Insurance (project) | Total Cost × 2% | 2% |
| Site Permits | Towers × Rate | 500 per tower |

#### 7. Overhead & Administrative
| Item | Frequency | Rate (BDT) |
|------|-----------|------------|
| Head Office Overhead | Monthly | 30,000 |
| Documentation & Reporting | Monthly | 15,000 |
| Client Liaison | Monthly | 20,000 |
| Accommodation (if needed) | Monthly | 40,000 |
| Miscellaneous | Monthly | 25,000 |

**Multiply by Duration (months)**

---

### Revenue Model

#### Option A: Per-Tower Billing (Most Common)
| Item | Formula | Rate (BDT/tower) |
|------|---------|------------------|
| Base Installation Rate | Towers × Base Rate | 80,000 - 120,000 |
| Power Unit Work | If included | +15,000 |
| Microwave Work | If included | +30,000 |
| Antenna Work | If included | +20,000 |
| Testing | If included | +18,000 |

**Total Revenue = Towers × (Base + Selected Work Scopes)**

#### Option B: Lump Sum Contract
```
Total Contract Value: _________ BDT
(Negotiate based on scope, complexity, timeline)
```

#### Deductions (Same as Fiber)
| Item | Formula | Rate |
|------|---------|------|
| VAT | Gross Revenue × Rate | 10% |
| Income Tax | Gross Revenue × Rate | 5% |

**Net Revenue = Gross Revenue - VAT - Income Tax**

---

### Business Rules & Validations

```
⚠️ Warnings:
• If towers >50 and duration <3 months → "Aggressive timeline"
• If Hard access + >30 towers → "Consider adding safety buffer"
• If Microwave work without RF Engineers → "Add RF Engineers"
• If Client provides equipment → "Ensure equipment delivery schedule"

💡 Suggestions:
• Towers 20-50: 2-3 teams optimal
• Towers 50-100: 4-6 teams recommended
• Hard access sites: Add 30% time buffer
• If <20 towers: Consider rejecting (setup cost too high)
```

---

## 🎯 UNIVERSAL SECTIONS (Apply to All Templates)

The following sections apply to all project types regardless of template:

---

### Profitability Metrics

```
Gross Profit = Gross Revenue - Total Cost
Net Profit = Net Revenue - Total Cost
Profit Margin % = (Net Profit ÷ Gross Revenue) × 100%
Break-even Billing Rate = Total Cost ÷ Length
```

---

## 📊 PART 4: Three Scenario Analysis

### Scenario 1: Conservative (Safety-First)
- **Purpose**: Worst-case planning, safest decision
- **Cost Adjustment**: +10% buffer
- **Revenue Adjustment**: -5% (client negotiation risk)
- **Decision Rule**: If profitable here → Very safe to approve

### Scenario 2: Realistic (Base Case)
- **Purpose**: Expected outcome based on standard rates
- **Cost Adjustment**: 0% (exact calculations)
- **Revenue Adjustment**: 0% (standard billing)
- **Decision Rule**: If profitable here → Approve

### Scenario 3: Optimistic (Best Case)
- **Purpose**: Best-case if everything goes well
- **Cost Adjustment**: -5% (efficient execution)
- **Revenue Adjustment**: 0% (no discount)
- **Decision Rule**: Reference only, not for decisions

---

## 🎨 PART 5: Results Dashboard UI

### Top Section: Decision Indicator

```
┌─────────────────────────────────────┐
│  [Status Icon] DECISION              │
│  Profit Margin: XX.X%                │
│  Confidence Level: HIGH/MEDIUM/LOW   │
└─────────────────────────────────────┘
```

**Color Coding:**
- **Green (>15%)**: ✅ FEASIBLE - Recommend Approval
- **Yellow (10-15%)**: ⚠️ MARGINAL - Review Carefully  
- **Red (<10%)**: ❌ NOT FEASIBLE - Reject or Renegotiate

**Action Buttons:**
- `[Approve Project]` - Move to quotation stage
- `[Reject]` - Archive with reason
- `[Edit Parameters]` - Adjust inputs and recalculate
- `[Save Draft]` - Come back later
- `[Export Report]` - PDF summary

---

### Middle Section: Scenario Comparison Table

| Metric | Conservative | Realistic | Optimistic |
|--------|--------------|-----------|------------|
| **Total Cost** | ৳X,XXX,XXX | ৳X,XXX,XXX | ৳X,XXX,XXX |
| **Gross Revenue** | ৳X,XXX,XXX | ৳X,XXX,XXX | ৳X,XXX,XXX |
| **VAT (10%)** | (৳XXX,XXX) | (৳XXX,XXX) | (৳XXX,XXX) |
| **Income Tax (5%)** | (৳XXX,XXX) | (৳XXX,XXX) | (৳XXX,XXX) |
| **Net Revenue** | ৳X,XXX,XXX | ৳X,XXX,XXX | ৳X,XXX,XXX |
| **Net Profit** | ৳X,XXX,XXX | ৳X,XXX,XXX | ৳X,XXX,XXX |
| **Margin %** | XX.X% | XX.X% | XX.X% |
| **Decision** | ✅/⚠️/❌ | ✅/⚠️/❌ | ✅/⚠️/❌ |

---

### Bottom Section: Detailed Breakdown (Expandable/Collapsible)

#### Cost Breakdown by Category
```
📊 Cost Breakdown                          Amount (BDT)    %
─────────────────────────────────────────────────────────────
▼ One-Time Costs                           XXX,XXX        X%
  • Mobilization                           XX,XXX
  • Water Reservoir                        XX,XXX
  • Office Furniture                       XX,XXX
  • PPE & Safety                          XX,XXX
  • Testing & Commissioning               XX,XXX
  • Transportation                        XX,XXX
  • Entertainment                         XX,XXX
  • Miscellaneous                         XX,XXX
  • Insurance                             XX,XXX

▼ Monthly Costs (X months)                 XXX,XXX        X%
  • Equipment Rental                      XXX,XXX
  • Site Facilities                       XX,XXX
  • Staff Salaries                        XXX,XXX
  • Allowances & Benefits                 XX,XXX
  • Overhead & Admin                      XX,XXX

▼ Daily Costs (XX days)                    XXX,XXX        X%
  • Labour                                XXX,XXX
  • Equipment & Fuel                      XX,XXX

▼ Length-Based (XX,XXXm)                   X,XXX,XXX      XX%
  • Cable (if self-supplied)              XXX,XXX
  • HDPE Duct (if self-supplied)          XXX,XXX
  • Warning Tape                          XX,XXX
  • Design & Documentation                XX,XXX
  • Permissions & Approvals               XXX,XXX

▼ Installation & Works                     X,XXX,XXX      XX%
  • Hand Holes                            X,XXX,XXX
  • Vertical Work                         XX,XXX
  • Splicing & Termination                XX,XXX
  • Accessories & Hardware                XX,XXX

▼ Financing & Contingency                  XXX,XXX        X%
  • Bank Interest                         XXX,XXX
  • Contingency                           XX,XXX

─────────────────────────────────────────────────────────────
TOTAL COST                                 X,XXX,XXX      100%

📈 Revenue Breakdown
─────────────────────────────────────────────────────────────
• Underground Laying (XX,XXXm × 250)      X,XXX,XXX
• Vertical Work (XXXm × 180)              XXX,XXX
• Splicing (XXX cores × 70)               XX,XXX
─────────────────────────────────────────────────────────────
GROSS REVENUE                              X,XXX,XXX
- VAT (10%)                                (XXX,XXX)
- Income Tax (5%)                          (XXX,XXX)
─────────────────────────────────────────────────────────────
NET REVENUE                                X,XXX,XXX

💰 Profitability Summary
─────────────────────────────────────────────────────────────
Gross Revenue                              X,XXX,XXX
Total Cost                                 (X,XXX,XXX)
─────────────────────────────────────────────────────────────
GROSS PROFIT                               XXX,XXX
VAT & Tax                                  (XXX,XXX)
─────────────────────────────────────────────────────────────
NET PROFIT                                 XXX,XXX
PROFIT MARGIN                              XX.X%
BREAK-EVEN RATE                            XXX BDT/meter
```

---

## ⚠️ Business Rules & Suggestions (Non-Blocking)

### Validation Warnings
```
💡 Profitability Suggestions:
• Your break-even rate is XXX BDT/m (billing 250 BDT/m)
• Consider negotiating cable/duct from client (saves ৳XXX,XXX)
• Hand hole cost is XX% of total - verify subcontractor rates
• At XX months, consider adding 10% time buffer for risks

⚠️ Risk Factors Identified:
• X rivers & X bridges detected - potential delay risks
• Client providing materials - ensure quality specifications
• Single HDD machine for XXkm - consider backup plan
• Project duration is tight for this length (X months for XXkm)
• High site complexity (bridges/rivers) may need extra equipment

✅ Optimization Opportunities:
• If duration increased to X months, HDD rental more economical
• Bulk material procurement could save X%
• Consider splitting into X phases for better cash flow
```

### Auto-Adjustments (Applied with notification)
- If length >50,000m → Add 1 site, 1 HDD machine
- If duration <2 months → Warn: "Aggressive timeline"
- If client provides cables but not ducts → Suggest negotiating both
- If profit margin <0% → Highlight break-even rate needed

---

## 🔄 User Workflow After Results

### 1. Approve Project
- Status changes to "Approved"
- Move to quotation generation stage
- Add to approved projects pipeline
- Track for client response

### 2. Reject Project
- Select rejection reason:
  - Low profit margin
  - High risk factors
  - Client requirements unrealistic
  - Location/logistics challenges
  - Better opportunities available
- Archive for future reference
- Optional: Track for re-evaluation later

### 3. Adjust Parameters & Recalculate
User can modify any input and instantly recalculate:
- Extend duration (more cost but maybe justify higher price)
- Ask client to provide materials
- Reduce scope (fewer rings/links)
- Negotiate higher billing rate
- Adjust equipment/staff levels

**Live Recalculation**: Changes reflect immediately

### 4. Save as Draft
- Save partially completed analysis
- Return later to finish
- Track incomplete evaluations

### 5. Compare with Similar Projects
- View side-by-side comparison
- Filter by: Location, Size, Client Type, Margin %
- Learn from past approvals/rejections

### 6. Generate PDF Report
- Executive summary (1 page)
- Full detailed breakdown
- Scenario comparison
- Risk assessment
- Recommendation
- Professional formatting for internal review

---

## 📈 Key Performance Indicators (KPIs)

### Analysis Efficiency
- **Target**: Analyze 100 projects in 5-6 hours
- **Speed**: 2-3 minutes per project
- **Accuracy**: 90%+ cost estimation accuracy

### Decision Metrics
- **Approval Rate**: Track % of feasible projects
- **Average Margin**: Monitor typical profit margins
- **Success Rate**: Approved projects that client accepts

### Business Impact
- **Revenue Pipeline**: Total potential revenue from approved projects
- **Profit Forecast**: Expected profit from pipeline
- **Conversion Rate**: Lead → Approved → Client Won

---

## 💾 Data Requirements

### Template Registry (System Configuration)
Stored in database, defines available project types:
```
project_templates table:
- Template code (OPTICAL_FIBER, 5G_TOWER_CONVERSION, etc.)
- Template name & description
- Icon & category
- Input schema (JSON): What fields to show
- Cost categories (JSON): What cost items exist
- Revenue model (JSON): How to calculate revenue
- Calculation logic reference
- Active/inactive status
```

### Template Cost Parameters (Type A - Template-Specific Settings)
Stored per template, editable via Settings page:
```
template_cost_parameters table:
- Template code (links to template)
- Category (Mobilization, Equipment, Manpower, etc.)
- Item name (HDD Machine Rent, Tower Climber Rate, etc.)
- Rate/Cost
- Unit (per day, per month, per tower, per meter, etc.)
- Frequency (one-time, recurring, per-unit)
- Active status
```

**Examples:**
- Optical Fiber: "HDD Machine Rent: 500,000 BDT/month"
- 5G Tower: "Tower Climber: 3,500 BDT/day"

### Project Data (Type B - Per Analysis)
Stored per project record:
```
projects table:
- Project identification (name, client, location, date)
- Project type/template (OPTICAL_FIBER or 5G_TOWER_CONVERSION)
- Input parameters (stored as JSON - flexible per type)
- Calculated results (costs, revenue, profit, margin)
- Decision outcome (approved/rejected, reason)
- User notes and comments
- Ownership (created_by, assigned_to)
- Status (draft, analyzing, approved, rejected, etc.)
- Timestamps and audit trail
```

### Settings/Configuration Data (Type A - Rarely Changes)
Stored in database/config, editable via Settings page:
- All cost rates per template (labour, equipment, materials)
- All revenue rates per template (billing, splicing, vertical, per-tower)
- Default parameters per template (cores/link, vertical work/link, towers/team)
- Business rules thresholds per template
- Regional multipliers (if applicable)

---

## 🔐 Future Enhancements (Post Phase 1)

1. **Additional Project Templates**
   - Indoor DAS (Distributed Antenna System) installation
   - Base station (BTS) installation projects
   - Microwave link installation
   - Radio network optimization projects
   - FTTH (Fiber to the Home) rollout
   - Smart city infrastructure

2. **Template Builder (Admin Tool)**
   - Visual template designer
   - Custom field creator
   - Formula builder for cost calculations
   - No-code template creation
   - Clone existing templates

3. **Project Templates by Subcategory**
   - Fiber: Small (<10km), Medium (10-30km), Large (>30km)
   - Tower: Low-rise (<30m), Mid-rise (30-60m), High-rise (>60m)
   - Urban vs Rural profiles
   - Government vs Private sector defaults

4. **Historical Learning**
   - Track actual costs vs estimates per template
   - Refine formulas based on completed projects
   - Regional cost adjustments per template
   - Template accuracy scoring

5. **Batch Import/Export**
   - Excel import for bulk analysis (template-specific formats)
   - CSV export for external reporting
   - Template-specific import templates

6. **Advanced Comparison**
   - Multi-project comparison matrix (same template)
   - Cross-template comparison (fiber vs tower economics)
   - Portfolio optimization (pick best 10 from 100 across types)

7. **Client Negotiation Mode**
   - Show client: "At 280 BDT/m instead of 250, project becomes viable"
   - Interactive "what-if" scenarios per template
   - Multi-parameter sensitivity analysis

8. **Market Intelligence**
   - Track competitor pricing per template
   - Industry benchmark comparisons per project type
   - Winning bid analysis by category
   - Template-specific market trends

---

## 🎓 Decision Guidelines

### When to APPROVE (✅)
- Realistic scenario shows >15% margin
- Conservative scenario shows >10% margin
- Low-medium risk factors
- Client reliability good
- Technical feasibility confirmed

### When to be CAUTIOUS (⚠️)
- Realistic margin 10-15%
- Conservative margin 5-10%
- Multiple risk factors present
- First-time client
- Complex terrain/logistics

### When to REJECT (❌)
- Realistic margin <10%
- Conservative margin <5% or negative
- High risk factors
- Unrealistic client expectations
- Better opportunities available

### When to NEGOTIATE
- Margin 8-12% (borderline)
- Client can provide more materials
- Scope can be adjusted
- Timeline can be extended
- Billing rate can be increased

---

## 🎨 User Interface: Template Selection

### Project Creation Flow

#### Step 1: Template Selection Page
```
Location: /app/(protected)/projects/new

┌────────────────────────────────────────────────────────┐
│  Create New Project - Select Project Type              │
│                                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │  📡 Optical Fiber Underground Laying          │    │
│  │  Underground cable installation projects       │    │
│  │                                                │    │
│  │  • Underground length-based                    │    │
│  │  • 12 input parameters                         │    │
│  │  • Per-meter billing model                     │    │
│  │  • Typical: 5-50km, 2-6 months                │    │
│  │                                                │    │
│  │                    [Select Template] ──────▶   │    │
│  └──────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │  🗼 4G to 5G Tower Conversion                 │    │
│  │  Base station equipment upgrade projects       │    │
│  │                                                │    │
│  │  • Tower count-based                          │    │
│  │  • 10 input parameters                         │    │
│  │  • Per-tower billing model                     │    │
│  │  • Typical: 20-100 towers, 2-4 months         │    │
│  │                                                │    │
│  │                    [Select Template] ──────▶   │    │
│  └──────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │  + More Templates Coming Soon                 │    │
│  │  (Indoor DAS, BTS Installation, etc.)         │    │
│  └──────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

#### Step 2: Template-Specific Form
After selecting template, user sees customized form:
- **Optical Fiber**: Shows length, rings, links, bridges, etc.
- **5G Tower**: Shows tower count, work scope, equipment ownership, etc.

#### Step 3: Results Dashboard (Universal)
Same format for all templates:
- Decision indicator (Green/Yellow/Red)
- Three scenarios comparison
- Cost breakdown (template-specific categories)
- Revenue calculation (template-specific model)
- Profitability summary

---

## 📱 User Interface Principles

1. **Speed First**: Minimal clicks, smart defaults, auto-calculate
2. **Visual Clarity**: Color-coded decisions, clear indicators
3. **Mobile Friendly**: Access on site visits
4. **Keyboard Shortcuts**: Power users can fly through entries
5. **Comparison View**: Side-by-side project comparison
6. **Export Everything**: PDF, Excel, print-friendly
7. **Undo/Redo**: Easy to experiment with parameters

---

## 🔗 Integration Points

### Phase 2: Quotation System
- Auto-populate quotation from approved project
- Professional PDF generation
- Client response tracking

### Phase 3: ERP Export
- Map fields to your ERP schema
- API integration or file export
- Bidirectional sync for project status

### Phase 4: Analytics Dashboard
- Aggregate metrics across all analyses
- Trend analysis
- Forecasting and pipeline management

---

## ✅ Success Criteria for Phase 1

### Template System
- [ ] Template registry system functional
- [ ] Template selection page displays available types
- [ ] Dynamic form generation based on selected template
- [ ] Template-specific calculation engines work correctly
- [ ] Can switch between templates without conflicts

### Optical Fiber Template
- [ ] User can complete fiber project input in <3 minutes
- [ ] System calculates all fiber costs accurately
- [ ] Three scenarios display correctly for fiber projects
- [ ] Decision indicator matches business rules
- [ ] Detailed breakdown shows all fiber line items

### 5G Tower Template
- [ ] User can complete tower project input in <2 minutes
- [ ] System calculates all tower costs accurately
- [ ] Per-tower billing calculates correctly
- [ ] Work scope options properly affect costs
- [ ] Tower-specific warnings display appropriately

### Universal Features (All Templates)
- [ ] User can approve/reject with reasons
- [ ] Draft projects can be saved and resumed
- [ ] PDF export generates professional report (template-aware)
- [ ] Settings page allows rate adjustments per template
- [ ] Performance: Handles 100+ projects across types without lag
- [ ] Analytics dashboard shows metrics across all templates
- [ ] Project list filterable by template type
- [ ] Comparison works within same template type

### Admin & Configuration
- [ ] Admin can view/edit all templates
- [ ] Cost parameters editable per template
- [ ] Revenue models configurable per template
- [ ] New templates can be activated/deactivated
- [ ] Template usage statistics visible

---

## 📊 Implementation Roadmap

### Phase 1A: Foundation + Template Engine (Week 1)
**Goal**: Core template system + database
- [ ] Set up PostgreSQL + Prisma
- [ ] Create template registry tables
- [ ] Build template selection UI
- [ ] Implement dynamic form generator
- [ ] Create calculation engine framework
- [ ] Set up authentication system

**Deliverable**: Can select template, see appropriate form

### Phase 1B: Optical Fiber Template (Week 2)
**Goal**: Complete fiber feasibility system
- [ ] Implement fiber input form (12 fields)
- [ ] Build fiber calculation logic (10 cost categories)
- [ ] Create fiber revenue model
- [ ] Implement three-scenario analysis
- [ ] Build results dashboard
- [ ] Add fiber-specific validations

**Deliverable**: Fully functional fiber feasibility calculator

### Phase 1C: 5G Tower Template (Week 3)
**Goal**: Add tower conversion support
- [ ] Define 5G tower template in registry
- [ ] Implement tower input form (10 fields)
- [ ] Build tower calculation logic (7 cost categories)
- [ ] Create per-tower billing model
- [ ] Add tower-specific business rules
- [ ] Test tower template end-to-end

**Deliverable**: Both fiber and tower templates working

### Phase 1D: Settings & Admin (Week 4)
**Goal**: Template management and configuration
- [ ] Build settings page (template selector)
- [ ] Cost parameter editor per template
- [ ] Revenue rate editor per template
- [ ] Default values configuration
- [ ] Template activation toggle
- [ ] Audit log for settings changes

**Deliverable**: Admin can manage all template parameters

### Phase 1E: Testing & Polish (Week 5)
**Goal**: Production-ready system
- [ ] End-to-end testing all workflows
- [ ] Performance optimization
- [ ] Error handling & validation
- [ ] UI/UX polish and consistency
- [ ] Documentation completion
- [ ] User training materials

**Deliverable**: Production-ready multi-template system

---

## 🔧 Technical Architecture

### Database Schema (Template-Based)

```sql
-- Template Registry
CREATE TABLE project_templates (
  id                UUID PRIMARY KEY,
  template_code     VARCHAR(50) UNIQUE NOT NULL,
  template_name     VARCHAR(255) NOT NULL,
  category          VARCHAR(100),
  icon              VARCHAR(50),
  description       TEXT,
  input_schema      JSONB NOT NULL,
  cost_categories   JSONB NOT NULL,
  revenue_model     JSONB NOT NULL,
  is_active         BOOLEAN DEFAULT true,
  display_order     INTEGER,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
);

-- Template Cost Parameters
CREATE TABLE template_cost_parameters (
  id                UUID PRIMARY KEY,
  template_code     VARCHAR(50) REFERENCES project_templates(template_code),
  category          VARCHAR(100) NOT NULL,
  item_name         VARCHAR(255) NOT NULL,
  rate              DECIMAL(15, 2),
  unit              VARCHAR(50),
  frequency         VARCHAR(50),
  is_conditional    BOOLEAN DEFAULT false,
  condition         JSONB,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP,
  
  INDEX idx_template (template_code),
  INDEX idx_category (category)
);

-- Projects (Multi-Template)
CREATE TABLE projects (
  id                UUID PRIMARY KEY,
  template_code     VARCHAR(50) REFERENCES project_templates(template_code),
  project_name      VARCHAR(255) NOT NULL,
  client_name       VARCHAR(255) NOT NULL,
  location          VARCHAR(100),
  
  -- Ownership & Status
  created_by        UUID REFERENCES users(id),
  status            VARCHAR(50) DEFAULT 'DRAFT',
  
  -- Template-Specific Data (JSON)
  input_parameters  JSONB NOT NULL,
  calculated_costs  JSONB,
  calculated_revenue JSONB,
  
  -- Universal Results
  total_cost        DECIMAL(15, 2),
  gross_revenue     DECIMAL(15, 2),
  net_revenue       DECIMAL(15, 2),
  net_profit        DECIMAL(15, 2),
  profit_margin     DECIMAL(5, 2),
  
  -- Approval
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMP,
  rejection_reason  TEXT,
  
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP,
  
  INDEX idx_template (template_code),
  INDEX idx_created_by (created_by),
  INDEX idx_status (status)
);
```

### API Endpoints

```
Template Management:
GET    /api/templates                    - List all active templates
GET    /api/templates/:code              - Get template details
GET    /api/templates/:code/schema       - Get input form schema
GET    /api/templates/:code/parameters   - Get cost parameters

Project Management:
POST   /api/projects                     - Create project (with template_code)
GET    /api/projects                     - List projects (filterable by template)
GET    /api/projects/:id                 - Get project details
PUT    /api/projects/:id                 - Update project
POST   /api/projects/:id/calculate       - Run calculation
POST   /api/projects/:id/approve         - Approve project
POST   /api/projects/:id/reject          - Reject project

Settings (Admin Only):
GET    /api/settings/:template_code      - Get template settings
PUT    /api/settings/:template_code      - Update template settings
GET    /api/settings/:template_code/parameters - Get all cost parameters
PUT    /api/settings/:template_code/parameters/:id - Update parameter
```

---

## 📊 Template Comparison Matrix

| Aspect | Optical Fiber | 5G Tower Conversion |
|--------|---------------|---------------------|
| **Project Type** | Infrastructure deployment | Equipment upgrade |
| **Contract Type** | Main contractor | Subcontractor |
| **Typical Client** | Direct/Telecom operators | Huawei/ZTE/Nokia |
| **Primary Metric** | Underground length (meters) | Number of towers |
| **Input Parameters** | 12 fields | 10 fields |
| **Entry Time** | 2-3 minutes | 2 minutes |
| **Cost Categories** | 10 categories | 7 categories |
| **Major Cost Drivers** | HDD machines, hand holes, cables | Tower climbers, equipment, safety |
| **Revenue Model** | Per meter + extras | Per tower + scope items |
| **Typical Revenue** | 250 BDT/m + splicing + vertical | 80,000-120,000 BDT/tower + extras |
| **Duration Range** | 1-6 months | 2-4 months |
| **Project Scale** | 5,000 - 50,000 meters | 20-100 towers |
| **Complexity Factors** | Bridges, rivers, culverts | Site access, tower height |
| **Equipment Tracking** | HDD machines, trucks, generators | Climbing gear, testing equipment |
| **Safety Focus** | Underground work, trenching | Fall protection, tower climbing |
| **Material Tracking** | Cables, ducts (if self-supplied) | Power units, microwave (if self-supplied) |
| **Key Success Factor** | Project length accuracy | Tower count & work scope |

---

**Document Version**: 2.0  
**Last Updated**: March 13, 2026  
**Status**: Design Complete - Multi-Template Architecture  
**Templates Included**: Optical Fiber + 5G Tower Conversion  
**Next Templates**: Indoor DAS, BTS Installation, Microwave Links
