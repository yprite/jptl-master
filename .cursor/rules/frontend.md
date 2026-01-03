# Frontend Rules

> ⚠️ **REMINDER**: Before starting work, read `rules/core.md` FIRST.
> 
> This file applies **ONLY** when modifying frontend code or UI components.
> 
> Core rules in `rules/core.md` ALWAYS apply regardless of context.

**Apply these rules ONLY when modifying frontend code or UI components.**

## When to Apply

- ✅ Modifying React components
- ✅ Working with frontend architecture
- ✅ Creating or modifying UI components
- ✅ Working with frontend state management
- ✅ Modifying frontend styling or layout

**If you're not doing frontend work, see:**
- Backend work → `rules/backend.md`
- Writing tests → `rules/testing.md`
- Refactoring → `rules/refactoring.md`

## Component Architecture

### Atomic Design Pattern
- Structure components using Atomic Design principles
- Atoms → Molecules → Organisms → Templates → Pages
- Promote component reusability and composition

### Data Flow
- Prefer unidirectional data flow
- Use component composition over complex state management
- Avoid prop drilling; use context or state management when needed

## Accessibility

### WCAG 2.1 AA Compliance
- Ensure all interactive elements are keyboard accessible
- Provide appropriate ARIA roles, labels, and names
- Maintain sufficient color contrast ratios
- Support screen readers with semantic HTML

## Performance Optimization

### React Optimization
- Use `React.memo` for expensive component renders
- Use `useMemo` for expensive computations
- Use `useCallback` for stable function references
- Avoid unnecessary re-renders

## Responsive Design

### Mobile-First Approach
- Design for mobile devices first
- Use responsive breakpoints appropriately
- Test on multiple screen sizes
- Ensure touch targets are appropriately sized

## Browser Compatibility

### Progressive Enhancement
- Support modern browsers (last 2 versions)
- Use feature detection over browser detection
- Provide fallbacks for unsupported features
- Test across major browsers (Chrome, Firefox, Safari, Edge)

## Testing

See `rules/testing.md` for frontend testing strategy and requirements.

