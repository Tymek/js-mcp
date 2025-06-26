import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand } from "../utils.js";
import { executeBackgroundCommand, shouldAutoDetectBackground } from "../background.js";
import { getProjectContext, validateDependencies, validateScript } from "../project.js";
import { ProjectPathSchema, ScriptNameSchema, ScriptArgsSchema } from "../schemas.js";

export const registerScriptTool = (server: McpServer) => {
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
        
        let result;
        
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
};
