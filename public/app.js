const taskForm = document.querySelector("#task-form");
const azureForm = document.querySelector("#azure-form");
const taskList = document.querySelector("#task-list");
const runList = document.querySelector("#run-list");
const inspector = document.querySelector("#inspector");
const submissionResult = document.querySelector("#submission-result");
const azureResult = document.querySelector("#azure-result");
const refreshButton = document.querySelector("#refresh-button");
const healthButton = document.querySelector("#show-health");
const heroStats = document.querySelector("#hero-stats");
const runtimeModeNote = document.querySelector("#runtime-mode-note");
const TERMINAL_STATES = new Set(["successful", "partial", "failed", "blocked", "boundary-stopped", "interrupted"]);
const pendingTaskRuns = new Set();
const taskRunWatchers = new Map();
const runPollers = new Map();
let followedRunId = null;

runtimeModeNote.textContent =
  "Runtime mode: agent-runner execution with github-pr delivery, so successful runs can open a real GitHub pull request.";

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

function showJson(target, payload) {
  target.textContent = JSON.stringify(payload, null, 2);
}

function showError(target, error) {
  target.textContent = error instanceof Error ? error.message : String(error);
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

function isRunTerminal(run) {
  return Boolean(run?.progressState?.terminal) || TERMINAL_STATES.has(run?.currentOutcomeState);
}

function showRunProgress(run) {
  const stage = run?.progressState?.currentStage || run?.currentStage || "unknown";
  inspector.textContent = `Run ${run.id} is running in ${stage} stage.\nCurrent outcome: ${run.currentOutcomeState}.\nPolling live status...`;
}

async function pollRun(runId) {
  try {
    const payload = await api(`/api/runs/${runId}`);
    const run = payload.run;

    if (followedRunId === runId) {
      if (isRunTerminal(run)) {
        showJson(inspector, payload);
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
      showError(inspector, error);
    }
    stopRunPolling(runId);
    return;
  }

  const timeoutId = window.setTimeout(() => {
    pollRun(runId).catch((error) => {
      if (followedRunId === runId) {
        showError(inspector, error);
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
        showJson(inspector, runPayload);
      } else {
        showRunProgress(runPayload.run);
        ensureRunPolling(task.runId);
      }
      await refreshDashboard();
      return;
    }
  } catch (error) {
    showError(inspector, error);
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
    taskList.textContent = "No tasks yet.";
  }

  for (const task of taskPayload.tasks) {
    const inspect = actionButton("Inspect", async () => {
      followedRunId = null;
      showJson(inspector, await api(`/api/tasks/${task.id}`));
    });
    const activeRunId = activeRunIdsByTask.get(task.id);
    const run = actionButton(activeRunId || pendingTaskRuns.has(task.id) ? "Run In Progress" : "Run Full Flow", async () => {
      if (pendingTaskRuns.has(task.id) || activeRunIdsByTask.has(task.id)) {
        return;
      }

      pendingTaskRuns.add(task.id);
      inspector.textContent = `Starting full run for ${task.id}...\nWaiting for the server to create a run and enter the first active stage.`;
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
        showJson(inspector, result);
        await refreshDashboard();
      } catch (error) {
        pendingTaskRuns.delete(task.id);
        stopTaskRunWatcher(task.id);
        showError(inspector, error);
        await refreshDashboard();
      }
    });
    run.disabled = pendingTaskRuns.has(task.id) || Boolean(activeRunId);
    taskList.append(card(task.title, `${task.id} · ${task.status}`, [inspect, run]));
  }

  runList.replaceChildren();
  if (runPayload.runs.length === 0) {
    runList.textContent = "No runs yet.";
  }

  for (const run of runPayload.runs) {
    if (!TERMINAL_STATES.has(run.currentOutcomeState)) {
      ensureRunPolling(run.id);
    }

    const inspect = actionButton("Inspect", async () => {
      followedRunId = null;
      showJson(inspector, await api(`/api/runs/${run.id}`));
    });
    const history = actionButton("History", async () => {
      followedRunId = null;
      showJson(inspector, await api(`/api/runs/${run.id}/history`));
    });
    const status = actionButton("Status", async () => {
      try {
        if (TERMINAL_STATES.has(run.currentOutcomeState)) {
          followedRunId = null;
          showJson(inspector, await api(`/api/runs/${run.id}/status`));
          return;
        }

        followedRunId = run.id;
        const payload = await api(`/api/runs/${run.id}`);
        showRunProgress(payload.run);
        ensureRunPolling(run.id);
      } catch (error) {
        showError(inspector, error);
      }
    }, "ghost");
    const structured = actionButton("Structured", async () => {
      followedRunId = null;
      showJson(inspector, await api(`/api/runs/${run.id}/structured`));
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
        );
        await refreshDashboard();
      } catch (error) {
        showError(inspector, error);
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
    showJson(submissionResult, result);
    await refreshDashboard();
  } catch (error) {
    submissionResult.textContent = error.message;
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
    showJson(azureResult, result);
    await refreshDashboard();
  } catch (error) {
    azureResult.textContent = error.message;
  }
});

refreshButton.addEventListener("click", refreshDashboard);
healthButton.addEventListener("click", async () => {
  followedRunId = null;
  showJson(inspector, await api("/api/health"));
});

refreshDashboard().catch((error) => {
  showError(inspector, error);
});
