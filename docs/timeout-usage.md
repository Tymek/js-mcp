# Timeout Configuration Usage Examples

This document provides practical examples of using the timeout feature in the JS Development MCP Server.

## Tool-Specific Timeout Examples

### run-tests Tool
```javascript
// Default timeout (30s for unit tests, 90s for e2e tests)
await callTool("run-tests", {
  testScript: "test"
});

// Custom timeout for long-running integration tests
await callTool("run-tests", {
  testScript: "test:integration", 
  timeout: 120000 // 2 minutes
});

// Extended timeout for comprehensive e2e test suite
await callTool("run-tests", {
  testScript: "test:e2e",
  timeout: 300000 // 5 minutes
});
```

### build-project Tool
```javascript
// Default timeout (30s)
await callTool("build-project", {
  production: true
});

// Extended timeout for large builds
await callTool("build-project", {
  production: true,
  timeout: 180000 // 3 minutes
});
```

### run-script Tool
```javascript
// Default timeout (30s for most scripts, 60s for e2e/test scripts)
await callTool("run-script", {
  scriptName: "lint"
});

// Custom timeout for slow linting processes
await callTool("run-script", {
  scriptName: "lint:full",
  timeout: 90000 // 1.5 minutes
});

// Extended timeout for complex build scripts
await callTool("run-script", {
  scriptName: "build:complex",
  timeout: 240000 // 4 minutes
});
```

### install-deps Tool
```javascript
// Default timeout (60s)
await callTool("install-deps", {
  packageManager: "npm"
});

// Extended timeout for large dependency installations
await callTool("install-deps", {
  packageManager: "npm",
  timeout: 300000 // 5 minutes
});
```

## Timeout Best Practices

### Recommended Timeout Values
- **Unit tests**: 30,000ms (30s) - Default
- **Integration tests**: 60,000-120,000ms (1-2 minutes)
- **E2E tests**: 90,000-300,000ms (1.5-5 minutes) 
- **Small builds**: 30,000ms (30s) - Default
- **Large builds**: 120,000-300,000ms (2-5 minutes)
- **Dependency installation**: 60,000-300,000ms (1-5 minutes)
- **Linting/formatting**: 30,000-90,000ms (30s-1.5 minutes)

### When to Use Custom Timeouts
1. **Large codebases** - Increase timeout for builds and tests
2. **Slow CI environments** - Add buffer time for resource constraints
3. **Complex test suites** - E2E tests often need more time
4. **Network-dependent operations** - Dependency installs may be slow
5. **Resource-intensive scripts** - Compilation, bundling, or analysis tools

### Timeout Constraints
- **Minimum**: 1,000ms (1 second)
- **Maximum**: 300,000ms (5 minutes)
- **Default fallbacks**: Used when timeout is not specified

## Error Handling

When a timeout occurs, you'll see an error message like:
```
⚠️ Command timed out (after 30 seconds)
```

To resolve timeout issues:
1. Increase the timeout value
2. Optimize the script/command performance
3. Check for hanging processes or infinite loops
4. Consider breaking large operations into smaller chunks
