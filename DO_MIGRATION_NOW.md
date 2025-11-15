# ⚡ QUICK MIGRATION - Do This Now!

## Step 1: Run Migration (2 minutes)

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/hfkaigavywgkdmtxhjsn/sql/new
   - (You may need to sign in)

2. **Open the SQL file:**
   - In this project, open: `MIGRATION_SQL.sql`
   - Copy **ALL** the SQL code (Ctrl+A, Ctrl+C)

3. **Paste and Run:**
   - Paste into Supabase SQL Editor
   - Click **Run** button (or press Ctrl+Enter)
   - Wait for "Success. No rows returned" message

## Step 2: Run Auto-Setup (Automatic!)

After migration completes, run this command:

```bash
node etl/auto_setup.js
```

This will:
- ✅ Verify tables were created
- ✅ Automatically run ETL to populate 25 sample recipes
- ✅ Set up storage bucket
- ✅ Verify everything works

## Step 3: Deploy Edge Function (Optional - 2 minutes)

1. Go to: https://supabase.com/dashboard/project/hfkaigavywgkdmtxhjsn/functions
2. Click **Create a new function**
3. Name: `search-by-ingredients`
4. Open: `EDGE_FUNCTION_CODE.ts` in this project
5. Copy all code and paste
6. Click **Deploy**

---

## 🎯 That's It!

After these 3 steps, your frontend will:
- ✅ Load recipes from Supabase
- ✅ Show images from Supabase Storage
- ✅ Have fast ingredient search (if Edge Function deployed)

---

## Need Help?

If migration fails:
- Check error message in SQL Editor
- Make sure you copied ALL SQL (entire file)
- Tables might already exist (that's okay - safe to run again)

If ETL fails:
- Check `.env` has correct credentials
- Verify migration was successful (check Table Editor)
- Check console for specific error messages

