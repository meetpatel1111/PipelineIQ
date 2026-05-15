# Smart Log Excerpt Design

**Date:** 2026-05-15
**Status:** Approved

---

## Goal

Replace the naive `tailLines()` log excerpt in the Jira ticket renderer with a step-structure-aware excerpt that shows the execution breadcrumb, the full output of the failing step, and the specific error lines — giving on-call engineers enough context to understand what ran, what failed, and why, without reading the full log.

## Problem

The current renderer calls `tailLines(log, 80)` — the last 80 lines of the raw log. For a typical 300–500 line CI build log:

- The last 80 lines are usually teardown, cleanup, and summary output — not the error
- The actual failure is buried 100–300 lines earlier
- There is no indication of which step failed or what led up to it
- Engineers must click through to the pipeline run to find the real error

## Architecture

One new file handles all excerpt logic. The renderer replaces its `tailLines()` call with `buildSmartExcerpt()`. Nothing else in the pipeline changes.

```
renderer.ts
  └── buildSmartExcerpt(log, format, maxLines)
        ├── parseSteps(lines, format)      — detect step boundaries
        ├── findErrorAnchors(lines)        — locate ERROR/FATAL lines
        ├── renderBreadcrumb(steps)        — ✓/✗ compact step list
        ├── renderStepOutput(lines, step)  — failing step's full output
        └── fallback: tailLines()          — unchanged for unstructured logs
```

## File Structure

| File | Action | Purpose |
|---|---|---|
| `src/core/log-parser/smart-excerpt.ts` | Create | All excerpt logic |
| `src/core/log-parser/__tests__/smart-excerpt.test.ts` | Create | Unit tests |
| `src/core/log-parser/index.ts` | Modify | Export `buildSmartExcerpt` |
| `src/core/renderer.ts` | Modify | Replace `tailLines()` call |

No changes to config schema, CLI, Jira client, or enrichers.

---

## Step Detection

### Supported Platforms

**GitHub Actions** — markers already present in log output:
```
##[group]Run tests          ← step starts
  ... step output ...
##[endgroup]                ← step ends cleanly
##[error]::error file=...   ← failure annotation (optional)
```

**Azure DevOps** — markers present in task output:
```
##[section]Starting: Run tests     ← step starts
  ... step output ...
##[section]Finishing: Run tests    ← step ends cleanly
##[error]...                       ← failure annotation (optional)
```

### StepInfo Type

```typescript
type StepStatus = "passed" | "failed" | "skipped";

type StepInfo = {
  name: string;
  status: StepStatus;
  startLine: number;   // index of first content line (after marker)
  endLine: number;     // index of last content line (-1 = log ends mid-step)
};
```

### Failure Detection Rules (in priority order)

1. Step contains a `##[error]` marker → `failed`
2. Step contains a line matching any error anchor pattern (see below) → `failed`
3. Step started but the log ends before its closing marker → `failed` (execution stopped mid-step)
4. Step has a closing marker and no errors → `passed`
5. Step never started (after the failed step) → `skipped`

### Error Anchor Patterns

A line is an error anchor if it matches any of:

```typescript
const ERROR_ANCHOR_PATTERNS = [
  /^\s*##\[error\]/i,                          // CI error annotation
  /\b(error|fatal|failed|failure)\b/i,          // generic keywords
  /exit\s+code\s+[1-9]/i,                      // non-zero exit
  /process\s+exited\s+with\s+code\s+[1-9]/i,
  /\b(FAIL|FAILED|ERROR)\b/,                   // uppercase CI output
  /exception\s+in\s+thread/i,                  // JVM
  /traceback\s+\(most\s+recent\s+call\s+last\)/i, // Python
  /thread\s+'.*'\s+panicked/i,                 // Rust
  /goroutine\s+\d+\s+\[running\]/i,            // Go panic
];
```

---

## Output Structure

### Section 1 — Execution Breadcrumb

Always rendered first when step markers are detected. Not counted against the line budget.

Format: single line with `→` separators, truncated at 120 chars with `…` if too long.

```
Steps: ✓ Set up job → ✓ Checkout → ✓ Setup Node.js → ✓ Install deps → ✗ Run tests → ○ Upload artifacts
```

Icons:
- `✓` — passed
- `✗` — failed
- `○` — skipped (never ran because a prior step failed)

### Section 2 — Failing Step Output

Full output of the identified failing step, rendered in a `log` code block with the step name as a header.

**Line budget:** `floor(maxLines * 0.75)`, minimum 20 lines. Default `maxLines` is 150.

**Trimming strategy:** If step output exceeds budget, remove lines from the **top** of the step (setup/initialization noise), keeping lines closest to the error. A trim notice is added:

```
[... N lines trimmed from top of step output ...]
```

### Section 3 — Error Highlight

The specific error anchor lines found within the failing step. Each is prefixed with `▶` inside the same code block to make them visually distinct.

**Line budget:** remaining lines after Section 2, minimum 10 lines.

If the error anchor lines are already visible in Section 2 (within the kept range), this section is omitted to avoid duplication.

### Full Rendered Example

```
Steps: ✓ Set up job → ✓ Checkout → ✓ Setup Node.js → ✓ Install deps → ✗ Run tests → ○ Upload artifacts

### Failing Step: Run tests
```log
[... 47 lines trimmed from top of step output ...]
  PASS src/core/dedup.test.ts
  PASS src/core/signatures.test.ts
  FAIL src/core/pipeline.test.ts
▶ ● processFailureEvent › dedup › should update existing issue
▶   Expected: "updated"
▶   Received: "created"
    at Object.<anonymous> (src/core/__tests__/pipeline.test.ts:88:5)
  Test Suites: 1 failed, 4 passed, 5 total
  Tests:       1 failed, 31 passed, 32 total
▶ npm ERR! Test failed. See above for more details.
```
```

---

## Fallback Chain

When step markers are absent or detection fails, the function degrades gracefully:

```
1. Step-aware (GitHub Actions / Azure DevOps markers detected)
       ↓ if no markers found
2. Error-anchored (any log format)
   - Find first error anchor line
   - Emit: 40 lines before anchor + anchor line + 20 lines after
   - If multiple error clusters (>50 lines apart), include up to 2 clusters
       ↓ if no error anchors found
3. Tail fallback
   - Current behaviour: last maxLines lines
   - Unchanged
```

---

## Function Signatures

```typescript
// src/core/log-parser/smart-excerpt.ts

export type ExcerptStrategy = "step-aware" | "error-anchored" | "tail-fallback";

export type SmartExcerptResult = {
  text: string;
  strategy: ExcerptStrategy;
  failingStep?: string;   // name of detected failing step, if any
};

/**
 * Primary entry point — called by renderer.
 * Replaces tailLines(log, maxLines).
 */
export function buildSmartExcerpt(
  log: string,
  source: string,   // event.source: "github" | "azure-devops" | anything else
  maxLines: number,
): SmartExcerptResult;

// Internal helpers (exported for testing)
export function parseSteps(lines: string[], source: string): StepInfo[];
export function findErrorAnchors(lines: string[]): number[];
export function renderBreadcrumb(steps: StepInfo[]): string;
export function renderStepOutput(
  lines: string[],
  step: StepInfo,
  budget: number,
): string;
```

---

## Renderer Integration

**Before:**
```typescript
// src/core/renderer.ts
const excerpt = tailLines(cleaned, logExcerptLines);
out.push("### Relevant Logs");
out.push("```log");
out.push(excerpt);
out.push("```");
```

**After:**
```typescript
// src/core/renderer.ts
const { text, failingStep } = buildSmartExcerpt(cleaned, event.source, logExcerptLines);
const logHeader = failingStep ? `### Failing Step: ${failingStep}` : "### Relevant Logs";
out.push(logHeader);
out.push("```log");
out.push(text);
out.push("```");
```

`event.source` (`"github"` | `"azure-devops"`) is used to select the step-marker syntax.
Any other source value falls through to the error-anchored / tail fallback chain.

The `tailLines` helper stays in `renderer.ts` as the fallback — `buildSmartExcerpt` calls it internally.

---

## Tests

`src/core/log-parser/__tests__/smart-excerpt.test.ts`

| Test | Scenario |
|---|---|
| `parseSteps — GitHub Actions` | Detects group/endgroup markers, correct startLine/endLine |
| `parseSteps — Azure DevOps` | Detects section Starting/Finishing markers |
| `parseSteps — marks last open step as failed` | Log ends mid-step |
| `parseSteps — marks steps after failure as skipped` | Post-failure steps never ran |
| `findErrorAnchors — finds ERROR line` | Basic keyword match |
| `findErrorAnchors — finds ##[error] annotation` | CI annotation match |
| `findErrorAnchors — ignores false positives` | "no error found" should not match |
| `renderBreadcrumb — formats correctly` | ✓/✗/○ icons, → separators |
| `renderBreadcrumb — truncates long step lists` | >120 chars → `…` |
| `renderStepOutput — trims from top when over budget` | Trim notice added |
| `renderStepOutput — keeps full output when within budget` | No trim notice |
| `buildSmartExcerpt — step-aware for GitHub Actions` | Returns step-aware strategy |
| `buildSmartExcerpt — step-aware for Azure DevOps` | Returns step-aware strategy |
| `buildSmartExcerpt — error-anchored fallback` | Generic log with errors |
| `buildSmartExcerpt — tail fallback` | Generic log with no errors |
| `buildSmartExcerpt — error highlights not duplicated` | If anchor in step output, no double render |
| `buildSmartExcerpt — respects maxLines budget` | Output never exceeds maxLines |

---

## Edge Cases

| Case | Handling |
|---|---|
| Step with no output (empty between markers) | Show `[Step produced no output]` |
| Failing step output is entirely within budget | No trim notice, show everything |
| Multiple error anchors in one step | All marked with `▶`, not just the first |
| Log is empty string | Return empty string, strategy: `tail-fallback` |
| maxLines < 20 | Clamp to minimum 20 lines |
| Step name contains special markdown chars | Escape before rendering as header |
