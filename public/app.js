const taskForm = document.querySelector("#task-form");
const azureForm = document.querySelector("#azure-form");
const taskList = document.querySelector("#task-list");
const runList = document.querySelector("#run-list");
const inspector = document.querySelector("#inspector");
const submissionResult = document.querySelector("#submission-result");
const azureResult = document.querySelector("#azure-result");
const refreshButton = document.querySelector("#refresh-button");
const taskSubmitButton = document.querySelector("#task-submit-button");
const taskSubmitStatus = document.querySelector("#task-submit-status");
const healthButton = document.querySelector("#show-health");
const heroStats = document.querySelector("#hero-stats");
const runtimeModeNote = document.querySelector("#runtime-mode-note");
const piAuthStatus = document.querySelector("#pi-auth-status");
const piAuthRefreshButton = document.querySelector("#pi-auth-refresh");
const piAuthLoginButton = document.querySelector("#pi-auth-login");
const TERMINAL_STATES = new Set(["successful", "partial", "failed", "blocked", "boundary-stopped", "interrupted"]);
const pendingTaskRuns = new Set();
const taskRunWatchers = new Map();
const runPollers = new Map();
let followedRunId = null;
let activePiAuthJobId = null;
let piAuthPollTimer = null;

runtimeModeNote.textContent =
  "Runtime mode: autonomous runner execution with github-pr delivery, so successful runs can open a real GitHub pull request.";

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(payload, null, 2));
  }

  return payload;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll(/[-_]+/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function summarizeValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "None";
    }

    return value
      .map((entry) => {
        if (entry && typeof entry === "object") {
          if (entry.path) {
            return String(entry.path);
          }
          if (entry.id) {
            return String(entry.id);
          }
          return JSON.stringify(entry);
        }
        return String(entry);
      })
      .join(", ");
  }

  if (typeof value === "object") {
    if (value.path) {
      return String(value.path);
    }
    if (value.id) {
      return String(value.id);
    }
    return JSON.stringify(value);
  }

  return String(value);
}

function makeSection(title, items) {
  const filteredItems = items.filter((item) => item && item.value !== undefined && item.value !== null && item.value !== "");
  if (filteredItems.length === 0) {
    return "";
  }

  return `
    <section class="result-section">
      <h4>${escapeHtml(title)}</h4>
      <dl class="result-grid">
        ${filteredItems
          .map(
            ({ label, value }) => `
              <div class="result-row">
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(summarizeValue(value))}</dd>
              </div>
            `,
          )
          .join("")}
      </dl>
    </section>
  `;
}

function buildErrorModel(error, context = {}) {
  let parsed = null;
  let message = error instanceof Error ? error.message : String(error);

  try {
    parsed = JSON.parse(message);
  } catch {
    parsed = null;
  }

  if (parsed && typeof parsed === "object") {
    const details = [];

    if (parsed.error) {
      details.push({ label: "Error", value: parsed.error });
    }
    if (parsed.reason) {
      details.push({ label: "Reason", value: parsed.reason });
    }
    if (parsed.stage) {
      details.push({ label: "Stage", value: parsed.stage });
    }
    if (parsed.runId) {
      details.push({ label: "Run", value: parsed.runId });
    }
    if (parsed.taskId || parsed.taskRequestId) {
      details.push({ label: "Task", value: parsed.taskId || parsed.taskRequestId });
    }
    if (Array.isArray(parsed.failedChecks) && parsed.failedChecks.length > 0) {
      details.push({ label: "Failed Checks", value: parsed.failedChecks });
    }
    if (Array.isArray(parsed.reasons) && parsed.reasons.length > 0) {
      details.push({ label: "Details", value: parsed.reasons });
    }

    return {
      headline: context.title || parsed.error || parsed.reason || "Request needs attention",
      tone: "warning",
      sections: [
        {
          title: "Issue Summary",
          items: details.length > 0 ? details : [{ label: "Details", value: "Review the payload below." }],
        },
      ],
      rawPayload: parsed,
      rawLabel: context.rawLabel || "Raw error payload",
    };
  }

  return {
    headline: context.title || "Request needs attention",
    tone: "warning",
    sections: [
      {
        title: "Issue Summary",
        items: [{ label: "Message", value: message }],
      },
    ],
    rawPayload: {
      message,
    },
    rawLabel: context.rawLabel || "Raw error details",
  };
}

function inferResultModel(payload, context = {}) {
  if (context.kind === "run-progress" && payload?.run) {
    const run = payload.run;
    return {
      headline: `Run ${run.id} is in progress`,
      tone: "info",
      sections: [
        {
          title: "Live Status",
          items: [
            { label: "Stage", value: run?.progressState?.currentStage || run.currentStage },
            { label: "Outcome", value: run.currentOutcomeState },
            { label: "Task", value: run.taskRequestId },
            { label: "Run", value: run.id },
          ],
        },
      ],
      rawPayload: payload,
      rawLabel: "Live run payload",
    };
  }

  if (payload?.task && !payload?.run) {
    const task = payload.task;
    return {
      headline: `Task ${task.id}`,
      tone: "neutral",
      sections: [
        {
          title: "Task Overview",
          items: [
            { label: "Title", value: task.title },
            { label: "Status", value: task.status },
            { label: "Repository", value: task.repository },
            { label: "Expected Outcome", value: task.expectedOutcome },
          ],
        },
        {
          title: "Execution Context",
          items: [
            { label: "Objective", value: task.objective },
            { label: "Constraints", value: task.constraints },
            { label: "Run", value: task.runId || "Not started" },
          ],
        },
      ],
      rawPayload: payload,
      rawLabel: "Task payload",
    };
  }

  if (payload?.importedFrom) {
    const taskId = payload.taskRequestId || payload.taskId || payload.task?.id;
    return {
      headline: payload.ok ? "Azure ticket imported" : "Azure import needs attention",
      tone: payload.ok ? "success" : "warning",
      sections: [
        {
          title: "Import Summary",
          items: [
            { label: "Task", value: taskId },
            { label: "Source", value: payload.importedFrom.system },
            { label: "Work Item", value: payload.importedFrom.workItemId },
            { label: "Status", value: payload.ok ? "Imported into task queue" : "Import failed" },
          ],
        },
        {
          title: "Next Step",
          items: [
            { label: "Recommended Action", value: taskId ? `Inspect ${taskId} or launch the full flow.` : "Review the payload below." },
          ],
        },
      ],
      rawPayload: payload,
      rawLabel: "Azure import payload",
    };
  }

  if ((payload?.taskRequestId || payload?.taskId) && !payload?.run && !payload?.runs && !payload?.tasks) {
    const taskId = payload.taskRequestId || payload.taskId;
    const reasons = Array.isArray(payload.reasons) ? payload.reasons : [];
    return {
      headline: payload.ok ? "Task submitted" : "Task submission needs attention",
      tone: payload.ok ? "success" : "warning",
      sections: [
        {
          title: "Submission Summary",
          items: [
            { label: "Task", value: taskId },
            { label: "Status", value: payload.ok ? "Ready for execution" : "Not accepted" },
            { label: "Run", value: payload.runId || "Not started" },
          ],
        },
        {
          title: "Follow-up",
          items: [
            { label: "Next Step", value: payload.ok ? `Use Run Full Flow on ${taskId} when ready.` : reasons.join(", ") || "Review the raw payload below." },
          ],
        },
      ],
      rawPayload: payload,
      rawLabel: "Submission payload",
    };
  }

  if (payload?.run) {
    const run = payload.run;
    const changedFiles = run?.completion?.changedFiles || run?.execution?.changes || [];
    const commandsRun = run?.completion?.commandsRun || [];
    const notes = run?.completion?.notes || [];
    return {
      headline: `Run ${run.id}`,
      tone: isRunTerminal(run) ? (run.currentOutcomeState === "successful" ? "success" : "warning") : "info",
      sections: [
        {
          title: "Run Summary",
          items: [
            { label: "Outcome", value: run.currentOutcomeState },
            { label: "Stage", value: run?.progressState?.currentStage || run.currentStage },
            { label: "Task", value: run.taskRequestId },
            { label: "Pull Request", value: run.pullRequestId || run?.delivery?.pullRequest?.url || "Not created" },
          ],
        },
        {
          title: "Delivery Highlights",
          items: [
            { label: "Summary", value: run?.completion?.summary || run?.execution?.summary || run?.failureClassification?.summary || "No summary available" },
            { label: "Changed Files", value: changedFiles },
            { label: "Commands Run", value: commandsRun },
            { label: "Notes", value: notes },
          ],
        },
      ],
      rawPayload: payload,
      rawLabel: "Run payload",
    };
  }

  if (payload?.data?.runId || payload?.data?.canonicalRunRecord) {
    const data = payload.data;
    return {
      headline: `Structured report for ${data.runId || data.canonicalRunRecord}`,
      tone: "neutral",
      sections: [
        {
          title: "Structured Overview",
          items: [
            { label: "Run", value: data.runId || data.canonicalRunRecord },
            { label: "Task", value: data.inputs?.task?.id },
            { label: "Completion", value: data.outcomes?.completion?.outcome || data.states?.progress?.currentOutcomeState },
            { label: "Delivery", value: data.outputs?.delivery?.pullRequest?.url || data.outputs?.delivery?.status || "No delivery artifact" },
          ],
        },
        {
          title: "Evidence",
          items: [
            { label: "Changed Files", value: data.outputs?.changes || data.outcomes?.completion?.changedFiles },
            { label: "Validation", value: data.states?.validation?.summary || data.states?.validation?.outcome },
            { label: "Failure Classification", value: data.outcomes?.failureClassification?.summary },
          ],
        },
      ],
      rawPayload: payload,
      rawLabel: "Structured run data",
    };
  }

  if (payload?.auth || payload?.job) {
    return {
      headline: payload?.auth?.authenticated ? "Subscription auth ready" : "Subscription auth required",
      tone: payload?.auth?.authenticated ? "success" : payload?.job?.state === "pending" ? "info" : "warning",
      sections: [
        {
          title: "Auth Status",
          items: [
            { label: "Mode", value: payload?.auth?.mode || payload?.job?.provider || "none" },
            { label: "Authenticated", value: String(Boolean(payload?.auth?.authenticated)) },
            { label: "Shared Agent Dir", value: payload?.auth?.sharedAgentDir || payload?.job?.sharedAgentDir },
            { label: "Authenticated At", value: payload?.auth?.authenticatedAt || "Not yet" },
          ],
        },
        {
          title: "Login Progress",
          items: [
            { label: "Job", value: payload?.job?.jobId || "No active job" },
            { label: "State", value: payload?.job?.state || "idle" },
            { label: "Message", value: payload?.job?.message || (payload?.auth?.authenticated ? "Ready for shared Pi execution." : "Open the browser flow to sign in.") },
          ],
        },
      ],
      rawPayload: payload,
      rawLabel: "Pi auth payload",
    };
  }

  if (payload?.runs || payload?.tasks || payload?.repositories) {
    return {
      headline: context.title || "Collection response",
      tone: "neutral",
      sections: [
        {
          title: "Overview",
          items: [
            { label: "Tasks", value: payload.tasks?.length },
            { label: "Runs", value: payload.runs?.length },
            { label: "Repositories", value: payload.repositories?.length },
          ],
        },
      ],
      rawPayload: payload,
      rawLabel: context.rawLabel || "Collection payload",
    };
  }

  if (payload?.status || payload?.service || payload?.uptime || typeof payload?.ok === "boolean") {
    return {
      headline: "Service health",
      tone: payload.status === "ok" || payload.ok === true ? "success" : "neutral",
      sections: [
        {
          title: "Health Check",
          items: Object.entries(payload).map(([key, value]) => ({ label: formatLabel(key), value })),
        },
      ],
      rawPayload: payload,
      rawLabel: "Health payload",
    };
  }

  return {
    headline: context.title || "Result",
    tone: "neutral",
    sections: [
      {
        title: "Summary",
        items: [{ label: "Details", value: "Review the raw payload below." }],
      },
    ],
    rawPayload: payload,
    rawLabel: context.rawLabel || "Raw payload",
  };
}

function renderStructuredResult(target, model) {
  target.classList.remove("muted");
  target.innerHTML = `
    <div class="result-shell result-tone-${escapeHtml(model.tone || "neutral")}">
      <div class="result-summary">
        <p class="result-kicker">Summary</p>
        <h3>${escapeHtml(model.headline || "Result")}</h3>
        ${model.sections.map((section) => makeSection(section.title, section.items || [])).join("")}
      </div>
      <details class="raw-result">
        <summary>${escapeHtml(model.rawLabel || "Raw payload / debug JSON")}</summary>
        <pre class="code-block raw-json">${escapeHtml(JSON.stringify(model.rawPayload, null, 2))}</pre>
      </details>
    </div>
  `;
}

function showResult(target, payload, context = {}) {
  renderStructuredResult(target, inferResultModel(payload, context));
}

function showJson(target, payload, context = {}) {
  showResult(target, payload, context);
}

function showError(target, error, context = {}) {
  renderStructuredResult(target, buildErrorModel(error, context));
}

function stopTaskRunWatcher(taskId) {
  const timeoutId = taskRunWatchers.get(taskId);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  taskRunWatchers.delete(taskId);
}

function stopRunPolling(runId) {
  const timeoutId = runPollers.get(runId);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  runPollers.delete(runId);
}

function stopPiAuthPolling() {
  if (piAuthPollTimer) {
    clearTimeout(piAuthPollTimer);
  }
  piAuthPollTimer = null;
}

function setTaskSubmissionState({ busy = false, message, buttonLabel } = {}) {
  taskSubmitButton.disabled = busy;
  taskSubmitButton.textContent = buttonLabel || (busy ? "Creating…" : "Create Task");
  taskSubmitStatus.textContent = message || "Ready to create a task via the live API.";
}

function isRunTerminal(run) {
  return Boolean(run?.progressState?.terminal) || TERMINAL_STATES.has(run?.currentOutcomeState);
}

function showRunProgress(run) {
  showResult(
    inspector,
    { run },
    {
      kind: "run-progress",
    },
  );
}

async function pollRun(runId) {
  try {
    const payload = await api(`/api/runs/${runId}`);
    const run = payload.run;

    if (followedRunId === runId) {
      if (isRunTerminal(run)) {
        showJson(inspector, payload, { title: `Run ${runId}` });
      } else {
        showRunProgress(run);
      }
    }

    if (isRunTerminal(run)) {
      stopRunPolling(runId);
      await refreshDashboard();
      return;
    }
  } catch (error) {
    if (followedRunId === runId) {
      showError(inspector, error, { title: `Run ${runId} needs attention` });
    }
    stopRunPolling(runId);
    return;
  }

  const timeoutId = window.setTimeout(() => {
    pollRun(runId).catch((error) => {
      if (followedRunId === runId) {
        showError(inspector, error, { title: `Run ${runId} needs attention` });
      }
      stopRunPolling(runId);
    });
  }, 2000);
  runPollers.set(runId, timeoutId);
}

function ensureRunPolling(runId) {
  if (!runId || runPollers.has(runId)) {
    return;
  }

  void pollRun(runId);
}

async function watchTaskForRun(taskId) {
  try {
    const payload = await api(`/api/tasks/${taskId}`);
    const task = payload.task;

    if (task.runId) {
      pendingTaskRuns.delete(taskId);
      stopTaskRunWatcher(taskId);
      followedRunId = task.runId;
      const runPayload = await api(`/api/runs/${task.runId}`);
      if (isRunTerminal(runPayload.run)) {
        showJson(inspector, runPayload, { title: `Run ${task.runId}` });
      } else {
        showRunProgress(runPayload.run);
        ensureRunPolling(task.runId);
      }
      await refreshDashboard();
      return;
    }
  } catch (error) {
    showError(inspector, error, { title: `Task ${taskId} needs attention` });
    pendingTaskRuns.delete(taskId);
    stopTaskRunWatcher(taskId);
    await refreshDashboard();
    return;
  }

  const timeoutId = window.setTimeout(() => {
    void watchTaskForRun(taskId);
  }, 1200);
  taskRunWatchers.set(taskId, timeoutId);
}

function card(title, meta, buttons = []) {
  const wrapper = document.createElement("section");
  wrapper.className = "item-card";

  const header = document.createElement("div");
  header.className = "item-card-head";
  header.innerHTML = `<h3>${title}</h3><p>${meta}</p>`;
  wrapper.append(header);

  const actions = document.createElement("div");
  actions.className = "item-actions";
  for (const button of buttons) {
    actions.append(button);
  }
  wrapper.append(actions);
  return wrapper;
}

function actionButton(label, handler, kind = "default") {
  const button = document.createElement("button");
  button.textContent = label;
  if (kind === "ghost") {
    button.className = "ghost-button";
  }
  button.addEventListener("click", handler);
  return button;
}

function emptyState(eyebrow, title, message, hint, options = {}) {
  const { variant = "default", bullets = [], accent = "•" } = options;
  const wrapper = document.createElement("section");
  wrapper.className = `empty-state empty-state-${variant}`;
  const bulletMarkup = bullets.length
    ? `
      <ul class="empty-state-list">
        ${bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
      </ul>
    `
    : "";
  wrapper.innerHTML = `
    <div class="empty-state-mark" aria-hidden="true">
      <span>${accent}</span>
    </div>
    <div class="empty-state-copy">
      <p class="empty-state-eyebrow">${eyebrow}</p>
      <h3>${title}</h3>
      <p>${message}</p>
      ${bulletMarkup}
      <p class="empty-state-hint">${hint}</p>
    </div>
  `;
  return wrapper;
}

async function refreshPiAuthStatus() {
  try {
    const payload = await api("/api/pi/auth/status");
    showJson(piAuthStatus, payload, { title: "Pi subscription auth" });
    piAuthLoginButton.disabled = Boolean(payload?.auth?.authenticated);
    piAuthLoginButton.textContent = payload?.auth?.authenticated ? "Connected" : "Connect ChatGPT";
    return payload;
  } catch (error) {
    showError(piAuthStatus, error, { title: "Pi auth unavailable" });
    return null;
  }
}

async function pollPiAuthJob(jobId) {
  try {
    const payload = await api(`/api/pi/auth/jobs/${jobId}`);
    showJson(piAuthStatus, payload, { title: "Pi auth progress" });
    if (payload?.job?.state === "completed" || payload?.auth?.authenticated) {
      activePiAuthJobId = null;
      stopPiAuthPolling();
      await refreshPiAuthStatus();
      return;
    }
  } catch (error) {
    showError(piAuthStatus, error, { title: "Pi auth progress unavailable" });
    activePiAuthJobId = null;
    stopPiAuthPolling();
    return;
  }

  piAuthPollTimer = window.setTimeout(() => {
    void pollPiAuthJob(jobId);
  }, 1500);
}

async function startPiAuthLogin() {
  try {
    const payload = await api("/api/pi/auth/login", { method: "POST" });
    activePiAuthJobId = payload.job.jobId;
    showJson(piAuthStatus, payload, { title: "Pi auth started" });
    window.open(payload.job.loginUrl, "pi-subscription-auth", "popup,width=900,height=780");
    stopPiAuthPolling();
    void pollPiAuthJob(activePiAuthJobId);
  } catch (error) {
    showError(piAuthStatus, error, { title: "Unable to start Pi auth" });
  }
}

async function refreshDashboard() {
  const [taskPayload, runPayload, repositoryPayload] = await Promise.all([
    api("/api/tasks"),
    api("/api/runs"),
    api("/api/repositories"),
  ]);
  const activeRunIdsByTask = new Map(
    runPayload.runs
      .filter((run) => !TERMINAL_STATES.has(run.currentOutcomeState))
      .map((run) => [run.taskRequestId, run.id]),
  );

  heroStats.innerHTML = `
    <div class="stat"><strong>${taskPayload.tasks.length}</strong><span>Tasks</span></div>
    <div class="stat"><strong>${runPayload.runs.length}</strong><span>Runs</span></div>
    <div class="stat"><strong>${repositoryPayload.repositories.length}</strong><span>Repos</span></div>
  `;

  taskList.replaceChildren();
  if (taskPayload.tasks.length === 0) {
    taskList.append(
      emptyState(
        "Ready To Start",
        "No tasks in the queue",
        "Capture the next piece of work so the control room has a clear brief to execute against.",
        "Once a task is saved, it becomes the launch point for the full autonomous flow.",
        {
          variant: "tasks",
          accent: "→",
          bullets: [
            "Give the task a crisp title and objective.",
            "Add constraints so the run stays inside the rails.",
            "Set the expected outcome to define what success looks like.",
          ],
        },
      ),
    );
  }

  for (const task of taskPayload.tasks) {
    const inspect = actionButton("Inspect", async () => {
      followedRunId = null;
      showJson(inspector, await api(`/api/tasks/${task.id}`), { title: `Task ${task.id}` });
    });
    const activeRunId = activeRunIdsByTask.get(task.id);
    const run = actionButton(activeRunId || pendingTaskRuns.has(task.id) ? "Run In Progress" : "Run Full Flow", async () => {
      if (pendingTaskRuns.has(task.id) || activeRunIdsByTask.has(task.id)) {
        return;
      }

      pendingTaskRuns.add(task.id);
      showResult(
        inspector,
        {
          taskRequestId: task.id,
          ok: true,
          runId: null,
          status: "Launching full autonomous flow",
        },
        { title: `Starting ${task.id}` },
      );
      await refreshDashboard();
      void watchTaskForRun(task.id);

      try {
        const result = await api(`/api/tasks/${task.id}/run`, { method: "POST" });
        pendingTaskRuns.delete(task.id);
        stopTaskRunWatcher(task.id);
        if (result.runId) {
          followedRunId = result.runId;
          stopRunPolling(result.runId);
        }
        showJson(inspector, result, { title: `Run started for ${task.id}` });
        await refreshDashboard();
      } catch (error) {
        pendingTaskRuns.delete(task.id);
        stopTaskRunWatcher(task.id);
        showError(inspector, error, { title: `Unable to start ${task.id}` });
        await refreshDashboard();
      }
    });
    run.disabled = pendingTaskRuns.has(task.id) || Boolean(activeRunId);
    taskList.append(card(task.title, `${task.id} · ${task.status}`, [inspect, run]));
  }

  runList.replaceChildren();
  if (runPayload.runs.length === 0) {
    runList.append(
      emptyState(
        "Waiting On Launch",
        "No runs have started",
        "The runway is clear. Start a task when you're ready to create a live execution record for the next delivery attempt.",
        "Run records appear here automatically as soon as a task enters the flow.",
        {
          variant: "runs",
          accent: "↗",
          bullets: [
            "Use Run Full Flow from a task card to kick things off.",
            "Active runs will stream status updates into the inspector.",
            "Completed runs keep their history, validation, and delivery details here.",
          ],
        },
      ),
    );
  }

  for (const run of runPayload.runs) {
    if (!TERMINAL_STATES.has(run.currentOutcomeState)) {
      ensureRunPolling(run.id);
    }

    const inspect = actionButton("Inspect", async () => {
      followedRunId = null;
      showJson(inspector, await api(`/api/runs/${run.id}`), { title: `Run ${run.id}` });
    });
    const history = actionButton("History", async () => {
      followedRunId = null;
      showJson(inspector, await api(`/api/runs/${run.id}/history`), { title: `Run ${run.id} history`, rawLabel: "Run history payload" });
    });
    const status = actionButton("Status", async () => {
      try {
        if (TERMINAL_STATES.has(run.currentOutcomeState)) {
          followedRunId = null;
          showJson(inspector, await api(`/api/runs/${run.id}/status`), { title: `Run ${run.id} status`, rawLabel: "Run status payload" });
          return;
        }

        followedRunId = run.id;
        const payload = await api(`/api/runs/${run.id}`);
        showRunProgress(payload.run);
        ensureRunPolling(run.id);
      } catch (error) {
        showError(inspector, error, { title: `Run ${run.id} status unavailable` });
      }
    }, "ghost");
    const structured = actionButton("Structured", async () => {
      followedRunId = null;
      showJson(inspector, await api(`/api/runs/${run.id}/structured`), { title: `Run ${run.id} structured report`, rawLabel: "Structured run payload" });
    }, "ghost");
    const pause = actionButton("Pause", async () => {
      try {
        followedRunId = null;
        showJson(
          inspector,
          await api(`/api/runs/${run.id}/operator-action`, {
            method: "POST",
            body: JSON.stringify({ action: "pause-run" }),
          }),
          { title: `Run ${run.id} operator action`, rawLabel: "Operator action payload" },
        );
        await refreshDashboard();
      } catch (error) {
        showError(inspector, error, { title: `Run ${run.id} operator action failed` });
      }
    }, "ghost");

    runList.append(
      card(
        `${run.id}`,
        `${run.currentStage} · ${run.currentOutcomeState}${run.pullRequestId ? ` · ${run.pullRequestId}` : ""}`,
        [inspect, history, status, structured, pause],
      ),
    );
  }
}

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(taskForm);
  const payload = {
    title: form.get("title"),
    objective: form.get("objective"),
    constraints: form.get("constraints"),
    expectedOutcome: form.get("expectedOutcome"),
    repository: form.get("repository"),
  };

  try {
    const result = await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showJson(submissionResult, result, { title: "Task submission" });
    await refreshDashboard();
  } catch (error) {
    showError(submissionResult, error, { title: "Task submission needs attention" });
  }
});

azureForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(azureForm);
  const payload = {
    workItemId: form.get("workItemId"),
    repository: form.get("repository"),
  };

  try {
    const result = await api("/api/intake/azure-work-item", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showJson(azureResult, result, { title: "Azure import" });
    await refreshDashboard();
  } catch (error) {
    showError(azureResult, error, { title: "Azure import needs attention" });
  }
});

refreshButton.addEventListener("click", refreshDashboard);
healthButton.addEventListener("click", async () => {
  followedRunId = null;
  showJson(inspector, await api("/api/health"), { title: "Service health" });
});
piAuthRefreshButton.addEventListener("click", () => {
  void refreshPiAuthStatus();
});
piAuthLoginButton.addEventListener("click", () => {
  void startPiAuthLogin();
});

Promise.all([refreshDashboard(), refreshPiAuthStatus()]).catch((error) => {
  showError(inspector, error, { title: "Dashboard unavailable" });
});
