import { z } from "zod";
import { AssignGroupMemberRequestSchema, AssignGroupMemberResponseSchema, AssignManagerToGroupRequestSchema, AssignManagerToGroupResponseSchema, AssignManagerToTeamRequestSchema, AssignSubscriptionApiRequestSchema, AssignUsersToTeamRequestSchema, AssignUsersToTheTeamResponseSchema, CreatePersonRequestSchema, CreateReportingGroupRequestSchema, CreateReportingGroupResponseSchema, CreateTeamRequestSchema, CreateTeamResponseSchema, DeleteReportingGroupRequestSchema, DeleteTeamRequestSchema, ErrorResponseSchema, GetPersonByIdResponseSchema, PatchGroupParentGroupsRequestSchema, PatchParentGroupsResponseSchema, PatchPersonRequestSchema, PatchTeamParentGroupsRequestSchema, ReassignSubscriptionApiRequestSchema, RemoveGroupMemberRequestSchema, RemoveGroupMemberResponseSchema, RemoveManagerFromGroupRequestSchema, RemoveManagerFromGroupResponseSchema, RemoveManagerFromTeamRequestSchema, RemoveManagerFromTeamResponseSchema, RemoveUserFromTeamRequestSchema, RemoveUserFromTeamResponseSchema, UpdatePersonNodesManagementResponseSchema, UpdatePersonRequestSchema, UpdatePersonTeamsManagementRequestSchema, UpdatePersonTeamsMembershipRequestSchema, UpdatePersonTeamsMembershipResponseSchema, UpdateReportingGroupRequestSchema, UpdateReportingGroupResponseSchema, UpdateTeamRequestSchema, UpdateTeamResponseSchema, getPersonResponseSchema, getPersonsResponseSchema, getTeamsResponseSchema, groupDetailsResponseSchema, groupMembersResponseSchema, personWithSubscriptionResponseSchema, teamDetailsResponseSchema, teamUsersResponseSchema } from "../schema.js";

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

export const PersonCreateInputSchema = z.object({
  body: z.lazy(() => CreatePersonRequestSchema).optional()
}).strict();

export const PersonDeleteInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict()
}).strict();

export const PersonArchiveInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict()
}).strict();

export const PersonUpdateInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict(),
  body: z.lazy(() => UpdatePersonRequestSchema).optional()
}).strict();

export const PersonAssignAppSubscriptionInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict(),
  body: z.lazy(() => AssignSubscriptionApiRequestSchema).optional()
}).strict();

export const TeamGetUsersInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict()
}).strict();

export const PersonListInputSchema = z.object({
  query: z.object({
  "Page": z.number().int(),
  "PageSize": z.number().int(),
  "FirstName": z.string().optional(),
  "LastName": z.string().optional(),
  "Email": z.string().optional(),
  "PhoneNumber": z.string().optional()
}).strict()
}).strict();

export const PersonGetInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict()
}).strict();

export const GroupGetInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict()
}).strict();

export const GroupGetMembersInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict()
}).strict();

export const TeamGetInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict()
}).strict();

export const GroupCreateInputSchema = z.object({
  body: z.lazy(() => CreateReportingGroupRequestSchema).optional()
}).strict();

export const GroupUpdateInputSchema = z.object({
  body: z.lazy(() => UpdateReportingGroupRequestSchema).optional()
}).strict();

export const GroupDeleteInputSchema = z.object({
  body: z.lazy(() => DeleteReportingGroupRequestSchema).optional()
}).strict();

export const GroupAssignManagerInputSchema = z.object({
  body: z.lazy(() => AssignManagerToGroupRequestSchema).optional()
}).strict();

export const GroupAssignMemberInputSchema = z.object({
  body: z.lazy(() => AssignGroupMemberRequestSchema).optional()
}).strict();

export const GroupRemoveMemberInputSchema = z.object({
  body: z.lazy(() => RemoveGroupMemberRequestSchema).optional()
}).strict();

export const GroupRemoveManagerInputSchema = z.object({
  body: z.lazy(() => RemoveManagerFromGroupRequestSchema).optional()
}).strict();

export const TeamCreateInputSchema = z.object({
  body: z.lazy(() => CreateTeamRequestSchema).optional()
}).strict();

export const TeamUpdateInputSchema = z.object({
  body: z.lazy(() => UpdateTeamRequestSchema).optional()
}).strict();

export const TeamDeleteInputSchema = z.object({
  body: z.lazy(() => DeleteTeamRequestSchema).optional()
}).strict();

export const TeamAssignManagerInputSchema = z.object({
  body: z.lazy(() => AssignManagerToTeamRequestSchema).optional()
}).strict();

export const TeamAssignUsersInputSchema = z.object({
  body: z.lazy(() => AssignUsersToTeamRequestSchema).optional()
}).strict();

export const TeamRemoveManagerInputSchema = z.object({
  body: z.lazy(() => RemoveManagerFromTeamRequestSchema).optional()
}).strict();

export const TeamRemoveUserInputSchema = z.object({
  body: z.lazy(() => RemoveUserFromTeamRequestSchema).optional()
}).strict();

export const PersonPatchInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict(),
  body: z.lazy(() => PatchPersonRequestSchema).optional()
}).strict();

export const GroupPatchParentGroupsInputSchema = z.object({
  body: z.lazy(() => PatchGroupParentGroupsRequestSchema).optional()
}).strict();

export const TeamPatchPersonMembershipInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict(),
  body: z.lazy(() => UpdatePersonTeamsMembershipRequestSchema).optional()
}).strict();

export const TeamPatchPersonManagementInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict(),
  body: z.lazy(() => UpdatePersonTeamsManagementRequestSchema).optional()
}).strict();

export const TeamPatchParentGroupsInputSchema = z.object({
  body: z.lazy(() => PatchTeamParentGroupsRequestSchema).optional()
}).strict();

export const TeamListInputSchema = z.object({
  query: z.object({
  "Page": z.number().int(),
  "PageSize": z.number().int()
}).strict()
}).strict();

export const PersonListSubscriptionsInputSchema = z.object({}).strict();

export const PersonGetSubscriptionInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict()
}).strict();

export const PersonAssignSubscriptionInputSchema = z.object({
  path: z.object({
  "identifier": z.string()
}).strict(),
  body: z.lazy(() => ReassignSubscriptionApiRequestSchema).optional()
}).strict();

export const personOperationDefinitions: OperationDefinition[] = [
  {
    toolName: "person_create",
    title: "Create Person",
    description: "Endpoint to create a Person in Nexus.\r\nA Person is the main entity in Nexus.",
    method: "POST",
    path: "/person/create",
    operationId: "person-api_post_person_create",
    tag: "person",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: PersonCreateInputSchema,
    requestBodySchema: CreatePersonRequestSchema,
    responseSchema: GetPersonByIdResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "person_delete",
    title: "Delete Person by Identifier",
    description: "Endpoint to delete a person using PersonId from Nexus or Identifier (userReference).",
    method: "DELETE",
    path: "/person/{identifier}/delete",
    operationId: "person-api_delete_person_-identifier-_delete",
    tag: "person",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: null,
    inputSchema: PersonDeleteInputSchema,
    requestBodySchema: undefined,
    responseSchema: undefined,
    errorSchema: undefined
  },
  {
    toolName: "person_archive",
    title: "Archive Person by Identifier",
    description: "Endpoint to archive a person using PersonId from Nexus or Identifier (userReference).",
    method: "PUT",
    path: "/person/{identifier}/archive",
    operationId: "person-api_put_person_-identifier-_archive",
    tag: "person",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: null,
    inputSchema: PersonArchiveInputSchema,
    requestBodySchema: undefined,
    responseSchema: undefined,
    errorSchema: undefined
  },
  {
    toolName: "person_update",
    title: "Update Person",
    description: "Endpoint to update a person in Nexus.\r\nA Person is the main entity in Nexus.",
    method: "PUT",
    path: "/person/{identifier}/update",
    operationId: "person-api_put_person_-identifier-_update",
    tag: "person",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: PersonUpdateInputSchema,
    requestBodySchema: UpdatePersonRequestSchema,
    responseSchema: GetPersonByIdResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "person_assign_app_subscription",
    title: "Assign app subscription to Person.",
    description: "To assign app subscripton to a person using PersonId in Nexus or UserReference.",
    method: "PUT",
    path: "/person/{identifier}/assignapp",
    operationId: "customer-api_put_person_-identifier-_assignapp",
    tag: "person",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: "application/json",
    responseContentType: null,
    inputSchema: PersonAssignAppSubscriptionInputSchema,
    requestBodySchema: AssignSubscriptionApiRequestSchema,
    responseSchema: undefined,
    errorSchema: undefined
  },
  {
    toolName: "person_list",
    title: "Get Persons from nexus.",
    description: "Returns the People from Nexus.",
    method: "GET",
    path: "/people",
    operationId: "queries-api_get-people",
    tag: "person",
    parameters: [
      {
        "location": "query",
        "name": "Page",
        "required": true
      },
      {
        "location": "query",
        "name": "PageSize",
        "required": true
      },
      {
        "location": "query",
        "name": "FirstName",
        "required": false
      },
      {
        "location": "query",
        "name": "LastName",
        "required": false
      },
      {
        "location": "query",
        "name": "Email",
        "required": false
      },
      {
        "location": "query",
        "name": "PhoneNumber",
        "required": false
      }
    ],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: PersonListInputSchema,
    requestBodySchema: undefined,
    responseSchema: getPersonsResponseSchema,
    errorSchema: undefined
  },
  {
    toolName: "person_get",
    title: "Get Person by Identifier",
    description: "Returns person details based on person ID in Nexus or Identifier.",
    method: "GET",
    path: "/person/{identifier}",
    operationId: "queries-api_get-person-by-identifier",
    tag: "person",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: PersonGetInputSchema,
    requestBodySchema: undefined,
    responseSchema: getPersonResponseSchema,
    errorSchema: undefined
  },
  {
    toolName: "person_patch",
    title: "Patch Person",
    description: "Endpoint to patch a person in Nexus. This method allows the update only the fields that are sent in the request.\r\nNull values are ignored, if the additional property of TreatEmptyAsNull is set to true empty values will also be ignored.",
    method: "PATCH",
    path: "/person/{identifier}/patch",
    operationId: "person-api_patch_person_-identifier-_patch",
    tag: "person",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: PersonPatchInputSchema,
    requestBodySchema: PatchPersonRequestSchema,
    responseSchema: GetPersonByIdResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "person_list_subscriptions",
    title: "Get All People Subscriptions",
    description: "Returns all subscriptions for the users in the tenant.",
    method: "GET",
    path: "/people/subscriptions",
    operationId: "queries-api_get-all-people-subscriptions",
    tag: "person",
    parameters: [],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: PersonListSubscriptionsInputSchema,
    requestBodySchema: undefined,
    responseSchema: getPersonResponseSchema,
    errorSchema: undefined
  },
  {
    toolName: "person_get_subscription",
    title: "Get Person Subscription by Identifier",
    description: "Returns person subscription information based on person identifier.",
    method: "GET",
    path: "/person/{identifier}/subscription",
    operationId: "queries-api_get-person-subscription-by-identifier",
    tag: "person",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: PersonGetSubscriptionInputSchema,
    requestBodySchema: undefined,
    responseSchema: personWithSubscriptionResponseSchema,
    errorSchema: undefined
  },
  {
    toolName: "person_assign_subscription",
    title: "Assign, replace, or unassign the app subscription for a Person.",
    description: "To assign app subscription to a person using PersonId in Nexus or UserReference.",
    method: "PUT",
    path: "/person/{identifier}/subscription/assign",
    operationId: "customer-api_put_person_-identifier-_subscription_assign",
    tag: "person",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: "application/json",
    responseContentType: null,
    inputSchema: PersonAssignSubscriptionInputSchema,
    requestBodySchema: ReassignSubscriptionApiRequestSchema,
    responseSchema: undefined,
    errorSchema: undefined
  }
];

export const teamOperationDefinitions: OperationDefinition[] = [
  {
    toolName: "team_get_users",
    title: "Get team users by identifier",
    description: "Returns team members based on Group ID in Nexus or identifier.",
    method: "GET",
    path: "/team/{identifier}/users",
    operationId: "queries-api_get-team-users",
    tag: "team",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: TeamGetUsersInputSchema,
    requestBodySchema: undefined,
    responseSchema: teamUsersResponseSchema,
    errorSchema: undefined
  },
  {
    toolName: "team_get",
    title: "Get team details by identifier",
    description: "Returns team details based on Team ID in Nexus or identifier.",
    method: "GET",
    path: "/team/{identifier}",
    operationId: "queries-api_get-team-details",
    tag: "team",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: TeamGetInputSchema,
    requestBodySchema: undefined,
    responseSchema: teamDetailsResponseSchema,
    errorSchema: undefined
  },
  {
    toolName: "team_create",
    title: "Create Team.",
    description: "Endpoint to create a team in Nexus.",
    method: "POST",
    path: "/team/create",
    operationId: "team-api_post_team_create",
    tag: "team",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamCreateInputSchema,
    requestBodySchema: CreateTeamRequestSchema,
    responseSchema: CreateTeamResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_update",
    title: "Updates team.",
    description: "Endpoint to update team in Nexus.",
    method: "PUT",
    path: "/team/update",
    operationId: "team-api_put_team_update",
    tag: "team",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamUpdateInputSchema,
    requestBodySchema: UpdateTeamRequestSchema,
    responseSchema: UpdateTeamResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_delete",
    title: "Deletes team.",
    description: "Endpoint to delete team in Nexus.",
    method: "DELETE",
    path: "/team/delete",
    operationId: "team-api_delete_team_delete",
    tag: "team",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: null,
    inputSchema: TeamDeleteInputSchema,
    requestBodySchema: DeleteTeamRequestSchema,
    responseSchema: undefined,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_assign_manager",
    title: "Assigns manager to the team.",
    description: "Endpoint to assign manager to the team in Nexus.",
    method: "PUT",
    path: "/team/manager/assign",
    operationId: "team-api_put_team_manager_assign",
    tag: "team",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamAssignManagerInputSchema,
    requestBodySchema: AssignManagerToTeamRequestSchema,
    responseSchema: UpdateTeamResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_assign_users",
    title: "Assigns users to the team.",
    description: "Endpoint to assign users to the team in Nexus.",
    method: "PUT",
    path: "/team/users/assign",
    operationId: "team-api_put_team_users_assign",
    tag: "team",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamAssignUsersInputSchema,
    requestBodySchema: AssignUsersToTeamRequestSchema,
    responseSchema: AssignUsersToTheTeamResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_remove_manager",
    title: "Remove manager from the team.",
    description: "Endpoint to remove manager from the team in Nexus.",
    method: "PUT",
    path: "/team/manager/remove",
    operationId: "team-api_put_team_manager_remove",
    tag: "team",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamRemoveManagerInputSchema,
    requestBodySchema: RemoveManagerFromTeamRequestSchema,
    responseSchema: RemoveManagerFromTeamResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_remove_user",
    title: "Removes user from team.",
    description: "Endpoint to remove user from team in Nexus.",
    method: "PUT",
    path: "/team/user/remove",
    operationId: "team-api_put_team_user_remove",
    tag: "team",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamRemoveUserInputSchema,
    requestBodySchema: RemoveUserFromTeamRequestSchema,
    responseSchema: RemoveUserFromTeamResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_patch_person_membership",
    title: "Updates a persons Team membership",
    description: "Updates a persons Team membership",
    method: "PATCH",
    path: "/person/{identifier}/team/membership/patch",
    operationId: "team-api_patch_person_-identifier-_team_membership_patch",
    tag: "team",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamPatchPersonMembershipInputSchema,
    requestBodySchema: UpdatePersonTeamsMembershipRequestSchema,
    responseSchema: UpdatePersonTeamsMembershipResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_patch_person_management",
    title: "Updates the nodes a person manages",
    description: "Updates the nodes a person manages",
    method: "PATCH",
    path: "/person/{identifier}/team/management/patch",
    operationId: "team-api_patch_person_-identifier-_team_management_patch",
    tag: "team",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamPatchPersonManagementInputSchema,
    requestBodySchema: UpdatePersonTeamsManagementRequestSchema,
    responseSchema: UpdatePersonNodesManagementResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_patch_parent_groups",
    title: "Patch the groups that a team belongs to",
    description: "Patch the groups that a team belongs to",
    method: "PATCH",
    path: "/team/parentgroups/patch",
    operationId: "team-api_patch_team_parentgroups_patch",
    tag: "team",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: TeamPatchParentGroupsInputSchema,
    requestBodySchema: PatchTeamParentGroupsRequestSchema,
    responseSchema: PatchParentGroupsResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "team_list",
    title: "Get Teams with members and managers from nexus.",
    description: "Returns the Teams from Nexus.",
    method: "GET",
    path: "/teams",
    operationId: "queries-api_get-teams",
    tag: "team",
    parameters: [
      {
        "location": "query",
        "name": "Page",
        "required": true
      },
      {
        "location": "query",
        "name": "PageSize",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: TeamListInputSchema,
    requestBodySchema: undefined,
    responseSchema: getTeamsResponseSchema,
    errorSchema: undefined
  }
];

export const groupOperationDefinitions: OperationDefinition[] = [
  {
    toolName: "group_get",
    title: "Get group details by identifier",
    description: "Returns group details based on Group ID in Nexus or identifier.",
    method: "GET",
    path: "/group/{identifier}",
    operationId: "queries-api_get-group-details",
    tag: "group",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: GroupGetInputSchema,
    requestBodySchema: undefined,
    responseSchema: groupDetailsResponseSchema,
    errorSchema: undefined
  },
  {
    toolName: "group_get_members",
    title: "Get group members by identifier",
    description: "Returns group members based on Group ID in Nexus or identifier.",
    method: "GET",
    path: "/group/{identifier}/members",
    operationId: "queries-api_get-group-members",
    tag: "group",
    parameters: [
      {
        "location": "path",
        "name": "identifier",
        "required": true
      }
    ],
    requestContentType: null,
    responseContentType: "application/json",
    inputSchema: GroupGetMembersInputSchema,
    requestBodySchema: undefined,
    responseSchema: groupMembersResponseSchema,
    errorSchema: undefined
  },
  {
    toolName: "group_create",
    title: "Create group.",
    description: "Endpoint to create a group in Nexus.",
    method: "POST",
    path: "/group/create",
    operationId: "team-api_post_group_create",
    tag: "group",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: GroupCreateInputSchema,
    requestBodySchema: CreateReportingGroupRequestSchema,
    responseSchema: CreateReportingGroupResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "group_update",
    title: "Update group.",
    description: "Endpoint to update a group in Nexus.",
    method: "PUT",
    path: "/group/update",
    operationId: "team-api_put_group_update",
    tag: "group",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: GroupUpdateInputSchema,
    requestBodySchema: UpdateReportingGroupRequestSchema,
    responseSchema: UpdateReportingGroupResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "group_delete",
    title: "Deletes group.",
    description: "Endpoint to delete a group in Nexus.",
    method: "DELETE",
    path: "/group/delete",
    operationId: "team-api_delete_group_delete",
    tag: "group",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: null,
    inputSchema: GroupDeleteInputSchema,
    requestBodySchema: DeleteReportingGroupRequestSchema,
    responseSchema: undefined,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "group_assign_manager",
    title: "Assigns manager to the group.",
    description: "Endpoint to assign a manager to the group in Nexus.",
    method: "PUT",
    path: "/group/manager/assign",
    operationId: "team-api_put_group_manager_assign",
    tag: "group",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: GroupAssignManagerInputSchema,
    requestBodySchema: AssignManagerToGroupRequestSchema,
    responseSchema: AssignManagerToGroupResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "group_assign_member",
    title: "Assigns team or group to the group.",
    description: "Endpoint to assign a team or group to another group.",
    method: "PUT",
    path: "/group/member/assign",
    operationId: "team-api_put_group_member_assign",
    tag: "group",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: GroupAssignMemberInputSchema,
    requestBodySchema: AssignGroupMemberRequestSchema,
    responseSchema: AssignGroupMemberResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "group_remove_member",
    title: "Removes team or group from the group.",
    description: "Endpoint to remove team or group from another group.",
    method: "PUT",
    path: "/group/member/remove",
    operationId: "team-api_put_group_member_remove",
    tag: "group",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: GroupRemoveMemberInputSchema,
    requestBodySchema: RemoveGroupMemberRequestSchema,
    responseSchema: RemoveGroupMemberResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "group_remove_manager",
    title: "Removes manager from group.",
    description: "Endpoint to remove manager from group.",
    method: "PUT",
    path: "/group/manager/remove",
    operationId: "team-api_put_group_manager_remove",
    tag: "group",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: GroupRemoveManagerInputSchema,
    requestBodySchema: RemoveManagerFromGroupRequestSchema,
    responseSchema: RemoveManagerFromGroupResponseSchema,
    errorSchema: ErrorResponseSchema
  },
  {
    toolName: "group_patch_parent_groups",
    title: "Patch the groups that a group belongs to",
    description: "Patch the groups that a group belongs to",
    method: "PATCH",
    path: "/group/parentgroups/patch",
    operationId: "team-api_patch_group_parentgroups_patch",
    tag: "group",
    parameters: [],
    requestContentType: "application/json",
    responseContentType: "application/json",
    inputSchema: GroupPatchParentGroupsInputSchema,
    requestBodySchema: PatchGroupParentGroupsRequestSchema,
    responseSchema: PatchParentGroupsResponseSchema,
    errorSchema: ErrorResponseSchema
  }
];

export const allOperationDefinitions: OperationDefinition[] = [
  ...personOperationDefinitions,
  ...teamOperationDefinitions,
  ...groupOperationDefinitions
];
