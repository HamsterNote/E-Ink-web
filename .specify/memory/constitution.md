<!-- Sync Impact Report
Version change: Unspecified -> 1.0.0
Modified principles: Template placeholders -> Code Quality Baseline; Template placeholders ->
Testing Standards; Template placeholders -> UX Consistency for E-Ink; Template placeholders ->
Performance Discipline; Template placeholders -> Compatibility and Legacy Standards
Added sections: Compatibility and Platform Constraints; Workflow and Quality Gates
Removed sections: None
Templates requiring updates: ✅ updated .specify/templates/plan-template.md; ✅
updated .specify/templates/tasks-template.md; ✅ updated
.specify/templates/spec-template.md; ⚠ pending .specify/templates/commands/*.md
(directory missing)
Follow-up TODOs: None
-->

# E-Ink Web Constitution

## Core Principles

### Code Quality Baseline
All changes MUST preserve strict ES5, HTML 4.01 Transitional, and CSS 2.1
compatibility. New code MUST avoid type suppression (`any`, `@ts-ignore`,
`@ts-expect-error`) and follow existing naming, indentation, and structure.
Bugfixes MUST be minimal and avoid unrelated refactors.

### Testing Standards
Behavior changes MUST be accompanied by tests or verification scripts that prove
the change. If tests are impractical, a written justification and alternative
verification plan MUST be included in the plan and PR description. Tests MUST
fail before the fix and pass after the fix, and type-check/build outputs MUST be
clean.

### UX Consistency for E-Ink
User interactions MUST remain consistent with established patterns: large tap
targets, high-contrast black-and-white presentation, and predictable navigation.
Any UI change MUST document its alignment with existing components and avoid new
interaction paradigms unless explicitly approved.

### Performance Discipline
Changes MUST minimize DOM mutations and reflows, batch updates where possible,
and respect operation counters used to avoid ghosting. Performance budgets MUST
be documented in plans for features affecting rendering or scrolling, with
measurements recorded when feasible.

### Compatibility and Legacy Standards
The project MUST remain compatible with older WebKit/IE-class browsers and the
current jQuery 1.12.4 API surface. Do not introduce modern DOM APIs, HTML5 tags,
CSS3 properties, or ES6+ syntax even if toolchains can transpile them.

## Compatibility and Platform Constraints

- HTML must remain 4.01 Transitional; avoid HTML5 tags and attributes.
- CSS must remain 2.1; avoid media queries, animations, and modern layout
properties.
- JavaScript must remain ES5; use `var` and function prototypes.
- Maintain high contrast and large hit targets suitable for e-ink devices.
- Avoid frequent repaint triggers; schedule full refreshes only when required.

## Workflow and Quality Gates

- Every change MUST include a constitution check in the plan or PR description.
- Type-check (`npm run type-check`) and build (`npm run build`) MUST pass before
merge.
- UX changes require a consistency review against existing components.
- Performance-sensitive changes require a before/after note or measurement.
- Compatibility review is required for any change touching HTML, CSS, or DOM APIs.

## Governance

- This constitution supersedes local conventions; deviations require explicit
written waiver in the plan and PR description.
- Amendments require a documented proposal, rationale, and approval from code
owners.
- Versioning follows semantic versioning: MAJOR for removals or incompatible
changes, MINOR for new principles/sections, PATCH for clarifications.
- Compliance review is mandatory on every PR with evidence of testing, UX, and
performance checks as applicable.

**Version**: 1.0.0 | **Ratified**: 2025-01-19 | **Last Amended**: 2026-01-19
