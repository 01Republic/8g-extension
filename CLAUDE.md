# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

8G Monorepo integrates the 8G Chrome Extension (MV3) and 8G Web Application into a unified development environment. This is a pnpm workspace project where the extension provides browser automation capabilities and the webapp offers a visual workflow builder interface.

## Development Commands

### Setup
```bash
pnpm install
```

### Development Mode
```bash
# All packages in parallel development mode
pnpm dev

# Individual package development
pnpm dev:extension    # Chrome Extension development
pnpm dev:webapp       # Web Application development (port 3000)
```

### Building
```bash
# Build all packages in correct order
pnpm build

# Individual package builds
pnpm build:shared     # Build shared types first (dependency)
pnpm build:extension  # Extension build + zip creation
pnpm build:webapp     # Webapp production build
```

### Testing and Quality
```bash
# Testing
pnpm test            # Run all tests across packages
pnpm test:run        # Run tests once (non-watch mode)

# Code Quality
pnpm lint            # ESLint across all packages
pnpm lint:fix        # Auto-fix ESLint issues
pnpm format          # Prettier formatting
pnpm format:check    # Check formatting without changes
pnpm typecheck       # TypeScript type checking

# Cleanup
pnpm clean           # Remove build artifacts
```

## Architecture Overview

### Monorepo Structure
```
8g-monorepo/
├── packages/
│   ├── extension/           # 8G Chrome Extension (scordi-extension)
│   └── webapp/              # 8G Web Application (8g-webapp)
├── shared/                  # Common types and utilities (8g-shared)
├── tools/                   # Build tools and scripts
├── apps/                    # Development servers (currently unused)
└── package.json            # Root workspace configuration
```

### Package Dependencies
- **8g-shared**: Core shared types and utilities, built first
- **scordi-extension**: Chrome Extension MV3 with browser automation SDK
- **8g-webapp**: React Router 7 web application that uses the extension SDK
- **Dependency flow**: shared → extension → webapp (webapp imports scordi-extension)

### Tech Stack
- **Package Manager**: pnpm with workspace support
- **TypeScript**: Project references for optimized builds
- **Build Tool**: Vite (for both extension and webapp)
- **Testing**: Vitest with jsdom environment
- **Linting**: ESLint + Prettier with shared configuration

## Key Architectural Patterns

### Workspace Configuration
- Uses TypeScript project references for incremental builds
- Shared devDependencies at root level for consistency
- Package-specific dependencies managed within each package
- Cross-package references use `workspace:*` protocol

### Extension-Webapp Communication
1. **Webapp** builds visual workflows using drag-and-drop interface
2. **Extension SDK** (EightGClient) receives workflow JSON via `collectWorkflow()`
3. **Extension** executes workflows in browser tabs with full automation capabilities
4. **Results** return to webapp for display and analysis

### Shared Type Safety
- `8g-shared` package exports common types (Workflow, Message, etc.)
- Both extension and webapp import from `8g-shared` for consistency
- Zod schemas ensure runtime type validation across packages

## Important Development Notes

### Build Order Dependencies
Always build shared package first when building individually:
```bash
pnpm build:shared && pnpm build:extension && pnpm build:webapp
```

### Extension Development
- Chrome Extension builds to `packages/extension/dist/`
- Load unpacked extension from dist/ folder at chrome://extensions/
- Extension must be connected for webapp workflow execution
- Extension also builds SDK bundle for npm distribution

### Webapp Development
- React Router 7 with config-based routing (not file-based)
- Requires MySQL database for workflow metadata storage
- Uses Express 5 server with React Router SSR
- WebSocket server runs on same port for real-time features

### Cross-Package Development
- Changes to `shared` require rebuilding dependent packages
- Extension SDK changes require webapp restart to see updates
- Use `pnpm dev` to start all packages with hot reload

### Database Setup (Webapp)
Create `.env` in `packages/webapp/`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=payplo_staging
NEXT_PUBLIC_CARD_SIGN_KEY=spurstodo
```

Manually create workflow table:
```sql
CREATE TABLE IF NOT EXISTS integration_app_workflow_metadata (
  id INT NOT NULL AUTO_INCREMENT,
  description VARCHAR(255),
  meta JSON NOT NULL,
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Workflow Development Patterns

### Adding New Block Types
1. Define block schema in `packages/extension/src/blocks/`
2. Add validation and handler functions in extension
3. Webapp automatically generates UI from Zod schema (no changes needed)

### Testing Workflows
1. Build workflow in webapp (`/workflow-builder`)
2. Extension must be installed and connected
3. Execute via "Run Workflow" button
4. Monitor execution in browser DevTools console

### Variable System
- Variables use `${vars.varName}` template syntax
- Extension handles variable resolution during execution
- Support for JSONPath expressions to reference previous step results

## Common Issues and Solutions

### Build Failures
- Ensure `8g-shared` builds successfully before other packages
- Clear `node_modules/.cache/` and `*.tsbuildinfo` files if needed
- Run `pnpm clean` followed by `pnpm install`

### Extension Connection Issues
- Reload extension at chrome://extensions/ after manifest changes
- Check extension service worker console for errors
- Verify extension has necessary permissions

### Database Connection Issues
- Ensure MySQL is running on configured port
- Verify database credentials in `.env`
- Check that database name exists

## Package-Specific Documentation

For detailed package-specific information, see:
- **Extension**: `packages/extension/CLAUDE.md` - Extension architecture, block system, workflow execution
- **Webapp**: `packages/webapp/CLAUDE.md` - React Router setup, UI components, database integration
- **Shared**: No specific documentation - see `src/index.ts` for exported types

## Reference Documents

The Korean README.md contains additional setup information and project overview. Each package may have additional documentation files for specific features or architectural decisions.