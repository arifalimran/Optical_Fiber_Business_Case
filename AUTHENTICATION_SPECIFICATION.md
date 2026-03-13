# Authentication & Access Control - Technical Specification

## 📋 System Overview

**Type**: Single-tenant, multi-role, email/password authentication
**Database**: One database for company, all projects stored centrally
**Visibility**: Creator-only (users see their projects, admin sees all)
**Session**: 24 hours, Remember Me enabled, Multi-device allowed

---

## 👥 User Roles & Permissions

### Role 1: ANALYST
**Purpose**: Create and analyze project feasibility

**Permissions**:
- ✅ Create new projects
- ✅ Edit own projects (draft stage)
- ✅ Run feasibility calculations
- ✅ View own projects (all stages)
- ✅ Save drafts
- ✅ Generate PDF reports
- ✅ View own analytics
- ❌ Cannot view other users' projects
- ❌ Cannot approve/reject projects
- ❌ Cannot generate quotations
- ❌ Cannot change settings
- ❌ Cannot manage users

### Role 2: APPROVER
**Purpose**: Review feasibility analyses and approve viable projects

**Permissions**:
- ✅ Create new projects
- ✅ View ALL projects (all users)
- ✅ Approve/Reject projects
- ✅ Edit projects in review
- ✅ Generate quotations
- ✅ Export approved projects
- ✅ View all analytics
- ✅ Add comments/notes to any project
- ❌ Cannot change settings (cost rates)
- ❌ Cannot manage users
- ❌ Cannot delete projects

### Role 3: ADMIN
**Purpose**: System administration and configuration

**Permissions**:
- ✅ ALL Approver permissions
- ✅ Manage users (create, edit, delete, change roles)
- ✅ Edit settings (cost rates, revenue rates, defaults)
- ✅ View all audit logs
- ✅ Delete projects (with confirmation)
- ✅ Export to ERP
- ✅ System configuration
- ✅ Backup/restore data

---

## 🔐 Authentication Flow

### User Login Flow
```
1. User visits app → Redirected to /login
2. Enter email + password
3. Optional: Check "Remember Me" (extends session to 30 days)
4. Submit credentials
5. Backend validates:
   - User exists?
   - Password correct?
   - Account active?
6. If valid:
   - Generate JWT token or session
   - Set httpOnly cookie
   - Redirect to dashboard
7. If invalid:
   - Show error message
   - Log failed attempt (rate limiting)
```

### Session Management
```
Token Type: JWT (JSON Web Token) or Session Cookie
Storage: httpOnly cookie (secure, not accessible via JavaScript)
Duration: 24 hours (default) or 30 days (Remember Me)
Multi-device: Allowed (separate tokens per device)
Refresh: Auto-refresh before expiry if user active
Logout: Clear cookie, invalidate token server-side
```

### Remember Me
```
If checked:
  - Session duration: 30 days instead of 24 hours
  - Persistent cookie
  - Auto-login on return visit
  
If unchecked:
  - Session duration: 24 hours
  - Session cookie (clears when browser closes)
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  full_name         VARCHAR(255) NOT NULL,
  role              ENUM('ANALYST', 'APPROVER', 'ADMIN') NOT NULL,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at     TIMESTAMP NULL,
  created_by        UUID REFERENCES users(id),
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
);
```

### Sessions Table (if using database sessions)
```sql
CREATE TABLE sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token             VARCHAR(500) UNIQUE NOT NULL,
  device_info       TEXT,
  ip_address        VARCHAR(45),
  expires_at        TIMESTAMP NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);
```

### Projects Table (Updated with ownership)
```sql
CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Template & Basic Info
  template_code     VARCHAR(50) NOT NULL,  -- 'OPTICAL_FIBER', '5G_TOWER_CONVERSION'
  project_name      VARCHAR(255) NOT NULL,
  client_name       VARCHAR(255) NOT NULL,
  location          VARCHAR(100) NOT NULL,
  
  -- Ownership
  created_by        UUID NOT NULL REFERENCES users(id),
  assigned_to       UUID REFERENCES users(id),
  
  -- Status tracking
  status            ENUM('DRAFT', 'ANALYZING', 'PENDING_APPROVAL', 'APPROVED', 
                         'REJECTED', 'QUOTED', 'CLIENT_ACCEPTED', 'CLIENT_REJECTED') 
                    DEFAULT 'DRAFT',
  
  -- Template-specific parameters (stored as JSON for flexibility)
  input_parameters  JSONB NOT NULL,  -- Different fields per template type
  calculated_costs  JSONB,           -- Cost breakdown results
  calculated_revenue JSONB,          -- Revenue breakdown results
  
  -- Universal results (all templates)
  total_cost        DECIMAL(15, 2),
  gross_revenue     DECIMAL(15, 2),
  net_revenue       DECIMAL(15, 2),
  net_profit        DECIMAL(15, 2),
  profit_margin     DECIMAL(5, 2), -- percentage
  
  -- Approval tracking
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMP,
  rejection_reason  TEXT,
  
  -- Timestamps
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_template_code (template_code),
  INDEX idx_created_by (created_by),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### Audit Log Table
```sql
CREATE TABLE audit_logs (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID REFERENCES users(id),
  action            VARCHAR(100) NOT NULL, -- LOGIN, LOGOUT, CREATE_PROJECT, etc.
  resource_type     VARCHAR(50), -- USER, PROJECT, SETTINGS
  resource_id       UUID,
  details           JSONB,
  ip_address        VARCHAR(45),
  user_agent        TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
```

---

## 🛡️ Security Implementation

### Password Security
```javascript
// Hashing Algorithm: bcrypt (cost factor 12)
import bcrypt from 'bcryptjs';

// Hash password on registration
const salt = await bcrypt.genSalt(12);
const passwordHash = await bcrypt.hash(password, salt);

// Verify password on login
const isValid = await bcrypt.compare(password, passwordHash);
```

**Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter (recommended)
- At least 1 number (recommended)
- No common passwords (password123, etc.)

### JWT Token Structure
```javascript
// Token payload
{
  userId: "uuid",
  email: "user@company.com",
  role: "ANALYST",
  fullName: "John Doe",
  iat: 1234567890,      // Issued at
  exp: 1234654290       // Expires at (24h or 30 days)
}

// Signing
const token = jwt.sign(payload, SECRET_KEY, { 
  expiresIn: rememberMe ? '30d' : '24h',
  algorithm: 'HS256'
});
```

### Rate Limiting
```javascript
// Login attempts: 5 per 15 minutes per IP
// API calls: 100 per minute per user
// Failed logins: Lock account after 10 failed attempts

Implementation:
- Use express-rate-limit or similar
- Store in Redis or in-memory
- Show countdown: "Too many attempts, try again in 10 minutes"
```

### HTTPS & Cookies
```javascript
// Cookie settings
res.cookie('auth_token', token, {
  httpOnly: true,        // Not accessible via JavaScript
  secure: true,          // HTTPS only (production)
  sameSite: 'strict',    // CSRF protection
  maxAge: rememberMe ? 30*24*60*60*1000 : 24*60*60*1000,
  path: '/'
});
```

---

## 🚪 Route Protection

### Frontend Route Guards
```typescript
// Middleware for Next.js pages/API

// Public routes (no auth required)
/login
/forgot-password
/reset-password

// Protected routes (auth required)
/dashboard          → Any authenticated user
/projects           → Any authenticated user  
/projects/new       → ANALYST, APPROVER, ADMIN (select template)
/projects/:id       → Creator or APPROVER/ADMIN
/projects/:id/edit  → Creator (if DRAFT) or APPROVER/ADMIN
/settings           → ADMIN only
/settings/:template → ADMIN only (per-template settings)
/users              → ADMIN only
/analytics          → Any authenticated user (own data vs all data)

// Route middleware
async function requireAuth(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) return res.redirect('/login');
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = await getUserById(decoded.userId);
    if (!req.user.is_active) return res.status(403).json({ error: 'Account inactive' });
    next();
  } catch (error) {
    return res.redirect('/login');
  }
}

// Role middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### Backend API Protection
```typescript
// Example: GET /api/projects?template=OPTICAL_FIBER
// Returns only projects user can see, optionally filtered by template

app.get('/api/projects', requireAuth, async (req, res) => {
  const { role, id: userId } = req.user;
  const { template } = req.query;
  
  let query = {
    where: {}
  };
  
  // Apply template filter if provided
  if (template) {
    query.where.template_code = template;
  }
  
  // Apply role-based filtering
  if (role === 'ADMIN' || role === 'APPROVER') {
    // See all projects
    const projects = await db.projects.findAll(query);
  } else {
    // See only own projects
    query.where.created_by = userId;
    const projects = await db.projects.findAll(query);
  }
  
  res.json(projects);
});

// Example: POST /api/projects/:id/approve
// Only APPROVER and ADMIN can approve

app.post('/api/projects/:id/approve', 
  requireAuth, 
  requireRole('APPROVER', 'ADMIN'), 
  async (req, res) => {
    const project = await db.projects.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    
    project.status = 'APPROVED';
    project.approved_by = req.user.id;
    project.approved_at = new Date();
    await project.save();
    
    // Log action
    await auditLog('APPROVE_PROJECT', req.user.id, project.id);
    
    res.json(project);
  }
);
```

---

## 📱 UI/UX Components

### Login Page
```
Location: /app/login/page.tsx

Layout:
┌─────────────────────────────────────┐
│                                     │
│   [Logo]  Optical Fiber Business    │
│                                     │
│   Email:    [________________]      │
│   Password: [________________]      │
│                                     │
│   [ ] Remember me for 30 days       │
│                                     │
│   [         Login         ]        │
│                                     │
│   Forgot password?                  │
│                                     │
└─────────────────────────────────────┘

Features:
- Show/hide password toggle
- Loading spinner on submit
- Error messages (inline, red)
- Remember me checkbox
- Enter key submits form
```

### Protected Layout
```typescript
// /app/(protected)/layout.tsx

export default function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) redirect('/login');
  
  return (
    <MainLayout user={user}>
      {children}
    </MainLayout>
  );
}
```

### User Context/Hook
```typescript
// /lib/auth/useAuth.ts

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  
  async function login(email, password, rememberMe) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe })
    });
    
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
      return { success: true };
    }
    
    const error = await res.json();
    return { success: false, error: error.message };
  }
  
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  }
  
  return { user, loading, login, logout };
}
```

### Permission Helpers
```typescript
// /lib/auth/permissions.ts

export function canViewProject(user, project) {
  if (user.role === 'ADMIN' || user.role === 'APPROVER') return true;
  return project.created_by === user.id;
}

export function canEditProject(user, project) {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'APPROVER' && project.status === 'PENDING_APPROVAL') return true;
  if (project.created_by === user.id && project.status === 'DRAFT') return true;
  return false;
}

export function canApproveProject(user) {
  return user.role === 'APPROVER' || user.role === 'ADMIN';
}

export function canManageUsers(user) {
  return user.role === 'ADMIN';
}

export function canEditSettings(user) {
  return user.role === 'ADMIN';
}
```

---

## 🔄 User Management Workflow

### Admin Creates New User
```
1. Admin navigates to /users
2. Click "Add User" button
3. Fill form:
   - Full Name
   - Email
   - Role (dropdown: Analyst/Approver/Admin)
   - Auto-generate temporary password OR send email invite
4. Submit
5. System creates user account
6. Sends email to user with:
   - Temporary password (if auto-generated)
   - Link to set password (if invite)
   - Login instructions
7. User logs in for first time
8. If temp password: Forced to change password
9. User can now access system based on role
```

### User Table (Admin View)
```
/app/(protected)/users/page.tsx

Columns:
- Name
- Email  
- Role (badge colored)
- Status (Active/Inactive)
- Last Login
- Created Date
- Actions (Edit, Deactivate, Delete)

Features:
- Search by name/email
- Filter by role
- Sort by any column
- Pagination
- Export to CSV
```

---

## 📊 Audit Logging

### Events to Log
```
Authentication:
- LOGIN_SUCCESS
- LOGIN_FAILED
- LOGOUT
- PASSWORD_CHANGED
- ACCOUNT_LOCKED

User Management:
- USER_CREATED
- USER_UPDATED
- USER_DELETED
- ROLE_CHANGED

Project Actions:
- PROJECT_CREATED
- PROJECT_VIEWED
- PROJECT_EDITED
- PROJECT_APPROVED
- PROJECT_REJECTED
- QUOTATION_GENERATED
- EXPORTED_TO_ERP

System:
- SETTINGS_CHANGED
- RATE_UPDATED
```

### Audit Log Viewer (Admin Only)
```
/app/(protected)/audit-logs/page.tsx

Filters:
- User (dropdown)
- Action type (dropdown)
- Date range
- Resource type (User/Project/Settings)

Display:
- Timestamp
- User (name + email)
- Action (colored badge)
- Resource
- Details (expandable JSON)
- IP Address
```

---

## 🚀 Implementation Plan

### Phase 1: Basic Auth (Week 1)
- [ ] User model & database tables
- [ ] Password hashing (bcrypt)
- [ ] Login page UI
- [ ] Login API endpoint
- [ ] JWT token generation
- [ ] Protected route middleware
- [ ] Logout functionality
- [ ] useAuth hook

### Phase 2: User Management (Week 1-2)
- [ ] Admin user creation form
- [ ] User list page
- [ ] Edit user functionality
- [ ] Activate/deactivate users
- [ ] Role assignment
- [ ] Audit logging

### Phase 3: Access Control (Week 2)
- [ ] Role-based route protection
- [ ] Project visibility filtering
- [ ] Permission helpers
- [ ] UI adjustments per role
- [ ] Approve/reject permissions

### Phase 4: Security Enhancements (Week 2-3)
- [ ] Rate limiting
- [ ] Session management
- [ ] Remember me functionality
- [ ] Multi-device support
- [ ] Failed login tracking
- [ ] HTTPS enforcement

---

## 🧪 Testing Checklist

### Authentication Tests
- [ ] Valid login succeeds
- [ ] Invalid email shows error
- [ ] Invalid password shows error
- [ ] Inactive account cannot login
- [ ] Session expires after 24 hours
- [ ] Remember me extends to 30 days
- [ ] Logout clears session
- [ ] Multi-device login works

### Authorization Tests
- [ ] Analyst sees only own projects
- [ ] Approver sees all projects
- [ ] Admin sees all projects
- [ ] Analyst cannot approve projects
- [ ] Approver can approve projects
- [ ] Admin can manage users
- [ ] Non-admin cannot access /settings
- [ ] Non-admin cannot access /users

### Security Tests
- [ ] Passwords are hashed (not plain text)
- [ ] Cookies are httpOnly
- [ ] HTTPS enforced in production
- [ ] Rate limiting blocks brute force
- [ ] XSS protection works
- [ ] CSRF protection works
- [ ] SQL injection prevented

---

## 📝 Environment Variables

```env
# .env.local

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/optical_fiber

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-here

# Session
SESSION_DURATION=24h
REMEMBER_ME_DURATION=30d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=5

# Email (for future password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# App
NODE_ENV=development
APP_URL=http://localhost:3000
```

---

## 🎯 Success Criteria

- [ ] Users can login with email/password
- [ ] Sessions persist for 24 hours (or 30 days with Remember Me)
- [ ] Multi-device login works correctly
- [ ] Role-based access is enforced
- [ ] Analysts see only their projects
- [ ] Approvers/Admins see all projects
- [ ] Only Approvers/Admins can approve projects
- [ ] Only Admins can manage users
- [ ] Only Admins can edit settings
- [ ] All actions are audit logged
- [ ] Rate limiting prevents brute force
- [ ] Passwords are securely hashed
- [ ] UI adapts based on user role

---

**Document Version**: 2.0  
**Last Updated**: March 13, 2026  
**Status**: Design Complete - Multi-Template Architecture Support  
**Next Step**: Backend API + Database Setup (PostgreSQL + Prisma + Next.js)
