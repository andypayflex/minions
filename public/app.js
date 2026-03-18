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

function emptyState(eyebrow, title, message, hint) {
  const wrapper = document.createElement("section");
  wrapper.className = "empty-state";
  wrapper.innerHTML = `
    <div class="empty-state-mark" aria-hidden="true">
      <span></span>
    </div>
    <div class="empty-state-copy">
      <p class="empty-state-eyebrow">${eyebrow}</p>
      <h3>${title}</h3>
      <p>${message}</p>
      <p class="empty-state-hint">${hint}</p>
    </div>
  `;
  return wrapper;
}

async function refreshDashboard() {
  const [taskPayload, runPayload, repositoryPayload] = await Promise.all([
    api("/api/tasks"),
    api("/api/runs"),
    api("/api/repositories"),
  ]);

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
        "Create a task from the form above to define the objective, constraints, and expected outcome for the next delivery run.",
        "A saved task becomes the launch point for the full autonomous flow.",
      ),
    );
  }

  for (const task of taskPayload.tasks) {
    const inspect = actionButton("Inspect", async () => {
      showJson(inspector, await api(`/api/tasks/${task.id}`));
    });
    const run = actionButton("Run Full Flow", async () => {
      const result = await api(`/api/tasks/${task.id}/run`, { method: "POST" });
      showJson(inspector, result);
      await refreshDashboard();
    });
    taskList.append(card(task.title, `${task.id} · ${task.status}`, [inspect, run]));
  }

  runList.replaceChildren();
  if (runPayload.runs.length === 0) {
    runList.append(
      emptyState(
        "Waiting On Launch",
        "No runs have started",
        "Launch a task to generate a live run with execution history, validation evidence, and delivery details.",
        "Run records will appear here as soon as a task enters the flow.",
      ),
    );
  }

  for (const run of runPayload.runs) {
    const inspect = actionButton("Inspect", async () => {
      showJson(inspector, await api(`/api/runs/${run.id}`));
    });
    const history = actionButton("History", async () => {
      showJson(inspector, await api(`/api/runs/${run.id}/history`));
    });
    const status = actionButton("Status", async () => {
      try {
        showJson(inspector, await api(`/api/runs/${run.id}/status`));
      } catch (error) {
        inspector.textContent = error.message;
      }
    }, "ghost");
    const structured = actionButton("Structured", async () => {
      showJson(inspector, await api(`/api/runs/${run.id}/structured`));
    }, "ghost");
    const pause = actionButton("Pause", async () => {
      try {
        showJson(
          inspector,
          await api(`/api/runs/${run.id}/operator-action`, {
            method: "POST",
            body: JSON.stringify({ action: "pause-run" }),
          }),
        );
        await refreshDashboard();
      } catch (error) {
        inspector.textContent = error.message;
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
  showJson(inspector, await api("/api/health"));
});

refreshDashboard().catch((error) => {
  inspector.textContent = error.message;
});
