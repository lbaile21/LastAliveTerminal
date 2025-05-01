# Project

A lightweight utility focused on fast, predictable performance.

## Table of Contents

- [Getting Started](#getting-started)
- [Performance](#performance)
  - [Guidelines](#guidelines)
  - [Benchmarking](#benchmarking)
  - [Common Pitfalls](#common-pitfalls)
  - [Profiling Tools](#profiling-tools)
- [Accessibility](#accessibility)
  - [Principles](#principles)
  - [Contributor Checklist](#contributor-checklist)
  - [Testing](#testing)
    - [Manual Checks](#manual-checks)
    - [Automated Checks](#automated-checks)
  - [Tooling](#tooling)
  - [Conformance Target](#conformance-target)
  - [Reporting Issues](#reporting-issues)
- [Internationalization](#internationalization)
  - [Text and Translation](#text-and-translation)
  - [Formatting](#formatting)
  - [Bidirectional Text](#bidirectional-text)
  - [Locale Negotiation](#locale-negotiation)
  - [Character Encoding](#character-encoding)
- [Security](#security)
  - [Reporting Vulnerabilities](#reporting-vulnerabilities)
  - [Supported Versions](#supported-versions)
  - [Dependency Hygiene](#dependency-hygiene)
  - [Secrets and Credentials](#secrets-and-credentials)
  - [Build and Supply Chain](#build-and-supply-chain)
- [License](#license)

## Getting Started

See the documentation in the `docs/` directory for installation and usage details.

## Performance

Performance is a stated goal of this project, so contributions should keep
an eye on the cost side of any change.

### Guidelines

- **Measure before optimizing.** Use a benchmark or profiler to confirm a
  hotspot before restructuring code for speed; intuition is frequently
  wrong about where time is actually spent.
- **Watch allocation patterns.** Prefer reusing buffers and avoiding
  unnecessary intermediate collections in hot paths.
- **Prefer O(1) / O(log n) data structures** for lookups on the critical
  path; document the expected size and access pattern when it matters.
- **Mind the constant factors.** Big-O is a ceiling, not a promise; cache
  locality, branch prediction, and syscall overhead often dominate at the
  sizes this project actually sees.
- **Guard against regressions.** When fixing a performance bug, add a
  benchmark or assertion that would have caught it.

### Benchmarking

When submitting a performance-sensitive change, include before/after
numbers from a repeatable benchmark. A useful report typically contains:

- The hardware, OS, and runtime version used.
- The input size or workload shape, ideally representative of real usage.
- The build configuration (release/optimized, not debug) and whether
  CPU frequency scaling or turbo boost was pinned during the run.
- Wall-clock time and, where relevant, allocation counts or peak memory.
- Multiple runs (at least 5) with a measure of variance (e.g. standard
  deviation or min/median/max), not just a single best-case number.
- The commit SHA the numbers were taken at, so results stay reproducible
  as the surrounding code evolves.

Microbenchmarks are useful for isolating a change, but confirm the win
shows up in an end-to-end scenario before claiming a speedup.

### Common Pitfalls

A few recurring traps are worth flagging explicitly, since they tend to
produce misleading results even in otherwise careful benchmarks:

- **Dead-code elimination.** Optimizing compilers and JITs will happily
  delete work whose result is never observed; ensure benchmark outputs
  are consumed (printed, summed, or returned) so the measured code
  actually runs.
- **Cold vs. warm runs.** Discard the first few iterations to let caches,
  JIT tiers, and branch predictors stabilize before recording timings.
- **Noisy neighbors.** Close background applications, disable indexing
  and auto-update daemons, and avoid running on battery power when
  collecting numbers intended for comparison.
- **Single-input bias.** A win at one input size can be a regression at
  another; sweep across representative sizes rather than tuning to a
  single data point.
- **Confusing correlation with causation.** A speedup that appears
  alongside an unrelated change may be due to code alignment shifts
  rather than the change itself; re-run with the suspected change
  reverted to confirm.

### Profiling Tools

A benchmark tells you *whether* something got faster; a profiler tells
you *why*. Reach for one of these when a benchmark surprises you or when
you need to find a hotspot before optimizing:

- **Sampling profilers** (`perf`, Instruments, `py-spy`, `async-profiler`)
  for low-overhead, production-safe call-stack attribution. Good first
  choice when you do not yet know where time is going.
- **Tracing profilers** (Chrome tracing, `dtrace`, `bpftrace`) when you
  need ordered event timelines or want to correlate work across threads.
- **Allocation profilers** (heaptrack, `memray`, pprof's alloc profile)
  when GC pressure or peak memory is the suspected culprit rather than
  CPU time.
- **Flame graphs** to summarize sampled stacks at a glance; wide plateaus
  are usually more actionable than tall narrow spikes.

Whatever tool you pick, run it against a release build with debug symbols
retained — stripped binaries produce unreadable stacks, and debug builds
produce profiles that do not reflect shipped behavior.

## Accessibility

This project aims to be usable by everyone. Accessibility is treated as a
first-class concern rather than an afterthought; the guidelines below apply
to both code contributions and documentation changes.

### Principles

A few ideas inform the more specific guidance that follows:

- **Semantics over decoration.** The accessibility tree is the source of
  truth; visual styling should reinforce it, not replace it.
- **Progressive enhancement.** Core functionality should work without
  JavaScript, custom controls, or pointer input wherever practical.
- **User preferences are inputs.** Reduced motion, forced colors, text
  spacing overrides, and zoom level are signals to respect, not bugs to
  paper over.
- **Parity, not separate paths.** Avoid "accessible alternatives" that
  diverge from the main experience; fix the main experience instead.

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

Testing is split into manual and automated passes. Neither subsumes the
other: automated tools catch only a fraction of issues (commonly cited
estimates put it around 30–40%), while manual checks reveal problems that
static analysis cannot — confusing focus order, awkward screen reader
phrasing, or gestures with no keyboard equivalent.

#### Manual Checks

1. Keyboard-only navigation (no mouse or trackpad). Confirm that focus
   never becomes trapped and that the visible focus indicator is always
   discernible against the current background.
2. One screen reader — NVDA, JAWS, VoiceOver, TalkBack, or Orca.
3. Page zoom at 200% to confirm the layout reflows without loss of content
   or functionality, including any sticky headers or off-canvas menus.
4. Forced-colors / high-contrast mode to confirm essential UI remains
   visible when user color overrides are active.
5. Text spacing overrides (line height 1.5×, paragraph spacing 2×) to
   confirm content does not clip or overlap.
6. Pointer alternatives: verify any drag, swipe, or multi-point gesture
   has a single-pointer equivalent (WCAG 2.5.1).

#### Automated Checks

- Run axe or Lighthouse against changed pages and triage any new
  violations before requesting review.
- Where practical, add a Pa11y or axe-core assertion to CI for pages or
  components that have regressed in the past.
- Treat "needs review" findings as findings: investigate them rather than
  filtering them out of reports.

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

### Conformance Target

This project targets **WCAG 2.2 Level AA** as its baseline. Level A is the
floor below which we do not knowingly ship; Level AAA criteria are adopted
opportunistically when they do not conflict with other goals, but are not
gating for review. When a change cannot meet the AA baseline — for example
because it depends on an upstream component with known issues — open a
tracking issue documenting the gap, the user impact, and the planned
remediation, and link it from the pull request rather than silently
lowering the bar.

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
- The approximate commit or release version where the issue was first
  observed, if known.

Issues tagged `a11y` are treated with the same priority as functional bugs.

## Internationalization

This project is used in environments with a wide variety of languages,
scripts, and regional conventions. Internationalization (i18n) overlaps
with accessibility but has its own concerns worth calling out.

### Text and Translation

- **Externalize user-facing strings.** Keep translatable text out of code
  and templates; reference it through the project's message catalog so
  translators can work without touching source.
- **Provide context for translators.** A short comment describing where
  and how a string appears prevents ambiguous translations, especially
  for short labels and button text.
- **Avoid concatenation.** Build full sentences from parameterized
  templates (`"Deleted {count} items"`) rather than gluing fragments
  together, since word order varies across languages.
- **Plan for expansion.** Translated strings are often 30–50% longer than
  the English source; layouts should accommodate growth without
  truncation or overflow.
- **Use plural-aware APIs** (ICU MessageFormat, CLDR plural rules) rather
  than hand-rolled `if (n === 1)` branches, which fail for languages
  with more than two plural categories (Arabic, for example, has six).

### Formatting

- Format dates, times, numbers, and currencies through locale-aware APIs
  (`Intl.DateTimeFormat`, `Intl.NumberFormat`, or platform equivalents).
- Do not assume the Gregorian calendar, a 12-hour clock, comma decimal
  separators, or any particular week-start day; all of these vary by
  locale and sometimes by user preference within a locale.
- Sort and compare strings with a locale-aware collator (`Intl.Collator`
  or equivalent) rather than byte-wise comparison, which mishandles
  diacritics and case folding.

### Bidirectional Text

- Test with at least one right-to-left locale (Arabic or Hebrew) to
  surface mirroring issues in layout, icons, and directional affordances.
- Use logical CSS properties (`margin-inline-start`, `padding-inline-end`)
  rather than physical `left`/`right` ones where possible.
- Set `dir="auto"` on inputs and containers whose contents may switch
  direction at runtime.

### Locale Negotiation

- Honor the user's stated preference (account setting, then
  `Accept-Language`) before falling back to a geolocated guess; IP-based
  inference is a last resort and should always be overridable.
- Treat locale tags as BCP 47 strings: match `zh-Hant-HK` against
  `zh-Hant` before `zh`, and never compare them case-sensitively.
- Ship a sensible default (typically `en`) for strings that have not yet
  been translated, and log misses so coverage gaps surface in review.

### Character Encoding

- Use UTF-8 end to end — source files, message catalogs, database
  columns, HTTP responses, and filesystem paths. Mixed encodings are a
  frequent source of mojibake that only surfaces for non-ASCII users.
- Count user-perceived characters in grapheme clusters, not code units;
  emoji, combining marks, and many scripts span multiple code points and
  will be truncated mid-character by naïve `length` or substring calls.
- Normalize text (typically NFC) before comparison, hashing, or storage
  as an identifier, so visually identical strings compare equal.

## Security

Security issues are handled out-of-band from the public issue tracker so
that fixes can be prepared before details become widely known. The notes
below describe how to report a suspected vulnerability, which versions
receive fixes, and the expectations contributors should hold themselves
to when pulling in third-party code.

### Reporting Vulnerabilities

If you believe you have found a security-relevant defect, please do **not**
open a public issue. Instead, contact the maintainers through the private
advisory channel listed in `SECURITY.md` (or, failing that, email the
address in the repository metadata). A useful report typically includes:

- A description of the issue and the impact you believe it has.
- Steps to reproduce, ideally with a minimal proof-of-concept.
- The affected version(s) and platform.
- Any suggested mitigation, if you have one in mind.

We aim to acknowledge reports within a few business days and to keep
reporters informed as a fix is developed, tested, and released. Credit is
offered in the resulting advisory unless you prefer to remain anonymous.

### Supported Versions

Security fixes are backported to the current release line and the
immediately preceding one. Older releases may receive fixes on a
best-effort basis but are not guaranteed; consumers on unsupported lines
are encouraged to plan an upgrade rather than relying on patches.

### Dependency Hygiene

- Prefer well-maintained dependencies with a clear release cadence over
  abandoned ones, even when the abandoned option is technically simpler.
- Pin direct dependencies and review lockfile changes during code review;
  unexplained transitive updates deserve scrutiny.
- Subscribe the repository to automated advisory feeds (GitHub security
  advisories, OSV, or equivalent) and treat new findings as work, not
  noise.
- When removing a dependency, also remove any configuration, scripts, or
  CI steps that referenced it, so the attack surface actually shrinks.

### Secrets and Credentials

Leaked credentials are one of the most common root causes of incidents,
and they are almost always preventable with a little discipline up front:

- **Never commit secrets** — API keys, tokens, private keys, or database
  passwords — to the repository, even in tests, fixtures, or example
  configs. Use placeholders and document how to supply real values at
  runtime via environment variables or a secret manager.
- **Enable pre-commit scanning** (gitleaks, trufflehog, or equivalent) so
  accidental commits are caught before they are pushed.
- **Rotate on exposure, not on convenience.** If a secret reaches a
  public surface — even briefly — treat it as compromised and rotate it,
  rather than relying on a force-push to erase history.
- **Scope credentials narrowly.** Prefer short-lived, least-privilege
  tokens over long-lived ones with broad permissions, especially for CI.

### Build and Supply Chain

The code you ship is only as trustworthy as the pipeline that produced it.
A few practices reduce the risk of a compromised build silently reaching
users:

- **Reproducible builds where feasible.** Pin compiler and toolchain
  versions, and prefer build steps whose output depends only on declared
  inputs, so two independent rebuilds of the same commit agree.
- **Verify artifact integrity.** Publish checksums (and, for releases,
  signatures) alongside binaries, and document how downstream consumers
  can verify them before installation.
- **Treat CI as production.** Restrict who can modify workflow files,
  require review on changes to release pipelines, and avoid running
  untrusted pull-request code with access to release credentials.
- **Generate an SBOM.** Emit a software bill of materials (CycloneDX or
  SPDX) with each release so consumers can quickly assess exposure when
  a new advisory lands against a transitive dependency.

## License

See the `LICENSE` file at the repository root for license terms.
