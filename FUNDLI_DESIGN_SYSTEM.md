# Fundli Design System (FDS)
*Version 1.0 - Comprehensive Design Guidelines*

## 🎯 Core Design Principles

### 1. Trust & Transparency
- **Clean, minimal interface** with no visual clutter
- **Clear data presentation** - numbers and transactions prominently displayed
- **Consistent information hierarchy** - most important data first
- **Transparent processes** - users always know what's happening

### 2. Accessibility First
- **WCAG AA compliance** - minimum 4.5:1 contrast ratios
- **Large tap targets** - minimum 44px for mobile interactions
- **Readable typography** - minimum 16px body text
- **Keyboard navigation** - full functionality without mouse
- **Screen reader support** - proper ARIA labels and roles

### 3. Scalable & Modular
- **Reusable components** with consistent variants
- **Design tokens** for colors, spacing, typography
- **Component library** with clear documentation
- **Responsive design** - mobile-first approach

### 4. Fintech Feel, Human Touch
- **Professional color palette** with warm accents
- **Serious but approachable** tone
- **Clear financial data** presentation
- **Human-friendly language** and microcopy

### 5. Gamification & Community
- **Subtle animations** for engagement
- **Progress indicators** and achievement badges
- **Community features** with social proof
- **Reward systems** for good financial behavior

## 🎨 Brand Identity

### Logo Concept
- **Secure vault + digital circuit** motif
- Represents **trust + technology**
- Clean, modern, scalable design

### Tagline Style
- **Short and empowering**
- Examples: "Finance, For Everyone", "Your Money, Your Future"

## 🌈 Color Palette

### Primary Colors
```css
/* Emerald Green - Growth, Trust, Wealth */
primary: "#2ECC71"
primary-50: "#f0fdf4"
primary-100: "#dcfce7"
primary-200: "#bbf7d0"
primary-300: "#86efac"
primary-400: "#4ade80"
primary-500: "#2ECC71"
primary-600: "#16a34a"
primary-700: "#15803d"
primary-800: "#166534"
primary-900: "#14532d"
```

### Secondary Colors
```css
/* Deep Navy - Professional, Grounding */
secondary: "#0D1B2A"
secondary-50: "#f8fafc"
secondary-100: "#f1f5f9"
secondary-200: "#e2e8f0"
secondary-300: "#cbd5e1"
secondary-400: "#94a3b8"
secondary-500: "#64748b"
secondary-600: "#475569"
secondary-700: "#334155"
secondary-800: "#1e293b"
secondary-900: "#0D1B2A"
```

### Accent Colors
```css
/* Golden Amber - ROI, Rewards, CTAs */
accent: "#F5B700"
accent-50: "#fffbeb"
accent-100: "#fef3c7"
accent-200: "#fde68a"
accent-300: "#fcd34d"
accent-400: "#fbbf24"
accent-500: "#F5B700"
accent-600: "#d97706"
accent-700: "#b45309"
accent-800: "#92400e"
accent-900: "#78350f"
```

### Neutral Colors
```css
/* Warm Grays - Backgrounds, Borders, Text */
neutral-100: "#F5F7FA"
neutral-200: "#E5E7EB"
neutral-300: "#d1d5db"
neutral-400: "#9ca3af"
neutral-500: "#6B7280"
neutral-600: "#4b5563"
neutral-700: "#374151"
neutral-800: "#1f2937"
neutral-900: "#111827"
```

### Status Colors
```css
success: "#16A34A"    /* Success states */
warning: "#F59E0B"    /* Warning states */
error: "#DC2626"      /* Error states */
info: "#2563EB"       /* Information states */
```

### Gradients
```css
/* Use sparingly for hero sections */
gradient-primary: "linear-gradient(135deg, #2ECC71 0%, #0D1B2A 100%)"
gradient-secondary: "linear-gradient(135deg, #0D1B2A 0%, #F5B700 100%)"
gradient-accent: "linear-gradient(135deg, #F5B700 0%, #2ECC71 100%)"
```

## 📝 Typography System

### Font Families
```css
/* Primary - Clean, system-like for dashboards */
font-primary: "Inter", system-ui, sans-serif

/* Secondary - Unique, premium for headings */
font-secondary: "Clash Display", "Satoshi", system-ui, sans-serif
```

### Font Scale
```css
/* Headings */
h1: 32px / 1.2 / bold      /* Page titles */
h2: 24px / 1.3 / semibold  /* Section headers */
h3: 20px / 1.4 / semibold  /* Cards, widget titles */
h4: 18px / 1.4 / medium    /* Subsection headers */
h5: 16px / 1.5 / medium    /* Small headers */
h6: 14px / 1.5 / medium    /* Micro headers */

/* Body Text */
body-large: 18px / 1.6 / regular   /* Important content */
body: 16px / 1.6 / regular         /* Default body text */
body-small: 14px / 1.5 / regular   /* Secondary info */
caption: 12px / 1.4 / regular      /* Captions, labels */
```

### Typography Classes
```css
.text-display { font-family: font-secondary; }
.text-body { font-family: font-primary; }
.text-gradient { background: linear-gradient(135deg, primary, accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
```

## 📏 Spacing & Grid System

### Base Unit
- **8px modular scale** for consistent spacing
- All spacing values are multiples of 8px

### Spacing Scale
```css
xs: 4px    /* 0.5 * base */
sm: 8px    /* 1 * base */
md: 16px   /* 2 * base */
lg: 24px   /* 3 * base */
xl: 32px   /* 4 * base */
2xl: 48px  /* 6 * base */
3xl: 64px  /* 8 * base */
4xl: 96px  /* 12 * base */
```

### Container Widths
```css
mobile: 100% (with 16px padding)
tablet: 640px - 768px
desktop: 1200px max
```

### Grid System
- **12-column responsive grid**
- **24px gutters** between columns
- **16px margins** on mobile, **24px** on desktop

## 🧩 Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
  background: primary-500;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-primary:hover {
  background: primary-600;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: secondary-600;
  border: 2px solid secondary-600;
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: 500;
}
```

#### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: primary-600;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
}
```

#### CTA Button
```css
.btn-cta {
  background: accent-500;
  color: white;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(245, 183, 0, 0.3);
}
```

### Input Fields

#### Standard Input
```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid neutral-200;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
}

.input-field:focus {
  border-color: primary-500;
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1);
}
```

#### Input with Icon
```css
.input-with-icon {
  position: relative;
}

.input-with-icon .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: neutral-400;
}
```

### Cards

#### Standard Card
```css
.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid neutral-100;
}
```

#### Loan Card
```css
.loan-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid neutral-100;
  transition: all 0.3s ease;
}

.loan-card:hover {
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}
```

### Badges & Tags

#### Status Badges
```css
.badge-success {
  background: rgba(22, 163, 74, 0.1);
  color: success;
  border: 1px solid rgba(22, 163, 74, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: warning;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge-error {
  background: rgba(220, 38, 38, 0.1);
  color: error;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.badge-info {
  background: rgba(37, 99, 235, 0.1);
  color: info;
  border: 1px solid rgba(37, 99, 235, 0.2);
}
```

#### Achievement Badges
```css
.badge-bronze {
  background: linear-gradient(135deg, #CD7F32, #B8860B);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 600;
}

.badge-silver {
  background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
  color: white;
}

.badge-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
}
```

### Navigation

#### Side Navigation
```css
.sidebar {
  width: 256px;
  background: white;
  border-right: 1px solid neutral-200;
  padding: 24px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: neutral-600;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: primary-50;
  color: primary-600;
}

.nav-item.active {
  background: primary-100;
  color: primary-700;
  border-right: 3px solid primary-500;
}
```

#### Bottom Tab Navigation (Mobile)
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid neutral-200;
  padding: 8px 0;
  display: flex;
  justify-content: space-around;
}
```

### Modals & Drawers

#### Modal
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
```

### Charts & Analytics

#### Chart Container
```css
.chart-container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: secondary-800;
  margin-bottom: 16px;
}
```

### Tables

#### Data Table
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: neutral-50;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: secondary-700;
  border-bottom: 2px solid neutral-200;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid neutral-100;
}

.data-table tr:hover {
  background: neutral-50;
}
```

## 🎭 Motion & Microinteractions

### Animation Principles
- **Smooth transitions** - 200-300ms duration
- **Easing functions** - ease-out for entrances, ease-in for exits
- **Subtle effects** - enhance UX without distraction

### Common Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Scale In */
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Button Hover */
.button-hover {
  transition: all 0.2s ease;
}

.button-hover:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

### Gamification Animations
```css
/* Confetti for loan approval */
@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
}

/* Progress bar fill */
@keyframes progressFill {
  from { width: 0%; }
  to { width: var(--progress-width); }
}

/* Badge glow */
@keyframes badgeGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(46, 204, 113, 0.5); }
  50% { box-shadow: 0 0 20px rgba(46, 204, 113, 0.8); }
}
```

## 🌙 Theming

### Light Mode (Default)
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #F5F7FA;
  --text-primary: #0D1B2A;
  --text-secondary: #6B7280;
  --border-color: #E5E7EB;
  --shadow-color: rgba(0,0,0,0.08);
}
```

### Dark Mode
```css
[data-theme="dark"] {
  --bg-primary: #0D1B2A;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  --shadow-color: rgba(0,0,0,0.3);
}
```

## 🎯 Unique Signature Elements

### Trust Bar
```css
.trust-bar {
  background: linear-gradient(135deg, primary-500, accent-500);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

### Dynamic Loan Cards
```css
.loan-card-expandable {
  transition: all 0.3s ease;
  cursor: pointer;
}

.loan-card-expandable.expanded {
  transform: scale(1.02);
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
```

### Referral Tree Visualization
```css
.referral-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.referral-node {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, primary-500, accent-500);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
  animation: badgeGlow 2s infinite;
}
```

### Insurance Pool Meter
```css
.pool-meter {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(primary-500 0deg, primary-500 var(--pool-strength), neutral-200 var(--pool-strength));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pool-meter::before {
  content: '';
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  position: absolute;
}
```

### Achievement Showcase
```css
.achievement-shelf {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, neutral-50, primary-50);
  border-radius: 16px;
  border: 2px solid accent-200;
}
```

## ♿ Accessibility Guidelines

### Color Contrast
- **Minimum 4.5:1** for normal text
- **Minimum 3:1** for large text (18px+)
- **Color is not the only indicator** - use icons, text, or patterns

### Interactive Elements
- **Minimum 44px touch targets** for mobile
- **Clear focus indicators** with 2px outline
- **Keyboard navigation** support for all interactive elements

### Screen Reader Support
```html
<!-- Proper ARIA labels -->
<button aria-label="Close modal">×</button>
<div role="alert" aria-live="polite">Error message</div>
<nav aria-label="Main navigation">...</nav>

<!-- Semantic HTML -->
<main>
  <section aria-labelledby="dashboard-heading">
    <h2 id="dashboard-heading">Dashboard</h2>
  </section>
</main>
```

## 🛠️ Implementation Guide

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#2ECC71',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0D1B2A',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F5B700',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#DC2626',
        info: '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'Satoshi', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.08)',
        'medium': '0 8px 30px rgba(0,0,0,0.12)',
        'large': '0 12px 40px rgba(0,0,0,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'confetti': 'confetti 2s ease-out',
        'progress-fill': 'progressFill 1s ease-out',
        'badge-glow': 'badgeGlow 2s infinite',
      },
    },
  },
  plugins: [],
}
```

### Component Usage Examples

#### Button Components
```jsx
// Primary Button
<button className="btn-primary">
  Apply for Loan
</button>

// Secondary Button
<button className="btn-secondary">
  Learn More
</button>

// CTA Button
<button className="btn-cta">
  Get Started
</button>
```

#### Card Components
```jsx
// Standard Card
<div className="card">
  <h3 className="text-lg font-semibold mb-4">Loan Details</h3>
  <p className="text-gray-600">Loan information here...</p>
</div>

// Loan Card
<div className="loan-card">
  <div className="flex justify-between items-start mb-4">
    <h3 className="text-xl font-semibold">$25,000</h3>
    <span className="badge-success">Active</span>
  </div>
  <p className="text-gray-600 mb-2">Business Expansion</p>
  <p className="text-sm text-gray-500">Next payment: Dec 15, 2024</p>
</div>
```

#### Form Components
```jsx
// Input Field
<div className="mb-4">
  <label className="form-label">Loan Amount</label>
  <input 
    type="number" 
    className="input-field" 
    placeholder="Enter amount"
  />
</div>

// Input with Icon
<div className="input-with-icon mb-4">
  <Search className="icon h-5 w-5" />
  <input 
    type="text" 
    className="input-field pl-10" 
    placeholder="Search loans"
  />
</div>
```

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Mobile-First Approach
- **Start with mobile** design and scale up
- **Touch-friendly** interactions (44px minimum)
- **Simplified navigation** for small screens
- **Optimized content** hierarchy

## 🎨 Design Tokens

### Spacing Tokens
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
--space-4xl: 96px;
```

### Typography Tokens
```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 32px;

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.6;
```

### Shadow Tokens
```css
--shadow-soft: 0 4px 20px rgba(0,0,0,0.08);
--shadow-medium: 0 8px 30px rgba(0,0,0,0.12);
--shadow-large: 0 12px 40px rgba(0,0,0,0.15);
--shadow-glow: 0 0 20px rgba(46, 204, 113, 0.3);
```

## 🔧 Development Guidelines

### CSS Architecture
- **Utility-first** approach with Tailwind CSS
- **Component-based** styling
- **Consistent naming** conventions
- **Modular CSS** for complex components

### Component Structure
```jsx
// Component file structure
components/
  Button/
    Button.jsx
    Button.module.css
    Button.stories.js
    Button.test.js
```

### Code Standards
- **Consistent indentation** (2 spaces)
- **Meaningful variable names**
- **Component documentation**
- **Accessibility testing**

## 📊 Performance Considerations

### Optimization Strategies
- **Lazy loading** for heavy components
- **Image optimization** with proper formats
- **CSS purging** to remove unused styles
- **Bundle splitting** for better loading

### Animation Performance
- **Use transform and opacity** for animations
- **Avoid animating layout properties**
- **Use will-change** sparingly
- **Respect prefers-reduced-motion**

## 🧪 Testing Guidelines

### Visual Testing
- **Screenshot testing** for components
- **Cross-browser compatibility**
- **Responsive design testing**
- **Accessibility testing**

### Component Testing
```jsx
// Example test structure
describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📚 Resources & Tools

### Design Tools
- **Figma** - Design and prototyping
- **Adobe XD** - Alternative design tool
- **Sketch** - Mac-only design tool

### Development Tools
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Storybook** - Component documentation
- **Chromatic** - Visual testing

### Accessibility Tools
- **axe-core** - Accessibility testing
- **WAVE** - Web accessibility evaluation
- **Lighthouse** - Performance and accessibility audit

## 🚀 Getting Started

### Installation
```bash
# Install dependencies
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
npm install framer-motion lucide-react

# Initialize Tailwind
npx tailwindcss init
```

### Setup
1. **Copy the Tailwind config** from this document
2. **Import the CSS** in your main file
3. **Create component library** using the provided examples
4. **Test accessibility** with provided tools
5. **Implement responsive design** following the guidelines

## 📝 Changelog

### Version 1.0 (Current)
- Initial design system implementation
- Complete color palette and typography
- Component library with examples
- Accessibility guidelines
- Responsive design patterns

---

*This design system is living documentation. Update it as the project evolves and new patterns emerge.*
