/**
 * Release Version Extractor for Jira Releases / FixVersions synchronization.
 */

/**
 * Extracts candidate release version strings from a git branch or tag name.
 * Returns an array of candidate names (e.g. ['1.2.0', 'v1.2.0']) ordered by preference.
 */
export function extractReleaseVersions(branchOrTag?: string | null, customPattern?: string): string[] {
  if (!branchOrTag || typeof branchOrTag !== "string") {
    return [];
  }

  const cleanRef = branchOrTag.trim();

  // If user provided a custom regex pattern
  if (customPattern) {
    try {
      const regex = new RegExp(customPattern, "i");
      const match = cleanRef.match(regex);
      if (match) {
        const matchedVal = (match[1] || match[0]).trim();
        return [matchedVal];
      }
    } catch {
      // invalid regex, continue to default
    }
  }

  // Standard release patterns:
  // e.g. release/v1.2.0, release/1.2.0, rc/v2.1.0-beta.1, releases/3.0.0, v1.4.2, tag: v1.0.0
  const releaseRegex = /(?:^|\/)(?:release(?:s)?\/|rc\/|v|^v?)(\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)(?:$|\/)/i;
  const match = cleanRef.match(releaseRegex);
  if (!match) {
    return [];
  }

  const numericVersion = match[1];
  if (!numericVersion) {
    return [];
  }
  const withV = `v${numericVersion}`;

  // If the input explicitly contained 'v' right before the number, prefer 'v1.2.0', then '1.2.0'
  if (/v\d/i.test(cleanRef)) {
    return [withV, numericVersion];
  }

  return [numericVersion, withV];
}

/**
 * Match candidate version names against a list of Jira project versions.
 * Returns the matching Jira version name, or undefined.
 */
export function matchJiraVersion(
  candidates: string[],
  jiraVersions: Array<{ name: string; id?: string }>
): string | undefined {
  if (!candidates || candidates.length === 0 || !jiraVersions || jiraVersions.length === 0) {
    return undefined;
  }

  for (const candidate of candidates) {
    const found = jiraVersions.find(
      (jv) => jv.name.toLowerCase() === candidate.toLowerCase()
    );
    if (found) {
      return found.name;
    }
  }

  return undefined;
}
