import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand } from "../utils.js";
import { getProjectContext, validateDependencies, validateScript } from "../project.js";
import { ProjectPathSchema, TestScriptSchema, TestPatternSchema, TimeoutSchema } from "../schemas.js";

export const registerTestTool = (server: McpServer) => {
  server.tool(
    "run-tests",
    "Run project tests using npm test or available test scripts. Supports various testing frameworks like Jest, Mocha, Vitest, etc. Can run specific test files, test patterns, or all tests in the project. Automatically detects project structure and provides helpful feedback about test results. Configurable timeout: 30 seconds for unit tests, 90 seconds for e2e tests.",
    {
      projectPath: ProjectPathSchema,
      testScript: TestScriptSchema,
      testPattern: TestPatternSchema,
      timeout: TimeoutSchema,
    },
    async ({ projectPath, testScript = "test", testPattern, timeout }) => {
      try {
        const context = await getProjectContext(projectPath);
        validateScript(context, testScript);
        validateDependencies(context);

        const args = ['run', testScript];
        if (testPattern) {
          args.push('--', testPattern);
        }

        // Use custom timeout if provided, otherwise use defaults based on test type
        const timeoutMs = timeout ?? (testScript.toLowerCase().includes('e2e') ? 90000 : 30000);
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
};
