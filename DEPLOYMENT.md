# Deployment Checklist

## Pre-Deployment

- [x] Remove unnecessary documentation files
- [x] Optimize build configuration
- [x] Update .gitignore
- [x] Clean up console.logs from production code
- [x] Consolidate documentation in README.md

## Build & Test

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Type check:**
   ```bash
   npm run type-check
   ```

3. **Lint code:**
   ```bash
   npm run lint
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Test production build locally:**
   ```bash
   npm run preview
   ```

## Environment Variables

Ensure these are set in your hosting platform:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

## Deployment Platforms

### Vercel
1. Connect your repository
2. Set environment variables
3. Deploy automatically on push

### Netlify
1. Connect your repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables

### GitHub Pages
1. Build: `npm run build`
2. Deploy `dist` folder to `gh-pages` branch
3. Set base path in `vite.config.ts` if needed

## Post-Deployment

- [ ] Verify all routes work
- [ ] Test authentication flow
- [ ] Test recipe search functionality
- [ ] Verify images load correctly
- [ ] Check mobile responsiveness
- [ ] Monitor error logs

## Performance Optimization

The build is optimized with:
- Code splitting (vendor, UI, Supabase, TensorFlow chunks)
- Minification enabled for production
- Source maps disabled in production
- Optimized dependency bundling

