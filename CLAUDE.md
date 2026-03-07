# CLAUDE.md — Harvest Box Operations

## Project Overview

**Harvest Box Operations** is a React-based single-page application (SPA) for managing the end-to-end operations of Harvest Box, an Australian specialty food company. The app covers incoming stock from suppliers, product and batch management, production order creation, and customer order fulfilment.

The entire application lives in a **single JSX file** — `Downloads/harvestbox - order verson 4.jsx` — with all styling, state, and logic co-located. There is currently no build toolchain, no package.json, and no backend integration; it is a standalone prototype designed to run inside a React-capable environment (e.g. CodeSandbox, a pre-configured CDN React setup, or bundled externally).

---

## Repository Structure

```
Harvest-Box-Operations/
├── Downloads/
│   └── harvestbox - order verson 4.jsx   # Entire application (~1 562 lines)
└── CLAUDE.md                              # This file
```

---

## Technology Stack

| Concern | Choice |
|---|---|
| UI Framework | React (hooks-only, no class components) |
| Styling | Inline CSS objects (no external stylesheet, no CSS modules) |
| State Management | `useState` hooks — app-level and component-level |
| Icons | Inline SVG function components |
| Build / Bundler | None (prototype file) |
| Testing | None currently |
| Linting / Formatting | None currently |
| Backend / API | None currently (all state is ephemeral) |

---

## Architecture

### Design Pattern

The app follows a **lift-state-up** pattern. All core business data is owned by the root `App` component as `useState` collections. Data and mutator functions are passed down as props to tab components, which in turn pass them into form/modal sub-components.

### Component Hierarchy

```
App
├── Sidebar navigation (inline JSX)
├── Header (inline JSX)
├── IncomingStockTab
│   ├── IncomingStockForm   (modal)
│   └── ItemQtyBar, StockStatusBadge
├── ProductsTab
│   ├── ProductForm         (modal)
│   └── BatchForm           (modal)
├── ProductionTab
│   ├── ProductionForm      (modal)
│   └── PrintModal
├── OrdersTab
│   └── OrderForm           (modal)
├── SettingsTab
└── Shared components
    ├── Modal
    ├── Field
    ├── SaveCancel
    ├── ActionBtns
    ├── Toast
    └── StatusBadge
```

### State Shape (App root)

```js
tab            // string — active tab key
incomingStock  // array of purchase order objects
products       // array of product objects
production     // array of production order objects
recipes        // object — product formulations / settings
orders         // array of customer order objects
```

---

## Data Models

### Product
```js
{
  id: number,
  productId: string,      // e.g. "HB-001"
  description: string,
  batches: [{ batch: string, qty: number }]
}
```

### Incoming Stock (Purchase Order)
```js
{
  id: number,
  supplier: string,
  dateRaised: string,     // ISO date
  expectedDelivery: string,
  po: string,             // PO number
  reference: string,
  status: string,         // "Pending" | "Received"
  notes: string,
  items: [{
    id: number,
    code: string,         // e.g. "NUT-ALMOND-1KG"
    description: string,
    qty: number,
    cost: number,
    receivedQty: number,
    usedQty: number
  }]
}
```

### Production Order
```js
{
  id: number,
  productId: string,
  description: string,
  batch: string,
  qty: number,
  stockLines: [{ stockId: number, itemId: number, qty: number }]
}
```

### Customer Order
```js
{
  id: number,
  invoiceNumber: string,  // e.g. "INV-2026-001"
  customer: string,
  reference: string,
  date: string,           // order date
  dueDate: string,
  status: string,         // see status workflow below
  notes: string,
  items: [{
    id: number,
    productId: string,
    description: string,
    batch: string,
    qty: number
  }]
}
```

---

## Business Workflows

### Stock Flow
```
Supplier → Incoming Stock (PO) → Production Order → Product Batch → Customer Order
```

1. Supplier delivers raw materials → tracked in **Incoming Stock** tab.
2. Raw materials are allocated to a **Production** run, which creates a product batch.
3. Finished product batches appear in **Products** tab with quantities.
4. Customer **Orders** draw from product batches, reducing available stock.

### Customer Order Status Lifecycle
```
Open → Stock Allocated → Paper Work Attached → Collected
```

Overdue orders (past `dueDate`) are visually highlighted in red.

---

## Design System

All colours are defined in a `COLORS` constant at the top of the file:

```js
COLORS = {
  cream: "#FDF6EC",     warmWhite: "#FEFAF4",
  amber: "#D4830A",     amberLight: "#F0A830",   amberPale: "#FEF3DC",
  green: "#2D5016",     greenMid: "#4A7C2F",     greenLight: "#8AB46A",  greenPale: "#EEF5E8",
  brown: "#5C3D1E",     brownLight: "#8B6344",   brownPale: "#F5EDE3",
  charcoal: "#2C2416",  muted: "#9A8A74",        border: "#E8D9C4",
  red: "#C0392B",       redPale: "#FDECEA"
}
```

- Use these named colours rather than hard-coded hex values in any new styling.
- All styles are applied as inline JS objects (`style={{ ... }}`).
- The visual language is earthy / agricultural (greens, browns, ambers) to match the Harvest Box brand.

---

## Coding Conventions

### General
- Functional components only — no class components.
- `useState` for all state; no external state library.
- All new components should accept clearly named props with no default prop mutations.
- Avoid adding external dependencies without explicit agreement; the file is designed to be dependency-free.

### File Organisation
- Until a build system is introduced, all code lives in the single JSX file.
- Group new components near their closest related existing component.
- Keep the `COLORS` constant, shared components (Modal, Field, etc.), and icon components at the top of the file.

### Naming Conventions
| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `ProductForm` |
| Props / variables | camelCase | `invoiceNumber` |
| Product IDs | `HB-NNN` | `HB-004` |
| Batch codes | `BYYYY-MMX` | `B2026-03A` |
| PO numbers | Free text, supplier-prefixed | `NUTS-2026-001` |
| Invoice numbers | `INV-YYYY-NNN` | `INV-2026-003` |
| Stock item codes | `CATEGORY-NAME-SIZE` | `NUT-ALMOND-1KG` |

### Styling Rules
- Use `COLORS.<key>` for all colour references.
- Apply spacing in multiples of 4 px (4, 8, 12, 16, 24, 32…).
- Borders use `1px solid ${COLORS.border}` as the standard value.
- Border-radius: 6–8 px for cards/inputs, 4 px for badges.

---

## Key Shared Components

| Component | Purpose |
|---|---|
| `Modal` | Reusable dialog wrapper — accepts `title`, `onClose`, `children` |
| `Field` | Labelled form row — accepts `label`, `children` |
| `SaveCancel` | Standard Save / Cancel button pair |
| `ActionBtns` | Edit + Delete icon buttons for table rows |
| `Toast` | Temporary notification — auto-dismissed |
| `StatusBadge` | Date-aware coloured badge |

---

## Development Notes

### Running the Application
There is no `package.json` or build config. Options to run:
1. Paste the file content into a CodeSandbox/StackBlitz React template.
2. Add a minimal `index.html` + Babel/CDN React setup alongside the file.
3. Initialise a Vite/CRA project and import the component as `App`.

### Adding a Build System (recommended next step)
```bash
npm create vite@latest . -- --template react
# Move the JSX file to src/App.jsx and adjust the default export
```

### Adding Tests
Once a build system exists, Vitest + React Testing Library is recommended:
```bash
npm install -D vitest @testing-library/react @testing-library/user-event
```

### Linting / Formatting
ESLint + Prettier are recommended when a build system is added:
```bash
npm install -D eslint prettier eslint-plugin-react eslint-config-prettier
```

---

## What AI Assistants Should Know

1. **Single-file app** — all changes go into `Downloads/harvestbox - order verson 4.jsx` unless a build system has been introduced.
2. **No external deps** — do not import third-party libraries without explicit instruction.
3. **Inline styles only** — do not introduce CSS files, CSS modules, Tailwind, or styled-components.
4. **Colour palette** — always use `COLORS.<key>`; never hard-code hex values.
5. **Lift state up** — business data lives in `App`; pass it down as props, do not create new top-level state atoms inside tab components.
6. **No backend** — the app is currently purely client-side; do not add `fetch`/`axios` calls without instruction.
7. **Naming patterns** — follow the ID, batch, invoice, and stock code conventions in the table above to maintain data consistency.
8. **Status enums** — use exact string values for statuses (`"Pending"`, `"Received"`, `"Open"`, `"Stock Allocated"`, `"Paper Work Attached"`, `"Collected"`).
9. **File name has a typo** — `order verson 4.jsx` is intentional in the current state; do not rename without instruction.
10. **Australian locale** — dates should be formatted `dd/mm/yyyy` for display; store dates as ISO strings internally.
