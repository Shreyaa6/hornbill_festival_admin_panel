# Hornbill Festival Admin Portal

Enterprise-ready React & TypeScript administrative dashboard for the annual **Hornbill Festival** held at Kisama Heritage Village, Nagaland.

---

## 📁 Project Architecture & Folder Structure

```
hornbill_festival_admin/
├── public/                     # Static assets (favicons, manifest, public logos)
├── src/
│   ├── assets/                 # SVGs, images, static graphic resources
│   │   ├── icons/
│   │   └── images/
│   ├── components/             # Reusable UI & presentation layer
│   │   ├── common/             # Generic atomic UI components (Button, Card, Badge, DataTable)
│   │   ├── feedback/           # Alerts, Empty States, Spinners, Toast notifications
│   │   └── layout/             # High-level layouts (AdminLayout, Sidebar, Header, Footer)
│   ├── config/                 # Application settings, navigation items, constants
│   ├── context/                # React Context providers (AuthContext, ThemeContext)
│   ├── features/               # Domain-driven feature modules (events, stalls, tribes)
│   ├── hooks/                  # Global custom reusable hooks (useDebounce, useLocalStorage)
│   ├── pages/                  # Page-level components corresponding to route endpoints
│   │   ├── Dashboard/
│   │   ├── Events/
│   │   ├── Tribes/
│   │   ├── Stalls/
│   │   ├── Landmarks/
│   │   ├── Users/
│   │   ├── Settings/
│   │   └── NotFound/
│   ├── routes/                 # Routing configuration (AppRoutes, ProtectedRoute)
│   ├── services/               # API clients, HTTP wrappers, Firebase services
│   ├── styles/                 # Global styles, variables, typography, design tokens
│   ├── types/                  # TypeScript interfaces, domain entities, API payloads
│   ├── utils/                  # Pure utility functions (formatting, date calculations, validation)
│   ├── App.tsx                 # Root application wrapper with context providers & router
│   ├── main.tsx                # React DOM entry point
│   └── vite-env.d.ts           # Vite TypeScript declarations
├── .env.example                # Sample environment variables
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # Root TypeScript configuration
├── tsconfig.app.json           # Application TypeScript configuration with `@/*` aliases
└── vite.config.ts              # Vite configuration with path aliases
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🧭 Key Architectural Principles

- **Path Aliasing**: Use `@/...` to import cleanly from `src/` (e.g. `import { Button } from '@/components/common'`).
- **Domain Feature Separation**: High-level domain logic belongs in `src/features/<feature_name>/`.
- **Reusable Primitives**: UI components in `src/components/common` remain decoupled from business logic.
- **Strong Typing**: All domain entities (Events, Tribes, Stalls, Landmarks, Users) are strongly typed in `src/types/`.
# hornbill_festival_admin_panel
