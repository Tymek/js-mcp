import { spawn } from "child_process";
import type { BackgroundTask, ExecResult } from "./types.js";

export const backgroundTasks = new Map<string, BackgroundTask>();

export const executeBackgroundCommand = (command: string, args: readonly string[], cwd?: string): Promise<ExecResult> =>
  new Promise((resolve) => {
    const taskId = `${command}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const workingDir = cwd || process.cwd();
    
    const child = spawn(command, [...args], {
      cwd: workingDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      detached: true
    });

    const task: BackgroundTask = {
      id: taskId,
      command,
      args: [...args],
      cwd: workingDir,
      process: child,
      output: [],
      startTime: new Date(),
      status: 'running'
    };

    backgroundTasks.set(taskId, task);

    let initialOutput = '';
    let hasOutput = false;

    const addToOutput = (data: string) => {
      const lines = data.split('\n').filter(line => line.trim());
      task.output.push(...lines);
      // Keep only last 100 lines to prevent memory issues
      if (task.output.length > 100) {
        task.output = task.output.slice(-100);
      }
    };

    const collectInitialOutput = () => {
      setTimeout(() => {
        resolve({
          stdout: `🚀 Background task started successfully!\n\n📋 Task ID: ${taskId}\n📍 Working Directory: ${workingDir}\n🔧 Command: ${command} ${args.join(' ')}\n\n📋 Initial Output:\n${initialOutput}\n\n💡 Use 'stop-background-task' to stop or 'get-background-output' to read output.`,
          stderr: '',
          success: true
        });
      }, 3000);
    };

    child.stdout?.on('data', (data) => {
      const output = data.toString();
      addToOutput(output);
      if (!hasOutput) {
        initialOutput += output;
        hasOutput = true;
      }
    });

    child.stderr?.on('data', (data) => {
      const output = data.toString();
      addToOutput(`[STDERR] ${output}`);
      if (!hasOutput) {
        initialOutput += output;
        hasOutput = true;
      }
    });

    child.on('spawn', () => {
      collectInitialOutput();
    });

    child.on('exit', (code) => {
      task.status = code === 0 ? 'stopped' : 'failed';
      addToOutput(`[PROCESS] Process exited with code ${code}`);
    });

    child.on('error', (error) => {
      task.status = 'failed';
      addToOutput(`[ERROR] ${error.message}`);
      resolve({
        stdout: '',
        stderr: `❌ Failed to start background process: ${error.message}`,
        success: false
      });
    });

    child.unref();
  });

export const shouldAutoDetectBackground = (scriptName: string): boolean => {
  const name = scriptName.toLowerCase();
  
  // First, check for exclusions - scripts that should NEVER run in background
  const exclusions = [
    'cleanup', 'clean', 'reset', 'install', 'build', 'compile', 'bundle',
    'lint', 'format', 'test', 'deploy', 'publish', 'release', 'prepare',
    'postinstall', 'preinstall', 'prebuild', 'postbuild', 'verify',
    'check', 'validate', 'audit', 'update', 'upgrade', 'migration',
    'migrate', 'seed', 'init', 'setup', 'config', 'configure'
  ];
  
  // If script name matches any exclusion exactly or starts with exclusion + separator
  for (const exclusion of exclusions) {
    if (name === exclusion || 
        name.startsWith(exclusion + ':') || 
        name.startsWith(exclusion + '-') || 
        name.startsWith(exclusion + '_')) {
      return false;
    }
  }
  
  // Then check for background indicators
  const backgroundIndicators = ['dev', 'start', 'serve', 'watch'];
  
  for (const indicator of backgroundIndicators) {
    if (name.includes(indicator)) {
      // Additional check: make sure it's not a cleanup/reset script that happens to contain these words
      // e.g., "dev-cleanup", "start-reset", etc.
      const isCleanupVariant = exclusions.some(exclusion => 
        name.includes(exclusion) && (
          name.includes(indicator + '-' + exclusion) ||
          name.includes(indicator + '_' + exclusion) ||
          name.includes(indicator + ':' + exclusion) ||
          name.includes(exclusion + '-' + indicator) ||
          name.includes(exclusion + '_' + indicator) ||
          name.includes(exclusion + ':' + indicator)
        )
      );
      
      if (!isCleanupVariant) {
        return true;
      }
    }
  }
  
  return false;
};
