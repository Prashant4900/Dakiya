/**
 * On-disk workspace core — maps to `.dakiya/dakiya.yaml`.
 */

import type { z } from "zod";
import type { WorkspaceManifestSchema } from "./schemas.js";

export { WORKSPACE_MANIFEST_VERSION } from "./schemas.js";

export type WorkspaceManifest = z.infer<typeof WorkspaceManifestSchema>;
