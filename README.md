# Test MCP Server

A Model Context Protocol (MCP) server for testing SCIM applications and managing development tasks without requiring terminal approval.

## Features

This MCP server provides the following tools for project management and testing:

### Available Tools

1. **run-tests** - Run project tests using npm test or available test scripts
   - Auto-detects project root
   - Supports custom test scripts and patterns
   
2. **build-project** - Build the project using npm build or available build scripts
   - Supports production builds
   - Auto-detects build configuration

3. **install-deps** - Install project dependencies
   - Supports npm, yarn, and pnpm
   - Production-only installs available

4. **run-script** - Run any custom npm script from package.json
   - Supports additional arguments
   - Lists available scripts if not found

5. **list-scripts** - List all available npm scripts in the project
   - Shows script names and commands
   - Auto-detects project structure

6. **project-status** - Check comprehensive project status
   - Dependencies count
   - Installation status
   - Available scripts
   - Project metadata

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### With Claude Desktop

Add the following to your Claude Desktop configuration file (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "test-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/testmcp/build/index.js"]
    }
  }
}
```

### With VS Code

The project includes a `.vscode/mcp.json` configuration file for VS Code integration.

### Direct Usage

You can also run the server directly:

```bash
npm start
```

## Development

### Project Structure

```
testmcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript output
├── .vscode/
│   └── mcp.json         # VS Code MCP configuration
├── .github/
│   └── copilot-instructions.md
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Tool Examples

### Running Tests
- Run default tests: Uses the `run-tests` tool
- Run specific test pattern: Uses the `run-tests` tool with `testPattern` parameter
- Run custom test script: Uses the `run-tests` tool with `testScript` parameter

### Building Projects
- Standard build: Uses the `build-project` tool
- Production build: Uses the `build-project` tool with `production: true`

### Managing Dependencies
- Install all dependencies: Uses the `install-deps` tool
- Install production only: Uses the `install-deps` tool with `production: true`

## Requirements

- Node.js 16 or higher
- npm, yarn, or pnpm
- TypeScript (installed as dev dependency)

## License

ISC

## Contributing

This project is designed to work with SCIM testing scenarios and can be extended with additional tools as needed.
