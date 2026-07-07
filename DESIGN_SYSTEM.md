# Cyber Detector Design System

## 1. Color Tokens (CSS Variables)

### Surface Tokens (Backgrounds)
- `--surface-0`: `#F3F4F6` - Page background (darkest)
- `--surface-1`: `#FFFFFF` - Header background
- `--surface-2`: `#FFFFFF` - Card backgrounds (input, result, history)

### Text Tokens
- `--text-primary`: `#111827` - Main body text
- `--text-secondary`: `#6B7280` - Labels, secondary info, descriptions
- `--text-muted`: `#9CA3AF` - Placeholder, timestamps, disabled text

### Border & Divider Tokens
- `--border`: `#E5E7EB` - Hairline (0.5px) - default state
- `--border-strong`: `#D1D5DB` - Enhanced border on scroll/interaction

### Semantic Color Ramps

#### Danger/Red (Dangerous Status)
- `--bg-danger`: `#FEE2E2` - Background fill
- `--border-danger`: `#DC2626` - Border and accent
- `--text-danger`: `#991B1B` - Text color

#### Suspicious/Amber (Low/Medium Risk)
- `--bg-suspicious`: `#FAEEDA` - Background fill
- `--bar-suspicious`: `#EF9F27` - Bar and accent
- `--text-suspicious`: `#854F0B` - Text color

#### Safe/Green (Safe Status)
- `--bg-safe`: `#EAF3DE` - Background fill
- `--bar-safe`: `#639922` - Bar and accent
- `--text-safe`: `#3B6D11` - Text color

### Action & Accent Tokens
- `--fill-accent`: `#2563EB` - Primary action button (Analyze)
- `--on-accent`: `#FFFFFF` - Text on accent

### Spacing Scale
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 12px
- `--spacing-lg`: 16px
- `--spacing-xl`: 24px
- `--spacing-2xl`: 32px

### Layout
- `--header-height`: 64px

---

## 2. Fixed Header Specification

### Position & Behavior
- `position: sticky`
- `top: 0`
- `z-index: 10` (stays over content)
- Height: 64px
- Padding: 0 24px

### Structure
```
| [Logo/Title + Subtitle]  [Avatar Initials] [Logout Btn] |
```

### Scroll Behavior
- Default state: `border-bottom: 0.5px solid var(--border)`
- On scroll (scrollY > 0): Header adds `.scrolled` class
- On scroll: Border upgrades to `border-bottom-color: var(--border-strong)`
- Creates "lifted" effect without shadows (flat design rule)

### Color
- Background: `var(--surface-1)` (white, not transparent)
- Border: Transitions from `--border` to `--border-strong`

---

## 3. Layout Structure (Top to Bottom)

### Fixed Header (Always Visible)
```css
.detector-header {
  position: sticky; top: 0; z-index: 10;
  height: 64px; padding: 0 20px;
  background: var(--surface-1);
  border-bottom: 0.5px solid var(--border);
}
```

### Main Content Area
```css
.detector-container {
  flex: 1;
  padding-top: var(--header-height); /* Prevents content hiding behind header */
}

.detector-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;  /* Two equal columns */
  gap: 16px;
}

/* Responsive: Stack to single column under 960px */
@media (max-width: 960px) {
  .detector-content {
    grid-template-columns: 1fr;
  }
}
```

### Two-Column Layout
- **Left Column** (`.detector-main`):
  - Input card (textarea + Analyze button)
  - Severity legend
  
- **Right Column** (`.detector-sidebar`):
  - Result card (top) - status badge, progress bar, confidence score
  - History card (bottom, flex: 1, scrollable internally)

---

## 4. Component Specifications

### Card Component
```css
.card {
  background: var(--surface-2);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: border-color 0.3s ease;
}

.card:hover {
  border-color: var(--border-strong);
}
```

### Input Card
- Textarea with rounded corners
- Focus state: Blue border (`--fill-accent`) + subtle background tint
- Button: Full-width primary action button
- Severity legend below button

### Result Card (Status Section)
Contains three aligned components:

#### 1. Status Badge
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  border-left: 3px solid [severity-color];
}

/* Three states */
.status-badge.safe { 
  background: var(--bg-safe);
  color: var(--text-safe);
  border-left-color: var(--bar-safe);
}
.status-badge.suspicious { 
  background: var(--bg-suspicious);
  color: var(--text-suspicious);
  border-left-color: var(--bar-suspicious);
}
.status-badge.dangerous { 
  background: var(--bg-danger);
  color: var(--text-danger);
  border-left-color: var(--border-danger);
}
```

#### 2. Progress Bar (Confidence Score)
```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.safe { background: var(--bar-safe); }
.progress-fill.suspicious { background: var(--bar-suspicious); }
.progress-fill.dangerous { background: var(--border-danger); }
```

#### 3. Confidence Score Line
```
Confidence Score    │    85%
```

### History Item Card (Color-Coded)
```css
.history-item {
  background: var(--surface-2);
  border: 0.5px solid var(--border);
  border-left: 4px solid [severity-color];  /* Color-coded border */
  border-radius: 8px;
  padding: 16px;
}

/* Colored left border + background tint by severity */
.history-item.risk-safe {
  border-left-color: var(--bar-safe);
  background: linear-gradient(to right, rgba(234,243,222,0.5), var(--surface-2));
}
.history-item.risk-dangerous {
  border-left-color: var(--border-danger);
  background: linear-gradient(to right, rgba(254,226,226,0.5), var(--surface-2));
}
```

**Rule of thumb**: Severity color always appears in **three places** together:
1. Left border accent on history row
2. Status pill/badge
3. Progress bar fill

This creates visual scannability. Never color just one of them.

---

## 5. Severity Mapping (Confidence → UI State)

Apply these thresholds **consistently everywhere** (badge, bar, history rows):

| Confidence | Status | Class | Colors |
|------------|--------|-------|--------|
| < 40% | Safe | `.safe` | `--bg-safe`, `--bar-safe`, `--text-safe` |
| 40–70% | Suspicious | `.suspicious` | `--bg-suspicious`, `--bar-suspicious`, `--text-suspicious` |
| > 70% | Dangerous | `.dangerous` | `--bg-danger`, `--border-danger`, `--text-danger` |

**Implementation**: Map backend `confidence` to one of three states, then apply the same class to badge, progress bar, and history row.

---

## 6. Typography

### Headings
- **H1**: 32px, 700 weight, `--text-primary`
- **H2**: 20px, 700 weight, `--text-primary`
- **H3**: 16px, 600 weight, `--text-primary`

### Body
- **Main text**: 16px, 400 weight, `--text-primary`
- **Labels**: 14px, 500 weight, `--text-primary`
- **Secondary**: 14px, 400 weight, `--text-secondary`
- **Timestamps/Muted**: 12px, 400 weight, `--text-muted`

### Monospace (Data)
- Font: `'IBM Plex Mono', monospace`
- Size: 13px, 400 weight
- Used for: Timestamps, IDs, data values

---

## 7. Border & Divider Rules

- **Hairline borders**: 0.5px solid `--border` (never hard black)
- **Dividers**: Same as borders
- **Hover/Scroll state**: Upgrade to `--border-strong` for emphasis
- **Active focus**: Use `--fill-accent` border (2px)

---

## 8. Button Styles

### Primary (Analyze Button)
```css
.btn-primary {
  background: var(--fill-accent);  /* #2563EB */
  color: var(--on-accent);         /* white */
  width: 100%;
  font-weight: 600;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-2px);
}
```

### Danger (Delete/Clear)
```css
.btn-danger {
  background: var(--border-danger);  /* #DC2626 */
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #B91C1C;
}
```

### Text (Links)
```css
.btn-text {
  background: none;
  color: var(--fill-accent);
  border: none;
  text-decoration: underline;
}

.btn-text:hover {
  color: #1d4ed8;
}
```

---

## 9. States & Interactions

### Input Focus
```css
input:focus, textarea:focus {
  outline: none;
  border-color: var(--fill-accent);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### Disabled State
```css
input:disabled, button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--surface-0);
}
```

### Error State
```css
.error-message {
  background: var(--bg-danger);
  color: var(--text-danger);
  border-left: 0.5px solid var(--border-danger);
  padding: 12px;
  border-radius: 8px;
}
```

---

## 10. Scroll Listener Implementation (JavaScript)

In React, add this hook to `DetectorPage.js`:

```javascript
// Scroll listener for sticky header border upgrade
useEffect(() => {
  const handleScroll = () => {
    const header = document.querySelector('.detector-header');
    if (header) {
      if (window.scrollY > 0) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**CSS Effect**:
```css
.detector-header {
  border-bottom: 0.5px solid var(--border);
  transition: border-color 0.2s ease;
}

.detector-header.scrolled {
  border-bottom-color: var(--border-strong);
}
```

---

## 11. Empty State

When no results or history:

```html
<div class="empty-state">
  <div class="empty-state-icon">📭</div>
  <div class="empty-state-title">No Results Yet</div>
  <div class="empty-state-text">Analyze a comment to see results here</div>
</div>
```

Colors: Use `--text-secondary` for title, `--text-muted` for description.

---

## 12. Responsive Breakpoints

- **960px and below**: Two-column grid → single column
- **768px and below**: Reduced padding, smaller font sizes
- **480px and below**: Mobile optimized

---

## 13. Accessibility

- All text meets WCAG AA contrast ratios (minimum 4.5:1)
- Focus states always visible
- Buttons have `aria-label` or visible text
- Color not the only indicator (always pair with icons or text)
- Reduced motion: Honor `prefers-reduced-motion` media query

---

## Summary: Three-Color Rule

**Every severity indicator must show the color in exactly three places:**
1. **History row left border** (4px accent line)
2. **Status badge** (background + border-left)
3. **Progress bar fill** (width varies, color is the status)

This creates **scanability**: a user can glance at the result card and immediately identify severity.

---

**Last Updated**: July 6, 2026
**Design System Version**: 1.0
