# 🏆 KMCE SportsPortol

![Version](https://img.shields.io/badge/version-2.0.0-blueviolet?style=for-the-badge)
![UI](https://img.shields.io/badge/UI-Premium_Dark-0ea5e9?style=for-the-badge)
![Tech](https://img.shields.io/badge/Next.js_14-Powered-black?style=for-the-badge)

Welcome to the **KMCE SportsPortol**, the ultimate tournament management ecosystem designed for champions. This platform provides a seamless, high-performance experience for organizing and participating in college sports championships.

---

## ✨ Key Features

### 🎴 Athlete Experience
- **Premium Dashboard**: A pro-tier command center for captains to track squad status.
- **Dynamic Recruitment**: Seamless player selection and roster management.
- **Glass-morphic UI**: State-of-the-art dark theme with fluid animations and responsive design.
- **One-Tap Verification**: Hall ticket-based automated profile enrollment.

### ⚖️ Administrative Governance
- **Command Center**: Manage team approvals, payment audits, and tournament logistics.
- **Tournament Forge**: Live control over UPI IDs, registration fees, rules, and schedules.
- **Audit Trails**: Visual UTR and screenshot verification for transparent financial handling.

---

## 🛠️ Technology Stack

| Core | Database & Auth | Styling | Deployment |
| :--- | :--- | :--- | :--- |
| **Next.js 14** | **Supabase** | **Tailwind CSS** | **Netlify / Vercel** |
| React-based framework | SQL Storage & Auth | Premium Design System | Edge Functions enabled |

---

## 🚀 Rapid Deployment

### 1. Database Setup (Supabase)
Run the provided migration scripts in your Supabase SQL Editor:
1. `migration_premium_ui.sql` — Sets up core tournament settings.
2. `setup_all_rls_policies.sql` — Configures security and data access.
3. `make_bucket_public.sql` — Enables proof-of-payment uploads.

### 2. Environment Configuration
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Build & Launch
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

---

## 🎨 Branding Guide
The platform uses a curated design system:
- **Primary**: Cricket Blue (`#0ea5e9`)
- **Background**: Deep Space (`#0f172a`)
- **Typography**: Inter / Outfit (High-Black Italic for headers)

---

## 📜 Governance
Built for the **KMCE Sports Committee**. All systems are optimized for scale, security, and extreme visual excellence.

© 2024 KMCE SportsPortol. Built for Champions. 🚀
