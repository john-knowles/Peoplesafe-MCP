# Peoplesafe User Management

Use this skill when you need to manage Peoplesafe people, teams, reporting groups, or app subscriptions through the local MCP server.

## Use This Skill For

- creating, updating, archiving, patching, and deleting people
- looking up people and subscriptions
- creating, updating, and deleting teams
- assigning or removing team users and team managers
- creating, updating, and deleting reporting groups
- assigning or removing group managers and members
- patching team and group parent relationships

## Working Rules

- Prefer the MCP tools exposed by the `peoplesafe` server over hand-written HTTP requests.
- If credentials are missing, tell the user to set them in MCP env or a credentials JSON file — do not collect secrets in chat.
- Treat the environment as real shared infrastructure and confirm destructive operations when appropriate.
- When performing lookups, prefer the most specific identifier the user has available.

## Tool Families

- `person_*`: person and subscription workflows
- `team_*`: team membership and management workflows
- `group_*`: reporting-group structure and membership workflows

## Authentication

The MCP server resolves credentials only from:

- environment variables: `PEOPLESAFE_BASE_URL`, `PEOPLESAFE_AUTH_TOKEN`, `PEOPLESAFE_SUBSCRIPTION_KEY`
- JSON file or inline JSON via `PEOPLESAFE_CONFIG_FILE`, `PEOPLESAFE_CONFIG_JSON`, or `--config`

Credentials are not accepted via tool arguments (so they cannot leak into conversation logs).

If credentials are unavailable, pause and point the user at env or config setup instead of retrying blindly.
