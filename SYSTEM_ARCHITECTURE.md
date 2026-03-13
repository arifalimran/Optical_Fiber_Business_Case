# System Architecture Overview - Optical Fiber Business Case

## 📋 Document Purpose

This is the **master architecture document** for the Multi-Template Telecom Project Feasibility System. It provides a high-level overview of the entire system architecture, combining business requirements, technical decisions, and implementation roadmap.

---

## 🎯 System Vision

### **Problem Statement**
Telecom contractors need to rapidly evaluate feasibility of multiple project types (fiber optic, tower conversions, etc.) to identify profitable opportunities among hundreds of potential projects. Current process is slow, inconsistent, and doesn't support different project categories.

### **Solution**
A unified, template-based feasibility analysis platform that:
- Supports multiple telecom project types through configurable templates
- Enables 2-3 minute feasibility analysis per project
- Provides conservative/realistic/optimistic scenario planning
- Streamlines from lead → analysis → approval → quotation → ERP integration
- Scales to handle 100+ analyses across different project categories

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  Next.js Frontend + React 19 + Tailwind CSS + shadcn/ui │
│                                                          │
│  • Template Selection UI                                │
│  • Dynamic Forms per Template                           │
│  • Results Dashboard (3 scenarios)                      │
│  • Project Management                                    │
│  • Analytics & Reporting                                │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   AUTHENTICATION LAYER                   │
│           JWT-based Auth + Role-Based Access            │
│                                                          │
│  • Multi-Role: Analyst / Approver / Admin               │
│  • Session Management (24h / 30d Remember Me)           │
│  • Creator-Only Visibility + Admin Override             │
│  • Route Protection & Permissions                        │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
│              Next.js API Routes + Business Logic         │
│                                                          │
│  • Template Registry Service                            │
│  • Calculation Engine (per template)                     │
│  • Project Management Service                            │
│  • Approval Workflow Engine                              │
│  • Quotation Generator                                   │
│  • Analytics Aggregator                                  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                          │
│             PostgreSQL + Prisma ORM                      │
│                                                          │
│  • Users & Sessions                                      │
│  • Project Templates Registry                            │
│  • Template Cost Parameters                              │
│  • Projects (with JSONB for template-specific data)     │
│  • Audit Logs                                            │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                      │
│                                                          │
│  • ERP Export (approved projects)                        │
│  • PDF Generation (quotations & reports)                │
│  • Email Notifications (future)                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### **Technology Stack**
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **State**: React Context + Server Components

### **Key Pages**
```
/                              → Dashboard (overview)
/login                         → Authentication
/projects                      → Project list (all or user's)
/projects/new                  → Template selection
/projects/new/:template        → Template-specific input form
/projects/:id                  → Project details & results
/projects/:id/edit             → Edit project parameters
/analytics                     → Analytics dashboard
/settings                      → Admin: Template settings
/settings/:template            → Admin: Template cost parameters
/users                         → Admin: User management
```

### **Component Structure**
```
components/
├── layout/
│   ├── Sidebar.tsx           → Navigation menu
│   ├── TopBar.tsx            → Search, notifications, user menu
│   ├── Footer.tsx            → Footer links
│   └── MainLayout.tsx        → Layout wrapper
├── projects/
│   ├── TemplateSelector.tsx   → Choose project type
│   ├── DynamicForm.tsx        → Template-specific form
│   ├── ResultsDashboard.tsx   → 3 scenarios + breakdown
│   └── ProjectCard.tsx        → Project list item
├── templates/
│   ├── fiber/
│   │   └── FiberInputForm.tsx
│   └── tower/
│       └── TowerInputForm.tsx
├── analytics/
│   └── Charts.tsx
└── ui/                       → shadcn/ui components
```

---

## 🔧 Backend Architecture

### **Technology Stack**
- **Framework**: Next.js API Routes
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Authentication**: JWT tokens + httpOnly cookies
- **Password**: bcrypt (cost factor 12)

### **API Structure**
```
/api/
├── auth/
│   ├── login.ts              → POST: Email/password login
│   ├── logout.ts             → POST: Clear session
│   ├── me.ts                 → GET: Current user info
│   └── register.ts           → POST: Create user (admin only)
│
├── templates/
│   ├── index.ts              → GET: List all templates
│   ├── [code].ts             → GET: Template details
│   └── [code]/
│       ├── schema.ts         → GET: Input form schema
│       └── parameters.ts     → GET/PUT: Cost parameters
│
├── projects/
│   ├── index.ts              → GET: List, POST: Create
│   ├── [id].ts               → GET/PUT/DELETE: Project CRUD
│   ├── [id]/calculate.ts     → POST: Run feasibility calc
│   ├── [id]/approve.ts       → POST: Approve project
│   ├── [id]/reject.ts        → POST: Reject with reason
│   └── [id]/quotation.ts     → POST: Generate PDF quote
│
├── settings/
│   └── [template]/
│       ├── index.ts          → GET/PUT: Template settings
│       └── parameters/
│           └── [id].ts       → PUT: Update parameter
│
├── users/
│   ├── index.ts              → GET: List, POST: Create
│   └── [id].ts               → GET/PUT/DELETE: User CRUD
│
└── analytics/
    ├── overview.ts           → GET: Dashboard metrics
    └── templates/
        └── [code].ts         → GET: Template-specific analytics
```

---

## 🗄️ Database Schema (Core Tables)

### **Users & Authentication**
```sql
users
  - id (UUID, PK)
  - email (unique)
  - password_hash
  - full_name
  - role (ANALYST, APPROVER, ADMIN)
  - is_active
  - created_at, updated_at, last_login_at

sessions
  - id (UUID, PK)
  - user_id (FK → users)
  - token (unique)
  - expires_at
  - device_info, ip_address
  - created_at, last_activity_at
```

### **Template System**
```sql
project_templates
  - id (UUID, PK)
  - template_code (unique: OPTICAL_FIBER, 5G_TOWER_CONVERSION)
  - template_name, category, icon, description
  - input_schema (JSONB)
  - cost_categories (JSONB)
  - revenue_model (JSONB)
  - is_active, display_order
  - created_at, updated_at

template_cost_parameters
  - id (UUID, PK)
  - template_code (FK → project_templates)
  - category, item_name
  - rate, unit, frequency
  - is_conditional, condition (JSONB)
  - is_active
  - created_at, updated_at
```

### **Projects**
```sql
projects
  - id (UUID, PK)
  - template_code (FK → project_templates)
  - project_name, client_name, location
  - created_by (FK → users)
  - status (DRAFT, ANALYZING, PENDING_APPROVAL, etc.)
  - input_parameters (JSONB) ← Template-specific
  - calculated_costs (JSONB)
  - calculated_revenue (JSONB)
  - total_cost, gross_revenue, net_profit, profit_margin
  - approved_by (FK → users), approved_at
  - rejection_reason
  - created_at, updated_at
```

### **Audit Trail**
```sql
audit_logs
  - id (BIGSERIAL, PK)
  - user_id (FK → users)
  - action (LOGIN, CREATE_PROJECT, APPROVE_PROJECT, etc.)
  - resource_type, resource_id
  - details (JSONB)
  - ip_address, user_agent
  - created_at
```

---

## 🔐 Security Architecture

### **Authentication Flow**
1. User submits email + password
2. Backend validates credentials (bcrypt compare)
3. Generate JWT token (24h or 30d if Remember Me)
4. Set httpOnly, secure, sameSite cookie
5. Frontend receives user object
6. Subsequent requests include cookie automatically
7. Middleware validates token on each API call

### **Authorization Model**
```
Role Hierarchy:
ADMIN > APPROVER > ANALYST

Permissions Matrix:
                    ANALYST  APPROVER  ADMIN
Create Project        ✓        ✓        ✓
View Own Projects     ✓        ✓        ✓
View All Projects     ✗        ✓        ✓
Edit Own Draft        ✓        ✓        ✓
Approve/Reject        ✗        ✓        ✓
Generate Quotation    ✗        ✓        ✓
Manage Users          ✗        ✗        ✓
Edit Settings         ✗        ✗        ✓
View Audit Logs       ✗        ✗        ✓
```

### **Data Visibility**
- **Analysts**: See only projects they created
- **Approvers**: See all projects company-wide
- **Admins**: See everything + system settings

---

## 📊 Template System Architecture

### **Template Definition**
Each template is a JSON configuration defining:

```typescript
interface ProjectTemplate {
  code: string;              // OPTICAL_FIBER, 5G_TOWER_CONVERSION
  name: string;
  category: string;
  icon: string;
  
  inputSchema: {             // What fields to show in form
    fields: Field[];
  };
  
  costCategories: {          // What cost sections exist
    categories: Category[];
  };
  
  revenueModel: {            // How to calculate revenue
    type: 'PER_METER' | 'PER_TOWER' | 'LUMP_SUM';
    items: RevenueItem[];
  };
  
  calculationLogic: string;  // Reference to calculation function
}
```

### **Calculation Engine**
Template-specific calculators:

```typescript
// interfaces/calculator.ts
interface Calculator {
  calculateCosts(
    inputs: any,
    parameters: CostParameter[]
  ): CostBreakdown;
  
  calculateRevenue(
    inputs: any,
    parameters: CostParameter[]
  ): RevenueBreakdown;
  
  calculateProfitability(
    costs: CostBreakdown,
    revenue: RevenueBreakdown
  ): ProfitabilityResults;
  
  generateScenarios(
    base: Results
  ): {
    conservative: Results;
    realistic: Results;
    optimistic: Results;
  };
}

// calculators/fiber.ts
export const fiberCalculator: Calculator = { ... };

// calculators/tower.ts
export const towerCalculator: Calculator = { ... };
```

### **Dynamic Form Generation**
Forms are generated from template schema:

```typescript
function DynamicForm({ template, onSubmit }) {
  const schema = template.inputSchema;
  
  return (
    <form>
      {schema.fields.map(field => (
        <FormField
          key={field.name}
          type={field.type}
          label={field.label}
          validation={field.validation}
          defaultValue={field.default}
        />
      ))}
    </form>
  );
}
```

---

## 🎯 User Workflows

### **Workflow 1: Analyst Creates Project**
```
1. Login → Dashboard
2. Click "New Project"
3. Select Template (Fiber or Tower)
4. Fill template-specific form (2-3 min)
5. Click "Calculate Feasibility"
6. View 3 scenarios (Conservative/Realistic/Optimistic)
7. Review cost breakdown
8. Decision:
   a. If clearly not feasible → "Reject" (archive)
   b. If borderline → "Save Draft" (revisit later)
   c. If looks good → Submit for approval
9. Project moves to "Pending Approval" status
10. Approver notified
```

### **Workflow 2: Approver Reviews Project**
```
1. Login → See "Pending Approval" badge
2. Navigate to project
3. Review all 3 scenarios
4. Check cost assumptions
5. View business rules suggestions
6. Decision:
   a. Approve → Status: "Approved"
   b. Reject with reason → Status: "Rejected"
   c. Send back for revision → Comment + notify analyst
7. If approved → Generate quotation
8. Track quotation status
9. If client accepts → Export to ERP
```

### **Workflow 3: Admin Manages Settings**
```
1. Login (Admin) → Settings
2. Select template (Fiber or Tower)
3. View all cost parameters
4. Edit rates that changed (e.g., labor cost increased)
5. Save changes
6. All future calculations use new rates
7. Historical projects unaffected (point-in-time snapshot)
```

---

## 📈 Implementation Phases

### **Phase 1: Foundation (Weeks 1-2)**
- ✅ Next.js project setup
- ✅ Authentication system (email/password, JWT, roles)
- ✅ Database schema (PostgreSQL + Prisma)
- ✅ Basic UI layout (sidebar, topbar, footer)
- ✅ Template registry infrastructure

### **Phase 2: Optical Fiber Template (Week 2-3)**
- Template definition in database
- Fiber input form (12 fields)
- Fiber calculation engine (10 cost categories)
- Results dashboard (3 scenarios)
- Approve/reject workflow
- Testing end-to-end

### **Phase 3: 5G Tower Template (Week 3-4)**
- Tower template definition
- Tower input form (10 fields)
- Tower calculation engine (7 cost categories)
- Per-tower billing model
- Tower-specific validations
- Testing end-to-end

### **Phase 4: Admin & Settings (Week 4-5)**
- Settings UI per template
- Cost parameter editor
- User management page
- Template activation/deactivation
- Audit logging UI

### **Phase 5: Analytics & Reporting (Week 5-6)**
- Dashboard metrics
- Project comparison
- Template-specific analytics
- PDF quotation generation
- Export functionality

### **Phase 6: Polish & Deploy (Week 6-7)**
- Performance optimization
- Error handling
- Security hardening
- User testing
- Deployment
- Documentation

---

## 🔄 Data Flow Example

**Scenario: Analyst Creates Fiber Project**

```
1. Frontend: User fills form
   POST /api/projects
   Body: {
     template_code: "OPTICAL_FIBER",
     project_name: "Dhaka Metro",
     input_parameters: {
       underground_length: 30000,
       number_of_rings: 2,
       number_of_links: 10,
       ...
     }
   }

2. API Route: Validate & Save
   - Check user permissions
   - Validate template exists
   - Validate input against schema
   - Create project record (status: DRAFT)
   - Return project ID

3. Frontend: Request Calculation
   POST /api/projects/:id/calculate
   
4. API Route: Calculate
   - Load template cost parameters
   - Load project inputs
   - Call fiberCalculator.calculateCosts()
   - Call fiberCalculator.calculateRevenue()
   - Generate 3 scenarios
   - Update project with results
   - Return results

5. Frontend: Display Results
   - Show decision indicator (Green/Yellow/Red)
   - Show 3 scenarios table
   - Show detailed cost breakdown
   - Show approve/reject buttons

6. User: Approves
   POST /api/projects/:id/approve
   
7. API Route: Update Status
   - Check user role (must be APPROVER/ADMIN)
   - Update status to APPROVED
   - Set approved_by, approved_at
   - Log audit trail
   - Send notification (future)
```

---

## ⚙️ Environment Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/optical_fiber
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET=your-super-secret-key-here-min-32-chars
JWT_EXPIRY=24h
JWT_REMEMBER_ME_EXPIRY=30d
BCRYPT_ROUNDS=12

# Session
SESSION_COOKIE_NAME=auth_token
SESSION_SECURE=true
SESSION_SAME_SITE=strict

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=5

# Application
NODE_ENV=production
APP_URL=https://optical-fiber.yourdomain.com
PORT=3000

# Email (Future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# ERP Integration (Future)
ERP_API_URL=
ERP_API_KEY=
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- Calculation engines (fiber, tower)
- Permission helpers
- Data validators
- Utility functions

### **Integration Tests**
- API endpoints (auth, projects, templates)
- Database operations
- Template loading & calculation
- Approval workflows

### **E2E Tests**
- User login/logout
- Create fiber project → Calculate → Approve
- Create tower project → Calculate → Reject
- Admin changes settings
- Multi-user scenarios

---

## 📊 Success Metrics

### **Performance**
- [ ] Page load < 2 seconds
- [ ] Calculation < 1 second
- [ ] Support 100+ concurrent users
- [ ] Database queries < 100ms

### **Usability**
- [ ] Project input < 3 minutes
- [ ] 90% user satisfaction
- [ ] <5% error rate
- [ ] Intuitive without training

### **Business**
- [ ] Analyze 100+ projects/week
- [ ] 10% approval rate achieved
- [ ] 50% time saved vs manual process
- [ ] Support 2+ project types

---

## 🚀 Deployment Architecture

```
Production:
├── Next.js App (Vercel or VPS)
├── PostgreSQL (Managed service or VPS)
├── Redis (for rate limiting, future)
└── Backup (daily automated)

Environments:
├── Development (localhost)
├── Staging (testing.domain.com)
└── Production (app.domain.com)
```

---

## 📚 Related Documents

1. **[PHASE_1_FEASIBILITY_CALCULATOR.md](./PHASE_1_FEASIBILITY_CALCULATOR.md)**
   - Detailed feasibility calculator specifications
   - Template-specific parameters
   - Cost calculation formulas
   - Revenue models

2. **[AUTHENTICATION_SPECIFICATION.md](./AUTHENTICATION_SPECIFICATION.md)**
   - Authentication & authorization details
   - Role-based access control
   - Session management
   - Security implementation

3. **[README.md](./frontend/README.md)**
   - Frontend setup instructions
   - Development guidelines
   - Component documentation

---

## 🎓 Glossary

**Template**: A project type configuration defining inputs, costs, and revenue model  
**Feasibility Analysis**: Process of calculating if a project is profitable  
**Scenario**: Conservative/Realistic/Optimistic cost/revenue estimates  
**Cost Category**: Grouping of related costs (e.g., Equipment, Manpower)  
**Profit Margin**: (Net Profit ÷ Revenue) × 100%  
**Pipeline**: Collection of projects in various stages  
**ERP**: Enterprise Resource Planning system for project execution  

---

**Document Version**: 1.0  
**Last Updated**: March 13, 2026  
**Status**: Master Architecture - Ready for Implementation  
**Architecture Type**: Multi-Template, Template-Based Design  
**Tech Stack**: Next.js + PostgreSQL + Prisma + TypeScript
