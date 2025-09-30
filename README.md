**TurboVets – Secure Task Management System**

Nx Monorepo • NestJS API • Angular + Tailwind + NgRx • JWT + RBAC

A secure, org-scoped task board with role-based access control, drag & drop reordering, dark mode (persisted), inline editing (title + description), and a clean dashboard UI.

This README covers both backend and frontend.

**Table of contents**

Monorepo layout

Tech stack

Features

RBAC model

API surface

Setup & run

Backend (API)

Frontend (Dashboard)

Useful NPM/Nx scripts

Quick smoke tests (curl & PowerShell)

Testing (unit only)

Architecture notes

Troubleshooting

Future enhancements


**Monorepo layout**
turbovets/

  apps/
  
    api/                # NestJS API (JWT, RBAC, tasks)
    
    dashboard/          # Angular app (Tailwind, NgRx, CDK DnD)
    
  libs/
  
    auth/               # RBAC decorators, guards, role→permission map
    
    data/               # reserved for shared DTOs/Types
    
  scripts/
  
    api.ps1             # PowerShell helpers (Windows, optional)
    
  .env                  # API environment (see below)
  
  dev.db                # SQLite dev database

**Tech stack**

Backend: NestJS, TypeORM, SQLite (dev), JWT, class-validator, custom RBAC guards

Frontend: Angular (standalone APIs), TailwindCSS (darkMode:'class'), NgRx (minimal), Angular CDK Drag&Drop

Dev: Nx workspace, Jest for unit tests

**Features**

Email/password auth → JWT in localStorage (jwt)

Global HTTP interceptor adds Authorization: Bearer <jwt> to /api/*

Route guard redirects to /login if no token

Org-scoped tasks CRUD (orgId=1 demo), statuses: todo, in_progress, done

Create with optional description

Inline edit title and description; optimistic UI with rollback

Drag & Drop to reorder within a column or move across columns (persists position and status)

Viewer UI effectively read-only (403s are surfaced with friendly alerts)

Dark mode toggle (🌓) persists in localStorage('theme')

Sidebar Files and Settings show a “Coming soon” modal

Minimal NgRx slice (tasks.items) to keep state simple and inspectable

RBAC model

Roles → permissions

Role	tasks:read	tasks:create	tasks:update	tasks:delete	audit:read
Owner	  ✅(scoped)	   ✅	        ✅any task	      ✅only own	   ✅
Admin 	✅	           ✅	        ✅	              ✅	           ✅
Viewer	✅	           ❌	        ❌	              ❌	           ❌

Scope resolution

PUT/DELETE /tasks/:id → guard loads the task’s organization

GET/POST /tasks → orgId from query/body

Hierarchy: membership on target org or its parent (2-level) is accepted

RBAC decorators & guards live in libs/auth:

@RequirePermission('tasks:update') on routes

RbacGuard enforces role rules & scope resolution

JwtGuard validates token and sets req.user

**API surface**

Auth

POST /api/auth/register           → { id, email }
POST /api/auth/login              → { accessToken }


Tasks (secured)

GET    /api/tasks?orgId=1
POST   /api/tasks                 { orgId, title, description? }
PUT    /api/tasks/:id             { title?|description?|status?|position? }
DELETE /api/tasks/:id


Audit (secured; Owner/Admin by default)

GET /api/audit-log?orgId=1


Dev/Debug (non-prod helpers)

POST /api/dev-seed                # create org “Acme”(id=1) & grant caller OWNER (idempotent)
GET  /api/debug/*?orgId=1         # users / orgs / memberships / tasks

**Setup & run**
Prereqs

Node 20+ (recommend ≥ 20.19 for dashboard’s vite engine)

Nx (via npx is fine)

Backend (API)

Environment – create turbovets/.env:

JWT_SECRET=devlocal_super_secret_change_me
DB_FILE=./dev.db
PORT=3000


.env is at the workspace root. The API reads it globally.

Install & serve

npm i

npx nx serve api

# API: http://localhost:3000/api


Seed (optional but handy)
Login and call POST /api/dev-seed with your JWT to create Acme (id=1) and grant the caller OWNER. (See smoke tests below.)

Frontend (Dashboard)

Tailwind & proxy are wired.

// tailwind.config.js
module.exports = {
  content: ['./apps/dashboard/src/**/*.{html,ts}'],
  theme: { extend: {} },
  darkMode: 'class',
  plugins: [],
};

// apps/dashboard/proxy.conf.json
{ "/api": { "target": "http://localhost:3000", "secure": false, "changeOrigin": true } }


Serve the app:

npx nx serve dashboard
# UI: http://localhost:4200


Demo accounts (if you created them):

owner@acme.io
 / owner

admin@acme.io
 / admin

viewer@acme.io
 / viewer

Useful NPM/Nx scripts
{
  "scripts": {
    "serve:api": "nx serve api",
    "serve:web": "nx serve dashboard --proxy-config=apps/dashboard/proxy.conf.json",
    "test:api": "nx test api"
  }
}

**Quick smoke tests (curl & PowerShell)**
curl
# Register a user
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "content-type: application/json" \
  -d '{"email":"frank@gmail.com","password":"frank"}'

# Login → JWT
JWT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"frank@gmail.com","password":"frank"}' | jq -r .accessToken)

# Seed org + OWNER (idempotent)
curl -s -X POST http://localhost:3000/api/dev-seed \
  -H "authorization: Bearer $JWT"

# Create task (with description)
curl -s -X POST http://localhost:3000/api/tasks \
  -H "authorization: Bearer $JWT" -H "content-type: application/json" \
  -d '{"orgId":1,"title":"Ship RBAC","description":"first task"}'

# List
curl -s -H "authorization: Bearer $JWT" "http://localhost:3000/api/tasks?orgId=1"

# Update (status/description)
curl -s -X PUT http://localhost:3000/api/tasks/1 \
  -H "authorization: Bearer $JWT" -H "content-type: application/json" \
  -d '{"status":"in_progress","description":"moving"}'

# Delete
curl -s -X DELETE http://localhost:3000/api/tasks/1 -H "authorization: Bearer $JWT"

PowerShell helpers (Windows)
# one-time
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
. .\scripts\api.ps1

# Quick demo users
Register-User -Email "owner@acme.io"  -Password "owner"
Register-User -Email "admin@acme.io"  -Password "admin"
Register-User -Email "viewer@acme.io" -Password "viewer"

# login as existing OWNER (e.g. frank) & grant roles
Set-Jwt -Email "frank@gmail.com" -Password "frank"
Add-Member -Email "owner@acme.io"  -OrgId 1 -Role OWNER
Add-Member -Email "admin@acme.io"  -OrgId 1 -Role ADMIN
Add-Member -Email "viewer@acme.io" -OrgId 1 -Role VIEWER

# sanity checks
List-Tasks -OrgId 1
Create-Task -OrgId 1 -Title "Admin task"
Update-Task -Id 2 -Status in_progress -OrgId 1
Delete-Task -Id 2

**Testing (unit only)**

E2E tests are intentionally omitted.

apps/api/test/rbac.spec.ts – role→permission mapping (hasPermission)

apps/api/test/tasks.service.spec.ts – service behavior (ordering, create defaults, partial update, not found)

apps/api/test/rbac.guard.spec.ts – guard authorization: scope from :id/?orgId, 2-level hierarchy, Viewer/Admin/Owner rules (Owner delete only own)

Run:

npm run test:api
# or a single file:
nx test api --testFile apps/api/test/rbac.guard.spec.ts

**Architecture notes**

Backend

Auth flow: /auth/login returns JWT; JwtGuard verifies on protected routes.

RBAC: @RequirePermission() + RbacGuard enforce permission; guard resolves org scope from either task.id (PUT/DELETE) or orgId in query/body (GET/POST). 2-level org hierarchy supported.

Entities: User, Organization (parent?), Membership (role), Task (org, creator, title, description, status, category, position, timestamps).

Dev: synchronize:true and SQLite for speed.

Frontend

Angular standalone components (no NgModule ceremony)

AuthInterceptor injects Authorization header from localStorage('jwt')

AuthGuard redirects to /login without a token

Tasks board (/tasks):

Create with title + optional description

Inline edit title (dbl-click or ✏️) and description (expand link)

Status buttons (To Do / In Progress / Done) allow forward and backward moves

CDK Drag&Drop reorders and cross-moves; persists position and status

Quick filter (search box) to filter by title/creator; status pills (All/ToDo/InProgress/Done)

Dark mode toggle in the left rail; persisted in localStorage('theme')

Files & Settings routes show ComingSoon overlay

**Troubleshooting**

secretOrPrivateKey must have a value
.env missing or not at repo root. Create it, then restart nx serve api.

403 “Organization scope required”
For list/create, pass ?orgId=1 or { orgId: 1 }.
For update/delete, the guard infers from :id once the task exists.

Viewer blocked actions
Expected; Viewer is read-only. UI shows a small alert on 403.

Vite EBADENGINE warnings when installing dashboard deps
Use Node 20.19+. (API still runs on 20.17, but the warning disappears on 20.19.)

PowerShell helper not recognized
Run:
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
. .\scripts\api.ps1

**Future enhancements**

Refresh tokens + rotation; revoke on logout

Migrations (disable TypeORM synchronize) for prod

Switch to Postgres with proper docker-compose

Real audit sink (file/ELK) with correlation IDs & user agent/IPs

Task comments, attachments, and audit viewer UI

/me endpoint returning memberships → derive UI role (remove optimistic toggles)
