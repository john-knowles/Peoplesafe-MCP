import { z } from "zod";

export const AuthHeaderOverrideSchema = z
  .object({
    authToken: z.string().min(1).optional(),
    subscriptionKey: z.string().min(1).optional()
  })
  .strict();

export const AssignSubscriptionApiRequestSchema = z.object({
  "subscriptionType": z.number().int()
}).strict();

export const ReassignSubscriptionApiRequestSchema = z.object({
  "subscriptionType": z.number().int()
}).strict();

export const emergencyContactSchema = z.object({
  "firstName": z.string(),
  "lastName": z.string(),
  "relationship": z.string(),
  "phoneNumber": z.string()
}).strict();

export const getPersonResponseSchema = z.object({
  "person": z.lazy(() => personSchema).optional()
}).strict();

export const getPersonsResponseSchema = z.object({
  "count": z.number().int().optional(),
  "persons": z.array(z.lazy(() => personSchema)).optional()
}).strict();

export const getTeamsResponseSchema = z.object({
  "count": z.number().int().optional(),
  "teams": z.array(z.lazy(() => teamItemSchema)).optional()
}).strict();

export const groupSchema = z.object({
  "id": z.string().optional(),
  "groupReference": z.string().optional()
}).strict();

export const groupDetailsResponseSchema = z.object({
  "id": z.string().optional(),
  "identifier": z.string().optional(),
  "name": z.string().optional(),
  "description": z.string().optional()
}).strict();

export const groupMembersResponseSchema = z.object({
  "teams": z.array(z.lazy(() => teamSchema)).optional(),
  "groups": z.array(z.lazy(() => groupSchema)).optional()
}).strict();

export const personSchema = z.object({
  "id": z.string().optional(),
  "userReference": z.string().optional(),
  "emailAddress": z.string().optional(),
  "firstName": z.string().optional(),
  "lastName": z.string().optional(),
  "hasPortalAccess": z.boolean().optional(),
  "jobTitle": z.string().nullable().optional(),
  "dateOfBirth": z.string().datetime({ offset: true }).nullable().optional(),
  "sexAssignedAtBirth": z.string().nullable().optional(),
  "roles": z.array(z.number().int()).optional(),
  "codeWord": z.string().nullable().optional(),
  "pin": z.number().int().nullable().optional(),
  "contactPhoneNumbers": z.array(z.lazy(() => phoneNumberSchema)).nullable().optional(),
  "emergencyContacts": z.array(z.lazy(() => emergencyContactSchema)).nullable().optional()
}).strict();

export const personWithSubscriptionResponseSchema = z.object({
  "id": z.string().uuid().optional(),
  "userReference": z.string().optional(),
  "subscriptionType": z.number().int().optional(),
  "subscriptionTypeName": z.string().optional()
}).strict();

export const phoneNumberSchema = z.object({
  "type": z.number().int(),
  "number": z.string(),
  "isPrimary": z.boolean()
}).strict();

export const teamSchema = z.object({
  "id": z.string().optional(),
  "teamReference": z.string().optional()
}).strict();

export const teamDetailsResponseSchema = z.object({
  "id": z.string().optional(),
  "identifier": z.string().optional(),
  "name": z.string().optional(),
  "description": z.string().optional()
}).strict();

export const teamItemSchema = z.object({
  "reference": z.string().optional(),
  "name": z.string().optional(),
  "members": z.array(z.lazy(() => teamPersonSchema)).optional(),
  "managers": z.array(z.lazy(() => teamPersonSchema)).optional()
}).strict();

export const teamPersonSchema = z.object({
  "name": z.string().optional(),
  "userReference": z.string().optional()
}).strict();

export const teamUserSchema = z.object({
  "identifier": z.string().optional(),
  "id": z.string().optional()
}).strict();

export const teamUsersResponseSchema = z.object({
  "teamUsers": z.array(z.lazy(() => teamUserSchema)).optional()
}).strict();

export const AssignedTeamSchema = z.object({
  "reference": z.string().nullable().optional()
}).strict();

export const CreatePersonSchema = z.object({
  "userReference": z.string(),
  "emailAddress": z.string(),
  "firstName": z.string(),
  "lastName": z.string(),
  "hasPortalAccess": z.boolean(),
  "jobTitle": z.string().nullable().optional(),
  "dateOfBirth": z.string().datetime({ offset: true }).nullable().optional(),
  "sexAssignedAtBirth": z.string(),
  "roles": z.array(z.number().int()),
  "codeWord": z.string().nullable().optional(),
  "pin": z.number().int().nullable().optional(),
  "contactPhoneNumbers": z.array(z.lazy(() => PhoneNumberSchema)),
  "emergencyContacts": z.array(z.lazy(() => EmergencyContactSchema)).nullable().optional(),
  "assignedSubscriptionType": z.number().int().nullable().optional(),
  "assignedTeam": z.lazy(() => AssignedTeamSchema).optional()
}).strict();

export const CreatePersonRequestSchema = z.object({
  "person": z.lazy(() => CreatePersonSchema),
  "withoutActivation": z.boolean().nullable().optional()
}).strict();

export const EmergencyContactSchema = z.object({
  "firstName": z.string(),
  "lastName": z.string(),
  "relationship": z.string(),
  "phoneNumber": z.string()
}).strict();

export const ErrorContentSchema = z.object({
  "message": z.string().nullable().optional(),
  "code": z.string().nullable().optional(),
  "stackTrace": z.string().nullable().optional(),
  "field": z.string().nullable().optional(),
  "errors": z.array(z.string()).nullable().optional(),
  "additionalDescription": z.unknown().nullable().optional()
}).strict();

export const ErrorResponseSchema = z.object({
  "errorId": z.string().nullable().optional(),
  "content": z.lazy(() => ErrorContentSchema).optional()
}).strict();

export const GetPersonByIdResponseSchema = z.object({
  "person": z.lazy(() => PersonSchema).optional()
}).strict();

export const PatchPersonSchema = z.object({
  "firstName": z.string().nullable().optional(),
  "lastName": z.string().nullable().optional(),
  "hasPortalAccess": z.boolean().nullable().optional(),
  "jobTitle": z.string().nullable().optional(),
  "dateOfBirth": z.string().datetime({ offset: true }).nullable().optional(),
  "sexAssignedAtBirth": z.string().nullable().optional(),
  "roles": z.array(z.number().int()).nullable().optional(),
  "codeWord": z.string().nullable().optional(),
  "pin": z.number().int().nullable().optional(),
  "contactPhoneNumbers": z.array(z.lazy(() => PhoneNumberSchema)).nullable().optional(),
  "emergencyContacts": z.array(z.lazy(() => EmergencyContactSchema)).nullable().optional()
}).strict();

export const PatchPersonRequestSchema = z.object({
  "person": z.lazy(() => PatchPersonSchema),
  "withoutActivation": z.boolean().nullable().optional(),
  "ignoreEmptyValues": z.boolean().nullable().optional()
}).strict();

export const PersonSchema = z.object({
  "id": z.string().nullable().optional(),
  "userReference": z.string().nullable().optional(),
  "emailAddress": z.string().nullable().optional(),
  "firstName": z.string().nullable().optional(),
  "lastName": z.string().nullable().optional(),
  "hasPortalAccess": z.boolean().optional(),
  "jobTitle": z.string().nullable().optional(),
  "dateOfBirth": z.string().datetime({ offset: true }).nullable().optional(),
  "sexAssignedAtBirth": z.string().nullable().optional(),
  "roles": z.array(z.number().int()).nullable().optional(),
  "codeWord": z.string().nullable().optional(),
  "pin": z.string().nullable().optional(),
  "contactPhoneNumbers": z.array(z.lazy(() => PhoneNumberSchema)).nullable().optional(),
  "emergencyContacts": z.array(z.lazy(() => EmergencyContactSchema)).nullable().optional()
}).strict();

export const PhoneNumberSchema = z.object({
  "type": z.number().int(),
  "number": z.string(),
  "isPrimary": z.boolean()
}).strict();

export const UpdatePersonSchema = z.object({
  "userReference": z.string().nullable().optional(),
  "firstName": z.string(),
  "lastName": z.string(),
  "hasPortalAccess": z.boolean(),
  "jobTitle": z.string().nullable().optional(),
  "dateOfBirth": z.string().datetime({ offset: true }).nullable().optional(),
  "sexAssignedAtBirth": z.string().nullable().optional(),
  "roles": z.array(z.number().int()),
  "codeWord": z.string().nullable().optional(),
  "pin": z.number().int().nullable().optional(),
  "contactPhoneNumbers": z.array(z.lazy(() => PhoneNumberSchema)).nullable().optional(),
  "emergencyContacts": z.array(z.lazy(() => EmergencyContactSchema)).nullable().optional()
}).strict();

export const UpdatePersonRequestSchema = z.object({
  "person": z.lazy(() => UpdatePersonSchema),
  "withoutActivation": z.boolean().nullable().optional()
}).strict();

export const AssignGroupMemberRequestSchema = z.object({
  "teamIdentifier": z.string(),
  "groupIdentifier": z.string()
}).strict();

export const AssignGroupMemberResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "groupIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional()
}).strict();

export const AssignManagerToGroupRequestSchema = z.object({
  "groupIdentifier": z.string(),
  "userIdentifier": z.string()
}).strict();

export const AssignManagerToGroupResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "groupIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const AssignManagerToTeamRequestSchema = z.object({
  "teamIdentifier": z.string(),
  "userIdentifier": z.string()
}).strict();

export const AssignUsersToTeamRequestSchema = z.object({
  "teamIdentifier": z.string(),
  "userIdentifiers": z.array(z.string()),
  "primaryTeamOption": z.lazy(() => PrimaryTeamOptionSchema)
}).strict();

export const AssignUsersToTheTeamResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "teamIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const CreateGroupSchema = z.object({
  "groupIdentifier": z.string(),
  "name": z.string(),
  "description": z.string().nullable().optional()
}).strict();

export const CreateReportingGroupRequestSchema = z.object({
  "group": z.lazy(() => CreateGroupSchema)
}).strict();

export const CreateReportingGroupResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "groupIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const CreateTeamSchema = z.object({
  "teamIdentifier": z.string(),
  "name": z.string(),
  "description": z.string().nullable().optional()
}).strict();

export const CreateTeamRequestSchema = z.object({
  "team": z.lazy(() => CreateTeamSchema)
}).strict();

export const CreateTeamResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "teamIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const DeleteGroupSchema = z.object({
  "groupIdentifier": z.string()
}).strict();

export const DeleteReportingGroupRequestSchema = z.object({
  "group": z.lazy(() => DeleteGroupSchema)
}).strict();

export const DeleteTeamSchema = z.object({
  "teamIdentifier": z.string()
}).strict();

export const DeleteTeamRequestSchema = z.object({
  "team": z.lazy(() => DeleteTeamSchema)
}).strict();

export const PatchGroupParentGroupsRequestSchema = z.object({
  "groupIdentifier": z.string(),
  "parentGroupIdentifiers": z.array(z.string()).nullable().optional()
}).strict();

export const PatchParentGroupsResponseSchema = z.object({
  "parentGroups": z.array(z.string()).nullable().optional()
}).strict();

export const PatchTeamParentGroupsRequestSchema = z.object({
  "teamIdentifier": z.string(),
  "parentGroupIdentifiers": z.array(z.string()).nullable().optional()
}).strict();

export const PrimaryTeamOptionSchema = z.union([z.literal(0), z.literal(1)]);

export const RemoveGroupMemberRequestSchema = z.object({
  "teamIdentifier": z.string(),
  "groupIdentifier": z.string()
}).strict();

export const RemoveGroupMemberResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "groupIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional()
}).strict();

export const RemoveManagerFromGroupRequestSchema = z.object({
  "groupIdentifier": z.string(),
  "userIdentifier": z.string()
}).strict();

export const RemoveManagerFromGroupResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "groupIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const RemoveManagerFromTeamRequestSchema = z.object({
  "teamIdentifier": z.string(),
  "userIdentifier": z.string()
}).strict();

export const RemoveManagerFromTeamResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "teamIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const RemoveUserFromTeamRequestSchema = z.object({
  "teamIdentifier": z.string(),
  "userIdentifier": z.string()
}).strict();

export const RemoveUserFromTeamResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "teamIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const UpdateGroupSchema = z.object({
  "groupIdentifier": z.string(),
  "name": z.string(),
  "description": z.string().nullable().optional()
}).strict();

export const UpdatePersonNodesManagementResponseSchema = z.object({
  "managerOf": z.array(z.string()).nullable().optional()
}).strict();

export const UpdatePersonTeamsManagementRequestSchema = z.object({
  "managerOfIdentifiers": z.array(z.string()).nullable().optional()
}).strict();

export const UpdatePersonTeamsMembershipRequestSchema = z.object({
  "primaryTeamIdentifier": z.string().nullable().optional(),
  "memberOfIdentifiers": z.array(z.string()).nullable().optional()
}).strict();

export const UpdatePersonTeamsMembershipResponseSchema = z.object({
  "primaryTeamId": z.string().nullable().optional(),
  "memberOf": z.array(z.string()).nullable().optional()
}).strict();

export const UpdateReportingGroupRequestSchema = z.object({
  "group": z.lazy(() => UpdateGroupSchema)
}).strict();

export const UpdateReportingGroupResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "groupIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const UpdateTeamSchema = z.object({
  "teamIdentifier": z.string(),
  "name": z.string(),
  "description": z.string().nullable().optional()
}).strict();

export const UpdateTeamRequestSchema = z.object({
  "team": z.lazy(() => UpdateTeamSchema)
}).strict();

export const UpdateTeamResponseSchema = z.object({
  "id": z.string().nullable().optional(),
  "teamIdentifier": z.string().nullable().optional(),
  "name": z.string().nullable().optional(),
  "description": z.string().nullable().optional()
}).strict();

export const componentSchemas = {
  "AssignSubscriptionApiRequest": AssignSubscriptionApiRequestSchema,
  "ReassignSubscriptionApiRequest": ReassignSubscriptionApiRequestSchema,
  "emergencyContact": emergencyContactSchema,
  "getPersonResponse": getPersonResponseSchema,
  "getPersonsResponse": getPersonsResponseSchema,
  "getTeamsResponse": getTeamsResponseSchema,
  "group": groupSchema,
  "groupDetailsResponse": groupDetailsResponseSchema,
  "groupMembersResponse": groupMembersResponseSchema,
  "person": personSchema,
  "personWithSubscriptionResponse": personWithSubscriptionResponseSchema,
  "phoneNumber": phoneNumberSchema,
  "team": teamSchema,
  "teamDetailsResponse": teamDetailsResponseSchema,
  "teamItem": teamItemSchema,
  "teamPerson": teamPersonSchema,
  "teamUser": teamUserSchema,
  "teamUsersResponse": teamUsersResponseSchema,
  "AssignedTeam": AssignedTeamSchema,
  "CreatePerson": CreatePersonSchema,
  "CreatePersonRequest": CreatePersonRequestSchema,
  "EmergencyContact": EmergencyContactSchema,
  "ErrorContent": ErrorContentSchema,
  "ErrorResponse": ErrorResponseSchema,
  "GetPersonByIdResponse": GetPersonByIdResponseSchema,
  "PatchPerson": PatchPersonSchema,
  "PatchPersonRequest": PatchPersonRequestSchema,
  "Person": PersonSchema,
  "PhoneNumber": PhoneNumberSchema,
  "UpdatePerson": UpdatePersonSchema,
  "UpdatePersonRequest": UpdatePersonRequestSchema,
  "AssignGroupMemberRequest": AssignGroupMemberRequestSchema,
  "AssignGroupMemberResponse": AssignGroupMemberResponseSchema,
  "AssignManagerToGroupRequest": AssignManagerToGroupRequestSchema,
  "AssignManagerToGroupResponse": AssignManagerToGroupResponseSchema,
  "AssignManagerToTeamRequest": AssignManagerToTeamRequestSchema,
  "AssignUsersToTeamRequest": AssignUsersToTeamRequestSchema,
  "AssignUsersToTheTeamResponse": AssignUsersToTheTeamResponseSchema,
  "CreateGroup": CreateGroupSchema,
  "CreateReportingGroupRequest": CreateReportingGroupRequestSchema,
  "CreateReportingGroupResponse": CreateReportingGroupResponseSchema,
  "CreateTeam": CreateTeamSchema,
  "CreateTeamRequest": CreateTeamRequestSchema,
  "CreateTeamResponse": CreateTeamResponseSchema,
  "DeleteGroup": DeleteGroupSchema,
  "DeleteReportingGroupRequest": DeleteReportingGroupRequestSchema,
  "DeleteTeam": DeleteTeamSchema,
  "DeleteTeamRequest": DeleteTeamRequestSchema,
  "PatchGroupParentGroupsRequest": PatchGroupParentGroupsRequestSchema,
  "PatchParentGroupsResponse": PatchParentGroupsResponseSchema,
  "PatchTeamParentGroupsRequest": PatchTeamParentGroupsRequestSchema,
  "PrimaryTeamOption": PrimaryTeamOptionSchema,
  "RemoveGroupMemberRequest": RemoveGroupMemberRequestSchema,
  "RemoveGroupMemberResponse": RemoveGroupMemberResponseSchema,
  "RemoveManagerFromGroupRequest": RemoveManagerFromGroupRequestSchema,
  "RemoveManagerFromGroupResponse": RemoveManagerFromGroupResponseSchema,
  "RemoveManagerFromTeamRequest": RemoveManagerFromTeamRequestSchema,
  "RemoveManagerFromTeamResponse": RemoveManagerFromTeamResponseSchema,
  "RemoveUserFromTeamRequest": RemoveUserFromTeamRequestSchema,
  "RemoveUserFromTeamResponse": RemoveUserFromTeamResponseSchema,
  "UpdateGroup": UpdateGroupSchema,
  "UpdatePersonNodesManagementResponse": UpdatePersonNodesManagementResponseSchema,
  "UpdatePersonTeamsManagementRequest": UpdatePersonTeamsManagementRequestSchema,
  "UpdatePersonTeamsMembershipRequest": UpdatePersonTeamsMembershipRequestSchema,
  "UpdatePersonTeamsMembershipResponse": UpdatePersonTeamsMembershipResponseSchema,
  "UpdateReportingGroupRequest": UpdateReportingGroupRequestSchema,
  "UpdateReportingGroupResponse": UpdateReportingGroupResponseSchema,
  "UpdateTeam": UpdateTeamSchema,
  "UpdateTeamRequest": UpdateTeamRequestSchema,
  "UpdateTeamResponse": UpdateTeamResponseSchema
} as const;
