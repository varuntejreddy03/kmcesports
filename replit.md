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
**Deadline: January 27, 2026 at 12:30 PM** (Editable from Admin Login & Tournament Settings)
- After this deadline, no new teams can be created
- Users without teams will see "Registration Closed" message
- Team creation page blocked with deadline notice
- Deadline can be changed from Admin Login page or Tournament Settings

## Live Draw & Knockout Bracket Generator
Available on the Admin Dashboard (🎲 Random button):
- Click "🎲 Random" button in Match Schedule section
- **Live Draw Animation**: All approved team names shown, then spin/shuffle visually for 3 seconds
- **One-by-one Drawing**: Teams are drawn from the pool one at a time (800ms each) and placed into bracket slots
- **Full Knockout Bracket**: Generates multi-round bracket (Play-in → Quarterfinals → Semifinals → Final)
- **Pick First Team**: After bracket is shown, "Pick First Team" button runs slot-machine style spin across all teams and selects one randomly
- **Fair bracket math**: Calculates play-in matches for non-power-of-2 team counts, bye teams advance automatically
- **Transparency**: All team names visible during shuffle — no bias possible (great for screen-sharing/projector)
- Uses Fisher-Yates shuffle for true random ordering
- **Live broadcast to captains**: All draw events broadcast via Supabase Realtime — captains see the full animation live on their dashboard
- Redraw button resets and runs the full animation again

## Live Draw Broadcast (Supabase Realtime)
- Admin draw events broadcast on `live-draw` channel
- Events: `draw_start`, `draw_shuffle_done`, `team_drawn`, `bracket_complete`, `pick_start`, `pick_result`, `draw_end`
- `LiveDrawOverlay` component on captain dashboard subscribes and renders full animation in real-time
- Captains see: spinning teams → one-by-one drawing → bracket → first team pick — all live

## WhatsApp Notification
For approved+paid teams, admin can send WhatsApp message to captain:
- Click "📱 WHATSAPP" button on team card (mobile) or table (desktop)
- Copies full message to clipboard with team details, player roster, and all 18 tournament rules
- Opens WhatsApp with captain's phone number
- Admin just pastes the message and sends

## Required Supabase Migration
Run this SQL in Supabase SQL Editor to add match result & bracket columns:
```sql
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS result_margin text,
ADD COLUMN IF NOT EXISTS round integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS match_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS score_link text,
ADD COLUMN IF NOT EXISTS playing_11_a text,
ADD COLUMN IF NOT EXISTS playing_11_b text,
ADD COLUMN IF NOT EXISTS impact_sub_a text,
ADD COLUMN IF NOT EXISTS impact_sub_b text;
```

## Match Result & Auto-Advance System
- Admin can enter match results: select winner + enter margin (runs/wickets/super over/DLS)
- Saving result marks match as "completed" and auto-advances winner to next round match
- Auto-advance uses round/match_number: match N in round R feeds into match ceil(N/2) in round R+1
- Bracket save now stores all rounds (Play-in, QF, SF, Final) with round/match_number metadata
- Dedicated /matches page shows full tournament bracket grouped by rounds with results

## Recent Changes
- February 7, 2026: Added /matches page — dedicated tournament bracket with round grouping, results, and live scores
- February 7, 2026: Added match result system — admin enters winner + margin, auto-advances to next round
- February 7, 2026: Updated bracket save to include round/match_number/status for all rounds
- February 7, 2026: Landing page schedule replaced with link to /matches page
- February 7, 2026: Squad-based Playing 11 selection — admin picks from registered players (checkbox UI)
- February 7, 2026: Added Playing 11, Impact Subs, and Live Score Link management per match (admin modal with save to DB)
- February 7, 2026: Live Score link visible on landing page match cards for public viewing (pulse animation)
- February 7, 2026: Added live draw broadcast via Supabase Realtime — captains see full draw animation on their dashboard in real-time
- February 7, 2026: Added "Pick First Team" random spinner integrated into bracket draw (no separate mode)
- February 7, 2026: Upgraded Random Match Generator to Live Draw with spinning animation, one-by-one team drawing, and full knockout bracket (Play-in → QF → SF → Final)
- February 7, 2026: Replaced Guide section on landing page with Registered Teams section showing team names and captain names
- February 7, 2026: Added year-wise breakdown to analytics (1st/2nd/3rd/4th year based on roll number prefixes)
- February 7, 2026: Added CSV export button (📥) in admin navbar to download all teams with player details
- February 7, 2026: Added "Last Final Call" red banner on homepage with "Registration Closes at 9 PM" message
- February 6, 2026: Added Analytics dashboard to admin panel (total teams, branch breakdown, team overview)
- February 6, 2026: Added "Message All Members" button to send custom WhatsApp messages to all team players
- February 5, 2026: Fixed duplicate player bug - players on pending teams now blocked from other teams
- February 5, 2026: Added server-side validation before team creation to prevent race conditions
- February 5, 2026: Fixed session expiry - now activity-based (resets on user interaction)
- February 5, 2026: Enabled Supabase auto token refresh for stable authentication
- February 5, 2026: Added retry logic for Hall Ticket lookups to fix intermittent data fetch failures
- February 5, 2026: Fixed cross-origin warnings in Next.js development
- January 24, 2026: Added admin ability to edit player roles and remove players from teams
- January 24, 2026: Added WhatsApp button to send team details and rules to approved+paid teams
- January 24, 2026: Removed test mode from random match generator (production-ready)
- January 24, 2026: Added random match generator on admin dashboard
- January 24, 2026: Registration deadline now editable from admin login and tournament settings
- January 24, 2026: Login flow updated - returning users skip role selection and password change
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
- **Analytics Dashboard**: Toggle with 📊 button to see total teams, approved/pending counts, total players, paid teams, branch-wise player breakdown (CSE, CSM, ECE, CSC, CSD, CSO), and team overview list
- **Message All Members**: 📩 button on each team to send custom WhatsApp message to all team players (separate from captain WhatsApp button)
- View all teams with captain details and player counts
- Approve/reject team registrations
- Approve/reject payments
- Request repayment (clears rejected payment for resubmission)
- Delete teams completely (removes team, players, and payments)
- View team member phone numbers
- Schedule matches between approved teams
- Cricket coordinators: Suresh (9390155430), Sreekar (9063128733)

## Session Management
- Sessions timeout after 30 minutes of **inactivity** (activity-based)
- User activity (clicks, keystrokes, scrolling, touch) resets the session timer
- Activity tracking stored in localStorage (session_last_activity)
- Supabase tokens auto-refresh when active and proactively refresh before expiry
- All protected pages check session every 60 seconds
- On expiration, users are redirected to /auth/login?expired=true

### Data Fetching Reliability
- Hall Ticket lookups use retry logic (3 attempts with backoff)
- Supabase queries wrapped with retrySupabaseQuery() for network resilience

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
