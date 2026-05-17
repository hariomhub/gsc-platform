# Global Sustainability Council (GSC) Platform

> Built on the same architecture as riskaicouncil.com, repositioned for ESG, carbon management, and sustainability.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| Backend | Node.js + Express + TypeScript (tsx) |
| Database | MySQL 8 (Azure Database) |
| Storage | Azure Blob Storage |
| Auth | JWT (HttpOnly cookie) + LinkedIn OAuth |
| Push | Firebase FCM |
| Deploy | Azure App Service + GitHub Actions |

## Quick Start

### 1. Database
```bash
mysql -u root -p < backend/db/schema.sql
mysql -u root -p < backend/db/framework_schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # fill in your values
npm install
npx tsx scripts/create-admin.ts   # creates admin user id=1
mysql -u root -p < backend/db/seeds/01_app_settings.sql
mysql -u root -p < backend/db/seeds/02_awards.sql
mysql -u root -p < backend/db/seeds/03_framework.sql
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env        # fill in Firebase keys
npm install
npm run dev
```

App runs at: http://localhost:5173
API runs at: http://localhost:5000

## User Roles

| Role | DB Value | Access |
|---|---|---|
| Admin / Founding Member | `founding_member` | Full admin dashboard, all features |
| GSC Council Member | `council_member` | Premium features, workshops |
| Sustainability Professional | `professional` | Standard member features |

## Project Structure
See architecture blueprint in `/docs/` for full details.
