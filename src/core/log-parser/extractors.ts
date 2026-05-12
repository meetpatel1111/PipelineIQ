/**
 * Extractors for specific patterns from log content
 */

/**
 * Extract error messages from logs
 */
export function extractErrorMessages(logs: string): string[] {
  const errorMessages: string[] = [];
  
  // Common error patterns
  const errorPatterns = [
    /error[:\s]+(.+?)(?=\n|$)/gi,
    /Error[:\s]+(.+?)(?=\n|$)/gi,
    /exception[:\s]+(.+?)(?=\n|$)/gi,
    /Exception[:\s]+(.+?)(?=\n|$)/gi,
    /failed[:\s]+(.+?)(?=\n|$)/gi,
    /Failed[:\s]+(.+?)(?=\n|$)/gi,
    /cannot[:\s]+(.+?)(?=\n|$)/gi,
    /Cannot[:\s]+(.+?)(?=\n|$)/gi,
    /unable to[:\s]+(.+?)(?=\n|$)/gi,
    /Unable to[:\s]+(.+?)(?=\n|$)/gi,
    // Specific error formats
    /E[0-9]{3}:?\s*(.+?)(?=\n|$)/gi,
    /fatal[:\s]+(.+?)(?=\n|$)/gi,
    /Fatal[:\s]+(.+?)(?=\n|$)/gi,
  ];

  for (const pattern of errorPatterns) {
    const matches = logs.match(pattern);
    if (matches) {
      errorMessages.push(...matches.map(match => match.trim()));
    }
  }

  // Also extract lines that contain error indicators but don't match patterns
  const lines = logs.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('error') || 
        line.toLowerCase().includes('failed') || 
        line.toLowerCase().includes('exception') ||
        line.toLowerCase().includes('fatal')) {
      // Avoid duplicates
      if (!errorMessages.some(existing => existing.includes(line.trim()))) {
        errorMessages.push(line.trim());
      }
    }
  }

  return [...new Set(errorMessages)]; // Remove duplicates
}

/**
 * Extract stack traces from logs
 */
export function extractStackTraces(logs: string): string[] {
  const stackTraces: string[] = [];
  
  // Stack trace patterns for different languages/frameworks
  const stackPatterns = [
    // JavaScript/Node.js
    {
      start: /at\s+[\w\.$]+\s*\(/g,
      end: "\n\n",
      multiline: true,
    },
    // Java
    {
      start: /Exception in thread|Caused by:/g,
      end: "\n\n",
      multiline: true,
    },
    // Python
    {
      start: /Traceback \(most recent call last\):/g,
      end: "\n\n",
      multiline: true,
    },
    // .NET
    {
      start: /at\s+[A-Za-z_][\w.<>]*\(/g,
      end: "\n\n",
      multiline: true,
    },
    // Go
    {
      start: /goroutine \d+|created by/g,
      end: "\n\n",
      multiline: true,
    },
    // Rust
    {
      start: /thread '.*' panicked at/g,
      end: "\n\n",
      multiline: true,
    },
  ];

  for (const pattern of stackPatterns) {
    const matches = Array.from(logs.matchAll(pattern.start));
    
    for (const match of matches) {
      const startIndex = match.index || 0;
      const endIndex = logs.indexOf(pattern.end, startIndex);
      
      if (endIndex > startIndex) {
        const stackTrace = logs.substring(startIndex, endIndex).trim();
        if (stackTrace.length > 50) { // Filter out very short matches
          stackTraces.push(stackTrace);
        }
      }
    }
  }

  // Also look for multi-line stack traces with common indicators
  const multiLinePatterns = [
    /(\s+at\s+[\w\.$]+\s*\(.*\)\s*\n\s+at\s+[\w\.$]+\s*\(.*\)\s*\n)/g,
    /(\s+at\s+[A-Za-z_][\w.<>]*\(.*\)\s*\n\s+at\s+[A-Za-z_][\w.<>]*\(.*\)\s*\n)/g,
  ];

  for (const pattern of multiLinePatterns) {
    const matches = logs.match(pattern);
    if (matches) {
      stackTraces.push(...matches.map(match => match.trim()));
    }
  }

  return [...new Set(stackTraces)]; // Remove duplicates
}

/**
 * Extract exit codes from logs
 */
export function extractExitCodes(logs: string): number[] {
  const exitCodes: number[] = [];
  
  // Exit code patterns
  const exitCodePatterns = [
    /exit code[:\s]*(\d+)/gi,
    /exit status[:\s]*(\d+)/gi,
    /returned[:\s]*(\d+)/gi,
    /process exited with code[:\s]*(\d+)/gi,
    /command exited with[:\s]*(\d+)/gi,
    /non-zero exit code[:\s]*(\d+)/gi,
    // Shell exit codes
    /\$\?\s*=\s*(\d+)/g,
    // Docker exit codes
    /container exited with status[:\s]*(\d+)/gi,
    // CI/CD specific
    /failed with exit code[:\s]*(\d+)/gi,
    /build failed with exit code[:\s]*(\d+)/gi,
    /test failed with exit code[:\s]*(\d+)/gi,
  ];

  for (const pattern of exitCodePatterns) {
    const matches = Array.from(logs.matchAll(pattern));
    for (const match of matches) {
      const exitCode = parseInt(match[1]!, 10);
      if (!isNaN(exitCode) && exitCode >= 0 && exitCode <= 255) {
        exitCodes.push(exitCode);
      }
    }
  }

  return [...new Set(exitCodes)]; // Remove duplicates
}

/**
 * Extract failed commands from logs
 */
export function extractFailedCommands(logs: string): string[] {
  const failedCommands: string[] = [];
  
  // Command failure patterns
  const commandPatterns = [
    // Shell commands
    /\$?\s*([a-zA-Z0-9_\-\/\.]+\s+.*?)(?=\s*failed|\s*error|\s*exit)/gi,
    // npm/yarn commands
    /(npm|yarn|pnpm)\s+(run|install|test|build)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Docker commands
    /docker\s+(run|build|push|pull)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // kubectl commands
    /kubectl\s+(apply|create|delete|get)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Terraform commands
    /terraform\s+(apply|plan|destroy|init)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Git commands
    /git\s+(clone|checkout|pull|push)\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Make commands
    /make\s+[a-zA-Z0-9_\-\/\.]*/gi,
    // Generic command patterns
    /command\s+["']?([a-zA-Z0-9_\-\/\.\s]+)["']?\s+failed/gi,
    /failed to execute[:\s]*["']?([a-zA-Z0-9_\-\/\.\s]+)["']?/gi,
    // Test runners
    /(jest|mocha|vitest|pytest|go test)\s+.*?(?=\s+failed|\s+error)/gi,
    // Build tools
    /(webpack|vite|rollup|parcel|esbuild)\s+.*?(?=\s+failed|\s+error)/gi,
  ];

  for (const pattern of commandPatterns) {
    const matches = Array.from(logs.matchAll(pattern));
    for (const match of matches) {
      const command = match[1] || match[0];
      if (command && command.trim().length > 0) {
        failedCommands.push(command.trim());
      }
    }
  }

  return [...new Set(failedCommands)]; // Remove duplicates
}

/**
 * Extract deployment targets from logs
 */
export function extractDeploymentTargets(logs: string): string[] {
  const targets: string[] = [];
  
  // Deployment target patterns
  const targetPatterns = [
    // Kubernetes
    /deploying to[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    /namespace[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    /cluster[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    // Docker registries
    /pushing to[:\s]*([a-zA-Z0-9_\-\/\.]+\.[a-zA-Z0-9_\-\/\.]+)/gi,
    /registry[:\s]*([a-zA-Z0-9_\-\/\.]+\.[a-zA-Z0-9_\-\/\.]+)/gi,
    // Cloud providers
    /environment[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    /region[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    // Terraform
    /workspace[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
    /backend[:\s]*([a-zA-Z0-9_\-\/\.]+)/gi,
  ];

  for (const pattern of targetPatterns) {
    const matches = Array.from(logs.matchAll(pattern));
    for (const match of matches) {
      const target = match[1];
      if (target && target.trim().length > 0) {
        targets.push(target.trim());
      }
    }
  }

  return [...new Set(targets)]; // Remove duplicates
}

/**
 * Extract security issues from logs
 */
export function extractSecurityIssues(logs: string): string[] {
  const securityIssues: string[] = [];
  
  // Security issue patterns
  const securityPatterns = [
    // Authentication failures
    /(401\s+unauthorized|authentication\s+failed|invalid\s+token|access\s+denied)/gi,
    // Authorization failures
    /(403\s+forbidden|permission\s+denied|access\s+forbidden)/gi,
    // Secret exposure
    /(secret|password|token|key|credential)\s+(exposed|leaked|found)/gi,
    // Vulnerability mentions
    /(vulnerability|cve-\d+|security\s+issue)/gi,
    // TLS/SSL errors
    /(ssl\s+error|tls\s+error|certificate\s+error|handshake\s+failed)/gi,
    // Injection attempts
    /(sql\s+injection|xss|csrf|command\s+injection)/gi,
  ];

  for (const pattern of securityPatterns) {
    const matches = logs.match(pattern);
    if (matches) {
      securityIssues.push(...matches.map(match => match.trim()));
    }
  }

  return [...new Set(securityIssues)]; // Remove duplicates
}

/**
 * Extract performance issues from logs
 */
export function extractPerformanceIssues(logs: string): string[] {
  const performanceIssues: string[] = [];
  
  // Performance issue patterns
  const performancePatterns = [
    // Timeout patterns
    /(timeout|timed\s+out|deadline\s+exceeded)/gi,
    // Memory issues
    /(out\s+of\s+memory|memory\s+leak|heap\s+overflow)/gi,
    // CPU issues
    /(high\s+cpu|cpu\s+spike|cpu\s+exhaustion)/gi,
    // Disk issues
    /(disk\s+full|no\s+space\s+left|storage\s+exhausted)/gi,
    // Network issues
    /(connection\s+refused|connection\s+timeout|network\s+error)/gi,
    // Slow operations
    /(slow\s+query|slow\s+request|performance\s+degradation)/gi,
  ];

  for (const pattern of performancePatterns) {
    const matches = logs.match(pattern);
    if (matches) {
      performanceIssues.push(...matches.map(match => match.trim()));
    }
  }

  return [...new Set(performanceIssues)]; // Remove duplicates
}
