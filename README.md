# Peoplesafe MCP

An experimental MCP server for the Peoplesafe Nexus User Management API, supporting multiple environments (Dev, Test, Staging, Production).

This repository exposes dedicated MCP tools for every `Person`, `Team`, and `ReportingGroup` endpoint defined in the Peoplesafe API, with generated `zod` validation and dual-key BYOK authentication.

## What’s Included

- `34` generated MCP tools mapped from the staging OpenAPI contract
- strict runtime schemas in `src/schema.ts`
- generated operation registry in `src/generated/operations.ts`
- modular tool registration under `src/tools/`
- transport factory in `src/index.ts`
- local `stdio` mode for desktop/editor clients
- `sse` mode for legacy cloud-hosted MCP clients
- Azure Functions adapter in `src/azure/httpTrigger.ts`
- ready-to-copy client configs for Claude Desktop, Cursor, Windsurf, VS Code, and OpenClaw

## Authentication

Every tool requires:

- `x-auth-token`
- `X-Subscription-Key`

Credential resolution order:

1. MCP tool input fields: `authToken`, `subscriptionKey`
2. Environment variables: `PEOPLESAFE_AUTH_TOKEN`, `PEOPLESAFE_SUBSCRIPTION_KEY`

If either value is missing, the server returns this exact instruction:

`I need your Peoplesafe API Base URL, Auth Token, and Subscription Key to proceed.`

## Configuration

The server supports the following environment variables, which can be set in your MCP client's configuration:

- `PEOPLESAFE_BASE_URL`: The base URL for the Peoplesafe API (e.g., for Dev, Test, Staging, or Production).
- `PEOPLESAFE_AUTH_TOKEN`: (Optional) Your Peoplesafe Auth Token.
- `PEOPLESAFE_SUBSCRIPTION_KEY`: (Optional) Your Peoplesafe Subscription Key.

If these values are provided in the configuration, the MCP will use them automatically. If they are omitted or empty, the MCP will ask you for them during the first tool call.

## Build And Run

```bash
npm install
npm run build
```

Local default:

```bash
npm start
```

That uses `stdio` unless `MCP_TRANSPORT` is set.

Available transport modes:

- `stdio`: local editor and desktop clients
- `sse`: legacy HTTP + SSE server on `/sse` and `/messages`
- `http`: Streamable HTTP server on `/mcp` with SSE compatibility also enabled

Examples:

```bash
MCP_TRANSPORT=stdio npm start
MCP_TRANSPORT=sse npm start
MCP_TRANSPORT=http npm start
```

For Azure App Service hosting, use:

```bash
MCP_TRANSPORT=sse npm start
```

The server automatically honors Azure’s assigned `PORT` and binds to `0.0.0.0` when running inside App Service.

## Client Integration Matrix

| Client | File in repo | Transport | Notes |
| --- | --- | --- | --- |
| Claude Desktop | `claude_config_snippet.json` | `stdio` | Uses `npx` + `tsx`. On Windows merge into `%APPDATA%\\Claude\\claude_desktop_config.json`. |
| Cursor | `.cursor/mcp.json` | `stdio` | Workspace config using `npm run start`. |
| Windsurf | `windsurf_mcp_config.json` | `stdio` | Compatible with `mcpServers` format used by Cascade clients. |
| VS Code | `.vscode/mcp.json` | `stdio` | Workspace-level MCP config with server name `Peoplesafe`. |
| OpenClaw | `openclaw.json` + `skills/peoplesafe/clawhub.json` | `stdio` | Includes a repo-local skill manifest and skill instructions. |

## Copy-Paste Configs

### Claude Desktop

File: `claude_config_snippet.json`

```json
{
  "mcpServers": {
    "peoplesafe": {
      "command": "node",
      "args": [
        "/path/to/peoplesafe-mcp/dist/index.js"
      ],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "PEOPLESAFE_BASE_URL": "",
        "PEOPLESAFE_AUTH_TOKEN": "",
        "PEOPLESAFE_SUBSCRIPTION_KEY": ""
      }
    }
  }
}
```

Mac app users can merge this into Claude Desktop’s config file. Windows users should place the equivalent content in `%APPDATA%\\Claude\\claude_desktop_config.json`.

### Cursor

File: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "peoplesafe": {
      "command": "npm",
      "args": ["run", "start"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "PEOPLESAFE_BASE_URL": "",
        "PEOPLESAFE_AUTH_TOKEN": "",
        "PEOPLESAFE_SUBSCRIPTION_KEY": ""
      }
    }
  }
}
```

### Windsurf

File: `windsurf_mcp_config.json`

```json
{
  "mcpServers": {
    "peoplesafe": {
      "command": "node",
      "args": [
        "/path/to/peoplesafe-mcp/dist/index.js"
      ],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "PEOPLESAFE_BASE_URL": "",
        "PEOPLESAFE_AUTH_TOKEN": "",
        "PEOPLESAFE_SUBSCRIPTION_KEY": ""
      }
    }
  }
}
```

### VS Code

File: `.vscode/mcp.json`

```json
{
  "servers": {
    "Peoplesafe": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "PEOPLESAFE_BASE_URL": "",
        "PEOPLESAFE_AUTH_TOKEN": "${env:PEOPLESAFE_AUTH_TOKEN}",
        "PEOPLESAFE_SUBSCRIPTION_KEY": "${env:PEOPLESAFE_SUBSCRIPTION_KEY}"
      }
    }
  }
}
```

### OpenClaw

Files:

- `openclaw.json`
- `skills/peoplesafe/clawhub.json`
- `skills/peoplesafe/SKILL.md`

`openclaw.json`

```json
{
  "mcp": {
    "servers": {
      "peoplesafe": {
        "command": "npm",
        "args": ["run", "start"],
        "env": {
          "MCP_TRANSPORT": "stdio",
          "PEOPLESAFE_BASE_URL": "",
          "PEOPLESAFE_AUTH_TOKEN": "",
          "PEOPLESAFE_SUBSCRIPTION_KEY": ""
        }
      }
    }
  },
  "skills": ["./skills/peoplesafe"]
}
```

## Tool Coverage

### Person Tools

- `person_create`
- `person_delete`
- `person_archive`
- `person_update`
- `person_assign_app_subscription`
- `person_list`
- `person_get`
- `person_patch`
- `person_list_subscriptions`
- `person_get_subscription`
- `person_assign_subscription`

### Team Tools

- `team_create`
- `team_update`
- `team_delete`
- `team_assign_manager`
- `team_assign_users`
- `team_remove_manager`
- `team_remove_user`
- `team_get_users`
- `team_get`
- `team_patch_person_membership`
- `team_patch_person_management`
- `team_patch_parent_groups`
- `team_list`

### Group Tools

- `group_create`
- `group_update`
- `group_delete`
- `group_assign_manager`
- `group_assign_member`
- `group_remove_member`
- `group_remove_manager`
- `group_get`
- `group_get_members`
- `group_patch_parent_groups`

## Azure Functions

Relevant files:

- `host.json`
- `peoplesafeMcp/function.json`
- `src/functionApp.ts`
- `src/azure/httpTrigger.ts`
- `.github/workflows/azure-deploy.yml`

Important:

- The Azure deploy workflow is intentionally inactive until you configure a protected GitHub Environment and the required Azure OIDC secrets.
- Simply keeping the workflow file in this public repo does not connect anything to your Azure account.
- No deployment can happen unless you manually run the workflow and GitHub Environment access is approved.

This repo uses the Node.js v4 programming model in code via `src/functionApp.ts`. The `peoplesafeMcp/function.json` file is included as companion HTTP binding metadata for teams and tooling that still expect an explicit trigger file in the repo.

## Azure App Service

If Azure Functions Consumption is blocked by subscription quota, Azure App Service is the easiest Azure-hosted fallback for this project.

Recommended first setup:

- publish: `Code`
- runtime: `Node 22 LTS`
- operating system: `Linux`
- pricing plan: `Free (F1)` if available

App settings to add:

- `MCP_TRANSPORT` = `sse`
- `PEOPLESAFE_AUTH_TOKEN` = your staging auth token
- `PEOPLESAFE_SUBSCRIPTION_KEY` = your staging subscription key

Startup command:

```bash
npm start
```

Expected public endpoint:

```text
https://<your-app-name>.azurewebsites.net/sse
```

Legacy SSE messages endpoint:

```text
https://<your-app-name>.azurewebsites.net/messages
```

### Required GitHub Secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

These are best stored as environment-scoped secrets on a protected GitHub Environment such as `azure-staging`, rather than as plain repository-wide secrets.

### GitHub Actions Behavior

The deploy workflow is manual-only and uses `workflow_dispatch`. It does not auto-deploy on push.

When you run `.github/workflows/azure-deploy.yml`, it will:

1. install dependencies
2. build TypeScript
3. prune dev dependencies
4. log into Azure with OIDC
5. set cloud app settings including `MCP_TRANSPORT=sse`
6. deploy the app to Azure Functions

For a safer public-repo setup, create a protected GitHub Environment, for example `azure-staging`, and configure:

1. required reviewers
2. environment-scoped Azure secrets
3. optional branch restrictions so only `main` can be deployed

Suggested manual deploy inputs:

- `ref`: `main`
- `environment`: `azure-staging`
- `function_app_name`: your Azure Function App name
- `resource_group`: your Azure resource group

## Inspector

For local MCP debugging:

```bash
npm run dev:inspect
```

The currently published `@modelcontextprotocol/inspector` package advertises a Node `22.7.5+` engine, so the main server build works on Node `20`, but Inspector is happiest on Node `22`.

## Important Notes

- Workspace configs assume you have already run `npm run build`.
- The Claude Desktop and Windsurf repo files use this machine’s current absolute path. If a teammate clones the repo elsewhere, they should update that path before copying the file.
- The server implementation does not hardcode credentials. If connector-level env values are absent, the MCP tools will tell the AI to ask for them.

## Verification

Verified locally with:

```bash
npm run build
```
