# CaseCast Frontend - Architecture Diagrams (Demo/Interview Revision)

This file is a quick visual revision sheet for:
- Request flow
- Component flow
- Layering flow
- Build/runtime flow

## 1) Request Flow (User -> Screen)

```mermaid
flowchart LR
    A[User opens site] --> B[index.html loaded]
    B --> C[src/main.jsx executes]
    C --> D[React createRoot mounts App]
    D --> E[src/App.jsx renders landing UI]
    E --> F[Video source /loader.mp4 requested]
    F --> G[Video can play event]
    G --> H[videoReady=true]
    H --> I[entry fade overlay hidden]
    I --> J[Interactive landing visible]
```

How to explain in interviews:
1. Browser gets HTML shell.
2. React bootstraps in main.jsx.
3. App.jsx renders full landing stack.
4. Video readiness triggers smooth reveal.

## 2) Component Flow (React Tree)

```mermaid
flowchart TD
    A[main.jsx] --> B[App component]
    B --> C[Landing Shell]
    C --> D[Background Video]
    C --> E[Entry Fade Layer]
    C --> F[Cursor Letter Cluster]
    C --> G[Navbar]
    C --> H[Hero Section]

    G --> G1[Brand Mark]
    G --> G2[Nav Links]
    G --> G3[Request Demo CTA]

    H --> H1[Hero Kicker]
    H --> H2[CASE CAST Title]
    H --> H3[Subtitle]
    H --> H4[Explore Link]
```

State + hooks used:
- videoReady (useState): controls fade reveal after video readiness
- cursor state (useState): tracks mouse x/y and active hover state
- clusterLetters (useMemo): precomputed animated letter positions/settings

## 3) Layering Flow (Z-Index Stack)

```mermaid
flowchart TB
    L0[Layer 0: bg-video]
    L1[Layer 2: entry-fade]
    L2[Layer 8: cursor-letter-cluster]
    L3[Layer 10: navbar]
    L4[Layer 3: hero content area]

    L0 --> L1 --> L2 --> L4 --> L3
```

Note:
- The visual order is controlled by absolute/fixed positioning + z-index in src/index.css.
- Cursor letters are pointer-events: none, so they never block user interaction.

## 4) Styling Flow (Where CSS Comes From)

```mermaid
flowchart LR
    A[src/main.jsx imports src/index.css] --> B[Tailwind directives in index.css]
    B --> C[Custom class-based styles in index.css]
    C --> D[Classes applied in App.jsx]
    D --> E[Final rendered visual output]
```

Tailwind pipeline files:
- tailwind.config.js (content scanning)
- postcss.config.js (Tailwind plugin hookup)
- src/index.css (@tailwind base/components/utilities)

Practical note:
- In the current landing page, most styling is custom CSS classes, not utility-only Tailwind classes.

## 5) Build and Runtime Flow

```mermaid
flowchart LR
    A[npm run dev] --> B[Vite dev server]
    B --> C[HMR + live reload during edits]

    D[npm run build] --> E[Vite production build]
    E --> F[Optimized assets in dist/]
    F --> G[npm run preview]
```

## 6) File Responsibility Map

```mermaid
flowchart TD
    A[index.html] --> A1[HTML shell + root mount node]
    B[src/main.jsx] --> B1[React bootstrap]
    C[src/App.jsx] --> C1[Feature behavior + page structure]
    D[src/index.css] --> D1[Global styles + animations + layers]
    E[public/loader.mp4] --> E1[Background media]
    F[vite.config.js] --> F1[Bundler config]
    G[tailwind.config.js] --> G1[Tailwind scan paths]
    H[postcss.config.js] --> H1[PostCSS + Tailwind plugin]
    I[eslint.config.js] --> I1[Lint quality rules]
```

## 7) 30-Second Demo Script

Use this if interviewer asks: "Walk me through architecture quickly."

1. Vite serves index.html and mounts React via main.jsx.
2. App.jsx is the landing orchestrator: video background, navbar, hero, and cursor letter interaction.
3. A videoReady state controls fade-in timing so first paint feels deliberate.
4. Cursor movement updates CSS-variable-driven letter cluster animation.
5. index.css owns all layers and animation rules; Tailwind is configured but current page is mostly custom CSS.
6. Build pipeline is standard Vite: dev for HMR, build for dist optimization.

## 8) Interview Deep-Dive Points

If asked "why this design":
- Separation of concerns:
  - structure/behavior in App.jsx
  - visuals/animation in index.css
- Performance-minded choices:
  - useMemo for cluster metadata
  - lightweight state model
  - pointer-events disabled on decorative layer
- Maintainability:
  - clear class names
  - predictable z-index architecture

## 9) Quick Revision Checklist

Before demos/interviews, revise:
- Entry point chain: index.html -> main.jsx -> App.jsx
- State logic: videoReady and cursor
- Layering order and why z-index values matter
- Tailwind presence vs actual custom CSS usage
- What lives in public versus src
