# Test Configuration Examples

## Claude Desktop Configuration

Add this to your `claude_desktop_config.json` file:

### macOS/Linux
Located at: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows 
Located at: `%APPDATA%\Claude\claude_desktop_config.json`

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

## VS Code Settings

For VS Code integration, the `.vscode/mcp.json` file is already configured.

## Testing the Server

Once configured, you can test the MCP server with commands like:

- "Check the project status"
- "Run the tests"
- "Build the project"
- "Install dependencies"
- "List available scripts"
- "Run the lint script"

## Example Commands

### For SCIM Project Testing
- "Run tests for the SCIM implementation"
- "Build the SCIM project for production"
- "Check the project status and dependencies"
- "Install all dependencies for the project"

### For General Development
- "Show me all available npm scripts"
- "Run the development server"
- "Execute the linting script"
- "Install production dependencies only"

## Debugging

If the server doesn't work:

1. Check that the build directory exists: `/src/testmcp/build/`
2. Verify the index.js file is executable: `chmod +x build/index.js`
3. Test manually: `echo '{}' | node build/index.js`
4. Check Claude Desktop logs for errors

## Extending the Server

To add new tools, modify `src/index.ts` and add new `server.tool()` calls following the existing pattern.
