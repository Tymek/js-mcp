#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

// Server configuration
const server = new McpServer({
  name: "js-development-mcp-server",
  version: "2.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Type definitions for better type safety
type ExecResult = {
  stdout: string;
  stderr: string;
  success: boolean;
};

type LockFileType = 'none' | 'npm' | 'yarn' | 'pnpm';
type Framework = 'Next.js' | 'React' | 'Vue.js' | 'Express' | 'NestJS';

type PackageJson = {
  name?: string;
  version?: string;
  description?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

type ProjectContext = {
  workingDir: string;
  packageJson: PackageJson;
  projectName: string;
  availableScripts: readonly string[];
  hasNodeModules: boolean;
  lockFileType: LockFileType;
  framework?: Framework;
};

type BackgroundTask = {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  process: any;
  output: string[];
  startTime: Date;
  status: 'running' | 'stopped' | 'failed';
};

// Global task registry
const backgroundTasks = new Map<string, BackgroundTask>();

// Input validation schemas with enhanced descriptions
const ProjectPathSchema = z.string().optional().describe(
  "Absolute or relative path to the project directory. If not provided, the server will auto-detect the project root by searching for package.json files starting from the current working directory."
);

const TestScriptSchema = z.string().optional().default("test").describe(
  "Name of the npm script to run for testing. Common values: 'test', 'test:unit', 'test:integration', 'test:e2e'. Defaults to 'test'."
);

const TestPatternSchema = z.string().optional().describe(
  "Specific test file pattern or path to run. Examples: 'src/**/*.test.js', 'tests/user.test.js', '__tests__/api', or Jest patterns like '--testNamePattern=User'."
);

const BuildScriptSchema = z.string().optional().default("build").describe(
  "Name of the npm script to run for building. Common values: 'build', 'build:prod', 'build:dev', 'compile'. Defaults to 'build'."
);

const PackageManagerSchema = z.enum(["npm", "yarn", "pnpm"]).optional().default("npm").describe(
  "Package manager to use for dependency installation. Choose based on your project's lock file: npm (package-lock.json), yarn (yarn.lock), or pnpm (pnpm-lock.yaml)."
);

const ScriptNameSchema = z.string().describe(
  "Name of the npm script to execute as defined in package.json scripts section. Examples: 'start', 'dev', 'lint', 'format', 'deploy'."
);

const ScriptArgsSchema = z.array(z.string()).optional().describe(
  "Additional command-line arguments to pass to the script. Examples: ['--watch', '--verbose'], ['--port', '3001'], ['--env', 'staging']."
);

// Utility functions with improved error handling
const executeCommand = (command: string, args: readonly string[], cwd?: string, timeoutMs = 30000): Promise<ExecResult> =>
  new Promise((resolve) => {
    const child = spawn(command, [...args], {
      cwd: cwd || process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;

    const resolveOnce = (result: ExecResult) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutHandle);
      resolve(result);
    };

    const timeoutHandle = setTimeout(() => {
      if (!resolved) {
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
        resolveOnce({
          stdout: stdout.trim(),
          stderr: (stderr + '\n⚠️  Command timed out (after ' + (timeoutMs / 1000) + ' seconds)').trim(),
          success: false
        });
      }
    }, timeoutMs);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolveOnce({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0
      });
    });

    child.on('exit', (code) => {
      resolveOnce({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0
      });
    });

    child.on('error', (error) => {
      resolveOnce({
        stdout: '',
        stderr: error.message,
        success: false
      });
    });
  });

const executeBackgroundCommand = (command: string, args: readonly string[], cwd?: string): Promise<ExecResult> =>
  new Promise((resolve) => {
    const taskId = `${command}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const workingDir = cwd || process.cwd();
    
    const child = spawn(command, [...args], {
      cwd: workingDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      detached: true
    });

    const task: BackgroundTask = {
      id: taskId,
      command,
      args: [...args],
      cwd: workingDir,
      process: child,
      output: [],
      startTime: new Date(),
      status: 'running'
    };

    backgroundTasks.set(taskId, task);

    let initialOutput = '';
    let hasOutput = false;

    const addToOutput = (data: string) => {
      const lines = data.split('\n').filter(line => line.trim());
      task.output.push(...lines);
      // Keep only last 100 lines to prevent memory issues
      if (task.output.length > 100) {
        task.output = task.output.slice(-100);
      }
    };

    const collectInitialOutput = () => {
      setTimeout(() => {
        resolve({
          stdout: `🚀 Background task started successfully!\n\n📋 Task ID: ${taskId}\n📍 Working Directory: ${workingDir}\n🔧 Command: ${command} ${args.join(' ')}\n\n📋 Initial Output:\n${initialOutput}\n\n💡 Use 'stop-background-task' to stop or 'get-background-output' to read output.`,
          stderr: '',
          success: true
        });
      }, 3000);
    };

    child.stdout?.on('data', (data) => {
      const output = data.toString();
      addToOutput(output);
      if (!hasOutput) {
        initialOutput += output;
        hasOutput = true;
      }
    });

    child.stderr?.on('data', (data) => {
      const output = data.toString();
      addToOutput(`[STDERR] ${output}`);
      if (!hasOutput) {
        initialOutput += output;
        hasOutput = true;
      }
    });

    child.on('spawn', () => {
      collectInitialOutput();
    });

    child.on('exit', (code) => {
      task.status = code === 0 ? 'stopped' : 'failed';
      addToOutput(`[PROCESS] Process exited with code ${code}`);
    });

    child.on('error', (error) => {
      task.status = 'failed';
      addToOutput(`[ERROR] ${error.message}`);
      resolve({
        stdout: '',
        stderr: `❌ Failed to start background process: ${error.message}`,
        success: false
      });
    });

    child.unref();
  });

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const findProjectRoot = async (startPath: string): Promise<string> => {
  let currentPath = path.resolve(startPath);
  
  while (currentPath !== path.dirname(currentPath)) {
    if (await fileExists(path.join(currentPath, 'package.json'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  throw new Error('package.json not found in directory tree');
};

const getProjectContext = async (projectPath?: string): Promise<ProjectContext> => {
  const workingDir = projectPath 
    ? path.resolve(projectPath) 
    : await findProjectRoot(process.cwd());
  
  const packageJsonPath = path.join(workingDir, 'package.json');
  if (!await fileExists(packageJsonPath)) {
    throw new Error(`No package.json found in ${workingDir}. Please specify a valid project path or run from a Node.js project directory.`);
  }

  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  const scripts = packageJson.scripts || {};
  
  const hasNodeModules = await fileExists(path.join(workingDir, 'node_modules'));
  
  const lockFileType: LockFileType =
    (await fileExists(path.join(workingDir, 'package-lock.json'))) ? 'npm' :
    (await fileExists(path.join(workingDir, 'yarn.lock'))) ? 'yarn' :
    (await fileExists(path.join(workingDir, 'pnpm-lock.yaml'))) ? 'pnpm' : 'none';

  // Framework detection with more comprehensive dependency checking
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const framework: Framework | undefined =
    deps.next ? 'Next.js' :
    deps.react ? 'React' :
    deps.vue ? 'Vue.js' :
    deps.express ? 'Express' :
    deps['@nestjs/core'] ? 'NestJS' : undefined;

  return {
    workingDir,
    packageJson,
    projectName: packageJson.name || 'Unknown Project',
    availableScripts: Object.keys(scripts),
    hasNodeModules,
    lockFileType,
    framework
  };
};

// Helper functions for common validations
const validateDependencies = (context: ProjectContext): void => {
  if (!context.hasNodeModules) {
    throw new Error('Dependencies not installed. Run install-deps tool first to install dependencies.');
  }
};

const validateScript = (context: ProjectContext, scriptName: string): void => {
  if (!context.availableScripts.includes(scriptName)) {
    const similarScripts = context.availableScripts.filter(s => 
      s.includes(scriptName) || scriptName.includes(s) || 
      s.toLowerCase().includes(scriptName.toLowerCase())
    );
    
    const suggestion = similarScripts.length > 0 
      ? `\n\n🔍 Similar scripts found: ${similarScripts.join(', ')}`
      : `\n\n💡 Common script patterns: start, dev, build, test, lint, format`;
    
    throw new Error(`Script '${scriptName}' not found in ${context.projectName}.${suggestion}\n\n📋 All available scripts: ${context.availableScripts.join(', ') || 'none'}`);
  }
};

// Tool implementations
server.tool(
  "get-help",
  "Get intelligent recommendations for which tools to use based on your current situation and goals. Provides contextual guidance and suggests optimal workflows for common development tasks.",
  {
    goal: z.string().describe("What you want to accomplish. Examples: 'run tests', 'deploy project', 'fix build errors', 'start development', 'check project health'"),
    projectPath: ProjectPathSchema,
  },
  async ({ goal, projectPath }) => {
    try {
      const context = await getProjectContext(projectPath);
      
      const recommendations: string[] = [];
      const workflow: string[] = [];
      
      const goalLower = goal.toLowerCase();
      
      if (goalLower.includes('test')) {
        if (!context.hasNodeModules) {
          workflow.push("1. install-deps - Install dependencies first");
          workflow.push("2. run-tests - Execute tests");
        } else if (!context.availableScripts.includes('test')) {
          recommendations.push("❌ No test script found. Consider adding a test script to package.json");
          workflow.push("1. Add test script to package.json");
          workflow.push("2. run-tests - Execute tests");
        } else {
          workflow.push("1. run-tests - Execute all tests");
          if (context.availableScripts.some(s => s.includes('test:') || s.includes('test-'))) {
            workflow.push("   Alternative: run-tests with specific testScript for targeted testing");
          }
        }
        recommendations.push("💡 Use testPattern parameter to run specific test files or patterns");
      }
      
      if (goalLower.includes('build') || goalLower.includes('compile')) {
        if (!context.hasNodeModules) {
          workflow.push("1. install-deps - Install dependencies first");
          workflow.push("2. build-project - Build the project");
        } else {
          workflow.push("1. run-tests - Ensure tests pass first (optional but recommended)");
          workflow.push("2. build-project - Build the project");
          if (goalLower.includes('production') || goalLower.includes('deploy')) {
            workflow.push("   Use production: true for optimized production build");
          }
        }
      }
      
      if (goalLower.includes('start') || goalLower.includes('dev') || goalLower.includes('serve')) {
        if (!context.hasNodeModules) {
          workflow.push("1. install-deps - Install dependencies first");
        }
        const devScripts = context.availableScripts.filter(s => 
          s.includes('dev') || s.includes('start') || s.includes('serve')
        );
        if (devScripts.length > 0) {
          workflow.push(`2. run-script - Use scriptName: "${devScripts[0]}" to start development`);
          if (devScripts.length > 1) {
            recommendations.push(`📋 Multiple dev scripts available: ${devScripts.join(', ')}`);
          }
        } else {
          recommendations.push("❌ No development script found. Common names: 'dev', 'start', 'serve'");
        }
      }
      
      if (goalLower.includes('deploy') || goalLower.includes('release')) {
        workflow.push("1. run-tests - Ensure all tests pass");
        workflow.push("2. build-project - Build for production (production: true)");
        const deployScripts = context.availableScripts.filter(s => 
          s.includes('deploy') || s.includes('release') || s.includes('publish')
        );
        if (deployScripts.length > 0) {
          workflow.push(`3. run-script - Use scriptName: "${deployScripts[0]}" for deployment`);
        } else {
          recommendations.push("💡 Consider adding deployment scripts like 'deploy', 'release', or 'publish'");
        }
      }
      
      if (goalLower.includes('status') || goalLower.includes('health') || goalLower.includes('check')) {
        workflow.push("1. project-status - Get comprehensive project overview");
        workflow.push("2. Follow suggestions from project-status output");
      }
      
      if (goalLower.includes('install') || goalLower.includes('dependencies') || goalLower.includes('deps')) {
        workflow.push("1. install-deps - Install all dependencies");
        if (context.lockFileType !== 'npm') {
          workflow.push(`   Consider using packageManager: "${context.lockFileType}" for consistency`);
        }
      }
      
      if (goalLower.includes('scripts') || goalLower.includes('available') || goalLower.includes('commands')) {
        workflow.push("1. list-scripts - See all available scripts categorized by type");
        workflow.push("2. run-script - Execute any script by name");
      }
      
      // Default recommendations if nothing specific matched
      if (workflow.length === 0) {
        workflow.push("1. project-status - Start by understanding your project");
        workflow.push("2. list-scripts - See what automation is available");
        workflow.push("3. Choose appropriate tool based on your needs");
      }
      
      // Add context-aware recommendations
      if (!context.hasNodeModules) {
        recommendations.unshift("⚠️  Dependencies not installed - run install-deps first");
      }
      
      if (context.framework) {
        recommendations.push(`🚀 Detected ${context.framework} project - tools are optimized for this framework`);
      }
      
      const response = `
🎯 Goal: ${goal}
📦 Project: ${context.projectName}${context.framework ? ` (${context.framework})` : ''}

🔧 Recommended Workflow:
${workflow.join('\n')}

${recommendations.length > 0 ? `\n💡 Additional Recommendations:
${recommendations.join('\n')}` : ''}

📋 Available Tools:
- project-status: Get comprehensive project overview
- install-deps: Install project dependencies  
- list-scripts: Show all available npm scripts
- run-tests: Execute test suites
- build-project: Build for development or production
- run-script: Run any custom npm script
- list-background-tasks: Show running background processes
- get-background-output: Read output from background tasks
- stop-background-task: Stop background processes (Ctrl+C equivalent)
- get-help: Get contextual recommendations (this tool)

🚀 Quick Examples:
- "Check project health" → project-status
- "Install dependencies" → install-deps  
- "Run all tests" → run-tests
- "Build for production" → build-project with production: true
- "Start development" → run-script with scriptName: "dev" (auto-detects background mode)
- "Start server in background" → run-script with scriptName: "start" and background: true
      `.trim();
      
      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error getting recommendations: ${error instanceof Error ? error.message : String(error)}\n\n💡 Start with: project-status to check your project setup`,
          },
        ],
      };
    }
  }
);

server.tool(
  "run-tests",
  "Run project tests using npm test or available test scripts. Supports various testing frameworks like Jest, Mocha, Vitest, etc. Can run specific test files, test patterns, or all tests in the project. Automatically detects project structure and provides helpful feedback about test results. Timeout: 30 seconds for unit tests, 90 seconds for e2e tests.",
  {
    projectPath: ProjectPathSchema,
    testScript: TestScriptSchema,
    testPattern: TestPatternSchema,
  },
  async ({ projectPath, testScript = "test", testPattern }) => {
    try {
      const context = await getProjectContext(projectPath);
      validateScript(context, testScript);
      validateDependencies(context);

      const args = ['run', testScript];
      if (testPattern) {
        args.push('--', testPattern);
      }

      // E2E tests often take longer, so increase timeout for test scripts containing e2e
      const timeoutMs = testScript.toLowerCase().includes('e2e') ? 90000 : 30000; // 90s for e2e, 30s for others
      const result = await executeCommand('npm', args, context.workingDir, timeoutMs);
      
      const status = result.success ? '✅ Tests passed' : '❌ Tests failed';
      const frameworkInfo = context.framework ? ` (${context.framework} project)` : '';
      
      return {
        content: [
          {
            type: "text",
            text: `${status} for ${context.projectName}${frameworkInfo}\n\n📊 Test Output:\n${result.stdout}\n\n${result.stderr ? `⚠️  Warnings/Errors:\n${result.stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error running tests: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "build-project",
  "Build the project using npm build or available build scripts. Supports various build tools like Webpack, Vite, Next.js, TypeScript compiler, etc. Can build for development or production environments. Automatically detects build configuration and provides detailed build feedback.",
  {
    projectPath: ProjectPathSchema,
    buildScript: BuildScriptSchema,
    production: z.boolean().optional().default(false).describe("Build for production environment with optimizations enabled. Sets NODE_ENV=production and typically enables minification, tree-shaking, and other optimizations."),
  },
  async ({ projectPath, buildScript = "build", production = false }) => {
    try {
      const context = await getProjectContext(projectPath);
      validateScript(context, buildScript);
      validateDependencies(context);

      const buildEnv = production ? 'production' : 'development';
      
      const result = await executeCommand('npm', ['run', buildScript], context.workingDir);
      
      const status = result.success ? '✅ Build successful' : '❌ Build failed';
      const frameworkInfo = context.framework ? ` (${context.framework} project)` : '';
      
      return {
        content: [
          {
            type: "text",
            text: `${status} for ${context.projectName}${frameworkInfo}\n🔧 Build mode: ${buildEnv}\n\n📦 Build Output:\n${result.stdout}\n\n${result.stderr ? `⚠️  Warnings/Errors:\n${result.stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error building project: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "install-deps",
  "Install project dependencies using npm, yarn, or pnpm. Automatically detects the appropriate package manager based on lock files present in the project. Supports installing all dependencies or production-only dependencies. Provides detailed installation feedback and suggestions for common issues.",
  {
    projectPath: ProjectPathSchema,
    packageManager: PackageManagerSchema,
    production: z.boolean().optional().default(false).describe("Install only production dependencies, excluding devDependencies. Useful for deployment scenarios where development tools are not needed."),
  },
  async ({ projectPath, packageManager = "npm", production = false }) => {
    try {
      const context = await getProjectContext(projectPath);
      
      // Suggest appropriate package manager based on lock files
      if (packageManager === 'npm' && context.lockFileType !== 'npm' && context.lockFileType !== 'none') {
        return {
          content: [
            {
              type: "text",
              text: `⚠️  Detected ${context.lockFileType} lock file but npm was requested. Consider using packageManager: "${context.lockFileType}" for consistency`,
            },
          ],
        };
      }

      const installType = production ? 'production dependencies' : 'all dependencies';
      const args = ['install'];
      if (production) {
        if (packageManager === 'npm') args.push('--production');
        else if (packageManager === 'yarn') args.push('--production');
        else if (packageManager === 'pnpm') args.push('--prod');
      }

      const result = await executeCommand(packageManager, args, context.workingDir);
      
      const status = result.success ? '✅ Installation successful' : '❌ Installation failed';
      const frameworkInfo = context.framework ? ` (${context.framework} project)` : '';
      
      return {
        content: [
          {
            type: "text",
            text: `${status} for ${context.projectName}${frameworkInfo}\n📦 Installed: ${installType}\n🔧 Package manager: ${packageManager}\n\n📋 Installation Output:\n${result.stdout}\n\n${result.stderr ? `⚠️  Warnings/Errors:\n${result.stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error installing dependencies: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "run-script",
  "Run any custom npm script defined in package.json. Supports all script types including development servers, linting, formatting, deployment, and custom build tasks. Can pass additional arguments to scripts and provides intelligent suggestions for similar scripts when not found. Advanced auto-detection: automatically runs dev/start/serve/watch scripts in background, but excludes cleanup/build/test/etc scripts even if they contain background keywords (e.g., 'dev-cleanup' runs in foreground). Configurable timeouts: 30s default, 1m for e2e tests.",
  {
    scriptName: ScriptNameSchema,
    projectPath: ProjectPathSchema,
    args: ScriptArgsSchema,
    background: z.boolean().optional().default(false).describe(
      "Run the script in background mode for long-running processes like development servers. When true, the tool returns immediately after starting the process, allowing it to run continuously. Use for 'dev', 'start', 'serve' and similar commands."
    ),
  },
  async ({ scriptName, projectPath, args = [], background = false }) => {
    try {
      const context = await getProjectContext(projectPath);
      validateScript(context, scriptName);
      validateDependencies(context);

      const command = ['run', scriptName];
      if (args.length > 0) {
        command.push('--', ...args);
      }

      // Auto-detect background processes if not explicitly set
      const shouldRunInBackground = background || shouldAutoDetectBackground(scriptName);
      
      function shouldAutoDetectBackground(scriptName: string): boolean {
        const name = scriptName.toLowerCase();
        
        // First, check for exclusions - scripts that should NEVER run in background
        const exclusions = [
          'cleanup', 'clean', 'reset', 'install', 'build', 'compile', 'bundle',
          'lint', 'format', 'test', 'deploy', 'publish', 'release', 'prepare',
          'postinstall', 'preinstall', 'prebuild', 'postbuild', 'verify',
          'check', 'validate', 'audit', 'update', 'upgrade', 'migration',
          'migrate', 'seed', 'init', 'setup', 'config', 'configure'
        ];
        
        // If script name matches any exclusion exactly or starts with exclusion + separator
        for (const exclusion of exclusions) {
          if (name === exclusion || 
              name.startsWith(exclusion + ':') || 
              name.startsWith(exclusion + '-') || 
              name.startsWith(exclusion + '_')) {
            return false;
          }
        }
        
        // Then check for background indicators
        const backgroundIndicators = ['dev', 'start', 'serve', 'watch'];
        
        for (const indicator of backgroundIndicators) {
          if (name.includes(indicator)) {
            // Additional check: make sure it's not a cleanup/reset script that happens to contain these words
            // e.g., "dev-cleanup", "start-reset", etc.
            const isCleanupVariant = exclusions.some(exclusion => 
              name.includes(exclusion) && (
                name.includes(indicator + '-' + exclusion) ||
                name.includes(indicator + '_' + exclusion) ||
                name.includes(indicator + ':' + exclusion) ||
                name.includes(exclusion + '-' + indicator) ||
                name.includes(exclusion + '_' + indicator) ||
                name.includes(exclusion + ':' + indicator)
              )
            );
            
            if (!isCleanupVariant) {
              return true;
            }
          }
        }
        
        return false;
      }

      let result: ExecResult;
      
      if (shouldRunInBackground) {
        result = await executeBackgroundCommand('npm', command, context.workingDir);
      } else {
        // For non-background processes, use appropriate timeouts
        const isLongRunning = scriptName.toLowerCase().includes('e2e') || 
                             scriptName.toLowerCase().includes('test');
        const timeoutMs = isLongRunning ? 60000 : 30000; // 1 min for e2e/tests, 30s for others
        result = await executeCommand('npm', command, context.workingDir, timeoutMs);
      }
      
      const status = result.success ? 
        (shouldRunInBackground ? '🚀 Background process started' : '✅ Script completed successfully') : 
        '❌ Script failed';
      
      const frameworkInfo = context.framework ? ` (${context.framework} project)` : '';
      const argsInfo = args.length > 0 ? ` with args: ${args.join(' ')}` : '';
      const modeInfo = shouldRunInBackground ? ' (background mode)' : '';
      
      return {
        content: [
          {
            type: "text",
            text: `${status}: '${scriptName}'${argsInfo}${modeInfo} for ${context.projectName}${frameworkInfo}\n\n📋 Script Output:\n${result.stdout}\n\n${result.stderr ? `⚠️  Warnings/Errors:\n${result.stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error running script: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "list-scripts",
  "List all available npm scripts defined in package.json with their commands. Provides a comprehensive overview of all executable scripts, categorizes them by type (build, test, dev, etc.), and includes helpful descriptions for common script patterns.",
  {
    projectPath: ProjectPathSchema,
  },
  async ({ projectPath }) => {
    try {
      const context = await getProjectContext(projectPath);
      
      if (context.availableScripts.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `📋 No scripts found in ${context.projectName}\n\n💡 Add scripts to package.json to enable project automation:\n\n{\n  "scripts": {\n    "start": "node index.js",\n    "dev": "nodemon index.js",\n    "build": "tsc",\n    "test": "jest"\n  }\n}`,
            },
          ],
        };
      }

      const scripts = context.packageJson.scripts || {};
      
      // Categorize scripts
      const categories = {
        development: [] as string[],
        build: [] as string[],
        test: [] as string[],
        linting: [] as string[],
        deployment: [] as string[],
        other: [] as string[]
      };

      Object.keys(scripts).forEach(name => {
        if (name.includes('dev') || name.includes('start') || name.includes('watch')) {
          categories.development.push(name);
        } else if (name.includes('build') || name.includes('compile')) {
          categories.build.push(name);
        } else if (name.includes('test')) {
          categories.test.push(name);
        } else if (name.includes('lint') || name.includes('format') || name.includes('prettier')) {
          categories.linting.push(name);
        } else if (name.includes('deploy') || name.includes('release') || name.includes('publish')) {
          categories.deployment.push(name);
        } else {
          categories.other.push(name);
        }
      });

      let output = `📋 Available scripts in ${context.projectName}:`;
      if (context.framework) output += ` (${context.framework} project)`;
      output += '\n\n';

      // Display scripts by category
      Object.entries(categories).forEach(([category, scriptNames]) => {
        if (scriptNames.length > 0) {
          output += `🔧 ${category.charAt(0).toUpperCase() + category.slice(1)} Scripts:\n`;
          scriptNames.forEach(name => {
            output += `  ${name}: ${scripts[name]}\n`;
          });
          output += '\n';
        }
      });

      output += `\n💡 Run any script with: run-script tool\n`;
      output += `📦 Dependencies status: ${context.hasNodeModules ? '✅ Installed' : '❌ Not installed'}`;
      
      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error listing scripts: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "project-status",
  "Check comprehensive project status including dependencies, scripts, framework detection, and development environment setup. Provides detailed analysis of project health, suggests improvements, and identifies potential issues before running other commands.",
  {
    projectPath: ProjectPathSchema,
  },
  async ({ projectPath }) => {
    try {
      const context = await getProjectContext(projectPath);
      const { packageJson } = context;
      
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      
      // Analyze project health
      const issues: string[] = [];
      const suggestions: string[] = [];
      
      if (!context.hasNodeModules) {
        issues.push("❌ Dependencies not installed");
        suggestions.push("Run 'install-deps' to install dependencies");
      }
      
      if (context.lockFileType === 'none') {
        issues.push("⚠️  No lock file found");
        suggestions.push("Run npm install to generate package-lock.json");
      }
      
      if (context.availableScripts.length === 0) {
        issues.push("⚠️  No scripts defined");
        suggestions.push("Add scripts to package.json for automation");
      }
      
      if (!context.availableScripts.includes('test')) {
        suggestions.push("Consider adding a test script for quality assurance");
      }
      
      if (!context.availableScripts.includes('build') && !context.availableScripts.some(s => s.includes('build'))) {
        suggestions.push("Consider adding a build script for production builds");
      }

      const status = `
📊 Project Status: ${context.projectName}
${context.framework ? `🚀 Framework: ${context.framework}` : ''}
📍 Path: ${context.workingDir}
📦 Version: ${packageJson.version || 'Unknown'}
📝 Description: ${packageJson.description || 'No description'}

🔍 Dependencies Analysis:
├── Production: ${Object.keys(dependencies).length} packages
├── Development: ${Object.keys(devDependencies).length} packages
├── Installation: ${context.hasNodeModules ? '✅ Installed' : '❌ Not installed'}
└── Lock file: ${context.lockFileType !== 'none' ? `✅ ${context.lockFileType}` : '❌ Missing'}

⚙️  Scripts Analysis:
├── Total scripts: ${context.availableScripts.length}
├── Has test script: ${context.availableScripts.includes('test') ? '✅' : '❌'}
├── Has build script: ${context.availableScripts.some(s => s.includes('build')) ? '✅' : '❌'}
└── Has dev script: ${context.availableScripts.some(s => s.includes('dev') || s.includes('start')) ? '✅' : '❌'}

${context.availableScripts.length > 0 ? `📋 Available Scripts:
${context.availableScripts.map(s => `├── ${s}`).join('\n')}` : '📋 No scripts available'}

${issues.length > 0 ? `\n🔴 Issues Found:
${issues.map(issue => `├── ${issue}`).join('\n')}` : '\n✅ No issues found'}

${suggestions.length > 0 ? `\n💡 Suggestions:
${suggestions.map(suggestion => `├── ${suggestion}`).join('\n')}` : ''}

🏃‍♂️ Ready to use tools: ${context.hasNodeModules ? 'run-tests, build-project, run-script' : 'install-deps (run this first)'}
      `.trim();
      
      return {
        content: [
          {
            type: "text",
            text: status,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error checking project status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "list-background-tasks",
  "List all currently running and recently stopped background tasks. Shows task IDs, commands, status, and runtime information.",
  {
    projectPath: ProjectPathSchema,
  },
  async ({ projectPath }) => {
    try {
      if (backgroundTasks.size === 0) {
        return {
          content: [
            {
              type: "text",
              text: "📋 No background tasks found.\n\n💡 Start a background task using run-script with background: true or by running dev/start/serve scripts.",
            },
          ],
        };
      }

      let output = `📋 Background Tasks (${backgroundTasks.size} total):\n\n`;
      
      const sortedTasks = Array.from(backgroundTasks.values()).sort((a, b) => 
        b.startTime.getTime() - a.startTime.getTime()
      );

      sortedTasks.forEach(task => {
        const runtime = Math.floor((Date.now() - task.startTime.getTime()) / 1000);
        const statusIcon = task.status === 'running' ? '🟢' : task.status === 'stopped' ? '🟡' : '🔴';
        
        output += `${statusIcon} **${task.id}**\n`;
        output += `   📍 Directory: ${task.cwd}\n`;
        output += `   🔧 Command: ${task.command} ${task.args.join(' ')}\n`;
        output += `   ⏱️  Runtime: ${runtime}s\n`;
        output += `   📊 Status: ${task.status}\n`;
        output += `   💬 Output lines: ${task.output.length}\n\n`;
      });

      output += `💡 Use 'get-background-output' to read task output or 'stop-background-task' to terminate a task.`;

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error listing background tasks: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "get-background-output",
  "Get the output from a background task. Shows recent output lines with timestamps and status information.",
  {
    taskId: z.string().describe("The ID of the background task to get output from. Use 'list-background-tasks' to see available task IDs."),
    lines: z.number().optional().default(50).describe("Number of recent output lines to retrieve. Defaults to 50, maximum 100."),
  },
  async ({ taskId, lines = 50 }) => {
    try {
      const task = backgroundTasks.get(taskId);
      
      if (!task) {
        const availableIds = Array.from(backgroundTasks.keys());
        return {
          content: [
            {
              type: "text",
              text: `❌ Task ID '${taskId}' not found.\n\n📋 Available task IDs:\n${availableIds.length > 0 ? availableIds.map(id => `- ${id}`).join('\n') : 'No background tasks running'}`,
            },
          ],
        };
      }

      const maxLines = Math.min(lines, 100);
      const recentOutput = task.output.slice(-maxLines);
      const runtime = Math.floor((Date.now() - task.startTime.getTime()) / 1000);
      const statusIcon = task.status === 'running' ? '🟢' : task.status === 'stopped' ? '🟡' : '🔴';

      let output = `${statusIcon} **Background Task Output: ${taskId}**\n\n`;
      output += `📍 Directory: ${task.cwd}\n`;
      output += `🔧 Command: ${task.command} ${task.args.join(' ')}\n`;
      output += `⏱️  Runtime: ${runtime}s\n`;
      output += `📊 Status: ${task.status}\n`;
      output += `💬 Showing last ${recentOutput.length} lines:\n\n`;
      output += '```\n';
      output += recentOutput.join('\n');
      output += '\n```\n\n';
      
      if (task.status === 'running') {
        output += `💡 Task is still running. Use 'stop-background-task' to terminate it.`;
      } else {
        output += `💡 Task has ${task.status}. Use 'list-background-tasks' to see other active tasks.`;
      }

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error getting background task output: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "stop-background-task",
  "Stop a running background task. Sends SIGTERM first, then SIGKILL if needed. Equivalent to Ctrl+C.",
  {
    taskId: z.string().describe("The ID of the background task to stop. Use 'list-background-tasks' to see available task IDs."),
    force: z.boolean().optional().default(false).describe("Force kill immediately with SIGKILL instead of graceful SIGTERM. Use if the task doesn't respond to normal termination."),
  },
  async ({ taskId, force = false }) => {
    try {
      const task = backgroundTasks.get(taskId);
      
      if (!task) {
        const availableIds = Array.from(backgroundTasks.keys());
        return {
          content: [
            {
              type: "text",
              text: `❌ Task ID '${taskId}' not found.\n\n📋 Available task IDs:\n${availableIds.length > 0 ? availableIds.map(id => `- ${id}`).join('\n') : 'No background tasks running'}`,
            },
          ],
        };
      }

      if (task.status !== 'running') {
        return {
          content: [
            {
              type: "text",
              text: `⚠️  Task '${taskId}' is already ${task.status}.\n\n💡 Use 'list-background-tasks' to see currently running tasks.`,
            },
          ],
        };
      }

      const signal = force ? 'SIGKILL' : 'SIGTERM';
      const runtime = Math.floor((Date.now() - task.startTime.getTime()) / 1000);
      
      try {
        task.process.kill(signal);
        task.status = 'stopped';
        task.output.push(`[SYSTEM] Process terminated with ${signal} after ${runtime}s`);
        
        if (!force) {
          // Give process 5 seconds to terminate gracefully, then force kill
          setTimeout(() => {
            if (task.status === 'stopped' && !task.process.killed) {
              task.process.kill('SIGKILL');
              task.output.push('[SYSTEM] Process force-killed with SIGKILL');
            }
          }, 5000);
        }

        return {
          content: [
            {
              type: "text",
              text: `✅ Background task stopped successfully!\n\n📋 Task: ${taskId}\n🔧 Command: ${task.command} ${task.args.join(' ')}\n⏱️  Runtime: ${runtime}s\n🛑 Signal: ${signal}\n\n💡 Use 'get-background-output' to see final output or 'list-background-tasks' to see other active tasks.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to stop task: ${error instanceof Error ? error.message : String(error)}\n\n💡 Try using force: true to force kill the process.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error stopping background task: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Main function to start the server
const main = async (): Promise<void> => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("JS Development MCP Server running on stdio 🚀");
  
  // Clean up background tasks on exit
  const cleanup = () => {
    backgroundTasks.forEach((task, taskId) => {
      if (task.status === 'running') {
        try {
          task.process.kill('SIGTERM');
          task.output.push('[SYSTEM] Process terminated on server shutdown');
        } catch (error) {
          console.error(`Failed to terminate background task ${taskId}:`, error);
        }
      }
    });
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
};

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
