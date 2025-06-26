# Project Structure

The MCP server has been refactored into smaller, manageable files for better maintainability:

## Core Files

- **`index.ts`** - Entry point that starts the server
- **`server.ts`** - Server configuration and startup logic
- **`types.ts`** - All TypeScript type definitions
- **`schemas.ts`** - Zod validation schemas
- **`utils.ts`** - Basic utility functions (executeCommand)
- **`project.ts`** - Project context and validation functions
- **`background.ts`** - Background task management

## Tools Directory

Each tool is now in its own file under `src/tools/`:

- **`tools/index.ts`** - Tool registration entry point
- **`tools/help.ts`** - Help and recommendations tool
- **`tools/test.ts`** - Test execution tool
- **`tools/build.ts`** - Build tool
- **`tools/install.ts`** - Dependency installation tool
- **`tools/script.ts`** - Script execution tool
- **`tools/status.ts`** - Project status and script listing tools
- **`tools/background.ts`** - Background task management tools

## Benefits

1. **Modularity** - Each concern is separated into its own file
2. **Maintainability** - Easier to find and modify specific functionality
3. **Testability** - Individual modules can be tested in isolation
4. **Readability** - Smaller files are easier to understand
5. **Reusability** - Utility functions and types can be imported as needed

## Import Structure

```
index.ts
├── server.ts
    ├── tools/index.ts
        ├── tools/help.ts
        ├── tools/test.ts
        ├── tools/build.ts
        ├── tools/install.ts
        ├── tools/script.ts
        ├── tools/status.ts
        └── tools/background.ts
    ├── background.ts
    └── types.ts
├── utils.ts
├── project.ts
├── schemas.ts
└── types.ts
```

Each file only imports what it needs, creating a clean dependency graph.
