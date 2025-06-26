export type ExecResult = {
  stdout: string;
  stderr: string;
  success: boolean;
};

export type LockFileType = 'none' | 'npm' | 'yarn' | 'pnpm';
export type Framework = 'Next.js' | 'React' | 'Vue.js' | 'Express' | 'NestJS';

export type PackageJson = {
  name?: string;
  version?: string;
  description?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

export type ProjectContext = {
  workingDir: string;
  packageJson: PackageJson;
  projectName: string;
  availableScripts: readonly string[];
  hasNodeModules: boolean;
  lockFileType: LockFileType;
  framework?: Framework;
};

export type BackgroundTask = {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  process: any;
  output: string[];
  startTime: Date;
  status: 'running' | 'stopped' | 'failed';
};
