# Animation Patterns

All animation timing and easing is defined in `src/lib/animations.ts` for consistency.

## Centralized Animation Configs

```typescript
import {
  SIDEBAR_ANIMATION,       // Sidebar width transitions
  CONTENT_SLIDE_ANIMATION, // Horizontal and vertical slides
  SPRING_TRANSITION,       // Layout animations
  FADE_SLIDE_TRANSITION,   // Text fade+slide from right
} from '@/lib/animations'
```

## Usage Examples

### Sidebar Width Animation

```typescript
<motion.div
  animate={{ width: isCollapsed ? SIDEBAR_ANIMATION.collapsedWidth : SIDEBAR_ANIMATION.expandedWidth }}
  transition={SIDEBAR_ANIMATION.transition}
/>
```

### Content Slide In/Out

```typescript
<AnimatePresence>
  {!isCollapsed && (
    <motion.div
      initial={CONTENT_SLIDE_ANIMATION.horizontal.initial}
      animate={CONTENT_SLIDE_ANIMATION.horizontal.animate}
      exit={CONTENT_SLIDE_ANIMATION.horizontal.exit}
      transition={CONTENT_SLIDE_ANIMATION.transition}
    />
  )}
</AnimatePresence>
```

### Text Fade + Slide

```typescript
<motion.span
  initial={FADE_SLIDE_TRANSITION.initial}
  animate={FADE_SLIDE_TRANSITION.animate}
  exit={FADE_SLIDE_TRANSITION.exit}
  transition={FADE_SLIDE_TRANSITION.transition}
/>
```

## Framer Motion Layout Patterns

### LayoutGroup for Related Elements

```typescript
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'

<LayoutGroup>
  {items.map(item => (
    <motion.div
      layoutId={`element-${item.id}`}  // Same ID = morph between positions
      transition={SPRING_TRANSITION}
    />
  ))}
</LayoutGroup>
```

### AnimatePresence for Mount/Unmount

```typescript
<AnimatePresence mode="popLayout">
  {showElement && (
    <motion.div
      initial={FADE_SLIDE_TRANSITION.initial}
      animate={FADE_SLIDE_TRANSITION.animate}
      exit={FADE_SLIDE_TRANSITION.exit}
      transition={FADE_SLIDE_TRANSITION.transition}
    />
  )}
</AnimatePresence>
```

## Key Patterns

- `layoutId` - Elements that morph position between states
- `AnimatePresence` - Elements that mount/unmount
- `layout="position"` - Animates position only, not size (avoids height jumping)
- Avoid `layout` on containers that don't need size animation
- Shared `layoutId` for selection indicators that slide between items
- Spring transitions for snappy, natural feel

**Update animation configs in `src/lib/animations.ts` - changes sync everywhere.**
