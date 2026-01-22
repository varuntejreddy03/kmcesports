# College Cricket Tournament

## Overview
A Next.js web application for managing college cricket tournament registrations, teams, and payments. The app uses Supabase as the backend database.

## Project Structure
- `/src/app` - Next.js 14 app router pages
- `/src/components` - React components
- `/src/lib` - Utilities including Supabase client
- `/src/hooks` - Custom React hooks
- `/src/contexts` - React context providers
- `/src/types` - TypeScript type definitions

## Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Configured for Vercel/Netlify, runs on port 5000 for Replit

## Environment Variables Required
The following environment variables must be set for the app to function:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Running the App
```bash
npm run dev    # Development server on port 5000
npm run build  # Production build
npm run start  # Production server on port 5000
```

## Database Schema
The app uses the following Supabase tables:
- `student_data` - Student information
- `teams` - Team registrations
- `team_players` - Players assigned to teams
- `payments` - Payment records for team registrations
- `tournament_settings` - Tournament configuration

### Optional Login Tracking Columns (student_data)
To enable login/password tracking, add these columns to your student_data table in Supabase:
- `last_login` (timestamptz) - Last login timestamp
- `login_count` (integer, default 0) - Number of logins
- `password_changed` (boolean, default false) - Whether default password was changed
- `password_changed_at` (timestamptz) - When password was changed

## Recent Changes
- January 22, 2026: Added back/home buttons to all pages for consistent navigation
- January 22, 2026: Unified dark theme (#0a0f1a) and navbar styling across all pages
- January 22, 2026: Fixed session timeout clearing on logout in Navbar component
- January 22, 2026: Complete UI redesign - cricket-only portal (removed other sports references)
- January 22, 2026: Updated branding to "KMCECricket" throughout the portal
- January 22, 2026: Redesigned homepage with modern hero section, stats, about, and schedule sections
- January 22, 2026: Changed "4th Year student" to "New student" for registration link
- January 22, 2026: Added department eligibility validation for team creation
- January 22, 2026: Added 30-minute session timeout with automatic logout on all protected pages
- January 22, 2026: Configured for Replit environment (port 5000, host 0.0.0.0)

## Session Management
- Sessions timeout after 30 minutes of inactivity
- Session start time stored in localStorage (session_start_time)
- All protected pages check session every 60 seconds
- On expiration, users are redirected to /auth/login?expired=true

## Department Eligibility System
Team creation uses department-based eligibility validation:

**Department Codes** (extracted from roll number positions 7-8):
- 05 → CSE, 69 → CSO, 04 → ECE
- 66 → CSM, 62 → CSC, 67 → CSD

**Department Groups**:
- CSE Group: CSE (05), CSO (69), ECE (04)
- CSM Group: CSM (66), CSC (62), CSD (67), ECE (04)

**Rules**:
- Login allowed for all students (no department validation)
- Team department auto-assigned based on captain's roll number
- ECE captains can choose between CSE or CSM department
- Player list filtered to only show eligible students for captain's group
- Validation error: "NOT ELIGIBLE – DEPARTMENT RULE VIOLATION"
