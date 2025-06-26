# Tool Discovery Guide - Test MCP Server

## 🎯 Enhanced Discovery System

The Test MCP Server now includes sophisticated discovery capabilities that help AI agents better understand available tools and their optimal usage patterns.

## 🚀 Key Enhancement Features

### 1. Intelligent Tool Descriptions
- **Comprehensive descriptions**: Each tool includes detailed descriptions of capabilities, use cases, and best practices
- **Parameter guidance**: Enhanced parameter descriptions with examples and common values
- **Framework awareness**: Tools provide framework-specific optimizations and suggestions

### 2. Smart Context Analysis
- **Project health assessment**: Automatic detection of project structure, dependencies, and configuration
- **Framework detection**: Identifies Next.js, React, Vue.js, Express, NestJS, and other frameworks
- **Dependency management**: Intelligent package manager detection based on lock files

### 3. Contextual Recommendations
- **Goal-oriented guidance**: The `get-help` tool analyzes your goals and provides step-by-step workflows
- **Error recovery**: Failed commands provide actionable suggestions and similar alternatives
- **Workflow optimization**: Tools chain together intelligently with dependency checking

### 4. Enhanced Error Messages
- **Detailed diagnostics**: Clear explanations of what went wrong and why
- **Actionable solutions**: Specific steps to resolve issues
- **Similar suggestions**: Fuzzy matching for script names and commands

## 🛠️ Tool Capabilities Matrix

| Tool | Primary Purpose | Key Features | Framework Aware | Dependency Check |
|------|----------------|--------------|-----------------|------------------|
| `get-help` | Workflow guidance | Goal analysis, step-by-step recommendations | ✅ | ✅ |
| `project-status` | Health assessment | Comprehensive analysis, issue detection | ✅ | ✅ |
| `run-tests` | Test execution | Framework optimization, pattern matching | ✅ | ✅ |
| `build-project` | Project building | Production optimization, tool detection | ✅ | ✅ |
| `install-deps` | Dependency management | Package manager detection, smart recommendations | ✅ | N/A |
| `run-script` | Script execution | Fuzzy matching, argument support | ✅ | ✅ |
| `list-scripts` | Script discovery | Categorization, detailed analysis | ✅ | ✅ |

## 🎯 Discovery Workflows

### Starting with a New Project
```
1. get-help with goal: "understand this project"
   ↓
2. project-status for comprehensive health check
   ↓
3. install-deps if dependencies missing
   ↓
4. list-scripts to explore available automation
   ↓
5. Choose appropriate development workflow
```

### Troubleshooting Issues
```
1. project-status to identify problems
   ↓
2. get-help with specific issue description
   ↓
3. Follow recommended workflow steps
   ↓
4. Verify resolution with project-status
```

### Production Deployment
```
1. get-help with goal: "deploy to production"
   ↓
2. run-tests to ensure quality
   ↓
3. build-project with production: true
   ↓
4. run-script for deployment commands
```

## 🔍 Advanced Discovery Features

### Framework Detection
The server automatically detects and optimizes for:
- **Next.js**: Optimized build processes, dev server detection
- **React**: Component testing patterns, build optimization
- **Vue.js**: Vue-specific tooling and build processes
- **Express**: Server script detection, API testing patterns
- **TypeScript**: Compilation workflows, type checking
- **NestJS**: Framework-specific build and test patterns

### Intelligent Parameter Inference
- **Project paths**: Automatic project root detection
- **Package managers**: Auto-detection from lock files
- **Script names**: Fuzzy matching and suggestions
- **Test patterns**: Framework-aware test file detection

### Context-Aware Suggestions
- **Missing dependencies**: Installation recommendations
- **Script errors**: Alternative script suggestions
- **Build failures**: Configuration issue detection
- **Test failures**: Pattern and framework recommendations

## 💡 Best Practices for Agents

### 1. Start with Discovery
- Always begin with `project-status` to understand the project
- Use `get-help` when unsure about the best approach
- Let tools auto-detect parameters when possible

### 2. Follow Tool Recommendations
- Pay attention to tool suggestions and warnings
- Use provided workflow steps for complex tasks
- Leverage framework-specific optimizations

### 3. Chain Tools Intelligently
- Verify dependencies before running tasks
- Check project health before major operations
- Use test feedback to guide build processes

### 4. Leverage Enhanced Errors
- Read error messages for actionable solutions
- Use suggested alternatives when commands fail
- Follow troubleshooting workflows

## 🚀 Example Discovery Interactions

### Agent Query: "I want to test this React app"
**Enhanced Response:**
1. `project-status` detects React framework
2. Checks if dependencies installed
3. `run-tests` with React-optimized parameters
4. Provides React-specific test pattern suggestions

### Agent Query: "How do I deploy this Next.js project?"
**Enhanced Response:**
1. `get-help` with goal: "deploy Next.js project"
2. Workflow: test → build (production) → deploy
3. Next.js-specific build optimizations suggested
4. Framework-aware deployment script detection

### Agent Query: "Something's wrong with my build"
**Enhanced Response:**
1. `project-status` identifies potential issues
2. Framework-specific build diagnostics
3. Dependency and configuration checks
4. Step-by-step troubleshooting guide

## 📊 Enhanced Input Validation

### Smart Defaults
- Test script defaults to "test" with alternatives suggested
- Build script defaults to "build" with framework awareness
- Package manager auto-detected from lock files

### Intelligent Suggestions
- Similar script names when exact match not found
- Framework-appropriate parameter recommendations
- Context-aware error recovery options

### Flexible Parameters
- All project paths optional with auto-detection
- Framework-aware parameter optimization
- Smart fallbacks for missing configuration

## 🔧 Technical Implementation

### Schema Enhancements
- Detailed parameter descriptions with examples
- Framework-aware validation and suggestions
- Context-sensitive help text

### Error Handling
- Comprehensive error analysis and reporting
- Actionable error recovery suggestions
- Framework-specific troubleshooting guidance

### Context Management
- Project state caching for performance
- Framework detection persistence
- Intelligent workflow state management

This enhanced discovery system transforms the MCP server from a simple tool executor into an intelligent development assistant that understands context, provides guidance, and optimizes workflows for better developer experience.
