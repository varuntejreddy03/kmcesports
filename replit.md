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

## Registration Deadline
**Deadline: January 27, 2026 at 12:30 PM**
- After this deadline, no new teams can be created
- Users without teams will see "Registration Closed" message
- Team creation page blocked with deadline notice

## Recent Changes
- January 23, 2026: Added registration deadline (Jan 27, 2026 at 12:30 PM)
- January 23, 2026: Added email notifications on team creation and payment confirmation
- January 23, 2026: Email sent to 4 coordinators with full team data, phone numbers, and player details
- January 23, 2026: Added animated "How It Works" guide section with 4 step cards
- January 23, 2026: Added Guide button to navigation bar
- January 23, 2026: Added scrolling announcement ticker with eligibility rules
- January 23, 2026: Tournament format changed to 12 overs
- January 23, 2026: Enhanced rules visibility with yellow theme and prominent buttons
- January 23, 2026: Added UPI QR code to payment page with screenshot upload
- January 23, 2026: Improved admin mobile view for payment proof viewing
- January 23, 2026: Comprehensive mobile optimization across all pages
- January 23, 2026: Added 44px+ minimum touch targets for all interactive elements
- January 23, 2026: Responsive typography with mobile-first breakpoints (text-base md:text-lg)
- January 23, 2026: Improved mobile card layouts and spacing on Dashboard, Admin, Payment pages
- January 23, 2026: Mobile-optimized navigation with touch-friendly buttons
- January 23, 2026: Responsive form inputs with min-h-[48px] for accessibility
- January 23, 2026: Mobile-optimized homepage hero, stats, schedule, and CTA sections
- January 23, 2026: Mobile-optimized auth pages (login, register, change-password)
- January 22, 2026: Added admin ability to delete teams completely
- January 22, 2026: Added admin ability to request repayment (reset payment status)
- January 22, 2026: Added team member phone numbers in admin panel
- January 22, 2026: Prevented player removal from existing teams (only allowed during creation)
- January 22, 2026: Added coordinator contact numbers to admin login page
- January 22, 2026: Forced password change for users logging in with default password
- January 22, 2026: Added login tracking (last_login, login_count, password_changed)
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

## Admin Features
- View all teams with captain details and player counts
- Approve/reject team registrations
- Approve/reject payments
- Request repayment (clears rejected payment for resubmission)
- Delete teams completely (removes team, players, and payments)
- View team member phone numbers
- Schedule matches between approved teams
- Cricket coordinators: Suresh (6303860267), Sreeker (9063128733)

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
