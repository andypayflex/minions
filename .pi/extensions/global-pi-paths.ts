import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";

export const GLOBAL_PI_DIR = join(homedir(), ".pi", "agent");
export const GLOBAL_PI_AGENTS_DIR = join(GLOBAL_PI_DIR, "agents");
export const GLOBAL_PI_PI_DIR = join(GLOBAL_PI_AGENTS_DIR, "pi-pi");

export interface NamedSource<T> {
	value: T;
	path: string;
	source: "project" | "global";
}

export interface ParsedAgentFile {
	name: string;
	description: string;
	tools: string;
	systemPrompt: string;
	file: string;
	source: "project" | "global";
}

export function parseAgentMarkdown(filePath: string, source: "project" | "global"): ParsedAgentFile | null {
	try {
		const raw = readFileSync(filePath, "utf-8");
		const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (!match) return null;

		const frontmatter: Record<string, string> = {};
		for (const line of match[1].split("\n")) {
			const idx = line.indexOf(":");
			if (idx > 0) {
				frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
			}
		}

		if (!frontmatter.name) return null;

		return {
			name: frontmatter.name,
			description: frontmatter.description || "",
			tools: frontmatter.tools || "read,grep,find,ls",
			systemPrompt: match[2].trim(),
			file: filePath,
			source,
		};
	} catch {
		return null;
	}
}

export function listMarkdownFilesRecursive(dir: string): string[] {
	const files: string[] = [];

	for (const entry of readdirSync(dir)) {
		const fullPath = resolve(dir, entry);
		let stats;
		try {
			stats = statSync(fullPath);
		} catch {
			continue;
		}

		if (stats.isDirectory()) {
			files.push(...listMarkdownFilesRecursive(fullPath));
			continue;
		}

		if (stats.isFile() && fullPath.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
}

export function discoverAgentsWithFallback(cwd: string): ParsedAgentFile[] {
	const dirs: { dir: string; source: "project" | "global" }[] = [
		{ dir: join(cwd, "agents"), source: "project" },
		{ dir: join(cwd, ".claude", "agents"), source: "project" },
		{ dir: join(cwd, ".pi", "agents"), source: "project" },
		{ dir: GLOBAL_PI_AGENTS_DIR, source: "global" },
	];

	const agents: ParsedAgentFile[] = [];
	const seen = new Set<string>();

	for (const { dir, source } of dirs) {
		if (!existsSync(dir)) continue;
		try {
			for (const fullPath of listMarkdownFilesRecursive(dir)) {
				const def = parseAgentMarkdown(fullPath, source);
				if (def && !seen.has(def.name.toLowerCase())) {
					seen.add(def.name.toLowerCase());
					agents.push(def);
				}
			}
		} catch {}
	}

	return agents;
}

export function loadProjectThenGlobalFile(relativeToProject: string, relativeToGlobal: string): NamedSource<string>[] {
	const sources: NamedSource<string>[] = [];
	const projectPath = relativeToProject;
	const globalPath = join(GLOBAL_PI_DIR, relativeToGlobal);

	if (existsSync(projectPath)) {
		sources.push({ value: readFileSync(projectPath, "utf-8"), path: projectPath, source: "project" });
	}
	if (existsSync(globalPath)) {
		sources.push({ value: readFileSync(globalPath, "utf-8"), path: globalPath, source: "global" });
	}

	return sources;
}

export function discoverPiPiExperts(cwd: string): ParsedAgentFile[] {
	const dirs: { dir: string; source: "project" | "global" }[] = [
		{ dir: join(cwd, ".pi", "agents", "pi-pi"), source: "project" },
		{ dir: GLOBAL_PI_PI_DIR, source: "global" },
	];

	const experts: ParsedAgentFile[] = [];
	const seen = new Set<string>();

	for (const { dir, source } of dirs) {
		if (!existsSync(dir)) continue;
		try {
			for (const fullPath of listMarkdownFilesRecursive(dir)) {
				if (fullPath.endsWith("pi-orchestrator.md")) continue;
				const def = parseAgentMarkdown(fullPath, source);
				if (def && !seen.has(def.name.toLowerCase())) {
					seen.add(def.name.toLowerCase());
					experts.push(def);
				}
			}
		} catch {}
	}

	return experts;
}

// Helper module lives in .pi/extensions for convenient relative imports.
// Export a no-op factory so Pi won't treat this file as a broken extension
// when it scans project extension files.
export default function () {}
