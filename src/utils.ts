import { spawn } from "child_process";
import type { ExecResult } from "./types.js";

export const executeCommand = (command: string, args: readonly string[], cwd?: string, timeoutMs = 30000): Promise<ExecResult> =>
  new Promise((resolve) => {
    const child = spawn(command, [...args], {
      cwd: cwd || process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;

    const resolveOnce = (result: ExecResult) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutHandle);
      resolve(result);
    };

    const timeoutHandle = setTimeout(() => {
      if (!resolved) {
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
        resolveOnce({
          stdout: stdout.trim(),
          stderr: (stderr + '\n⚠️  Command timed out (after ' + (timeoutMs / 1000) + ' seconds)').trim(),
          success: false
        });
      }
    }, timeoutMs);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolveOnce({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0
      });
    });

    child.on('exit', (code) => {
      resolveOnce({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0
      });
    });

    child.on('error', (error) => {
      resolveOnce({
        stdout: '',
        stderr: error.message,
        success: false
      });
    });
  });
