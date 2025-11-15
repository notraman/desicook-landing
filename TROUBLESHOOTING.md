# Troubleshooting Guide

## 404 NOT_FOUND Error

If you're seeing a `404: NOT_FOUND` error with a Supabase error ID (like `bom1::j88zf-...`), this usually means:

### Common Causes

1. **Database tables don't exist** - The most common cause
2. **Edge Functions not deployed** - If calling `/functions/v1/...`
3. **Wrong Supabase URL or keys** - Incorrect environment variables
4. **Missing migrations** - Database setup not completed

### Quick Fix Steps

#### Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for specific error messages. Look for:
- `PGRST205` - Table does not exist
- `PGRST116` - No rows found (but table exists)
- `NOT_FOUND` - Resource not found

#### Step 2: Verify Database Tables

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** (left sidebar)
4. Check if these tables exist:
   - `profiles`
   - `recipes`
   - `favorites`
   - `recipe_history`

#### Step 3: Run Database Migrations

If tables are missing, run the migrations:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run migrations in this order:
   ```sql
   -- First, run the complete setup
   -- Copy and paste contents of: supabase/migrations/000_SETUP_ALL.sql
   
   -- Then run recipes table setup
   -- Copy and paste contents of: supabase/migrations/001_create_recipes.sql
   
   -- Then run history table
   -- Copy and paste contents of: supabase/migrations/002_history_table.sql
   ```

3. Click **Run** after each migration

#### Step 4: Verify Environment Variables

Check your `.env` file has correct values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Where to find these:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" → `VITE_SUPABASE_URL`
- Copy "anon public" key → `VITE_SUPABASE_PUBLISHABLE_KEY`

#### Step 5: Test Database Connection

Open browser console and run:

```javascript
// Import the test function
import { testDatabaseConnection } from './src/lib/testDatabase';

// Run the test
testDatabaseConnection().then(result => {
  console.log(result);
});
```

Or use the global function if available:
```javascript
testDatabase()
```

### Specific Error Solutions

#### Error: "Table 'profiles' does not exist"
**Solution:** Run `supabase/migrations/000_SETUP_ALL.sql` in Supabase SQL Editor

#### Error: "Table 'recipes' does not exist"
**Solution:** Run `supabase/migrations/001_create_recipes.sql` in Supabase SQL Editor

#### Error: "Edge Function not found" (404 on `/functions/v1/...`)
**Solution:** Deploy Edge Functions:
```bash
supabase functions deploy recognize
supabase functions deploy search-by-ingredients
supabase functions deploy suggest-recipes
```

#### Error: "Permission denied" or RLS errors
**Solution:** Check Row Level Security policies are set up correctly in migrations

### Still Having Issues?

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Look for recent errors

2. **Verify Supabase Project Status:**
   - Make sure your project is active
   - Check if you're using the correct project

3. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache completely

4. **Check Network Tab:**
   - Open Developer Tools → Network tab
   - Look for failed requests to Supabase
   - Check the response for detailed error messages

### Getting Help

If you're still stuck:
1. Check the browser console for full error details
2. Check Supabase Dashboard → Logs for server-side errors
3. Verify all migrations have been run successfully
4. Make sure environment variables are set correctly

