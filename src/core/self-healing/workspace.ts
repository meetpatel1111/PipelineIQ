/**
 * Centralized utility to resolve the local workspace root directory.
 * Prioritizes GitHub Actions ($GITHUB_WORKSPACE), Azure DevOps ($SYSTEM_DEFAULTWORKINGDIRECTORY),
 * or falls back to process.cwd().
 */
export function getWorkspaceRoot(): string {
  return (
    process.env.GITHUB_WORKSPACE ||
    process.env.SYSTEM_DEFAULTWORKINGDIRECTORY ||
    process.cwd()
  );
}
