# DesiCook - Smart Recipe Generator

A modern recipe discovery platform that helps users find recipes based on available ingredients. Features AI-powered ingredient detection, smart recipe matching, and personalized suggestions.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase project ([create one here](https://supabase.com))

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd desicook-landing

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # Edit with your Supabase credentials
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# For ETL scripts (server-side only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Image API Keys (Optional - for better recipe images)
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key
PIXABAY_API_KEY=your-pixabay-key
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Deployment

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory, ready to deploy to any static hosting service.

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy --prod`
3. Follow the prompts

### Deploy to GitHub Pages

1. Build the project: `npm run build`
2. Configure GitHub Actions or use `gh-pages` package
3. Set base path in `vite.config.ts` if needed

### Environment Variables in Production

Make sure to set these environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 🗄️ Database Setup

### 1. Run Migrations

1. Open Supabase Dashboard → SQL Editor
2. Run migrations in order:
   - `supabase/migrations/000_SETUP_ALL.sql` (auth tables)
   - `supabase/migrations/001_create_recipes.sql` (recipes tables)
   - `supabase/migrations/002_history_table.sql` (history table)

### 2. Seed Recipes (Optional)

```bash
# Test with sample recipes
node etl/seed_recipes.js --sample

# Full seed
node etl/seed_recipes.js --full
```

## 🔧 Edge Functions

### Deploy Edge Functions

1. **Image Recognition** (`recognize`):
   ```bash
   supabase functions deploy recognize
   ```
   Set secrets: `GEMINI_API_KEY`, `HF_API_KEY`

2. **Recipe Search** (`search-by-ingredients`):
   ```bash
   supabase functions deploy search-by-ingredients
   ```

3. **AI Suggestions** (`suggest-recipes`):
   ```bash
   supabase functions deploy suggest-recipes
   ```
   Set secret: `GEMINI_API_KEY`

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn-ui, Radix UI, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **AI/ML**: TensorFlow.js, HuggingFace, Google Gemini
- **Routing**: React Router v6
- **State Management**: React Query

## 📁 Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── lib/           # Utilities and services
│   ├── hooks/         # Custom React hooks
│   └── integrations/  # Supabase client setup
├── supabase/
│   ├── functions/     # Edge Functions
│   └── migrations/    # Database migrations
├── etl/              # ETL scripts for recipe seeding
└── public/           # Static assets
```

## 🔐 Security Notes

- Never commit `.env` files or API keys
- Use `VITE_` prefix only for client-side environment variables
- Edge Function secrets should NOT have `VITE_` prefix
- Service role key should only be used server-side

## 📝 License

This project uses free/public domain images from Unsplash, Pexels, and Pixabay.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
