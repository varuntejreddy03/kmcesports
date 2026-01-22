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

## Recent Changes
- January 22, 2026: Added 4th year student self-registration page at /auth/student-register
- January 22, 2026: Configured for Replit environment (port 5000, host 0.0.0.0)
