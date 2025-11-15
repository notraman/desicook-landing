# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/95fa8f48-c610-4af8-abdf-8b22111eb5f7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/95fa8f48-c610-4af8-abdf-8b22111eb5f7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/95fa8f48-c610-4af8-abdf-8b22111eb5f7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Recipe Database ETL (Extract, Transform, Load)

This project includes an ETL system to populate Supabase with recipes and images from external sources.

### Prerequisites

1. **Supabase Project**: Ensure you have a Supabase project set up
2. **API Keys**: Obtain API keys for:
   - [Unsplash](https://unsplash.com/developers) (primary image source)
   - [Pexels](https://www.pexels.com/api/) (fallback image source, optional)

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Image API Keys
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
PEXELS_API_KEY=your-pexels-api-key  # Optional, used as fallback

# Recipe Data Path (optional, defaults to src/data/recipes.json)
RECIPES_JSON_PATH=src/data/recipes.json
```

**⚠️ Important Security Notes:**
- Never commit real API keys to version control
- Use `.env` file and add it to `.gitignore`
- The `SUPABASE_SERVICE_ROLE_KEY` has admin access - keep it secure
- Use environment variables in CI/CD pipelines (GitHub Secrets, etc.)

### Database Migration

Before running the ETL, apply the database migration:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_create_recipes.sql`
4. Click **Run** to execute the migration

This creates:
- `recipes` table with GIN index on `ingredients_arr` for fast searches
- `ingredients` table for normalized ingredient names
- `recipe_ingredients` join table linking recipes to ingredients
- Row Level Security (RLS) policies for public read access

### Running the ETL

**Requirements**: Node.js 18+ (for native `fetch` support)

#### Test Mode (Sample Recipes)

Run with a small sample of recipes (25-50) for testing:

```bash
node etl/seed_recipes.js --sample
```

#### Full Mode (All Recipes)

Run with all recipes from your JSON file:

```bash
node etl/seed_recipes.js --full
```

#### Custom Concurrency

Control how many recipes are processed in parallel (default: 3):

```bash
node etl/seed_recipes.js --full --concurrency=5
```

### ETL Process

The ETL script performs the following steps for each recipe:

1. **Image Fetching**:
   - Searches Unsplash using recipe title, main ingredients, and cuisine
   - Falls back to Pexels if Unsplash yields no results
   - Downloads and uploads images to Supabase Storage (`recipes-images` bucket)

2. **Recipe Insertion**:
   - Inserts recipe into `recipes` table
   - Handles idempotency (skips existing recipes by title)

3. **Ingredient Normalization**:
   - Normalizes ingredient names (lowercase, trim, remove punctuation)
   - Creates/retrieves ingredients in `ingredients` table
   - Links recipes to ingredients via `recipe_ingredients` table
   - Populates `ingredients_arr` text[] column for fast searching

4. **Statistics**:
   - Logs success/failure for each recipe
   - Reports image source usage (Unsplash vs Pexels)
   - Provides summary at completion

### Image Storage

- Images are stored in Supabase Storage bucket: `recipes-images`
- Path format: `recipes/{recipe-id}.jpg`
- Images are publicly accessible via Supabase Storage URLs
- Maximum file size: 5MB per image
- Supported formats: JPEG, PNG, WebP

### Recipe Search API

The project includes a Supabase Edge Function for searching recipes by ingredients:

**Endpoint**: `https://your-project.supabase.co/functions/v1/search-by-ingredients`

**Method**: POST

**Request Body**:
```json
{
  "ingredients": ["tomato", "onion", "garlic"],
  "limit": 20,
  "offset": 0
}
```

**Response**:
```json
{
  "results": [
    {
      "recipe_id": "uuid",
      "title": "Recipe Name",
      "image_url": "https://...",
      "score": 0.85,
      "matched": ["tomato", "onion"],
      "total_ingredients": 8,
      "cuisine": "Italian",
      "difficulty": "Medium",
      "time_min": 30,
      "rating": 4.8
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

**Scoring Algorithm**:
- Exact matches: 2 points
- Partial matches (substring/synonym): 1 point
- Final score: `(matched_count * 2 + partial_matches * 1) / (total_ingredients * 2)`
- Results sorted by score (descending)

### Ingredient Substitutions

The system includes ingredient synonym mappings in `src/lib/substitutions.js`:
- Handles common variations (e.g., "cilantro" ↔ "coriander")
- Normalizes ingredient names for consistent matching
- Used by both ETL and search API

### Rate Limiting

The ETL script includes:
- Automatic rate limiting delays between API calls
- Batch processing with configurable concurrency
- Error handling for API rate limit responses
- Retry logic for transient failures

**Unsplash Rate Limits**:
- Free tier: 50 requests/hour
- Paid tiers: Higher limits available

**Pexels Rate Limits**:
- Free tier: 200 requests/hour
- Paid tiers: Higher limits available

### Troubleshooting

**ETL fails with "Missing Supabase environment variables"**:
- Ensure `.env` file exists with required variables
- Check that variable names match exactly (case-sensitive)

**Images not uploading**:
- Verify Supabase Storage bucket `recipes-images` exists
- Check that `SUPABASE_SERVICE_ROLE_KEY` has storage write permissions
- Review image download errors in console output

**No recipes found in search**:
- Ensure migration has been applied
- Verify `ingredients_arr` column is populated
- Check that GIN index exists: `recipes_ingredients_arr_gin_idx`

**API rate limit errors**:
- Reduce concurrency: `--concurrency=1`
- Add delays between batches in the script
- Consider upgrading API tier for higher limits

### License & Attribution

**Unsplash Images**:
- Unsplash images are free to use under the [Unsplash License](https://unsplash.com/license)
- Attribution is appreciated but not required
- Consider adding attribution in your app UI if desired

**Pexels Images**:
- Pexels images are free to use under the [Pexels License](https://www.pexels.com/license/)
- Attribution is appreciated but not required

### Next Steps

After running the ETL:

1. Verify recipes in Supabase dashboard
2. Test the search API endpoint
3. Integrate search API into your frontend
4. Monitor storage usage and API costs
5. Set up scheduled ETL runs if needed (CI/CD or cron)