import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { backgroundTasks } from "../background.js";
import { ProjectPathSchema } from "../schemas.js";

export const registerBackgroundTaskTools = (server: McpServer) => {
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
};
