# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

8G Extension is a Chrome extension (MV3) and browser SDK for reliable web data collection and automation. The project consists of:

- **Chrome Extension**: Background service worker, content scripts, and popup UI for orchestrating browser automation
- **Browser SDK**: JavaScript client library that web pages use to communicate with the extension via `window.postMessage`

All block execution happens through **workflows only** - even single blocks must be wrapped in a workflow structure.

## Development Commands

### Setup

```bash
npm install
```

### Development

```bash
npm run dev                 # Start Vite dev server for extension development
# Load unpacked extension from dist/ folder at chrome://extensions/
```

### Building

```bash
npm run build               # Build SDK bundle (ES module + TypeScript types)
npm run build:extension     # Build extension and create zip in release/
```

### Testing

```bash
npm test                    # Run Vitest in watch mode
npm run test:run            # Run tests once
npm run test:ui             # Run Vitest with UI
```

### Code Quality

```bash
npm run lint                # Run ESLint
npm run lint:fix            # Auto-fix ESLint issues
npm run format              # Format code with Prettier
npm run format:check        # Check formatting without modifying
```

## Architecture

### Communication Flow

```
Webpage (SDK: EightGClient)
  ↓ window.postMessage('8G_*')
Content Script (MessageKernel + ExternalMessageHandler)
  ↓ chrome.runtime.sendMessage
Background (BackgroundManager)
  ↓ executes workflow via WorkflowRunner
  ↓ sends ExecuteBlockMessage per step
Content Script (BlockHandler)
  ↓ executes block (validate* → handler*)
  ↑ returns BlockResult
Background (aggregates results)
  ↑ sends response back
Content Script (ExternalMessageHandler)
  ↑ window.postMessage('8G_COLLECT_RESPONSE')
Webpage (SDK resolves Promise)
```

### Key Components

**Background ([src/background/](src/background/))**

- [BackgroundManager.ts](src/background/chrome/BackgroundManager.ts) - Routes messages to appropriate services
- [TabManager.ts](src/background/chrome/TabManager.ts) - Manages tab lifecycle and sends block execution commands to content scripts
- [WorkflowService.ts](src/background/service/WorkflowService.ts) - Creates tabs and initiates workflow execution
- [CdpService.ts](src/background/service/CdpService.ts) - Chrome DevTools Protocol operations (click, keypress)
- [ApiService.ts](src/background/service/ApiService.ts) - Handles fetch-api block requests (bypasses CORS)
- [AiParsingService.ts](src/background/service/AiParsingService.ts) - OpenAI integration for ai-parse-data blocks

**Workflow ([src/workflow/](src/workflow/))**

- [WorkflowRunner.ts](src/workflow/WorkflowRunner.ts) - Core workflow execution engine: evaluates conditions, handles branching/retry/timeout, manages step execution
- [context/](src/workflow/context/) - Execution context management with organized sub-contexts:
  - [execution-context/](src/workflow/context/execution-context/) - Overall execution state
  - [var-context/](src/workflow/context/var-context/) - Variable management
  - [step-context/](src/workflow/context/step-context/) - Step results tracking
  - [loop-context/](src/workflow/context/loop-context/) - forEach/loop iteration state
- [step-executor/](src/workflow/step-executor/) - Step execution logic, condition evaluation, data binding, repeat handling

**Content Scripts ([src/content/](src/content/))**

- [main.tsx](src/content/main.tsx) - Entry point, initializes MessageKernel and handlers
- [kernel/MessageKernel.ts](src/content/kernel/MessageKernel.ts) - Core message routing, block execution with lock management
- [handler/ExternalMessageHandler.ts](src/content/handler/ExternalMessageHandler.ts) - Bridges webpage ↔ content script via window.postMessage
- [handler/InternalMessageHandler.ts](src/content/handler/InternalMessageHandler.ts) - Bridges background ↔ content script via chrome.runtime
- [elements/](src/content/elements/) - CSS/XPath selector builders, element finders (supports iframe, shadow DOM)
- [components/ConfirmationUI.tsx](src/content/components/ConfirmationUI.tsx) - User confirmation floating UI for wait-for-condition block
- [utils/synchronizedLock.ts](src/content/utils/synchronizedLock.ts) - Lock queue management for synchronized block execution

**Blocks ([src/blocks/](src/blocks/))**

- [index.ts](src/blocks/index.ts) - `BlockHandler.executeBlock()` entry point, routes to validate*/handler* functions
- Each block has: TypeSchema (Zod schema), validate* function, handler* function
- Block types: get-text, attribute-value, get-element-data, get/set/clear-value-form, element-exists, event-click, keypress, scroll, wait, save-assets, fetch-api, ai-parse-data, transform-data, export-data, network-catch, navigate, wait-for-condition

**SDK ([src/sdk/](src/sdk/))**

- [index.ts](src/sdk/index.ts) - Main export entry point
- [EightGClient.ts](src/sdk/EightGClient.ts) - Public API:
  - Core: `checkExtension()`, `collectWorkflow()`
  - Workspace: `getWorkspaces()`, `getWorkspacePlanAndCycle()`, `getWorkspaceBillingHistories()`, `getWorkspaceMembers()`
- [types.ts](src/sdk/types.ts) - Workflow, Step, and configuration types
- [errors.ts](src/sdk/errors.ts) - EightGError class

**Types ([src/types/](src/types/))**

- [external-messages.ts](src/types/external-messages.ts) - Messages between webpage and content script
- [internal-messages.ts](src/types/internal-messages.ts) - Messages between content script and background

### Build Configuration

- [manifest.config.ts](manifest.config.ts) - MV3 manifest definition (permissions, content_scripts, background)
- [vite.config.ts](vite.config.ts) - Extension build config (uses @crxjs/vite-plugin + zip plugin)
- [vite.sdk.config.ts](vite.sdk.config.ts) - SDK build config (ES module, externalizes react/react-dom)
- [vitest.config.ts](vitest.config.ts) - Test configuration (jsdom environment)

## Workflow Execution Model

Workflows are JSON structures that define sequences of block executions with branching, conditions, retry logic, and timeouts.

### Basic Structure

```typescript
{
  version: '1.0',
  start: 'stepId',           // Starting step
  steps: [
    {
      id: 'stepId',           // Unique identifier
      block?: { ... },        // Block to execute
      when?: { ... },         // Condition to run step
      repeat?: { ... },       // Loop configuration (forEach or count)
      switch?: [...],         // Conditional branching
      next?: 'nextStepId',    // Unconditional next step
      onSuccess?: 'stepId',   // Next on success
      onFailure?: 'stepId',   // Next on failure
      retry?: { attempts, delayMs, backoffFactor },
      timeoutMs?: number,
      delayAfterMs?: number,  // Wait after step completes
      setVars?: { ... }       // Set context variables
    }
  ]
}
```

### Execution Context

During workflow execution, `WorkflowRunner` maintains a context object:

```typescript
{
  steps: {
    [stepId]: { result, success, skipped }
  },
  vars: { ... },           // User-defined variables
  forEach?: {              // Available during forEach loops
    item: any,             // Current array item
    index: number,         // Current index (0-based)
    total: number          // Total array length
  },
  loop?: {                 // Available during count loops
    index: number,         // Current iteration (0-based)
    count: number          // Total iterations
  }
}
```

### Data Binding

Values can reference context data using JSONPath-like syntax:

- **valueFrom**: `{ valueFrom: "steps.stepId.result.data" }` - Direct value reference
- **template**: `{ template: "User ${vars.userId}" }` - String interpolation
- References are resolved via `WorkflowRunner.getByPath()` and `resolveBindings()`

### Conditions (when/switch)

Supports both JSON conditions (recommended) and expression strings:

**JSON Conditions:**

- `{ exists: "steps.stepId.result" }`
- `{ equals: { left: "steps.stepId.result.data", right: "OK" } }`
- `{ notEquals: { left: "...", right: "..." } }`
- `{ contains: { value: "...", search: "..." } }`
- `{ regex: { value: "...", pattern: "...", flags?: "..." } }`
- `{ and: [ {...}, {...} ] }`, `{ or: [...] }`, `{ not: {...} }`

**Expression Strings:**

- `{ expr: "steps.prev.result.data === 'OK'" }` - Uses Function() constructor with vars, steps, forEach, loop as parameters

### Repeat Execution

Steps can be repeated using `repeat` configuration:

**forEach (array iteration):**

```typescript
{
  repeat: {
    forEach: 'steps.getItems.result.data',  // Array path
    continueOnError: true,                     // Keep going on errors
    delayBetween: 200                          // Wait between iterations (ms)
  }
}
```

**count (fixed iterations):**

```typescript
{
  repeat: {
    count: 10,                 // Number or binding path
    delayBetween: 500
  }
}
```

Results from repeated steps are collected in arrays.

## Block System

### Block Structure

All blocks (except keypress, wait, fetch-api, ai-parse-data, transform-data, export-data, network-catch, navigate, wait-for-condition) have:

```typescript
{
  name: 'block-name',
  selector: string,          // CSS selector or XPath
  findBy: 'cssSelector' | 'xpath',
  option: {
    waitForSelector?: boolean,
    waitSelectorTimeout?: number,
    multiple?: boolean       // Return array of results
  }
}
```

### Block Categories

**Data Extraction:**

- `get-text` - Extract text with regex/prefix/suffix support
- `attribute-value` - Get element attribute values
- `get-element-data` - Complex extraction (text/attributes/selectors/xpath)

**Form Handling:**

- `get-value-form` - Read form values (input, select, checkbox)
- `set-value-form` - Set form values
- `clear-value-form` - Clear form inputs

**Interaction:**

- `event-click` - Click elements (supports text filtering, multiple elements)
- `keypress` - Simulate keyboard input (supports modifiers: ctrl, shift, alt, meta)
- `scroll` - Scroll page (toElement, toBottom, byDistance, untilLoaded)

**Utilities:**

- `element-exists` - Check if element exists (returns boolean)
- `wait` - Delay execution (ms)
- `wait-for-condition` - Wait for conditions (URL pattern, element, cookie, storage, user confirmation) with auto/manual/combined modes
- `navigate` - Navigate to specific URL with optional page load waiting
- `save-assets` - Collect image/media URLs

**API/AI/Data:**

- `fetch-api` - External API calls (no CORS restrictions, runs in background)
- `ai-parse-data` - Parse unstructured data using OpenAI with schema definition
- `transform-data` - Transform/reshape data with JSONPath and JavaScript expressions
- `export-data` - Export data to various formats (JSON, CSV, etc.)
- `network-catch` - Intercept and capture network requests/responses

### Block Execution Pipeline

1. `BlockHandler.executeBlock(block)` - Entry point in content script
2. Route by `block.name` to appropriate validate\* function
3. Validate with Zod schema - throw if invalid
4. Call corresponding handler\* function
5. Return `BlockResult<T>` with `{ data, hasError?, message? }`

### Element Selection

- [src/content/elements/finders/](src/content/elements/finders/) handles selector resolution
- Supports CSS selectors, XPath, iframe traversal, shadow DOM penetration
- `waitForSelector` option polls until element appears (up to `waitSelectorTimeout` ms)

## Testing

Tests use Vitest with jsdom environment. Test files are co-located with source files (\*.test.ts).

### Running Tests

- Tests automatically run in watch mode during development
- Use `npm run test:run` for CI/one-time runs
- Block tests extensively cover validation and handler logic

### Test Setup

- [src/test/setup.ts](src/test/setup.ts) - Global test configuration
- Import `@testing-library/jest-dom` for DOM matchers

## Important Development Notes

### Extension Development

- After changing manifest or background code, reload extension at chrome://extensions/
- Content script changes are hot-reloaded by Vite during dev
- Check console in both page context and extension context (background devtools)

### SDK Development

- SDK build outputs to `dist/sdk/` with separate entry point from extension
- React is externalized - SDK does not bundle React
- TypeScript definitions generated via `tsc -p tsconfig.sdk.json`

### Message Communication

- External messages (webpage ↔ content) use `window.postMessage` with '8G\_' prefix
- Internal messages use `chrome.runtime.sendMessage` / `onMessage`
- Each workflow execution has unique `requestId` for response matching
- Timeouts: checkExtension (5s), collectWorkflow (60s default)

### Workflow Development

- All block execution must go through workflows - no standalone block execution
- Always provide `option: {}` for blocks even if empty (required by validation)
- Exception: keypress, wait, fetch-api, ai-parse-data, transform-data, export-data, network-catch, navigate, wait-for-condition don't need selector/findBy/option
- Use `delayAfterMs` generously for animations and async UI updates
- Set `waitForSelector: true` for dynamic content
- Branch execution priority: switch → onSuccess/onFailure → next → end

### Error Handling

- Blocks return `{ hasError: true, message: '...' }` on failure
- Workflow steps track success/failure per step
- Use `retry` with backoff for flaky operations
- Use `continueOnError` in repeat blocks to skip failed iterations

## Code Organization

### Directory Structure

```
src/
├── background/          # Extension background service worker
│   ├── chrome/         # Tab and message management
│   │   ├── BackgroundManager.ts
│   │   └── TabManager.ts
│   ├── service/        # Service layer (CDP, API, AI, Workflow)
│   │   ├── CdpService.ts
│   │   ├── ApiService.ts
│   │   ├── AiParsingService.ts
│   │   └── WorkflowService.ts
│   └── index.ts        # Background entry point
├── workflow/           # Workflow execution engine (refactored from background)
│   ├── context/        # Context management (vars, steps, forEach/loop)
│   ├── step-executor/  # Step execution, conditions, bindings, repeat
│   └── WorkflowRunner.ts
├── content/            # Content script
│   ├── kernel/         # Message kernel
│   │   └── MessageKernel.ts
│   ├── handler/        # Message handlers (internal/external)
│   │   ├── ExternalMessageHandler.ts
│   │   └── InternalMessageHandler.ts
│   ├── elements/       # Element selectors and finders
│   │   └── finders/    # CSS/XPath, iframe, shadow DOM support
│   └── main.tsx        # Content script entry
├── blocks/             # Block implementations
│   ├── GetTextBlock.ts
│   ├── EventClickBlock.ts
│   ├── KeypressBlock.ts
│   ├── ScrollBlock.ts
│   ├── WaitBlock.ts
│   ├── NavigateBlock.ts
│   ├── WaitForConditionBlock.ts
│   ├── FetchApiBlock.ts
│   ├── AiParseDataBlock.ts
│   ├── TransformDataBlock.ts
│   ├── ExportDataBlock.ts
│   ├── NetworkCatchBlock.ts
│   └── index.ts        # BlockHandler entry point
├── sdk/                # Browser SDK
│   ├── EightGClient.ts # Main client API
│   ├── types.ts        # Public types
│   ├── errors.ts       # Error classes
│   └── index.ts        # SDK entry point
└── types/              # Type definitions
    ├── external-messages.ts  # Webpage ↔ content script
    └── internal-messages.ts  # Content ↔ background
```

## Reference Documentation

For detailed information, see:

- [WORKFLOW_EXECUTION_ARCHITECTURE.md](WORKFLOW_EXECUTION_ARCHITECTURE.md) - Complete workflow guide with examples
- [BLOCK_EXECUTION_ARCHITECTURE.md](BLOCK_EXECUTION_ARCHITECTURE.md) - Internal architecture details
- [EXPORT_DATA_BLOCK_EXAMPLES.md](EXPORT_DATA_BLOCK_EXAMPLES.md) - Export-data block usage examples
- [README.md](README.md) - Project overview, setup, and examples (Korean)
- [CHANGELOG.md](CHANGELOG.md) - Version history and release notes
