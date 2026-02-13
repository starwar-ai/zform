# ZForm Development Guide

## Build & Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check + production build
npm run build

# Run ESLint (linting)
npm run lint

# Preview production build
npm run preview
```

**Note**: This project does not currently have a test framework configured. If adding tests:
- Use Vitest as the test runner (matches Vite ecosystem)
- Store tests alongside source files with `.test.ts` or `.test.tsx` extension

## Project Overview

ZForm is a Schema-driven enterprise document management frontend framework built with:
- **React** + TypeScript + Vite
- **TanStack Table** - Detail tables
- **Zustand** + Immer - State management
- **shadcn/ui** + Tailwind CSS v4 + Radix UI - UI components

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode** is enabled in `tsconfig.app.json`
- Use `verbatimModuleSyntax` - import with `import type` for types only
- Avoid `any` - use `unknown` when type is truly unknown

### Imports & Path Aliases
- Use `@/` alias for imports: `import { something } from "@/components/..."`
- Order imports: external libs → internal modules → relative paths
- Use `import type` for type-only imports

### Naming Conventions
- **Files**: kebab-case (e.g., `push-down.ts`, `detail-table.tsx`)
- **Components**: PascalCase (e.g., `FieldRenderer`, `MasterForm`)
- **Functions/variables**: camelCase
- **Types/Interfaces**: PascalCase with `Type`/`Interface` suffix avoided
- **Constants**: UPPER_SNAKE_CASE for config objects, camelCase for regular constants
- **Field paths**: Use dot notation - `"master.fieldId"` or `"detail.tableId.fieldId"`

### Code Structure
```
src/
├── core/           # Pure logic, no React dependencies
│   ├── types.ts    # All type definitions
│   ├── registry.ts # Global document registry
│   ├── push-down.ts
│   ├── traceability.ts
│   └── impact.ts
├── stores/         # Zustand stores
├── hooks/          # React hooks
├── components/    # React components
│   └── ui/        # shadcn/ui base components
└── examples/      # Sample schemas
```

### UI Components (shadcn/ui)
- Base components in `@/components/ui/`
- Use `cva` (class-variance-authority) for component variants
- Use `cn()` utility for conditional class merging

### Tailwind CSS v4
- Theme defined in `src/index.css` using `@theme` block
- Use `--color-*` CSS variables (e.g., `bg-primary`, `text-foreground`)
- Custom utilities in `@layer utilities`

### Error Handling
- Use meaningful error messages: `throw new Error(\`Target schema "\${typeId}" not found in registry.\`)`
- Validate inputs at public API boundaries
- Core engine functions should throw on invalid state, not return error objects

### Component Patterns
- Use function components with explicit prop typing
- Extract complex logic to custom hooks in `src/hooks/`
- Keep UI components focused on rendering
- Use early returns for conditionals

### State Management
- Use Zustand + Immer for global state
- Mutations written inside Immer's `set` callback
- Prefer local state for component-specific state

### Comments & Documentation
- **Chinese** for UI-facing text and comments
- **English** for code identifiers (variables, functions, etc.)
- Document public APIs with JSDoc when not self-explanatory

## Common Development Patterns

### Adding a New Document Type
1. Define `DocumentSchema` in `src/examples/schemas.ts` (or new file)
2. Define `PushDownRule` for upstream relationships
3. Define `ChangeRule` for impact assessment
4. Register via `registry.registerSchema()`, `registerPushDownRule()`, `registerChangeRule()`

### Core Engine Functions
- Located in `src/core/` - pure functions, no React
- Testable without rendering components
- Throw errors on invalid input (fail fast)

## Architecture Notes

### Document Data Structure
- `masterData: Record<string, unknown>` - Main document fields
- `detailTables: DetailTableData[]` - Detail table rows
- `sourceRef?: SourceRef` - Upstream trace reference

### Key Type Definitions
All in `src/core/types.ts`:
- `DocumentSchema` - Document type definition
- `DocumentData` - Runtime document instance
- `PushDownRule` - Push-down (上游→下游) rules
- `ChangeRule` - Change impact assessment rules
