import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand } from "../utils.js";
import { getProjectContext } from "../project.js";
import { ProjectPathSchema, PackageManagerSchema } from "../schemas.js";

export const registerInstallTool = (server: McpServer) => {
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
};
