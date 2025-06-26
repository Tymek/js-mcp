import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerHelpTool } from "./help.js";
import { registerTestTool } from "./test.js";
import { registerBuildTool } from "./build.js";
import { registerInstallTool } from "./install.js";
import { registerScriptTool } from "./script.js";
import { registerProjectStatusTool, registerListScriptsTool } from "./status.js";
import { registerBackgroundTaskTools } from "./background.js";

export const registerAllTools = (server: McpServer) => {
  registerHelpTool(server);
  registerTestTool(server);
  registerBuildTool(server);
  registerInstallTool(server);
  registerScriptTool(server);
  registerProjectStatusTool(server);
  registerListScriptsTool(server);
  registerBackgroundTaskTools(server);
};
