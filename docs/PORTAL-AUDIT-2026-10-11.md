# SUO Portal Audit — 11 October 2026

## Executive status

**Overall:** Pre-launch functional, with the core portal structure stable enough for content/data QA and production-hardening.

This audit covered the main landing page, Applications catalogue, UODC, Knowledge Base, Mr. TPr SUO, navigation, application registry, internal links, basic accessibility hooks, responsive application navigation, cache/versioning and source-level performance risks.

## Central Applications Registry

A new single source of truth is now active:

- `data/applications.json`
- `js/app-registry.js`

Registry snapshot:

- 24 total registered records
- 22 active applications/platforms
- 15 active Dashboard Tematik
- 3 active StoryMaps
- 2 Coming Soon records
- Core platform records include 3D GeoPortal, SISMAPS, SMARTDesa and Spatial Analytics

The registry now drives:

1. Dashboard Tematik cards on the landing page
2. StoryMaps cards on the landing page
3. Applications flyout submenus
4. Applications catalogue cards
5. Application search synchronisation on the landing page
6. Application URLs used by Mr. TPr SUO

**Rule going forward:** add or edit an application in `data/applications.json` first. Do not manually maintain separate application lists in multiple pages.

## Audit findings — fixed

### 1. Duplicate application definitions
**Previous issue:** application names, URLs and categories were repeated in landing HTML, flyout navigation, Applications page, smart search and Mr. TPr SUO.

**Status:** FIXED for the main application registry surfaces.

### 2. Applications page dead navigation
The old Applications page linked to legacy/non-current pages such as `urban-data.html`, `intelligence.html` and `governance.html`.

**Status:** FIXED. Navigation now points back to current SUO sections/UODC/Mr. TPr SUO.

### 3. Async Applications catalogue filtering
The Applications filter script previously captured cards only once on DOMContentLoaded. Registry-rendered cards would therefore not be filterable.

**Status:** FIXED. Filtering re-runs after the registry emits `suo:applications-rendered`.

### 4. Applications flyout on mobile
Nested flyout categories could navigate before a user could inspect the submenu.

**Status:** FIXED. Mobile tap now expands/collapses the nested submenu first.

### 5. Static app search becoming stale
Landing Smart Search had a hard-coded application list.

**Status:** FIXED for application-level records. Registry records replace Dashboard/StoryMap/Platform search entries while GeoPortal layer shortcuts remain in the local search index.

### 6. Internal links and document structure
Source audit result:

- Broken internal `.html` links: **0**
- Broken fragment anchors on landing page: **0**
- Duplicate HTML IDs on landing page: **0**
- `target="_blank"` links missing `rel="noopener"`: **0**

### 7. GitHub Pages source availability
GitHub repository metadata was checked for the GitHub-hosted active applications used by SUO.

**16 / 16 checked repositories report GitHub Pages enabled**, public, not archived and not disabled.

This includes the SUO GeoPortal, Spatial Analytics and current GitHub-hosted thematic applications.

## Audit findings — retained for next hardening pass

### P1 — Applications page visual system is still legacy
`applications.html` still uses the older:
- `variables.css`
- `components.css`
- `inner.css`
- `applications.css`

Functionally it is now registry-driven, but visually it does not yet fully match the current SUO landing/UODC/Knowledge Base design system.

**Recommended next action:** reskin Applications page using the current SUO palette/navigation components without changing the registry renderer.

### P1 — iframe preview load
Landing Dashboard Tematik + StoryMaps can generate up to **18 live preview iframes** from the registry.

Native `loading="lazy"` is enabled, which reduces initial load, but this remains the largest front-end performance risk.

**Recommended next action:** keep real previews but use staged iframe activation (near-viewport) or a lightweight preview placeholder before loading the live frame.

### P1 — External service health monitoring
GitHub Pages repository status can be verified from GitHub, but SISMAPS/ArcGIS availability is external to this repository.

**Recommended next action:** add a lightweight system-status check/admin view later so external services can be flagged without manually opening each app.

### P2 — CSS technical debt
Current landing stylesheet audit:

- `css/home-v7.css`: ~108 KB
- `!important` declarations: ~658
- media-query blocks: ~56
- legacy `v7-suo-main-title` references remain: 16

These accumulated during iterative visual development and are the main reason small UI changes can unexpectedly conflict.

**Recommended next action:** after visual/content freeze, consolidate the stylesheet into one canonical rule set. Do not attempt a large CSS cleanup immediately before a stakeholder demo without regression testing.

### P2 — BM/EN consistency
The current landing registry supports bilingual title/description/tag values. UODC and Knowledge Base have bilingual/current styling support.

The standalone Applications catalogue shell remains largely English.

**Recommended next action:** bring the Applications shell into the same BM/EN system when it is reskinned.

### P2 — Smart Search architecture
Applications are now registry-driven, but GeoPortal layer shortcuts remain deliberately hard-coded in `home-v7.js`.

This is acceptable because they are search shortcuts rather than separate applications, but they should eventually move to a separate `data/search-index.json` or GeoPortal layer registry.

## Accessibility / interaction audit

Current positives:

- Skip-to-content link present
- Primary navigation has ARIA label
- mobile menu maintains `aria-expanded`
- Applications dropdown maintains `aria-expanded`
- Escape closes the Applications dropdown
- external links use `noopener`
- live preview iframes are removed from tab order
- nested mobile application submenu now supports tap expansion

Remaining recommendation:

- perform a final keyboard-only and screen-reader smoke test after CSS/design freeze

## Cache / version status

Landing asset version after this audit:

**V7.27.1**

Application Registry:

**v1.0.0**

Portal updated date:

**11 October 2026**

## Pre-launch conclusion

The portal is now structurally much safer to maintain because application additions no longer require manual synchronisation across multiple files.

For the next dashboard/application addition, update:

`data/applications.json`

and the landing cards, flyout menu, Applications catalogue, search and Mr. TPr application URLs will synchronise from the registry.

The next highest-value tasks are:

1. reskin `applications.html` to the current SUO visual system
2. reduce preview iframe cost
3. freeze visual structure and begin formal pre-launch QA
