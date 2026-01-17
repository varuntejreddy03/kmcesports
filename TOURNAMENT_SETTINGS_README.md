# Tournament Settings Implementation

## ✅ Completed Features

### 1. Database Schema
**File:** `create_tournament_settings.sql`

Created `tournament_settings` table with:
- `tournament_name` - Name of the tournament
- `sport` - Sport type (cricket, football, etc.)
- `ground_name` - Venue name
- `registration_fee` - Fee amount in rupees
- `max_teams` - Maximum number of teams allowed
- `registration_open` - Boolean to enable/disable registrations
- `rules_text` - Tournament rules
- `last_updated` - Timestamp of last update

**RLS Policies:**
- ✅ Public read access (all users can view)
- ✅ Admin-only write access (only users with role='admin' can create/update/delete)

**To Setup:**
Run `create_tournament_settings.sql` in your Supabase SQL Editor

---

### 2. Admin Panel - Tournament Settings Page
**File:** `src/app/admin/tournament-settings/page.tsx`

**Features:**
- ✅ Admin-only access (redirects non-admins to dashboard)
- ✅ Form to edit all tournament settings
- ✅ Toggle switch for registration open/close
- ✅ Save button with success/error messages
- ✅ Auto-loads existing settings
- ✅ Updates `last_updated` timestamp on save

**Access:** `/admin/tournament-settings`

---

### 3. Admin Panel Integration
**File:** `src/app/admin/page.tsx`

Added "⚙️ Tournament Settings" button in admin dashboard header that navigates to the settings page.

---

### 4. Custom Hook for Student Views
**File:** `src/hooks/useTournamentSettings.ts`

Created `useTournamentSettings()` hook that:
- Fetches tournament settings from Supabase
- Returns `{ settings, loading, refetch }`
- Can be used in any student-facing component

**Usage Example:**
```tsx
import { useTournamentSettings } from '@/hooks/useTournamentSettings'

function MyComponent() {
  const { settings, loading } = useTournamentSettings('cricket')
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{settings?.tournament_name}</h1>
      <p>Ground: {settings?.ground_name}</p>
      <p>Fee: ₹{settings?.registration_fee}</p>
    </div>
  )
}
```

---

## 🔄 Next Steps (To Complete)

### 1. Update Team Creation Page
Add registration check to `src/app/team/create/page.tsx`:

```tsx
import { useTournamentSettings } from '@/hooks/useTournamentSettings'

// In component:
const { settings } = useTournamentSettings()

// Show message if registration closed:
{!settings?.registration_open && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <h3 className="font-bold text-red-800">Registrations Closed</h3>
    <p className="text-red-700">
      Team registrations are currently closed. Please check back later.
    </p>
  </div>
)}

// Disable Create Team button:
<button
  disabled={!settings?.registration_open || submitting}
  className="..."
>
  {settings?.registration_open ? 'Create Team' : 'Registrations Closed'}
</button>
```

### 2. Update Dashboard
Show tournament info on student dashboard:

```tsx
const { settings } = useTournamentSettings()

<div className="bg-blue-50 p-4 rounded-lg mb-6">
  <h2 className="font-bold text-blue-900">{settings?.tournament_name}</h2>
  <p className="text-sm text-blue-700">Venue: {settings?.ground_name}</p>
  <p className="text-sm text-blue-700">Registration Fee: ₹{settings?.registration_fee}</p>
</div>
```

### 3. Display Rules
Add rules display on team creation or landing page:

```tsx
{settings?.rules_text && (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-semibold mb-2">Tournament Rules</h3>
    <pre className="whitespace-pre-wrap text-sm text-gray-700">
      {settings.rules_text}
    </pre>
  </div>
)}
```

---

## 🔒 Security

**RLS Policies Applied:**
- ✅ Students can READ tournament settings
- ✅ Only admins can CREATE/UPDATE/DELETE
- ✅ Admin check uses `role='admin'` from `student_data` table
- ✅ Frontend enforces admin-only access to settings page

**Testing:**
1. Login as admin → Can access `/admin/tournament-settings`
2. Login as student → Redirected to dashboard
3. All users can view tournament data via the hook

---

## 📝 Summary

**Created Files:**
1. `create_tournament_settings.sql` - Database schema
2. `src/app/admin/tournament-settings/page.tsx` - Admin settings page
3. `src/hooks/useTournamentSettings.ts` - React hook for fetching settings

**Modified Files:**
1. `src/app/admin/page.tsx` - Added Tournament Settings button

**TODO:**
- Integrate tournament settings display in student-facing pages
- Add registration_open check to team creation
- Display tournament rules and info

All admin functionality is complete and secured with RLS! 🎉
