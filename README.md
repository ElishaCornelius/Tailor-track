# Tailor Track

> A professional sewing job management system for tailoring businesses and their customers.

Tailor Track is a modern web application designed to help sewing and tailoring companies manage customer orders, track job progress, and provide customers with a self-service order tracking portal. It replaces messy paper records, scattered WhatsApp messages, and manual spreadsheets with a centralized, easy-to-use dashboard.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Key Features](#key-features)
- [User Flows](#user-flows)
  - [For Tailoring Companies / Admins](#for-tailoring-companies--admins)
  - [For Customers](#for-customers)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

---

## Problem Statement

Running a tailoring business involves juggling many moving parts: customer details, measurements, order descriptions, payment tracking, deadlines, and pickup coordination. Many small-to-medium tailoring businesses still rely on:

- **Paper registers** that are hard to search and easy to lose.
- **Informal communication** (WhatsApp, phone calls) that gets buried and lacks context.
- **Manual memory** for tracking which jobs are pending, in progress, or ready.
- **No easy way for customers** to check order status without calling or messaging.
- **No visibility** into top customers, daily earnings, or business performance.

These inefficiencies lead to missed deadlines, poor customer experience, lost revenue, and operational stress.

---

## Solution Overview

Tailor Track provides a clean, centralized platform where tailoring companies can:

1. **Register their business** and create a secure admin workspace.
2. **Log every sewing job** with customer details, descriptions, pricing, and payment info.
3. **Track job status** visually using a simple traffic-light system.
4. **Generate unique job codes** automatically for every order.
5. **Share job codes with customers**, who can then track their order status in real time.
6. **Review business insights** such as active jobs, completed jobs, customer rankings, and daily earnings.

It bridges the gap between business operations and customer communication, giving both tailors and their clients peace of mind.

---

## Key Features

### Company Registration & Authentication
- Tailoring businesses can register with company name, email, phone, and password.
- Each company gets a unique, auto-generated **company code** (e.g., `BEL-123`).
- Secure authentication powered by Supabase Auth.
- Role-based access control with `super_admin`, `company_admin`, and `customer` roles.

### Job Management
- Create new jobs with customer name, phone, description, number of dresses, total price, amount paid, and outstanding balance.
- Auto-generate unique **job codes** (e.g., `BEL-123-001`) using a database function.
- Update job status with one click:
  - 🔴 **Not Started**
  - 🟡 **In Progress**
  - 🟢 **Completed**
- Track all active and completed jobs from a single dashboard.

### Customer Tracking Portal
- Customers can enter their job code on a public tracking page.
- See order details, status, and a friendly status message (e.g., "Your order is ready for pickup!").
- No login required for customers — just the job code.

### Business Insights
- **Dashboard summary cards**: Active jobs, completed today, total customers.
- **Customer rankings**: Identify top customers by total spending or number of jobs.
- **History view**: Review completed jobs grouped by date with daily earnings totals.

### Responsive, Modern UI
- Built with React, Tailwind CSS, and shadcn/ui components.
- Fully responsive layout for desktop, tablet, and mobile.
- Clean, accessible interface with toast notifications and form validation.

---

## User Flows

### For Tailoring Companies / Admins

1. **Register** at `/company/register`.
2. **Log in** at `/admin/login`.
3. **Add a new job** at `/admin/add-job` — customer details are auto-linked or created.
4. **Manage jobs** from `/admin/dashboard` — update statuses as work progresses.
5. **View rankings** at `/admin/rankings` to identify loyal customers.
6. **View history** at `/admin/history` to see completed jobs and daily revenue.

### For Customers

1. Receive a job code from the tailoring company.
2. Visit `/customer/track`.
3. Enter the job code and click **Search**.
4. Instantly see order status, description, and pickup readiness.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS 3, shadcn/ui |
| State & Data | TanStack Query (React Query), React Context |
| Backend / Database | Supabase (Postgres + Auth + Row Level Security) |
| Routing | React Router v6 |
| Forms & Validation | Zod, React Hook Form |
| Notifications | Sonner |
| Icons | Lucide React |

---

## Database Schema

The backend uses Supabase Postgres with the following public tables:

### `companies`
Stores registered tailoring businesses.

| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `name` | Company name |
| `company_code` | Unique short code used in job IDs |
| `email` | Contact email |
| `phone` | Contact phone |
| `logo_url` | Optional company logo |

### `customers`
Stores customers linked to a company.

| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `company_id` | Linked company |
| `name` | Customer name |
| `phone` | Customer phone |
| `total_jobs` | Aggregated job count |
| `total_spent` | Aggregated lifetime spend |

### `jobs`
Stores individual sewing jobs.

| Field | Description |
|-------|-------------|
| `id` | Primary key |
| `company_id` | Owning company |
| `customer_id` | Linked customer |
| `code` | Unique job code |
| `description` | Job details |
| `num_dresses` | Quantity of items |
| `price` | Total price |
| `amount_paid` | Amount already paid |
| `outstanding_amount` | Remaining balance |
| `status` | `red`, `yellow`, or `green` |
| `created_at` / `completed_at` | Timestamps |

### `profiles`
Links authenticated users to companies.

| Field | Description |
|-------|-------------|
| `id` | Auth user ID |
| `company_id` | Linked company |
| `first_name` / `last_name` | Optional names |

### `user_roles`
Role-based access control.

| Field | Description |
|-------|-------------|
| `user_id` | Auth user ID |
| `role` | `super_admin`, `company_admin`, or `customer` |

### Database Functions
- `generate_job_code(company_code)` — generates unique job codes.
- `has_role(_user_id, _role)` — security definer function for role checks.
- `get_user_company_id(_user_id)` — retrieves a user's linked company.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- A Supabase project 

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

The project uses Supabase connection values managed by the platform. In local development, ensure your `.env` contains:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

> Replace with your actual Supabase project credentials.

### Build

```bash
npm run build
```

---

## Project Structure

```
.
├── public/
├── src/
│   ├── components/        # Reusable UI components (StatusBadge, shadcn/ui)
│   ├── hooks/             # Custom React hooks (useAuth, use-toast, use-mobile)
│   ├── integrations/
│   │   └── supabase/      # Supabase client and generated types
│   ├── lib/               # Utility functions
│   ├── pages/             # Application pages/routes
│   │   ├── Index.tsx
│   │   ├── CompanyRegister.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AddJob.tsx
│   │   ├── Rankings.tsx
│   │   ├── History.tsx
│   │   ├── CustomerTrack.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Roadmap

Potential future enhancements:

- [ ] SMS/WhatsApp notifications when job status changes.
- [ ] Customer accounts and order history for logged-in customers.
- [ ] Measurement storage per customer.
- [ ] Invoice generation and PDF export.
- [ ] Multi-currency support beyond Nigerian Naira (₦).
- [ ] Staff accounts with role-based permissions.
- [ ] Deadline/reminder system for due dates.
- [ ] Dark mode toggle.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ for tailors, fashion designers, and sewing businesses everywhere.
