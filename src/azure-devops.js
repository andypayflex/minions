function stripHtml(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseTags(tagValue) {
  return String(tagValue || "")
    .split(";")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function createBasicAuthHeader(personalAccessToken) {
  return `Basic ${Buffer.from(`:${personalAccessToken}`).toString("base64")}`;
}

export class AzureDevOpsClient {
  constructor(config = {}) {
    this.organization = config.organization;
    this.project = config.project;
    this.personalAccessToken = config.personalAccessToken;
    this.apiVersion = config.apiVersion || "7.1";
    this.fetchImpl = config.fetchImpl || fetch;
  }

  isConfigured() {
    return Boolean(this.organization && this.project && this.personalAccessToken);
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new Error(
        "Azure DevOps integration is not configured. Set AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT, and AZURE_DEVOPS_PAT.",
      );
    }
  }

  async getWorkItem(workItemId) {
    this.assertConfigured();

    const url = new URL(
      `https://dev.azure.com/${encodeURIComponent(this.organization)}/${encodeURIComponent(this.project)}/_apis/wit/workitems/${encodeURIComponent(workItemId)}`,
    );
    url.searchParams.set("$expand", "relations");
    url.searchParams.set("api-version", this.apiVersion);

    const response = await this.fetchImpl(url, {
      headers: {
        accept: "application/json",
        authorization: createBasicAuthHeader(this.personalAccessToken),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Azure DevOps work item request failed (${response.status}): ${body || response.statusText}`);
    }

    return response.json();
  }
}

function firstNonBlank(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

export function mapAzureWorkItemToTaskPayload(workItem, options = {}) {
  const fields = workItem.fields || {};
  const title = firstNonBlank(fields["System.Title"], `Azure Work Item ${workItem.id}`);
  const description = stripHtml(fields["System.Description"]);
  const acceptanceCriteria = stripHtml(fields["Microsoft.VSTS.Common.AcceptanceCriteria"]);
  const reproSteps = stripHtml(fields["Microsoft.VSTS.TCM.ReproSteps"]);
  const objective = firstNonBlank(description, acceptanceCriteria, reproSteps, title);
  const tags = parseTags(fields["System.Tags"]);
  const workItemType = firstNonBlank(fields["System.WorkItemType"], "Work Item");
  const state = firstNonBlank(fields["System.State"], "Unknown");
  const areaPath = firstNonBlank(fields["System.AreaPath"]);
  const iterationPath = firstNonBlank(fields["System.IterationPath"]);
  const repository =
    options.repository ||
    firstNonBlank(
      fields[options.repositoryFieldName],
      fields["Custom.Repository"],
      process.env.MINIONS_DEFAULT_REPOSITORY,
    ) ||
    "repo/minions-app";

  const constraints = [
    `${workItemType} from Azure DevOps`,
    `Current state: ${state}`,
    ...tags.map((tag) => `Tag: ${tag}`),
  ];

  if (areaPath) {
    constraints.push(`Area path: ${areaPath}`);
  }

  if (iterationPath) {
    constraints.push(`Iteration path: ${iterationPath}`);
  }

  if (options.additionalConstraints?.length) {
    constraints.push(...options.additionalConstraints);
  }

  const expectedOutcome =
    options.expectedOutcome ||
    `Resolve Azure DevOps work item ${workItem.id} with working code, tests, and review-ready delivery output.`;

  return {
    title,
    objective,
    repository,
    constraints,
    expectedOutcome,
    linkedItems: [
      {
        system: "azure-devops",
        id: String(workItem.id),
      },
    ],
    requestedActions: options.requestedActions || ["modify-code", "create-tests"],
    azureWorkItem: {
      id: workItem.id,
      url: workItem.url,
      workItemType,
      state,
      tags,
    },
  };
}

export function createAzureDevOpsClientFromEnv(overrides = {}) {
  return new AzureDevOpsClient({
    organization: overrides.organization || process.env.AZURE_DEVOPS_ORG,
    project: overrides.project || process.env.AZURE_DEVOPS_PROJECT,
    personalAccessToken: overrides.personalAccessToken || process.env.AZURE_DEVOPS_PAT,
    apiVersion: overrides.apiVersion || process.env.AZURE_DEVOPS_API_VERSION || "7.1",
    fetchImpl: overrides.fetchImpl,
  });
}

export { stripHtml };
