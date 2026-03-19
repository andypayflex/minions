import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const DEFAULT_SHARED_AGENT_DIR = path.join(os.homedir(), ".minions", "pi-subscription-auth");
const DEFAULT_POLL_INTERVAL_MS = 1500;
const DEFAULT_JOB_TTL_MS = 10 * 60 * 1000;
const DEFAULT_PI_COMMAND = process.env.MINIONS_PI_COMMAND || "pi";
const AUTH_FILES = ["auth.json", "oauth.json"];

function nowIso() {
  return new Date().toISOString();
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    return null;
  }
}

function createPendingJob({ sharedAgentDir, instructions }) {
  const id = `pi-auth-${crypto.randomUUID()}`;
  return {
    jobId: id,
    state: "pending",
    provider: "openai-chatgpt-subscription",
    method: "real-pi-login-bootstrap",
    sharedAgentDir,
    loginUrl: `/api/pi/auth/browser/${id}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null,
    message: instructions,
  };
}

function looksLikeOpenAiSubscriptionCredential(value, providerKey = "") {
  if (!value || typeof value !== "object") {
    return false;
  }

  const blob = JSON.stringify(value).toLowerCase();
  const key = String(providerKey || "").toLowerCase();
  return (
    blob.includes("openai") ||
    blob.includes("codex") ||
    blob.includes("chatgpt") ||
    key.includes("openai") ||
    key.includes("codex") ||
    key.includes("chatgpt")
  );
}

export class PiSubscriptionAuthManager {
  constructor(options = {}) {
    this.sharedAgentDir = options.sharedAgentDir || process.env.MINIONS_PI_SUBSCRIPTION_AGENT_DIR || DEFAULT_SHARED_AGENT_DIR;
    this.pollIntervalMs = options.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS;
    this.jobTtlMs = options.jobTtlMs || DEFAULT_JOB_TTL_MS;
    this.piCommand = options.piCommand || DEFAULT_PI_COMMAND;
    this.spawnImpl = options.spawnImpl || spawn;
    this.jobs = new Map();
  }

  async detectAuthArtifacts() {
    await ensureDir(this.sharedAgentDir);

    const discovered = [];
    let authenticatedAt = null;

    for (const filename of AUTH_FILES) {
      const filePath = path.join(this.sharedAgentDir, filename);
      const payload = await readJsonIfExists(filePath);
      if (!payload || typeof payload !== "object") {
        continue;
      }

      const matchedProviders = Object.entries(payload)
        .filter(([key, value]) => looksLikeOpenAiSubscriptionCredential(value, key))
        .map(([key]) => key);

      if (matchedProviders.length > 0) {
        const stat = await fs.stat(filePath).catch(() => null);
        discovered.push({
          file: filePath,
          providers: matchedProviders,
          kind: filename,
          modifiedAt: stat?.mtime?.toISOString?.() || null,
        });
        authenticatedAt ||= stat?.mtime?.toISOString?.() || null;
      }
    }

    return {
      authenticated: discovered.length > 0,
      authenticatedAt,
      artifacts: discovered,
    };
  }

  async getState() {
    const detected = await this.detectAuthArtifacts();
    return {
      ok: true,
      auth: {
        mode: detected.authenticated ? "subscription" : "none",
        provider: detected.authenticated ? "openai-chatgpt-subscription" : null,
        authenticated: detected.authenticated,
        authenticatedAt: detected.authenticatedAt,
        sharedAgentDir: this.sharedAgentDir,
        needsLogin: !detected.authenticated,
        artifacts: detected.artifacts,
        loginCommand: `PI_CODING_AGENT_DIR=${this.sharedAgentDir} ${this.piCommand}`,
        loginInstructions: [
          `Launch Pi with PI_CODING_AGENT_DIR set to ${this.sharedAgentDir}`,
          "Run /login inside Pi",
          "Choose OpenAI ChatGPT Plus/Pro (Codex)",
          "Return to Minions once login completes",
        ],
      },
    };
  }

  async createLoginJob() {
    const state = await this.getState();
    const instructions = state.auth.authenticated
      ? "Real Pi auth artifacts are already present in the shared agent directory."
      : `Complete login in Pi using: PI_CODING_AGENT_DIR=${this.sharedAgentDir} ${this.piCommand} and run /login.`;
    const job = createPendingJob({ sharedAgentDir: this.sharedAgentDir, instructions });
    this.jobs.set(job.jobId, job);
    return {
      ok: true,
      job,
      auth: state.auth,
    };
  }

  async getJob(jobId) {
    this._pruneJobs();
    const job = this.jobs.get(jobId);
    if (!job) {
      return { ok: false, error: "Auth job not found" };
    }

    const state = await this.getState();
    if (state.auth.authenticated && job.state !== "completed") {
      job.state = "completed";
      job.completedAt = state.auth.authenticatedAt;
      job.updatedAt = nowIso();
      job.message = "Detected real Pi auth artifacts in the shared agent directory.";
    }

    return {
      ok: true,
      job,
      auth: state.auth,
    };
  }

  async launchLoginBootstrap(jobId) {
    const lookup = await this.getJob(jobId);
    if (!lookup.ok) {
      return lookup;
    }

    const env = { ...process.env, PI_CODING_AGENT_DIR: this.sharedAgentDir };
    let launched = false;
    let errorMessage = null;

    try {
      const child = this.spawnImpl(this.piCommand, [], {
        env,
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      launched = true;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    const state = await this.getState();
    const job = this.jobs.get(jobId);
    job.updatedAt = nowIso();
    job.message = launched
      ? `Pi launched with PI_CODING_AGENT_DIR=${this.sharedAgentDir}. Run /login and select OpenAI ChatGPT Plus/Pro (Codex).`
      : `Could not auto-launch Pi (${errorMessage || "unknown error"}). Run: PI_CODING_AGENT_DIR=${this.sharedAgentDir} ${this.piCommand}`;

    return {
      ok: true,
      launched,
      job,
      auth: state.auth,
      manualCommand: `PI_CODING_AGENT_DIR=${this.sharedAgentDir} ${this.piCommand}`,
    };
  }

  renderBrowserPage(jobId) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pi Subscription Sign-In</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; background: #f6efe2; color: #1f2933; }
      main { max-width: 760px; margin: 40px auto; background: white; border-radius: 20px; padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,.08); }
      h1 { margin-top: 0; }
      .hint { color: #57606a; }
      .card { border: 1px solid #e5d7c5; border-radius: 16px; padding: 16px; background: #fffaf3; margin: 16px 0; }
      button { border: 0; border-radius: 999px; padding: 12px 16px; background: #c84c25; color: white; cursor: pointer; margin-right: 8px; }
      code, pre { background: #f3ede4; padding: 2px 6px; border-radius: 6px; }
      pre { padding: 12px; overflow: auto; }
    </style>
  </head>
  <body>
    <main>
      <h1>Connect your ChatGPT subscription</h1>
      <p class="hint">This page now bootstraps the real installed Pi runtime. Minions will consider auth complete only when Pi-recognized auth artifacts appear in the shared <code>PI_CODING_AGENT_DIR</code>.</p>
      <div class="card">
        <strong>Shared agent dir:</strong> <code>${this.sharedAgentDir}</code>
      </div>
      <div class="card">
        <strong>Manual command:</strong>
        <pre>PI_CODING_AGENT_DIR=${this.sharedAgentDir} ${this.piCommand}</pre>
        <ol>
          <li>Launch Pi using the command above, or click <em>Launch Pi</em>.</li>
          <li>In Pi, run <code>/login</code>.</li>
          <li>Select <strong>OpenAI ChatGPT Plus/Pro (Codex)</strong>.</li>
          <li>Close Pi or return here. Minions will poll for the real auth artifacts.</li>
        </ol>
      </div>
      <button id="launch">Launch Pi</button>
      <button id="refresh">Refresh Status</button>
      <p id="status" class="hint">Waiting for real Pi auth artifacts…</p>
    </main>
    <script>
      async function refresh() {
        const response = await fetch('/api/pi/auth/jobs/${jobId}');
        const payload = await response.json();
        const auth = payload.auth || {};
        document.querySelector('#status').textContent = auth.authenticated
          ? 'Detected real Pi auth artifacts. You can return to Minions.'
          : ((payload.job && payload.job.message) || 'Still waiting for Pi login to complete.');
      }
      document.querySelector('#launch').addEventListener('click', async () => {
        const response = await fetch('/api/pi/auth/jobs/${jobId}/launch', { method: 'POST' });
        const payload = await response.json();
        document.querySelector('#status').textContent = payload.job?.message || payload.manualCommand || 'Launch attempted.';
      });
      document.querySelector('#refresh').addEventListener('click', refresh);
      refresh();
    </script>
  </body>
</html>`;
  }

  _pruneJobs() {
    const now = Date.now();
    for (const [jobId, job] of this.jobs.entries()) {
      if (now - new Date(job.createdAt).getTime() > this.jobTtlMs) {
        this.jobs.delete(jobId);
      }
    }
  }
}
