# Project

A lightweight utility focused on fast, predictable performance.

## Table of Contents

- [Getting Started](#getting-started)
- [Accessibility](#accessibility)
  - [Contributor Checklist](#contributor-checklist)
  - [Testing](#testing)
  - [Tooling](#tooling)
  - [Reporting Issues](#reporting-issues)

## Getting Started

See the documentation in the `docs/` directory for installation and usage details.

## Accessibility

This project aims to be usable by everyone. Accessibility is treated as a
first-class concern rather than an afterthought; the guidelines below apply
to both code contributions and documentation changes.

### Contributor Checklist

Before opening a pull request, please verify the following:

- **Text alternatives.** Provide descriptive alt text (or an empty `alt=""`
  for purely decorative images) for any non-text content.
- **Keyboard support.** Ensure interactive elements are reachable in a
  logical tab order and expose visible focus states.
- **Color and contrast.** Maintain contrast ratios meeting WCAG AA or
  better; do not rely on color alone to convey meaning.
- **Motion.** Respect `prefers-reduced-motion` and avoid animations that
  could trigger vestibular disorders.
- **Semantics first.** Prefer native HTML elements; reach for ARIA only
  when no semantic equivalent exists, and follow the "first rule of ARIA".
- **Forms.** Associate every input with a label, mark required fields
  programmatically, and surface validation errors in text, not just color.

### Testing

At minimum, exercise changes with:

1. Keyboard-only navigation (no mouse or trackpad).
2. One screen reader — NVDA, JAWS, VoiceOver, TalkBack, or Orca.
3. An automated checker such as axe or Lighthouse for obvious regressions.
4. Page zoom at 200% to confirm the layout reflows without loss of content.

Automated tools catch only a fraction of issues, so manual verification
remains important.

### Tooling

The following tools are useful but not required; pick whatever fits your
workflow:

- [axe DevTools](https://www.deque.com/axe/) browser extension.
- Lighthouse, built into Chromium-based browsers.
- The Accessibility panel in Firefox or Chrome DevTools for inspecting the
  accessibility tree and computed roles.

### Reporting Issues

Reports of accessibility issues are welcome via the issue tracker. To help
us reproduce and prioritize, please include:

- Steps to reproduce, including the page or component involved.
- The assistive technology and browser/OS versions used, if applicable.
- The expected versus actual behavior.

Issues tagged `a11y` are treated with the same priority as functional bugs.
