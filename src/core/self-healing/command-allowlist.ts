import * as path from "node:path";

/**
 * Known safe executable binaries and tools in modern developer ecosystems.
 */
const ALLOWED_EXECUTABLES = new Set([
  // Node / JS / TS
  "npm", "npx", "pnpm", "yarn", "bun", "deno", "node", "tsc", "eslint", "prettier", "vitest", "jest", "nx", "turbo",
  // Python
  "python", "python3", "pytest", "pip", "pip3", "pipenv", "poetry", "uv", "pdm", "flake8", "ruff", "mypy", "black",
  // Rust
  "cargo", "rustc", "clippy-driver",
  // Go
  "go", "golangci-lint",
  // Java / Kotlin / Scala
  "mvn", "gradle", "gradlew", "./gradlew", ".\\gradlew", "sbt",
  // .NET / C# / F#
  "dotnet", "nuget", "msbuild",
  // PHP
  "composer", "php", "phpunit", "phpstan", "psalm",
  // Ruby
  "bundle", "bundler", "gem", "rake", "rspec", "rubocop",
  // C / C++ / Native
  "cmake", "ctest", "ninja", "meson", "make", "bmake", "gmake", "clang", "gcc", "g++",
  // Mobile / Swift / Dart
  "flutter", "dart", "swift",
  // Erlang / Elixir
  "mix", "rebar3",
  // Haskell / Clojure / Zig
  "stack", "cabal", "lein", "clojure", "zig",
  // Infra / Smart Contracts
  "terraform", "tofu", "forge", "hardhat", "anchor", "bazel", "dune",
]);

/**
 * Dangerous substrings or operators that indicate shell injection / exfiltration.
 */
const DANGEROUS_PATTERNS = [
  /;\s*(?:rm|curl|wget|bash|sh|zsh|powershell|pwsh|eval|exec|nc|netcat|socat|python|perl|ruby)\b/i,
  /\|\s*(?:bash|sh|zsh|powershell|pwsh|eval|exec)\b/i,
  />\s*\/dev\/(?:tcp|udp)/i,
  /\brm\s+-(?:r|f|rf|fr)\b/i,
  /\bcurl\s+[^|]+\|\s*(?:ba)?sh\b/i,
  /\bwget\s+[^|]+\|\s*(?:ba)?sh\b/i,
  /\b(?:cat|head|tail|grep)\s+.*(?:\.env|\.ssh|id_rsa|credentials|\/etc\/passwd|\/etc\/shadow)/i,
  /\b(?:eval|exec)\s*\(/i,
  /\b(?:Invoke-Expression|IEX)\b/i,
  /\b(?:powershell|pwsh)\s+-(?:enc|encodedcommand|e)\b/i,
  /\bbase64\s+-d\b/i,
  /\bchmod\s+[0-7]{3,4}\s+\/etc/i,
  /\bmkfifo\b/i,
];

/**
 * Validate that a shell command is safe to execute in the workspace.
 *
 * Checks:
 * 1. Command is non-empty and within reasonable length.
 * 2. Does not contain known shell injection / data exfiltration patterns.
 * 3. Primary executable is in the approved developer tool allowlist.
 */
export function validateCommand(command: string): boolean {
  if (!command || typeof command !== "string") return false;
  const trimmed = command.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return false;

  // Check against dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`[PipelineIQ Security] Blocked dangerous command pattern: "${trimmed}"`);
      return false;
    }
  }

  // Split multiple chained commands (&&, ||) and validate each part
  const subCommands = trimmed.split(/&&|\|\|/).map(c => c.trim()).filter(Boolean);
  if (subCommands.length === 0) return false;

  for (const subCmd of subCommands) {
    // Extract base executable
    const match = subCmd.match(/^(\.?[\w./\\-]+)/);
    if (!match) return false;

    let exe = match[1]!;
    // Strip path or extension (e.g. "./gradlew" -> "gradlew", "python.exe" -> "python")
    exe = path.basename(exe).replace(/\.(?:exe|cmd|bat|ps1|sh)$/i, "");

    if (!ALLOWED_EXECUTABLES.has(exe) && !ALLOWED_EXECUTABLES.has(match[1]!)) {
      console.warn(`[PipelineIQ Security] Blocked unapproved executable: "${match[1]}" in command "${trimmed}"`);
      return false;
    }
  }

  return true;
}

/**
 * Sanitize a file path to prevent directory traversal and null byte injections.
 */
export function sanitizeFilePath(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("[PipelineIQ Security] Invalid file path provided.");
  }

  // Reject null bytes
  if (filePath.includes("\0")) {
    throw new Error("[PipelineIQ Security] Null byte detected in file path.");
  }

  // Normalize path separators
  const normalized = path.normalize(filePath).replace(/\\/g, "/");

  // Reject directory traversal attempts that escape the workspace
  if (normalized.startsWith("../") || normalized === ".." || normalized.includes("/../")) {
    throw new Error(`[PipelineIQ Security] Directory traversal detected in path: ${filePath}`);
  }

  return normalized;
}
