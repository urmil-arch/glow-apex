# CLAUDE.md

This file provides guidance to Claude Code when working in the Glow Apex repository.

---

# IMPORTANT STARTUP RULES

Before starting any task, ALWAYS:

1. Read `CLAUDE.md`
2. Read `CHANGES.md`
3. Review the existing project structure
4. Understand previous implementation decisions

Do not make assumptions without reviewing existing project context.

---

# CHANGE LOG REQUIREMENT

Every completed task MUST be documented in:

changes.md

After making changes, append an entry using this format:

```md
[YYYY-MM-DD HH:MM] | add/modify/fix/remove | file-path

Summary of what changed.
Reason for change.
```

Example:

```md
[2026-06-10 14:30] | modify | src/pages/About.tsx

Updated company story section.
Improved messaging and added animated statistics.
```

Never skip updating `CHANGES.md`.

---

# PROJECT OVERVIEW

Glow Apex is the parent growth brand behind BuyRealViews.

The website exists to:

* Build trust
* Establish credibility
* Present Glow Apex as a premium growth company
* Generate partnership and business inquiries

This is NOT an SMM panel.

This is NOT an admin dashboard.

This is NOT a SaaS application.

---

# WEBSITE STRUCTURE

Only these pages should exist:

* Home
* About
* Contact

Additional pages require approval.

---

# DESIGN PRINCIPLES

The site should feel:

* Premium
* Modern
* Fast
* Minimal
* Professional

Inspiration:

* Stripe
* Linear
* Vercel
* Notion
* Raycast

Avoid:

* Template-looking designs
* Cheap agency aesthetics
* Overly bright gradients
* Cluttered layouts

---

# BRANDING

Company Name:

Glow Apex

Tagline:

Growth Without Guesswork.

Primary Color:

#10B981

Background:

#0A0A0A

---

# DEVELOPMENT RULES

Before implementing:

1. Explain the task.
2. List affected files.
3. Explain the implementation plan.

Do not immediately start making large changes without explaining the approach.

---

# COMPONENT RULES

Prefer reusable components.

Examples:

* SectionHeader
* StatCard
* FeatureCard
* CTASection
* PageHero

Avoid duplicated code.

If the same UI appears more than once, extract it into a reusable component.

---

# STYLING RULES

Use:

* Tailwind CSS
* Responsive design
* Consistent spacing
* Consistent typography

Avoid:

* Inline styles
* Hardcoded pixel values where unnecessary
* Inconsistent margins and paddings

---

# ANIMATION RULES

Use Framer Motion sparingly.

Preferred:

* Fade In
* Slide Up
* Staggered Reveal
* Hover Effects

Avoid:

* Excessive motion
* Infinite animations
* Distracting effects

Animations should improve polish, not draw attention.

---

# PERFORMANCE RULES

Always:

* Optimize images
* Lazy load heavy assets
* Keep bundle size small
* Remove unused imports
* Remove dead code

---

# CODE QUALITY

Use:

* TypeScript
* Functional Components
* Interfaces for props

Avoid:

* any types
* duplicated logic
* unused variables
* commented-out legacy code

---

# ROUTING

Allowed routes:

/
/about
/contact

Do not create additional routes without approval.

---

# CONTACT FORM

Required fields:

* First Name
* Last Name
* Email
* Message

Optional:

* Company

Always include validation and user feedback states.

---

# CTA RULES

Primary CTA:

Visit BuyRealViews

Secondary CTA:

Contact Us

All pages should guide users toward one of these actions.

---

# COPYWRITING RULES

Tone:

* Confident
* Professional
* Premium
* Clear

Avoid:

* Fake urgency
* Overpromising
* Clickbait language
* "Best in the world" claims

Focus on credibility and trust.

---

# COMPLETION CHECKLIST

Before marking any task complete:

* Code builds successfully
* No TypeScript errors
* No unused imports
* Mobile responsive
* changes.md updated
* Existing functionality tested

Never consider a task finished until changes.md has been updated.
