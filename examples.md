# Enhanced Test MCP Server Examples

## Tool Discovery & Smart Assistance

The Test MCP Server now includes enhanced discovery capabilities that help agents understand and use tools more effectively.

## Claude Desktop Configuration

Add this to your `claude_desktop_config.json` file:

### macOS/Linux
Located at: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows 
Located at: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "js-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/testmcp/build/index.js"]
    }
  }
}
```

## Enhanced Discovery Features

### 🎯 Smart Help System
- "How do I run tests?" → `get-help` provides step-by-step workflow
- "I want to deploy this project" → Analyzes project and suggests deployment workflow
- "Check if my project is ready" → `project-status` provides comprehensive health check

### 🚀 Framework-Aware Intelligence
- Automatically detects Next.js, React, Vue.js, Express, NestJS
- Provides framework-specific recommendations
- Optimizes tool parameters for detected frameworks

### 🔍 Intelligent Error Messages
- Missing scripts: Suggests similar script names
- Dependency issues: Clear guidance on resolution
- Framework conflicts: Detects and suggests fixes

## Enhanced Command Examples

### Discovery & Help Commands
- "What should I do first with this project?" → `get-help` + `project-status`
- "How do I set up testing?" → `get-help` with goal: "set up testing"
- "I need to deploy to production" → `get-help` with goal: "deploy to production"
- "Check my project health" → `project-status` with detailed analysis

### Smart Testing Workflow
- "Run all tests" → `run-tests` with dependency checking
- "Test only the API endpoints" → `run-tests` with intelligent test pattern suggestions
- "Run tests for user authentication" → `run-tests` with pattern matching guidance

### Intelligent Building
- "Build for production deployment" → `build-project` with production optimizations
- "Compile TypeScript" → Auto-detects TypeScript and uses appropriate build script
- "Build Next.js app" → Framework-aware build with Next.js optimizations

### Dependency Management Intelligence
- "Install dependencies" → `install-deps` with auto-detected package manager
- "Fix missing packages" → Smart dependency analysis and installation recommendations
- "Prepare for production" → `install-deps` with production-only flag

### Script Discovery & Execution
- "What can I run?" → `list-scripts` with categorized script display
- "Start development server" → `run-script` with intelligent script name matching
- "Run linting" → `run-script` with fuzzy script name matching

## Common Intelligent Workflows

### New Project Setup Workflow
1. **Discovery**: "Check project status" → `project-status`
2. **Dependencies**: "Install dependencies" → `install-deps` (auto-detected package manager)
3. **Exploration**: "What scripts are available?" → `list-scripts`
4. **Development**: "Start development" → `run-script` with dev script detection

### Testing Workflow with Intelligence
1. **Health Check**: "Is project ready for testing?" → `project-status`
2. **Test Execution**: "Run all tests" → `run-tests` with framework optimization
3. **Specific Testing**: "Test user components" → `run-tests` with pattern suggestions
4. **Quality Check**: "Build after tests" → `build-project` with test integration

### Production Deployment Workflow
1. **Pre-deployment**: "Check deployment readiness" → `project-status`
2. **Testing**: "Run full test suite" → `run-tests`
3. **Building**: "Build for production" → `build-project` with production: true
4. **Deployment**: "Deploy to production" → `run-script` with deployment script detection

### Troubleshooting with Smart Assistance
1. **Problem Identification**: "What's wrong with my project?" → `project-status`
2. **Dependency Issues**: "Fix dependencies" → `install-deps` with smart recommendations
3. **Script Issues**: "Why won't my script run?" → `list-scripts` + intelligent suggestions
4. **Build Problems**: "Fix build errors" → `build-project` with enhanced error reporting

## Framework-Specific Examples

### Next.js Projects
- "Start Next.js development" → Detects framework, uses `run-script` with "dev"
- "Build Next.js for production" → Framework-aware `build-project` with optimizations
- "Test Next.js components" → `run-tests` optimized for Next.js testing patterns

### React Projects
- "Test React components" → `run-tests` with React-specific test patterns
- "Build React app" → `build-project` with React build optimizations
- "Start React development" → `run-script` with React dev server detection

### TypeScript Projects
- "Compile TypeScript" → Auto-detects TypeScript, uses appropriate build script
- "Type check project" → `run-script` with TypeScript checking commands
- "Build TypeScript project" → `build-project` with TypeScript compilation

### Express/Node.js Projects
- "Start Express server" → `run-script` with Express server script detection
- "Test API endpoints" → `run-tests` with API testing patterns
- "Build Node.js app" → `build-project` optimized for Node.js

## Advanced Discovery Features

### Contextual Recommendations
- Tools analyze your project structure and provide contextual suggestions
- Framework detection enables specialized workflows
- Lock file analysis suggests optimal package managers

### Intelligent Error Recovery
- Failed commands provide actionable next steps
- Missing dependencies trigger installation suggestions
- Script name mismatches provide fuzzy matching recommendations

### Workflow Optimization
- Tools chain together intelligently (e.g., dependency check before testing)
- Framework-specific optimizations applied automatically
- Production vs development context awareness

## Pro Tips for Enhanced Discovery

1. **Start with project-status**: Always begin with project health check
2. **Use get-help for guidance**: When unsure, ask for workflow recommendations
3. **Let tools auto-detect**: Most parameters are optional and intelligently detected
4. **Follow suggestions**: Tools provide helpful next steps when commands fail
5. **Leverage framework detection**: Tools optimize for your specific tech stack

## Debugging Enhanced Features

If enhanced discovery isn't working:

1. Check that the build directory exists: `/src/testmcp/build/`
2. Verify the enhanced index.js file: `ls -la build/index.js`
3. Test manually: `echo '{"tool": "project-status", "arguments": {}}' | node build/index.js`
4. Check Claude Desktop logs for tool discovery information
