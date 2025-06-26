import { promises as fs } from "fs";
import path from "path";
import type { ProjectContext, LockFileType, Framework } from "./types.js";

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const findProjectRoot = async (startPath: string): Promise<string> => {
  let currentPath = path.resolve(startPath);
  
  while (currentPath !== path.dirname(currentPath)) {
    if (await fileExists(path.join(currentPath, 'package.json'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  throw new Error('package.json not found in directory tree');
};

export const getProjectContext = async (projectPath?: string): Promise<ProjectContext> => {
  const workingDir = projectPath 
    ? path.resolve(projectPath) 
    : await findProjectRoot(process.cwd());
  
  const packageJsonPath = path.join(workingDir, 'package.json');
  if (!await fileExists(packageJsonPath)) {
    throw new Error(`No package.json found in ${workingDir}. Please specify a valid project path or run from a Node.js project directory.`);
  }

  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  const scripts = packageJson.scripts || {};
  
  const hasNodeModules = await fileExists(path.join(workingDir, 'node_modules'));
  
  const lockFileType: LockFileType =
    (await fileExists(path.join(workingDir, 'package-lock.json'))) ? 'npm' :
    (await fileExists(path.join(workingDir, 'yarn.lock'))) ? 'yarn' :
    (await fileExists(path.join(workingDir, 'pnpm-lock.yaml'))) ? 'pnpm' : 'none';

  // Framework detection with more comprehensive dependency checking
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const framework: Framework | undefined =
    deps.next ? 'Next.js' :
    deps.react ? 'React' :
    deps.vue ? 'Vue.js' :
    deps.express ? 'Express' :
    deps['@nestjs/core'] ? 'NestJS' : undefined;

  return {
    workingDir,
    packageJson,
    projectName: packageJson.name || 'Unknown Project',
    availableScripts: Object.keys(scripts),
    hasNodeModules,
    lockFileType,
    framework
  };
};

export const validateDependencies = (context: ProjectContext): void => {
  if (!context.hasNodeModules) {
    throw new Error('Dependencies not installed. Run install-deps tool first to install dependencies.');
  }
};

export const validateScript = (context: ProjectContext, scriptName: string): void => {
  if (!context.availableScripts.includes(scriptName)) {
    const similarScripts = context.availableScripts.filter(s => 
      s.includes(scriptName) || scriptName.includes(s) || 
      s.toLowerCase().includes(scriptName.toLowerCase())
    );
    
    const suggestion = similarScripts.length > 0 
      ? `\n\n🔍 Similar scripts found: ${similarScripts.join(', ')}`
      : `\n\n💡 Common script patterns: start, dev, build, test, lint, format`;
    
    throw new Error(`Script '${scriptName}' not found in ${context.projectName}.${suggestion}\n\n📋 All available scripts: ${context.availableScripts.join(', ') || 'none'}`);
  }
};
