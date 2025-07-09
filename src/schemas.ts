import { z } from "zod";

// Input validation schemas with enhanced descriptions
export const ProjectPathSchema = z.string().optional().describe(
  "Absolute or relative path to the project directory. If not provided, the server will auto-detect the project root by searching for package.json files starting from the current working directory."
);

export const TestScriptSchema = z.string().optional().default("test").describe(
  "Name of the npm script to run for testing. Common values: 'test', 'test:unit', 'test:integration', 'test:e2e'. Defaults to 'test'."
);

export const TestPatternSchema = z.string().optional().describe(
  "Specific test file pattern or path to run. Examples: 'src/**/*.test.js', 'tests/user.test.js', '__tests__/api', or Jest patterns like '--testNamePattern=User'."
);

export const BuildScriptSchema = z.string().optional().default("build").describe(
  "Name of the npm script to run for building. Common values: 'build', 'build:prod', 'build:dev', 'compile'. Defaults to 'build'."
);

export const PackageManagerSchema = z.enum(["npm", "yarn", "pnpm"]).optional().default("npm").describe(
  "Package manager to use for dependency installation. Choose based on your project's lock file: npm (package-lock.json), yarn (yarn.lock), or pnpm (pnpm-lock.yaml)."
);

export const ScriptNameSchema = z.string().describe(
  "Name of the npm script to execute as defined in package.json scripts section. Examples: 'start', 'dev', 'lint', 'format', 'deploy'."
);

export const ScriptArgsSchema = z.array(z.string()).optional().describe(
  "Additional command-line arguments to pass to the script. Examples: ['--watch', '--verbose'], ['--port', '3001'], ['--env', 'staging']."
);

export const TimeoutSchema = z.number().min(1000).max(300000).optional().describe(
  "Custom timeout in milliseconds for command execution. Minimum: 1000ms (1s), Maximum: 300000ms (5m). If not provided, defaults are used: 30s for most commands, 60s for long-running scripts, 90s for e2e tests."
);
