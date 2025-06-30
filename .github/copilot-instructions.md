# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is an MCP (Model Context Protocol) server project for developing Javascript/Typescript applications. The server provides tools to run tests, build the project, and manage development tasks without requiring terminal approval.

You can find more info and examples at https://modelcontextprotocol.io/llms-full.txt

## Project Structure
- Built with TypeScript and the @modelcontextprotocol/sdk
- Provides testing tools for Next.js project
- Uses Zod for input validation
- Supports running tests, building, and project management commands

## Code Style Guidelines
- Use minimal comments - explain why, not what
- Keep existing comments intact
- Follow TypeScript best practices
- Use Zod for input validation where applicable

## Key Technologies
- **MCP SDK**: @modelcontextprotocol/sdk for server implementation
- **TypeScript**: Primary language with strict type checking
- **Zod**: Schema validation for inputs
- **Node.js**: Runtime environment
- **Testing**: Integration with test frameworks

## Development Commands
The MCP server provides tools for:
- Running tests (`npm test`, `npm run test:watch`)
- Building the project (`npm run build`)
- Development server management
- Project scaffolding and setup

## MCP Server Capabilities
This server exposes tools that can be used by MCP clients to:
- Execute development commands safely
- Run automated tests
- Build and deploy processes
- Project management tasks

When working with this codebase, focus on:
1. MCP tool implementations
2. TypeScript type safety
3. Zod schema definitions
4. Test coverage and quality
5. Clear and concise code
