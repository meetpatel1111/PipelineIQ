import * as fs from "node:fs";
import * as path from "node:path";
import type { FailureEvent } from "../types/failure.js";
import type { CodeFix } from "../types/self-healing.js";

export interface EcosystemDescriptor {
  id: string;
  name: string;
  category: "web" | "backend" | "enterprise" | "systems" | "ai_data" | "mobile" | "functional" | "blockchain" | "iac" | "embedded" | "desktop" | "general";
  manifests: string[];
  lockfiles: string[];
  vendorDirs?: string[];
  resolveInstallCommands: (root: string) => string[];
  resolveVerifyCommands: (root: string) => string[];
  resolveLockfileUpdateCommands: (root: string) => string[];
}

const exists = (root: string, f: string) => fs.existsSync(path.resolve(root, f));

/**
 * Universal Ecosystem Registry for 2026 Developer Landscape:
 * Covers 30+ language families, 100+ frameworks, and 40+ package managers.
 */
export const UNIVERSAL_ECOSYSTEMS: EcosystemDescriptor[] = [
  // ── 1. JavaScript / TypeScript / Fullstack (React, Next.js, Vue, Angular, Svelte, Remix, Astro, Node, Deno, Bun)
  {
    id: "nodejs",
    name: "JavaScript / TypeScript (Node.js / Bun / Deno)",
    category: "web",
    manifests: ["package.json", "deno.json", "deno.jsonc"],
    lockfiles: ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "bun.lock", "deno.lock"],
    vendorDirs: ["node_modules"],
    resolveInstallCommands: (root) => {
      if (exists(root, "pnpm-lock.yaml")) return ["pnpm install --no-frozen-lockfile || npm install --no-audit --no-fund"];
      if (exists(root, "yarn.lock")) return ["yarn install || npm install --no-audit --no-fund"];
      if (exists(root, "bun.lockb") || exists(root, "bun.lock")) return ["bun install || npm install --no-audit --no-fund"];
      if (exists(root, "deno.json") || exists(root, "deno.jsonc")) return ["deno cache --reload || true"];
      return ["npm install --no-audit --no-fund"];
    },
    resolveVerifyCommands: () => ["npm test --if-present", "npm run build --if-present"],
    resolveLockfileUpdateCommands: (root) => {
      if (exists(root, "yarn.lock")) return ["yarn install --mode update-lockfile || yarn install"];
      if (exists(root, "pnpm-lock.yaml")) return ["pnpm install --no-frozen-lockfile"];
      if (exists(root, "bun.lockb") || exists(root, "bun.lock")) return ["bun install"];
      return ["npm install"];
    },
  },

  // ── 2. Python (AI/ML, PyTorch, TensorFlow, Django, FastAPI, Flask, LangChain, dbt)
  {
    id: "python",
    name: "Python (AI, Data, Backend)",
    category: "ai_data",
    manifests: ["pyproject.toml", "requirements.txt", "Pipfile", "setup.py", "setup.cfg", "environment.yml"],
    lockfiles: ["poetry.lock", "Pipfile.lock", "uv.lock", "pdm.lock", "conda-lock.yml"],
    resolveInstallCommands: (root) => {
      const cmds: string[] = [];
      if (exists(root, "uv.lock")) cmds.push("uv sync || pip install -r requirements.txt || true");
      else if (exists(root, "poetry.lock")) cmds.push("poetry install --no-interaction || true");
      else if (exists(root, "Pipfile")) cmds.push("pipenv install --dev || true");
      else if (exists(root, "requirements.txt")) cmds.push("pip install -q -r requirements.txt || true");
      else if (exists(root, "setup.py") || exists(root, "pyproject.toml")) cmds.push("pip install -q -e . || true");
      return cmds;
    },
    resolveVerifyCommands: () => ["pytest", "python -m unittest discover", "python -m pytest"],
    resolveLockfileUpdateCommands: (root) => {
      if (exists(root, "poetry.lock")) return ["poetry lock --no-update"];
      if (exists(root, "uv.lock")) return ["uv lock"];
      if (exists(root, "Pipfile.lock")) return ["pipenv lock"];
      return ["pip freeze > requirements.txt"];
    },
  },

  // ── 3. Rust (Systems, WebAssembly, Axum, Actix, Solana/Anchor, Polkadot)
  {
    id: "rust",
    name: "Rust (Cargo, Systems, WASM, Web3)",
    category: "systems",
    manifests: ["Cargo.toml", "Anchor.toml"],
    lockfiles: ["Cargo.lock"],
    resolveInstallCommands: () => ["cargo fetch"],
    resolveVerifyCommands: () => ["cargo test", "cargo check"],
    resolveLockfileUpdateCommands: () => ["cargo update --workspace"],
  },

  // ── 4. Go (Cloud-Native, Microservices, Gin, Fiber, Kubernetes, Docker)
  {
    id: "go",
    name: "Go (Golang)",
    category: "backend",
    manifests: ["go.mod"],
    lockfiles: ["go.sum"],
    resolveInstallCommands: () => ["go mod download"],
    resolveVerifyCommands: () => ["go test ./...", "go vet ./..."],
    resolveLockfileUpdateCommands: () => ["go mod tidy"],
  },

  // ── 5. Java & Kotlin (JVM, Spring Boot, Quarkus, Micronaut, Android)
  {
    id: "jvm",
    name: "Java / Kotlin / Scala (Maven, Gradle, SBT)",
    category: "enterprise",
    manifests: ["pom.xml", "build.gradle", "build.gradle.kts", "build.sbt", "settings.gradle", "settings.gradle.kts"],
    lockfiles: ["gradle.lockfile"],
    resolveInstallCommands: (root) => {
      if (exists(root, "pom.xml")) return ["mvn dependency:resolve -q -DskipTests || true"];
      if (exists(root, "build.gradle") || exists(root, "build.gradle.kts")) {
        const gradlew = exists(root, "gradlew") ? "./gradlew" : "gradle";
        return [`${gradlew} build -x test -q || true`];
      }
      if (exists(root, "build.sbt")) return ["sbt update || true"];
      return [];
    },
    resolveVerifyCommands: (root) => {
      if (exists(root, "pom.xml")) return ["mvn test -q", "mvn compile -q"];
      if (exists(root, "build.gradle") || exists(root, "build.gradle.kts")) {
        const gradlew = exists(root, "gradlew") ? "./gradlew" : "gradle";
        return [`${gradlew} test -q`];
      }
      if (exists(root, "build.sbt")) return ["sbt test"];
      return [];
    },
    resolveLockfileUpdateCommands: () => [],
  },

  // ── 6. .NET / C# / F# (ASP.NET Core, Blazor, MAUI, Unity)
  {
    id: "dotnet",
    name: ".NET / C# / F# (NuGet, MSBuild)",
    category: "enterprise",
    manifests: ["*.sln", "*.csproj", "*.fsproj", "Directory.Build.props", "nuget.config"],
    lockfiles: ["packages.lock.json"],
    resolveInstallCommands: () => ["dotnet restore -v q || true"],
    resolveVerifyCommands: () => ["dotnet test -v q", "dotnet build -v q"],
    resolveLockfileUpdateCommands: () => ["dotnet restore --force-evaluate"],
  },

  // ── 7. PHP (Laravel, Symfony, WordPress)
  {
    id: "php",
    name: "PHP (Composer, Laravel, Symfony)",
    category: "backend",
    manifests: ["composer.json"],
    lockfiles: ["composer.lock"],
    vendorDirs: ["vendor"],
    resolveInstallCommands: () => ["composer install --no-interaction --prefer-dist --no-scripts -q || true"],
    resolveVerifyCommands: () => ["composer test", "./vendor/bin/phpunit", "php artisan test"],
    resolveLockfileUpdateCommands: () => ["composer update --lock"],
  },

  // ── 8. Ruby (Rails, Sinatra, Bundler)
  {
    id: "ruby",
    name: "Ruby (Ruby on Rails, Gemfile)",
    category: "backend",
    manifests: ["Gemfile"],
    lockfiles: ["Gemfile.lock"],
    vendorDirs: ["vendor/bundle"],
    resolveInstallCommands: () => ["bundle install --quiet || true"],
    resolveVerifyCommands: () => ["bundle exec rspec", "bundle exec rake test"],
    resolveLockfileUpdateCommands: () => ["bundle lock --update"],
  },

  // ── 9. Elixir & Erlang (Phoenix, BEAM, Mix, Rebar3)
  {
    id: "elixir",
    name: "Elixir / Erlang (Mix, Rebar3, Phoenix)",
    category: "functional",
    manifests: ["mix.exs", "rebar.config"],
    lockfiles: ["mix.lock", "rebar.lock"],
    vendorDirs: ["deps"],
    resolveInstallCommands: (root) => {
      if (exists(root, "mix.exs")) return ["mix deps.get --quiet || true"];
      if (exists(root, "rebar.config")) return ["rebar3 get-deps || true"];
      return [];
    },
    resolveVerifyCommands: (root) => {
      if (exists(root, "mix.exs")) return ["mix test"];
      if (exists(root, "rebar.config")) return ["rebar3 eunit"];
      return [];
    },
    resolveLockfileUpdateCommands: (root) => {
      if (exists(root, "mix.exs")) return ["mix deps.update --all"];
      return [];
    },
  },

  // ── 10. Dart & Flutter (Mobile, Web, Desktop)
  {
    id: "dart_flutter",
    name: "Dart / Flutter",
    category: "mobile",
    manifests: ["pubspec.yaml"],
    lockfiles: ["pubspec.lock"],
    vendorDirs: [".dart_tool"],
    resolveInstallCommands: () => ["flutter pub get || dart pub get || true"],
    resolveVerifyCommands: () => ["flutter test", "dart test"],
    resolveLockfileUpdateCommands: () => ["flutter pub upgrade || dart pub upgrade"],
  },

  // ── 11. Swift & Objective-C (iOS, macOS, SPM, CocoaPods)
  {
    id: "swift",
    name: "Swift (Swift Package Manager, CocoaPods)",
    category: "mobile",
    manifests: ["Package.swift", "Podfile"],
    lockfiles: ["Package.resolved", "Podfile.lock"],
    vendorDirs: [".build", "Pods"],
    resolveInstallCommands: (root) => {
      if (exists(root, "Podfile")) return ["pod install || true"];
      return ["swift package resolve || true"];
    },
    resolveVerifyCommands: () => ["swift test"],
    resolveLockfileUpdateCommands: () => ["swift package update"],
  },

  // ── 12. C & C++ (CMake, Make, Meson, Ninja, Conan, vcpkg)
  {
    id: "cpp",
    name: "C / C++ (CMake, Conan, vcpkg, Meson, Make)",
    category: "systems",
    manifests: ["CMakeLists.txt", "Makefile", "makefile", "conanfile.txt", "conanfile.py", "vcpkg.json", "meson.build"],
    lockfiles: ["conan.lock", "vcpkg-lock.json"],
    resolveInstallCommands: (root) => {
      const cmds: string[] = [];
      if (exists(root, "conanfile.txt") || exists(root, "conanfile.py")) cmds.push("conan install . --build=missing || true");
      if (exists(root, "vcpkg.json")) cmds.push("vcpkg install || true");
      return cmds;
    },
    resolveVerifyCommands: (root) => {
      if (exists(root, "CMakeLists.txt")) return ["ctest", "cmake --build build --target test"];
      if (exists(root, "Makefile") || exists(root, "makefile")) return ["make test", "make check"];
      return [];
    },
    resolveLockfileUpdateCommands: () => [],
  },

  // ── 13. Blockchain & Web3 (Solidity, Foundry, Hardhat, Anchor, Move, Vyper)
  {
    id: "web3",
    name: "Web3 / Blockchain (Solidity, Foundry, Hardhat, Anchor)",
    category: "blockchain",
    manifests: ["foundry.toml", "hardhat.config.js", "hardhat.config.ts", "Anchor.toml", "truffle-config.js"],
    lockfiles: [],
    resolveInstallCommands: (root) => {
      if (exists(root, "foundry.toml")) return ["forge install || true"];
      if (exists(root, "Anchor.toml")) return ["anchor build || true"];
      return [];
    },
    resolveVerifyCommands: (root) => {
      if (exists(root, "foundry.toml")) return ["forge test"];
      if (exists(root, "Anchor.toml")) return ["anchor test"];
      if (exists(root, "hardhat.config.ts") || exists(root, "hardhat.config.js")) return ["npx hardhat test"];
      return [];
    },
    resolveLockfileUpdateCommands: () => [],
  },

  // ── 14. Infrastructure as Code & Cloud (Terraform, OpenTofu, Pulumi, Helm)
  {
    id: "iac",
    name: "Infrastructure as Code (Terraform, OpenTofu, Pulumi, Helm)",
    category: "iac",
    manifests: ["main.tf", "Pulumi.yaml", "Chart.yaml", "helmfile.yaml"],
    lockfiles: [".terraform.lock.hcl"],
    resolveInstallCommands: (root) => {
      if (exists(root, "main.tf") || exists(root, ".terraform.lock.hcl")) return ["tofu init -backend=false || terraform init -backend=false || true"];
      if (exists(root, "Chart.yaml")) return ["helm dependency update || true"];
      return [];
    },
    resolveVerifyCommands: (root) => {
      if (exists(root, "main.tf")) return ["tofu validate || terraform validate"];
      if (exists(root, "Pulumi.yaml")) return ["pulumi preview"];
      if (exists(root, "Chart.yaml")) return ["helm lint"];
      return [];
    },
    resolveLockfileUpdateCommands: (root) => {
      if (exists(root, "main.tf")) return ["terraform init -upgrade || tofu init -upgrade"];
      return [];
    },
  },

  // ── 15. Zig (Systems, Embedded)
  {
    id: "zig",
    name: "Zig",
    category: "systems",
    manifests: ["build.zig", "build.zig.zon"],
    lockfiles: ["build.zig.zon.lock"],
    resolveInstallCommands: () => ["zig build --fetch || true"],
    resolveVerifyCommands: () => ["zig test", "zig build test"],
    resolveLockfileUpdateCommands: () => [],
  },

  // ── 16. Haskell, OCaml, Clojure, Gleam (Functional)
  {
    id: "functional",
    name: "Functional Languages (Haskell, OCaml, Clojure, Gleam)",
    category: "functional",
    manifests: ["stack.yaml", "*.cabal", "dune-project", "project.clj", "deps.edn", "gleam.toml"],
    lockfiles: ["gleam.lock", "cabal.project.freeze"],
    resolveInstallCommands: (root) => {
      if (exists(root, "gleam.toml")) return ["gleam deps download || true"];
      if (exists(root, "dune-project")) return ["dune build || true"];
      if (exists(root, "project.clj")) return ["lein deps || true"];
      if (exists(root, "stack.yaml")) return ["stack build --only-dependencies || true"];
      return [];
    },
    resolveVerifyCommands: (root) => {
      if (exists(root, "gleam.toml")) return ["gleam test"];
      if (exists(root, "dune-project")) return ["dune runtest"];
      if (exists(root, "project.clj")) return ["lein test"];
      if (exists(root, "stack.yaml")) return ["stack test"];
      return [];
    },
    resolveLockfileUpdateCommands: () => [],
  },

  // ── 17. Julia & R (Scientific, Statistical)
  {
    id: "scientific",
    name: "Julia & R (Scientific / Statistical)",
    category: "ai_data",
    manifests: ["Project.toml", "DESCRIPTION", "renv.lock"],
    lockfiles: ["Manifest.toml", "renv.lock"],
    resolveInstallCommands: (root) => {
      if (exists(root, "Project.toml")) return ["julia -e \"using Pkg; Pkg.instantiate()\" || true"];
      if (exists(root, "renv.lock")) return ["R -e \"renv::restore()\" || true"];
      return [];
    },
    resolveVerifyCommands: (root) => {
      if (exists(root, "Project.toml")) return ["julia -e \"using Pkg; Pkg.test()\""];
      if (exists(root, "DESCRIPTION")) return ["R CMD check ."];
      return [];
    },
    resolveLockfileUpdateCommands: () => [],
  },
];

/**
 * Universal Ecosystem Manager:
 * Discovers project stacks, extracts commands from CI logs, and provisions runtime dependencies.
 */
export class EcosystemManager {
  /**
   * Detect all active ecosystems present in the workspace root or subdirectories.
   */
  static detectActiveEcosystems(root: string): EcosystemDescriptor[] {
    const active: EcosystemDescriptor[] = [];
    for (const eco of UNIVERSAL_ECOSYSTEMS) {
      const hasManifest = eco.manifests.some((m) => {
        if (m.includes("*")) {
          try {
            const ext = m.replace("*", "");
            return fs.readdirSync(root).some((f) => f.endsWith(ext));
          } catch { return false; }
        }
        return exists(root, m);
      });

      if (hasManifest) {
        active.push(eco);
      }
    }
    return active;
  }

  /**
   * Resolve lockfile updates dynamically across all detected ecosystems.
   */
  static resolveLockfileCommands(root: string, fix?: CodeFix): string[] {
    if (fix?.packageSyncCommand) return [fix.packageSyncCommand];
    const ecosystems = this.detectActiveEcosystems(root);
    return ecosystems.flatMap((e) => e.resolveLockfileUpdateCommands(root));
  }

  /**
   * Resolve dependency installation / sync commands across all detected ecosystems.
   */
  static resolveInstallCommands(root: string, fix?: CodeFix): string[] {
    if (fix?.packageSyncCommand) return [fix.packageSyncCommand];
    const ecosystems = this.detectActiveEcosystems(root);
    return ecosystems.flatMap((e) => e.resolveInstallCommands(root));
  }

  /**
   * Resolve verification / test commands across all detected ecosystems.
   */
  static resolveVerifyCommands(root: string, fix?: CodeFix): string[] {
    if (fix?.verificationCommand) return [fix.verificationCommand];
    const ecosystems = this.detectActiveEcosystems(root);
    return ecosystems.flatMap((e) => e.resolveVerifyCommands(root));
  }

  /**
   * Extract historical setup/install commands directly from the CI pipeline runner logs.
   */
  static extractCIPipelineInstallCommands(event: FailureEvent): string[] {
    const logs = event.failure.logs ?? "";
    if (!logs) return [];

    const installKeywords = [
      "install", "restore", "sync", "deps.get", "fetch", "download",
      "pod install", "bundle install", "pip install", "npm ci", "npm install",
      "pnpm install", "yarn install", "cargo fetch", "go mod download"
    ];

    const extracted: string[] = [];
    const lines = logs.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^(?:##\[group\])?Run\s+(.+)$/i);
      if (match && match[1]) {
        const cmd = match[1].trim();
        if (
          installKeywords.some((kw) => cmd.toLowerCase().includes(kw)) &&
          !cmd.startsWith("actions/") &&
          !cmd.startsWith("docker://") &&
          cmd.length < 200
        ) {
          extracted.push(cmd);
        }
      }
    }

    return [...new Set(extracted)];
  }
}
