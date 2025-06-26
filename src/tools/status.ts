import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProjectContext } from "../project.js";
import { ProjectPathSchema } from "../schemas.js";

export const registerProjectStatusTool = (server: McpServer) => {
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
};

export const registerListScriptsTool = (server: McpServer) => {
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
};
