import fs from "node:fs";
import path from "node:path";

const IGNORED_DIRS = new Set([".git", "node_modules", ".next", "dist", "build", "coverage"]);
const CODE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".py", ".go", ".rb", ".java"]);
const TEST_HINTS = ["test", "spec", "__tests__"];

function detectArea(relativePath) {
  const segments = relativePath.split(path.sep).filter(Boolean);
  return segments[0] || "root";
}

function extractKeywords(relativePath) {
  return relativePath
    .replace(/\.[^.]+$/, "")
    .split(/[\\/._-]+/)
    .map((segment) => segment.toLowerCase())
    .filter(Boolean);
}

function detectFileType(relativePath) {
  const lower = relativePath.toLowerCase();
  if (TEST_HINTS.some((hint) => lower.includes(hint))) {
    return "test";
  }
  return "code";
}

function walkFiles(rootPath, currentPath, files, maxFiles) {
  if (files.length >= maxFiles) {
    return;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    if (files.length >= maxFiles) {
      return;
    }

    const fullPath = path.join(currentPath, entry.name);
    const relativePath = path.relative(rootPath, fullPath);

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }

      walkFiles(rootPath, fullPath, files, maxFiles);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!CODE_EXTENSIONS.has(ext)) {
      continue;
    }

    files.push({
      path: relativePath,
      area: detectArea(relativePath),
      type: detectFileType(relativePath),
      keywords: extractKeywords(relativePath),
    });
  }
}

function inferValidationSteps(rootPath) {
  const packageJsonPath = path.join(rootPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const scripts = packageJson.scripts || {};
      const steps = [];

      if (scripts.test) {
        steps.push({ id: "test", command: "npm test" });
      }

      if (scripts.lint) {
        steps.push({ id: "lint", command: "npm run lint" });
      }

      if (steps.length > 0) {
        return steps;
      }
    } catch {
      return [{ id: "repository-check", command: "manual-check-required" }];
    }
  }

  return [{ id: "repository-check", command: "manual-check-required" }];
}

export function analyzeLocalRepositoryTarget(target) {
  const repositoryPath = target.repositoryPath;

  if (!repositoryPath) {
    throw new Error("repositoryPath is required for local repository analysis");
  }

  if (!fs.existsSync(repositoryPath)) {
    throw new Error(`repository path does not exist: ${repositoryPath}`);
  }

  const files = [];
  walkFiles(repositoryPath, repositoryPath, files, target.maxFiles || 250);

  return {
    repositoryId: target.repositoryId,
    teamId: target.teamId,
    repositoryPath,
    metadata: {
      ...(target.metadata || {}),
      repositoryPath,
      fileCount: files.length,
      hasGitDirectory: fs.existsSync(path.join(repositoryPath, ".git")),
      packageJsonPresent: fs.existsSync(path.join(repositoryPath, "package.json")),
    },
    files,
    validationSteps: inferValidationSteps(repositoryPath),
  };
}
