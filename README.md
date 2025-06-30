# JS Development MCP Server

A Model Context Protocol (MCP) server for better JS/TS development. It provides **project tooling discovery**. Increased agent context leads to less friction and struggle with project tooling. Less friction equals faster iteration.

<img src="https://github.com/Tymek/js-mcp/raw/master/js-mcp-demo.gif" alt="JS MCP Demo" style="max-width: 500px;">

Warning: Using this has a YOLO vibe coding factor of arbitrary 8/10 – No warranty if this breaks your project, computer, or your life, but it _probably_ won't. Don't leave your agents unsupervised. This server allows you to run npm scripts in VSCode copilot without manual terminal command approval every time, so be careful.

## Quick Start

```bash
npx js-mcp
```

For VSCode / Claude Desktop:
```json
{
  "mcpServers": {
    "js-mcp": {
      "command": "npx",
      "args": ["js-mcp"]
    }
  }
}
```

## Instructions for LLM Agents & AI Assistants

> ### 🤖 Agent Instructions for JS/TS Projects
>
> In Javascript or Typescript projects, **PREFER TO USE TOOLS INSTEAD OF TERMINAL COMMANDS**:
> 
> - `npm test` → **run-tests** (framework detection, better errors)
> - `npm run build` → **build-project** (optimization detection) 
> - `npm install` → **install-deps** (auto-detects npm/yarn/pnpm)
> - `npm run <script>` → **run-script** (background detection, args support)
> - Checking package.json → **list-scripts** or **project-status**
> 
> **Benefits**: No terminal approval prompts, enhanced error context, framework awareness, proper background task management.
> 
> **Workflow**: Start with `get-help` for guidance, use `project-status` for unknown projects, then use specific tools.

## Tools

1. **get-help** - Get intelligent recommendations for which tools to use
2. **run-tests** - Run project tests with framework detection and better errors
3. **build-project** - Build projects with optimization detection and framework awareness
4. **install-deps** - Install dependencies with auto-detected package manager (npm/yarn/pnpm)
5. **run-script** - Run npm scripts with background detection and argument support
6. **list-scripts** - List and categorize all available npm scripts
7. **project-status** - Check comprehensive project health and framework detection

### Key Features
- **Framework Detection**: Next.js, React, Vue.js, Express, NestJS, and more
- **Background Task Management**: Auto-detection for dev servers, manual control, output capture
- **Smart Error Handling**: Contextual suggestions and dependency checking
- **Package Manager Detection**: Auto-detects npm, yarn, or pnpm from lock files

### Background Task Auto-Detection

**Always Background:** Scripts containing `dev`, `start`, `serve`, `watch`  
**Never Background:** Scripts starting with `cleanup`, `clean`, `reset`, `install`, `build`, `compile`, `bundle`, `lint`, `format`, `test`, `deploy`, `publish`, `release`, `prepare`, `verify`, `check`, `validate`, `audit`, `update`, `upgrade`, `migration`, `migrate`, `seed`, `init`, `setup`, `config`

## Development

Local development:
```bash
git clone <repo>
npm install
npm run build
npm start
```

## License

GPL-3.0 License

## Contributing

Go ahead. Feel free to extend this project with additional tools as needed. I can't promise to review or merge PRs. This codebase is a gift, not a commitment.
