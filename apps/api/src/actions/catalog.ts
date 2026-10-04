import { z } from "zod";

const executableActions = {
  restart_service: z.object({ serviceId: z.string().uuid() }).strict(),
  rollback_deployment: z.object({ deploymentId: z.string().uuid() }).strict()
} as const;

export type ExecutableActionType = keyof typeof executableActions;

export function validateExecutableAction(actionType: string, parameters: unknown) {
  const schema = executableActions[actionType as ExecutableActionType];
  if (!schema) {
    throw Object.assign(new Error("Action type is not approved for automated execution"), {
      statusCode: 409,
      code: "ACTION_TYPE_NOT_EXECUTABLE"
    });
  }
  return schema.parse(parameters);
}

export function isExecutableActionType(actionType: string): actionType is ExecutableActionType {
  return actionType in executableActions;
}
