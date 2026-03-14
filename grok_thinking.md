✅ Here is your complete, production-ready specification for the Feasibility Analysis Application.

It is written so that Grok (or any developer) can immediately start building it with Next.js (App Router), Express.js backend, PostgreSQL + Prisma/Drizzle, Tailwind + shadcn/ui.
1. Project Overview & Summary
App Name: Feasibility Pro (or “Feasify”)
Purpose: A web-based SaaS tool that lets users create any type of EPC / infrastructure project (Fiber Optic Underground Laying, 4G→5G Conversion, Solar EPC, Railway EPC, etc.) and instantly get a full financial feasibility report.
Core Flow (exactly 6 tabs/pages as you requested):

Assumptions – All user inputs (dynamic per project type)
CapEx – One-time capital costs (auto-calculated + editable)
OpEx – Recurring operational costs (monthly/daily/yearly)
Revenue – Income streams (per meter, per link, per MW, per km, etc.)
Cashflow Matrix – Year-by-year cash flow table (project life 3–10 years)
Dashboard – Final verdict + all key metrics + charts + PDF export

Key Features:

Multi-project-type templates (Fiber, Solar, 5G, Railway + “Custom”)
Real-time auto-calculation (no manual refresh)
Financial metrics: NPV, IRR, ROI, Payback Period, Break-even, Profit Margin, Sensitivity Analysis
User authentication (you already built)
Project save/load (PostgreSQL)
PDF/Excel export of full report
Sensitivity sliders (change length, interest rate, etc. → live update)

How Feasibility Analysis Works (simple explanation for developers & users)

User selects project type → loads pre-filled assumption template.
User fills/edits all inputs in Assumptions tab.
App calculates:
CapEx (one-time investments)
OpEx (recurring costs over project life)
Revenue (over project life)
Cashflow = Revenue – OpEx – CapEx (Year 0 = –CapEx)

Calculates financial KPIs:
NPV = Σ (Cashflow_t / (1 + discount_rate)^t)
IRR = rate where NPV = 0
ROI = (Total Profit / Total Investment) × 100
Payback Period = years until cumulative cashflow becomes positive
Break-even = minimum meters/MW/km needed to cover costs
Profit Margin = Net Profit / Revenue

Verdict:
Green “✅ HIGHLY FEASIBLE” if NPV > 0 && IRR > hurdle rate (e.g. 14%)
Red “❌ NOT FEASIBLE” otherwise

Sensitivity table + charts + export.

This is exactly how real banks, EPC companies, and consultants evaluate projects in 2026.
2. Recommended Tech Architecture (2026 Best Practice)
Frontend: Next.js 15+ (App Router) + React Server Components + Tailwind + shadcn/ui + Recharts (charts) + React Hook Form + Zod validation
Backend: Express.js (or you can use Next.js API routes + server actions if you want single codebase)
Database: PostgreSQL + Prisma ORM (recommended) or Drizzle
Authentication: Your existing setup (Clerk / NextAuth / custom JWT)
Deployment: Vercel (frontend) + Render / Railway / Fly.io (Express + Postgres)

3. Database Schema (PostgreSQL – Prisma style)

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  projects  Project[]
}

model ProjectType {
  id          String @id @default(cuid())
  name        String // "Fiber Optic", "Solar EPC", "Railway EPC", "5G Conversion"
  template    Json   // stores default assumption fields
}

model Project {
  id             String   @id @default(cuid())
  userId         String
  typeId         String
  name           String
  status         String   // draft, completed
  assumptions    Json     // all inputs stored as JSON (flexible for any project type)
  capex          Json
  opex           Json
  revenue        Json
  cashflow       Json     // year-by-year array
  metrics        Json     // {npv, irr, roi, payback, breakEven, margin, verdict}
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

This JSON approach makes it super flexible for 10+ project types without creating 10 different tables.

4. Frontend Page Structure (Next.js App Router)

/app
  /dashboard          → Main landing with list of projects + New Project button
  /project/[id]
    /assumptions      → Dynamic form (based on project type)
    /capex            → Table + auto-calculated totals (editable)
    /opex             → Monthly/Yearly breakdown
    /revenue          → Income streams
    /cashflow         → Table + line chart
    /dashboard        → Final report + verdict + PDF button

    Use shadcn/ui components:

Card, Table, Input, Select, Switch, Slider (for sensitivity)
Tabs (for the 6 sections)
Recharts or Chart.js for NPV/IRR charts

5. Detailed Module Breakdown + Calculation Logic
1. Assumptions Tab (All Inputs)

Project Type selector (Fiber, Solar, etc.)
Dynamic form fields (loaded from ProjectType.template or hard-coded per type)
Example fields for Fiber (exactly what we built together):
Total Length (m), Number of Rings, Number of Links, Avg Vertical per Link, Cores per Link, etc.
All your costs (HDD rent, labour, hand holes, loan interest 14%, etc.)

Save button → stores everything in assumptions JSON column

2. CapEx Tab

One-time costs only (mobilisation, furniture, cable/duct if not client, hand holes, PPE, OTDR, initial loan interest, bridge/culvert extra, etc.)
Auto-calculated + user can override any line
Grand Total shown at bottom

3. OpEx Tab

Recurring (monthly/daily × duration)
HDD rent × months, labour daily × working days, generator/fuel/truck/mini-truck, salaries, bonus, consultant, shade rent, stationery, misc, etc.
Total OpEx over project life

4. Revenue Tab

Per-meter / per-link / per-core rates (your 250 Tk/m underground + 180 vertical + 70 splicing)
Total Revenue = length × rate + extras
Option to mark VAT/Tax included or separate

5. Cashflow Matrix Tab

Table: Year 0 to Year N
Year 0 = –Total CapEx
Year 1–N = Revenue_t – OpEx_t
Cumulative cashflow row
Charts: Cashflow bar + Cumulative line

6. Dashboard Tab (Final Output)
Key Outputs displayed:

Total CapEx
Total OpEx
Total Revenue
Net Profit
Profit Margin %
ROI %
Payback Period (years)
Break-even Length (meters / MW / km)
NPV (at discount rate 14%)
IRR
Verdict (big green/red badge + explanation)
Sensitivity Table (3×3 grid: ±20% on length/cost/price)
Export buttons: PDF (react-pdf or html-to-pdf), Excel

6. Calculation Engine (Backend or Server Action)

function calculateProject(assumptions: any, projectLife: number) {
  const capex = calculateCapEx(assumptions);
  const opexTotal = calculateOpEx(assumptions, projectLife);
  const revenueTotal = calculateRevenue(assumptions, projectLife);
  
  const cashflows = generateCashflow(capex, opexTotal, revenueTotal, projectLife);
  
  const npv = calculateNPV(cashflows, assumptions.discountRate || 0.14);
  const irr = calculateIRR(cashflows);
  const roi = (revenueTotal - capex - opexTotal) / capex * 100;
  const payback = calculatePayback(cashflows);
  const breakEven = capex / (assumptions.revenuePerMeter - assumptions.variableCostPerMeter);

  const verdict = npv > 0 && irr > 0.14 ? "HIGHLY FEASIBLE" : "NOT FEASIBLE";

  return { capex, opexTotal, revenueTotal, cashflows, metrics: { npv, irr, roi, payback, breakEven, margin: (revenueTotal - capex - opexTotal)/revenueTotal*100, verdict } };
}

7. Summary for Your Team / Grok in VS Code
What to build first (priority order):

Project CRUD + Assumptions dynamic form (use your existing auth)
Calculation service (lib/calculateFeasibility.ts)
CapEx / OpEx / Revenue pages with tables (use shadcn Table + React Hook Form)
Cashflow matrix + charts
Dashboard with verdict + export
Add more project types (Solar, Railway, 5G) by creating new templates in DB

This structure is exactly what professional feasibility tools (like @Risk, Crystal Ball, or EPC company internal software) use in 2026.
You now have everything needed to code it fast.
Start with:

Create /app/project/[id]/assumptions/page.tsx
Paste the calculation function
Let me know which page you want the complete code for first (Assumptions form or Dashboard), and I’ll give you the full component + API route + Prisma queries.

Ready when you are — just say “give me code for Assumptions page” or “give me the Prisma schema file” and we’ll build it line by line! 🚀

