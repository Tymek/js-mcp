import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand } from "../utils.js";
import { getProjectContext, validateDependencies, validateScript } from "../project.js";
import { ProjectPathSchema, BuildScriptSchema } from "../schemas.js";

export const registerBuildTool = (server: McpServer) => {
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
};
