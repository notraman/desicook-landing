# DesiCook Design System Notes

## Glassmorphism Implementation

The DesiCook landing page uses a luxury glassmorphism aesthetic with multi-layered backgrounds and frosted glass panels. This creates visual depth while maintaining content readability.

### Core Glass Effects
- **Backdrop blur**: `backdrop-filter: blur(10px)` creates the frosted glass effect
- **Background opacity**: Panels use `rgba(255,255,255,0.06–0.10)` for subtle transparency
- **Border treatment**: `1px solid rgba(255,255,255,0.10)` provides definition without harsh lines
- **Shadow depth**: `0 6px 30px rgba(4,8,12,0.45)` adds elevation and luxury feel

### Color Token System
All colors are defined as HSL tokens in `src/index.css`:
- `--dc-deep-green`: Deep emerald for primary backgrounds
- `--dc-navy`: Rich navy for gradient layers
- `--dc-burgundy`: Wine-red accent for warmth
- `--dc-cream`: Ivory for readable text
- `--dc-gold`: Premium gold for CTAs and highlights

### Responsive Adjustments
For smaller screens or lower-performance devices, you can:
- Reduce blur from `blur(10px)` to `blur(6px)` in `.glass` utility
- Decrease background layer complexity by removing one radial gradient
- Increase panel opacity to `rgba(255,255,255,0.12)` for better contrast

### Accessibility
- All interactive elements have hover/focus states
- Gold focus ring (`--dc-gold`) provides clear keyboard navigation
- Contrast ratios meet WCAG AA standards with cream text on dark glass
- ARIA labels included on icon-only buttons

### Performance Tips
- Glass effects use CSS `backdrop-filter` (hardware accelerated)
- Gradients are applied to single background div (not multiple elements)
- Micro-interactions use `transform` instead of position changes for smooth 60fps animations
