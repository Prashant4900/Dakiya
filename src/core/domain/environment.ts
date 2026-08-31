/**
 * Environment profile — maps to `.dakiya/environments/<name>.yaml`.
 */

import type { z } from "zod";
import type {
	EnvironmentSchema,
	EnvironmentVariablesSchema,
} from "./schemas.js";

export type EnvironmentVariables = z.infer<typeof EnvironmentVariablesSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
