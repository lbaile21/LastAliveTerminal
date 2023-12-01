# Project

A lightweight utility focused on fast, predictable performance.

## Table of Contents

- [Getting Started](#getting-started)
- [Accessibility](#accessibility)
  - [Contributor Checklist](#contributor-checklist)
  - [Testing](#testing)
  - [Tooling](#tooling)
  - [Reporting Issues](#reporting-issues)
- [License](#license)

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
  better (4.5:1 for normal text, 3:1 for large text and UI components);
  do not rely on color alone to convey meaning.
- **Motion.** Respect `prefers-reduced-motion` and avoid animations that
  could trigger vestibular disorders.
- **Semantics first.** Prefer native HTML elements; reach for ARIA only
  when no semantic equivalent exists, and follow the "first rule of ARIA".
- **Forms.** Associate every input with a label, mark required fields
  programmatically, and surface validation errors in text, not just color.
- **Headings.** Use a single `h1` per page and avoid skipping heading
  levels, so the document outline remains coherent to screen readers.
- **Language.** Set a `lang` attribute on the root element, and mark
  inline passages in another language with their own `lang` attribute.
- **Link text.** Use descriptive link text; avoid bare "click here" or
  "read more" phrasing that loses meaning out of context.
- **Touch targets.** Size interactive controls to at least 24×24 CSS
  pixels (WCAG 2.2) and leave adequate spacing between adjacent targets.
- **Timeouts.** If a session or interaction has a time limit, allow users
  to extend, adjust, or disable it where feasible (WCAG 2.2.1).

### Testing

At minimum, exercise changes with:

1. Keyboard-only navigation (no mouse or trackpad). Confirm that focus
   never becomes trapped and that the visible focus indicator is always
   discernible against the current background.
2. One screen reader — NVDA, JAWS, VoiceOver, TalkBack, or Orca.
3. An automated checker such as axe or Lighthouse for obvious regressions.
4. Page zoom at 200% to confirm the layout reflows without loss of content
   or functionality, including any sticky headers or off-canvas menus.
5. Forced-colors / high-contrast mode to confirm essential UI remains
   visible when user color overrides are active.
6. Text spacing overrides (line height 1.5×, paragraph spacing 2×) to
   confirm content does not clip or overlap.
7. Pointer alternatives: verify any drag, swipe, or multi-point gesture
   has a single-pointer equivalent (WCAG 2.5.1).

Automated tools catch only a fraction of issues (commonly cited estimates
put it around 30–40%), so manual verification remains important.

### Tooling

The following tools are useful but not required; pick whatever fits your
workflow:

- [axe DevTools](https://www.deque.com/axe/) browser extension.
- Lighthouse, built into Chromium-based browsers.
- The Accessibility panel in Firefox or Chrome DevTools for inspecting the
  accessibility tree and computed roles.
- [Pa11y](https://pa11y.org/) for scripted command-line audits in CI.
- [WAVE](https://wave.webaim.org/) for quick in-page visual audits.
- [Accessibility Insights](https://accessibilityinsights.io/) for guided
  manual assessments alongside automated checks.

### Reporting Issues

Reports of accessibility issues are welcome via the issue tracker. To help
us reproduce and prioritize, please include:

- Steps to reproduce, including the page or component involved.
- The assistive technology and browser/OS versions used, if applicable.
- The expected versus actual behavior.
- Any relevant user preferences (reduced motion, forced colors, custom
  text spacing, or zoom level) active at the time.
- A screenshot or short screen recording when the issue is visual or
  interaction-based, with any sensitive information redacted.

Issues tagged `a11y` are treated with the same priority as functional bugs.

## License

See the `LICENSE` file at the repository root for license terms.
