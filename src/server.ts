import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { backgroundTasks } from "./background.js";

export const createServer = () => {
  const server = new McpServer({
    name: "js-development-mcp-server",
    version: "2.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  registerAllTools(server);
  return server;
};

export const startServer = async () => {
  const server = createServer();
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
