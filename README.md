# DesiCook - Smart Recipe Generator

**Live Demo:** [https://desicook-9rct.vercel.app/](https://desicook-9rct.vercel.app/)

> A fast, minimal, engineering-focused recipe discovery tool built to answer one question reliably: *“What can I cook right now?”* Designed with execution, clarity, and zero‑fluff architecture.

A modern, AI-assisted recipe discovery platform that helps users instantly find recipes based on the ingredients they already have. Built with speed, clarity, and usefulness in mind.

---

## 🚀 Quick Start

DesiCook is intentionally simple to install and run. No complex setup. No heavy tooling.

```bash
git clone (https://github.com/notraman/desicook-landing)
cd desicook-landing
npm install
npm run dev
```

You're ready.

---

## 🌱 Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Server-side only
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional image APIs
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key
PIXABAY_API_KEY=your-pixabay-key
```

---

## ⚙️ Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🖼️ Screenshots (Add your images here)


<img width="1753" height="752" alt="Screenshot 2025-11-15 164614" src="https://github.com/user-attachments/assets/738f7005-0505-43fb-9c66-10702534ab14" />
<img width="1753" height="752" alt="Screenshot 2025-11-15 164614" src="https://github.com/user-attachments/assets/a6ca641e-1e17-4c96-af5f-a9659f6d4063" />




## 📦 Deployment

### **Build for Production**

```bash
npm run build
```

Deploy the `dist/` folder to your hosting provider.

### **Deploy to Vercel**

1. `npm i -g vercel`
2. `vercel`

### **Deploy to Netlify**

1. `npm i -g netlify-cli`
2. `netlify deploy --prod`

### **Deploy to GitHub Pages**

1. `npm run build`
2. Configure GitHub Actions or use `gh-pages`

### **Production Variables**

Set the following:

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 🗄️ Database Setup

### **1. Run Migrations**

In Supabase SQL Editor, run these in order:

* `000_SETUP_ALL.sql`
* `001_create_recipes.sql`
* `002_history_table.sql`

### **2. Seed Recipes (Optional)**

```bash
# Sample recipes
node etl/seed_recipes.js --sample

# Full dataset
node etl/seed_recipes.js --full
```

---

## 🔧 Edge Functions

### **Ingredient Recognition (recognize)**

```bash
supabase functions deploy recognize
```

Secrets: `GEMINI_API_KEY`, `HF_API_KEY`

### **Recipe Search (search-by-ingredients)**

```bash
supabase functions deploy search-by-ingredients
```

### **AI Suggestions (suggest-recipes)**

```bash
supabase functions deploy suggest-recipes
```

Secret: `GEMINI_API_KEY`

---

## 🛠️ Tech Stack

* React 18, TypeScript, Vite
* Tailwind CSS, shadcn-ui
* Supabase (DB, Auth, Storage, Edge Functions)
* AI Models: TensorFlow.js, HuggingFace, Google Gemini
* React Router v6, React Query

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   ├── hooks/
│   └── integrations/
├── supabase/
│   ├── functions/
│   └── migrations/
├── etl/
└── public/
```

---

## 🔐 Security Notes

* Never commit `.env` files
* Only expose variables prefixed with `VITE_`
* Service role key must remain server-side
* Edge function secrets should never use `VITE_`

---

## 📝 License

Uses free/public images from Unsplash, Pexels, and Pixabay.

---

## 🤝 Contributing

1. Fork repository
2. Create a feature branch
3. Push changes
4. Open a PR

*Built with intention and simplicity , the way good tools should be.*
