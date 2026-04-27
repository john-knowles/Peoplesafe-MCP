import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const openApiPath = path.join(repoRoot, "openapi", "nexus-api-resource-staging.json");
const schemaOutputPath = path.join(repoRoot, "src", "schema.ts");
const operationsOutputPath = path.join(repoRoot, "src", "generated", "operations.ts");

const openApi = JSON.parse(fs.readFileSync(openApiPath, "utf8"));

const TAG_NAME_MAP = {
  Person: "person",
  Team: "team",
  ReportingGroup: "group"
};

const TOOL_NAME_OVERRIDES = {
  "POST /person/create": "person_create",
  "DELETE /person/{identifier}/delete": "person_delete",
  "PUT /person/{identifier}/archive": "person_archive",
  "PUT /person/{identifier}/update": "person_update",
  "PUT /person/{identifier}/assignapp": "person_assign_app_subscription",
  "GET /people": "person_list",
  "GET /person/{identifier}": "person_get",
  "PATCH /person/{identifier}/patch": "person_patch",
  "GET /people/subscriptions": "person_list_subscriptions",
  "GET /person/{identifier}/subscription": "person_get_subscription",
  "PUT /person/{identifier}/subscription/assign": "person_assign_subscription",
  "POST /group/create": "group_create",
  "PUT /group/update": "group_update",
  "DELETE /group/delete": "group_delete",
  "PUT /group/manager/assign": "group_assign_manager",
  "PUT /group/member/assign": "group_assign_member",
  "PUT /group/member/remove": "group_remove_member",
  "PUT /group/manager/remove": "group_remove_manager",
  "GET /group/{identifier}": "group_get",
  "GET /group/{identifier}/members": "group_get_members",
  "PATCH /group/parentgroups/patch": "group_patch_parent_groups",
  "POST /team/create": "team_create",
  "PUT /team/update": "team_update",
  "DELETE /team/delete": "team_delete",
  "PUT /team/manager/assign": "team_assign_manager",
  "PUT /team/users/assign": "team_assign_users",
  "PUT /team/manager/remove": "team_remove_manager",
  "PUT /team/user/remove": "team_remove_user",
  "GET /team/{identifier}/users": "team_get_users",
  "GET /team/{identifier}": "team_get",
  "PATCH /person/{identifier}/team/membership/patch": "team_patch_person_membership",
  "PATCH /person/{identifier}/team/management/patch": "team_patch_person_management",
  "PATCH /team/parentgroups/patch": "team_patch_parent_groups",
  "GET /teams": "team_list"
};

function pascalCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function schemaConstName(name) {
  const sanitized = name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, character) => character.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");

  const withSafePrefix = /^[0-9]/.test(sanitized) ? `Schema${sanitized}` : sanitized;
  return `${withSafePrefix}Schema`;
}

function operationSchemaConstName(toolName) {
  return `${pascalCase(toolName)}InputSchema`;
}

function refNameFromPointer(pointer) {
  return pointer.split("/").at(-1);
}

function preferredContentType(content = {}) {
  if (content["application/json"]) {
    return "application/json";
  }

  const firstEntry = Object.keys(content)[0];
  return firstEntry ?? null;
}

function literalExpression(value) {
  if (typeof value === "string") {
    return `z.literal(${JSON.stringify(value)})`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return `z.literal(${String(value)})`;
  }

  return "z.any()";
}

function withNullable(schema, expression) {
  if (schema?.nullable) {
    return `${expression}.nullable()`;
  }

  return expression;
}

function renderZod(schema) {
  if (!schema) {
    return "z.unknown()";
  }

  if (schema.$ref) {
    return withNullable(schema, `z.lazy(() => ${schemaConstName(refNameFromPointer(schema.$ref))})`);
  }

  if (schema.enum) {
    const literals = schema.enum.map((value) => literalExpression(value)).join(", ");
    return withNullable(schema, `z.union([${literals}])`);
  }

  if (schema.type === "array") {
    return withNullable(schema, `z.array(${renderZod(schema.items)})`);
  }

  if (schema.type === "object" || schema.properties) {
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    const propertyEntries = Object.entries(properties).map(([propertyName, propertySchema]) => {
      const propertyExpression = renderZod(propertySchema);
      const finalExpression = required.has(propertyName) ? propertyExpression : `${propertyExpression}.optional()`;
      return `${JSON.stringify(propertyName)}: ${finalExpression}`;
    });
    const objectExpression = `z.object({${propertyEntries.length ? `\n${propertyEntries.map((entry) => `  ${entry}`).join(",\n")}\n` : ""}}).strict()`;
    return withNullable(schema, objectExpression);
  }

  if (schema.type === "integer") {
    return withNullable(schema, "z.number().int()");
  }

  if (schema.type === "number") {
    return withNullable(schema, "z.number()");
  }

  if (schema.type === "boolean") {
    return withNullable(schema, "z.boolean()");
  }

  if (schema.type === "string") {
    if (schema.format === "uuid") {
      return withNullable(schema, "z.string().uuid()");
    }

    if (schema.format === "date-time") {
      return withNullable(schema, "z.string().datetime({ offset: true })");
    }

    return withNullable(schema, "z.string()");
  }

  return withNullable(schema, "z.unknown()");
}

function renderParameterGroup(parameters) {
  const required = new Set(parameters.filter((parameter) => parameter.required).map((parameter) => parameter.name));
  const entries = parameters.map((parameter) => {
    const expression = renderZod(parameter.schema);
    const finalExpression = required.has(parameter.name) ? expression : `${expression}.optional()`;
    return `${JSON.stringify(parameter.name)}: ${finalExpression}`;
  });

  const groupExpression = `z.object({${entries.length ? `\n${entries.map((entry) => `  ${entry}`).join(",\n")}\n` : ""}}).strict()`;

  if (parameters.some((parameter) => parameter.required)) {
    return groupExpression;
  }

  return `${groupExpression}.optional()`;
}

function buildInputSchemaExpression(operation) {
  const parameters = operation.parameters ?? [];
  const pathParameters = parameters.filter((parameter) => parameter.in === "path");
  const queryParameters = parameters.filter((parameter) => parameter.in === "query");
  const bodySchema = operation.requestBody
    ? (() => {
        const contentType = preferredContentType(operation.requestBody.content);
        const body = contentType ? operation.requestBody.content[contentType]?.schema : undefined;
        return body ? renderZod(body) : "z.unknown()";
      })()
    : null;

  const parts = [
    // Claude often sends null or "" for optional fields; coerce before .url() so validation passes and env-based base URL can be used.
    `baseUrl: z.preprocess((v) => (v === null || v === "" ? undefined : v), z.string().url().optional()).describe("Always omit unless intentionally overriding the server config. PEOPLESAFE_BASE_URL is set by the MCP host — do not ask the user for a base URL.")`
  ];

  if (pathParameters.length > 0) {
    parts.push(`path: ${renderParameterGroup(pathParameters)}`);
  }

  if (queryParameters.length > 0) {
    parts.push(`query: ${renderParameterGroup(queryParameters)}`);
  }

  if (bodySchema) {
    parts.push(`body: ${operation.requestBody?.required ? bodySchema : `${bodySchema}.optional()`}`);
  }

  return `z.object({\n${parts.map((part) => `  ${part}`).join(",\n")}\n}).strict()`;
}

function toolNameForOperation(method, pathName, operationId) {
  const override = TOOL_NAME_OVERRIDES[`${method.toUpperCase()} ${pathName}`];
  if (override) {
    return override;
  }

  return operationId.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function renderSchemaFile() {
  const componentEntries = Object.entries(openApi.components.schemas);
  const declarations = componentEntries
    .map(([name, schema]) => `export const ${schemaConstName(name)} = ${renderZod(schema)};`)
    .join("\n\n");

  const registryEntries = componentEntries
    .map(([name]) => `  ${JSON.stringify(name)}: ${schemaConstName(name)}`)
    .join(",\n");

  return `import { z } from "zod";

export const AuthHeaderOverrideSchema = z
  .object({
    authToken: z.string().min(1).optional(),
    subscriptionKey: z.string().min(1).optional()
  })
  .strict();

${declarations}

export const componentSchemas = {
${registryEntries}
} as const;
`;
}

function renderOperationsFile() {
  const schemaImports = new Set();
  const operationDeclarations = [];
  const groupedOperations = {
    person: [],
    team: [],
    group: []
  };

  for (const [pathName, pathItem] of Object.entries(openApi.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      const toolName = toolNameForOperation(method, pathName, operation.operationId ?? `${method}_${pathName}`);
      const inputSchemaName = operationSchemaConstName(toolName);
      const responseContentType = preferredContentType(operation.responses?.["200"]?.content);
      const responseSchema = responseContentType
        ? operation.responses?.["200"]?.content?.[responseContentType]?.schema
        : undefined;
      const requestContentType = preferredContentType(operation.requestBody?.content);
      const requestBodySchema = requestContentType
        ? operation.requestBody?.content?.[requestContentType]?.schema
        : undefined;
      const errorResponse = Object.entries(operation.responses ?? {}).find(([status]) => !status.startsWith("2"));
      const errorContentType = preferredContentType(errorResponse?.[1]?.content);
      const errorSchema = errorContentType ? errorResponse?.[1]?.content?.[errorContentType]?.schema : undefined;
      const tag = TAG_NAME_MAP[operation.tags?.[0] ?? ""] ?? "person";
      const parameterDefinitions = (operation.parameters ?? []).map((parameter) => ({
        location: parameter.in,
        name: parameter.name,
        required: Boolean(parameter.required)
      }));

      const refsToImport = [requestBodySchema, responseSchema, errorSchema, ...(operation.parameters ?? []).map((parameter) => parameter.schema)]
        .flatMap((schema) => collectRefs(schema));
      refsToImport.forEach((referenceName) => schemaImports.add(schemaConstName(referenceName)));

      operationDeclarations.push(`export const ${inputSchemaName} = ${buildInputSchemaExpression(operation)};`);

      const metadataExpression = `{
  toolName: ${JSON.stringify(toolName)},
  title: ${JSON.stringify(operation.summary ?? toolName)},
  description: ${JSON.stringify(operation.description ?? operation.summary ?? toolName)},
  method: ${JSON.stringify(method.toUpperCase())},
  path: ${JSON.stringify(pathName)},
  operationId: ${JSON.stringify(operation.operationId ?? toolName)},
  tag: ${JSON.stringify(tag)},
  parameters: ${JSON.stringify(parameterDefinitions, null, 2).replace(/\n/g, "\n  ")},
  requestContentType: ${JSON.stringify(requestContentType)},
  responseContentType: ${JSON.stringify(responseContentType)},
  inputSchema: ${inputSchemaName},
  requestBodySchema: ${requestBodySchema ? renderSchemaReference(requestBodySchema) : "undefined"},
  responseSchema: ${responseSchema ? renderSchemaReference(responseSchema) : "undefined"},
  errorSchema: ${errorSchema ? renderSchemaReference(errorSchema) : "undefined"}
}`;

      groupedOperations[tag].push(metadataExpression);
    }
  }

  const imports = Array.from(schemaImports).sort().join(", ");

  return `import { z } from "zod";
import { ${imports} } from "../schema.js";

export type OperationTag = "person" | "team" | "group";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type OperationParameterLocation = "path" | "query";

export interface OperationParameterDefinition {
  location: OperationParameterLocation;
  name: string;
  required: boolean;
}

export interface OperationDefinition {
  toolName: string;
  title: string;
  description: string;
  method: HttpMethod;
  path: string;
  operationId: string;
  tag: OperationTag;
  parameters: OperationParameterDefinition[];
  requestContentType: string | null;
  responseContentType: string | null;
  inputSchema: z.ZodTypeAny;
  requestBodySchema?: z.ZodTypeAny;
  responseSchema?: z.ZodTypeAny;
  errorSchema?: z.ZodTypeAny;
}

${operationDeclarations.join("\n\n")}

export const personOperationDefinitions: OperationDefinition[] = [
${groupedOperations.person.map((entry) => indent(entry, 2)).join(",\n")}
];

export const teamOperationDefinitions: OperationDefinition[] = [
${groupedOperations.team.map((entry) => indent(entry, 2)).join(",\n")}
];

export const groupOperationDefinitions: OperationDefinition[] = [
${groupedOperations.group.map((entry) => indent(entry, 2)).join(",\n")}
];

export const allOperationDefinitions: OperationDefinition[] = [
  ...personOperationDefinitions,
  ...teamOperationDefinitions,
  ...groupOperationDefinitions
];
`;
}

function collectRefs(schema) {
  if (!schema || typeof schema !== "object") {
    return [];
  }

  const refs = [];

  if (schema.$ref) {
    refs.push(refNameFromPointer(schema.$ref));
  }

  for (const value of Object.values(schema)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        refs.push(...collectRefs(item));
      }
      continue;
    }

    refs.push(...collectRefs(value));
  }

  return refs;
}

function renderSchemaReference(schema) {
  if (!schema?.$ref) {
    return "z.unknown()";
  }

  return schemaConstName(refNameFromPointer(schema.$ref));
}

function indent(value, depth) {
  const prefix = " ".repeat(depth);
  return value
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

fs.mkdirSync(path.dirname(schemaOutputPath), { recursive: true });
fs.mkdirSync(path.dirname(operationsOutputPath), { recursive: true });

fs.writeFileSync(schemaOutputPath, renderSchemaFile());
fs.writeFileSync(operationsOutputPath, renderOperationsFile());

console.log(`Generated ${path.relative(repoRoot, schemaOutputPath)} and ${path.relative(repoRoot, operationsOutputPath)}`);
