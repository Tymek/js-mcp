import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProjectContext } from "../project.js";
import { ProjectPathSchema } from "../schemas.js";

export const registerHelpTool = (server: McpServer) => {
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
};
