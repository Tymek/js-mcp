#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const server = new McpServer({
  name: "test-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper function to execute shell commands
async function executeCommand(command: string, args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; success: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: cwd || process.cwd(),
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0
      });
    });

    child.on('error', (error) => {
      resolve({
        stdout: '',
        stderr: error.message,
        success: false
      });
    });
  });
}

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Helper function to find project root
async function findProjectRoot(startPath: string): Promise<string | null> {
  let currentPath = startPath;
  
  while (currentPath !== path.dirname(currentPath)) {
    if (await fileExists(path.join(currentPath, 'package.json'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  return null;
}

// Tool: Run Tests
server.tool(
  "run-tests",
  "Run project tests using npm test or available test scripts",
  {
    projectPath: z.string().optional().describe("Path to the project directory (optional, will auto-detect)"),
    testScript: z.string().optional().describe("Specific test script to run (default: 'test')"),
    testPattern: z.string().optional().describe("Test pattern or specific test file to run"),
  },
  async ({ projectPath, testScript = "test", testPattern }) => {
    try {
      const workingDir = projectPath || await findProjectRoot(process.cwd()) || process.cwd();
      
      const packageJsonPath = path.join(workingDir, 'package.json');
      if (!await fileExists(packageJsonPath)) {
        return {
          content: [
            {
              type: "text",
              text: `No package.json found in ${workingDir}. Please specify a valid project path.`,
            },
          ],
        };
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      if (!scripts[testScript]) {
        const availableScripts = Object.keys(scripts).join(', ');
        return {
          content: [
            {
              type: "text",
              text: `Test script '${testScript}' not found. Available scripts: ${availableScripts || 'none'}`,
            },
          ],
        };
      }

      let command = ['run', testScript];
      if (testPattern) {
        command.push('--', testPattern);
      }

      const result = await executeCommand('npm', command, workingDir);
      
      return {
        content: [
          {
            type: "text",
            text: `Test execution ${result.success ? 'completed successfully' : 'failed'}:\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error running tests: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool: Build Project
server.tool(
  "build-project",
  "Build the project using npm build or available build scripts",
  {
    projectPath: z.string().optional().describe("Path to the project directory (optional, will auto-detect)"),
    buildScript: z.string().optional().describe("Specific build script to run (default: 'build')"),
    production: z.boolean().optional().describe("Build for production (default: false)"),
  },
  async ({ projectPath, buildScript = "build", production = false }) => {
    try {
      const workingDir = projectPath || await findProjectRoot(process.cwd()) || process.cwd();
      
      const packageJsonPath = path.join(workingDir, 'package.json');
      if (!await fileExists(packageJsonPath)) {
        return {
          content: [
            {
              type: "text",
              text: `No package.json found in ${workingDir}. Please specify a valid project path.`,
            },
          ],
        };
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      if (!scripts[buildScript]) {
        const availableScripts = Object.keys(scripts).join(', ');
        return {
          content: [
            {
              type: "text",
              text: `Build script '${buildScript}' not found. Available scripts: ${availableScripts || 'none'}`,
            },
          ],
        };
      }

      const env = production ? { ...process.env, NODE_ENV: 'production' } : process.env;
      const result = await executeCommand('npm', ['run', buildScript], workingDir);
      
      return {
        content: [
          {
            type: "text",
            text: `Build ${result.success ? 'completed successfully' : 'failed'}:\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error building project: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool: Install Dependencies
server.tool(
  "install-deps",
  "Install project dependencies using npm install",
  {
    projectPath: z.string().optional().describe("Path to the project directory (optional, will auto-detect)"),
    packageManager: z.enum(["npm", "yarn", "pnpm"]).optional().describe("Package manager to use (default: npm)"),
    production: z.boolean().optional().describe("Install only production dependencies (default: false)"),
  },
  async ({ projectPath, packageManager = "npm", production = false }) => {
    try {
      const workingDir = projectPath || await findProjectRoot(process.cwd()) || process.cwd();
      
      const packageJsonPath = path.join(workingDir, 'package.json');
      if (!await fileExists(packageJsonPath)) {
        return {
          content: [
            {
              type: "text",
              text: `No package.json found in ${workingDir}. Please specify a valid project path.`,
            },
          ],
        };
      }

      let command = [packageManager === 'npm' ? 'install' : 'install'];
      if (production) {
        command.push('--production');
      }

      const result = await executeCommand(packageManager, command, workingDir);
      
      return {
        content: [
          {
            type: "text",
            text: `Dependency installation ${result.success ? 'completed successfully' : 'failed'}:\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error installing dependencies: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool: Run Custom Script
server.tool(
  "run-script",
  "Run a custom npm script from package.json",
  {
    scriptName: z.string().describe("Name of the script to run"),
    projectPath: z.string().optional().describe("Path to the project directory (optional, will auto-detect)"),
    args: z.array(z.string()).optional().describe("Additional arguments to pass to the script"),
  },
  async ({ scriptName, projectPath, args = [] }) => {
    try {
      const workingDir = projectPath || await findProjectRoot(process.cwd()) || process.cwd();
      
      const packageJsonPath = path.join(workingDir, 'package.json');
      if (!await fileExists(packageJsonPath)) {
        return {
          content: [
            {
              type: "text",
              text: `No package.json found in ${workingDir}. Please specify a valid project path.`,
            },
          ],
        };
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      if (!scripts[scriptName]) {
        const availableScripts = Object.keys(scripts).join(', ');
        return {
          content: [
            {
              type: "text",
              text: `Script '${scriptName}' not found. Available scripts: ${availableScripts || 'none'}`,
            },
          ],
        };
      }

      let command = ['run', scriptName];
      if (args.length > 0) {
        command.push('--', ...args);
      }

      const result = await executeCommand('npm', command, workingDir);
      
      return {
        content: [
          {
            type: "text",
            text: `Script '${scriptName}' ${result.success ? 'completed successfully' : 'failed'}:\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error running script: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool: List Available Scripts
server.tool(
  "list-scripts",
  "List all available npm scripts in the project",
  {
    projectPath: z.string().optional().describe("Path to the project directory (optional, will auto-detect)"),
  },
  async ({ projectPath }) => {
    try {
      const workingDir = projectPath || await findProjectRoot(process.cwd()) || process.cwd();
      
      const packageJsonPath = path.join(workingDir, 'package.json');
      if (!await fileExists(packageJsonPath)) {
        return {
          content: [
            {
              type: "text",
              text: `No package.json found in ${workingDir}. Please specify a valid project path.`,
            },
          ],
        };
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};
      
      if (Object.keys(scripts).length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No scripts found in package.json",
            },
          ],
        };
      }

      const scriptList = Object.entries(scripts)
        .map(([name, command]) => `  ${name}: ${command}`)
        .join('\n');
      
      return {
        content: [
          {
            type: "text",
            text: `Available scripts in ${workingDir}:\n\n${scriptList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing scripts: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// Tool: Check Project Status
server.tool(
  "project-status",
  "Check project status including dependencies, scripts, and basic info",
  {
    projectPath: z.string().optional().describe("Path to the project directory (optional, will auto-detect)"),
  },
  async ({ projectPath }) => {
    try {
      const workingDir = projectPath || await findProjectRoot(process.cwd()) || process.cwd();
      
      const packageJsonPath = path.join(workingDir, 'package.json');
      if (!await fileExists(packageJsonPath)) {
        return {
          content: [
            {
              type: "text",
              text: `No package.json found in ${workingDir}. Please specify a valid project path.`,
            },
          ],
        };
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      
      const hasNodeModules = await fileExists(path.join(workingDir, 'node_modules'));
      const hasLockFile = await fileExists(path.join(workingDir, 'package-lock.json')) ||
                          await fileExists(path.join(workingDir, 'yarn.lock')) ||
                          await fileExists(path.join(workingDir, 'pnpm-lock.yaml'));

      const status = `Project Status for ${packageJson.name || 'Unknown Project'}:

Version: ${packageJson.version || 'Unknown'}
Description: ${packageJson.description || 'No description'}

Dependencies: ${Object.keys(dependencies).length} packages
Dev Dependencies: ${Object.keys(devDependencies).length} packages
Scripts: ${Object.keys(scripts).length} available

Installation Status:
- Node modules: ${hasNodeModules ? '✓ Installed' : '✗ Not installed'}
- Lock file: ${hasLockFile ? '✓ Present' : '✗ Missing'}

Available Scripts:
${Object.keys(scripts).length > 0 ? Object.keys(scripts).map(s => `- ${s}`).join('\n') : 'None'}

Project Path: ${workingDir}`;
      
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
            text: `Error checking project status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Test MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
