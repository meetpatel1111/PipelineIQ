import type { IAIEngine, AIEngineConfig, AIProviderInterface, AIRequest } from "./types.js";
import type { FailureEvent, EnrichmentResult, DeterministicFallback, Severity, Priority } from "../types/index.js";
import type { EnrichmentContext } from "../enrichers/types.js";
import { DeterministicFallbackEngine } from "./fallbacks.js";
import { OpenAIProvider, AnthropicProvider, AzureOpenAIProvider, LocalAIProvider } from "./providers.js";
import { GeminiProvider } from "./gemini-provider.js";

/**
 * Main AI Engine implementation with deterministic fallbacks
 * Follows PRD Section 14: AI is OPTIONAL with deterministic fallbacks
 */
export class AIEngine implements IAIEngine {
  private provider: AIProviderInterface | null = null;
  private config: AIEngineConfig;
  private isInitialized = false;

  constructor(config: AIEngineConfig) {
    this.config = config;
    this.initializeProvider();
  }

  /**
   * Initialize AI provider based on configuration
   */
  private initializeProvider(): void {
    if (!this.config.provider) {
      // No provider configured - AI disabled
      return;
    }

    try {
      switch (this.config.provider) {
        case "openai":
          this.provider = new OpenAIProvider(this.config);
          break;
        case "anthropic":
          this.provider = new AnthropicProvider(this.config);
          break;
        case "azure-openai":
          this.provider = new AzureOpenAIProvider(this.config);
          break;
        case "local":
          this.provider = new LocalAIProvider(this.config);
          break;
        case "gemini":
          this.provider = new GeminiProvider(this.config);
          break;
        default:
          console.warn(`Unknown AI provider: ${this.config.provider}`);
          return;
      }

      if (this.provider.isAvailable()) {
        this.isInitialized = true;
      } else {
        console.warn(`AI provider ${this.config.provider} is not available, falling back to deterministic`);
        this.provider = null;
      }
    } catch (error) {
      console.warn(`Failed to initialize AI provider ${this.config.provider}: ${error}`);
      this.provider = null;
    }
  }

  /**
   * Check if AI engine is available and ready
   */
  isAvailable(): boolean {
    return this.isInitialized && this.provider !== null;
  }

  /**
   * Get the name of the current provider
   */
  getProvider(): string {
    return this.provider?.name || "none";
  }

  /**
   * Main enrichment method - follows PRD architectural contract
   * 
   * Pipeline:
   * field value = AI producer (if enabled & succeeds & confidence ≥ threshold)
   *            → deterministic producer (always)
   *            → null / omitted (only for advanced AI-only fields)
   */
  async enrich(
    event: FailureEvent, 
    config: AIEngineConfig, 
    history?: EnrichmentContext["history"]
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];
    
    // If AI is not available, return deterministic fallbacks immediately
    if (!this.isAvailable()) {
      const deterministicFallback = DeterministicFallbackEngine.generateFallback(event);
      this.addDeterministicResults(results, deterministicFallback, event);
      return results;
    }

    // AI is available - try to get AI insights
    try {
      // 1. Generate classification hint only (cheap) - to provide context to AI
      const classification = DeterministicFallbackEngine.generateClassification(event);
      
      // 2. Build AI request with minimal context from deterministic side
      const aiRequest = this.buildAIRequest(event, { classification } as any, history);
      const aiResponse = await this.provider!.generateInsights(aiRequest);
      
      // 3. Check confidence threshold
      const meetsConfidence = !aiResponse.confidence || aiResponse.confidence >= (config.minConfidence || 0.6);
      
      if (meetsConfidence) {
        // AI Success - populate results from AI
        results.push(
          { field: "summary", value: aiResponse.summary, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "rootCause", value: aiResponse.rootCause, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "remediationSteps", value: aiResponse.remediation, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "category", value: aiResponse.classification, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "severity", value: aiResponse.severity, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "priority", value: this.severityToPriority(aiResponse.severity as any), provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "failingFiles", value: aiResponse.failingFiles, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true }
        );
      } else {
        // AI confidence too low - generate full deterministic fallback now (On-Demand)
        const deterministicFallback = DeterministicFallbackEngine.generateFallback(event);
        this.addDeterministicResults(results, deterministicFallback, event);
      }
    } catch (error) {
      // AI failed - generate full deterministic fallback now (On-Demand)
      console.warn(`[PipelineIQ] AI Enrichment failed, falling back to signatures: ${error}`);
      const deterministicFallback = DeterministicFallbackEngine.generateFallback(event);
      this.addDeterministicResults(results, deterministicFallback, event);
    }

    return results;
  }

  /**
   * Add deterministic fallback results to enrichment results
   */
  private addDeterministicResults(results: EnrichmentResult[], fallback: any, event: FailureEvent): void {
    results.push(
      { field: "summary", value: fallback.summary, provenance: "fallback", aiUsed: false },
      { field: "rootCause", value: fallback.rootCause, provenance: "fallback", aiUsed: false },
      { field: "remediation", value: fallback.remediation, provenance: "fallback", aiUsed: false },
      { field: "severity", value: fallback.severity, provenance: "fallback", aiUsed: false },
      { field: "classification", value: fallback.classification, provenance: "fallback", aiUsed: false },
      { field: "assignee", value: null, provenance: "fallback", aiUsed: false },
      { field: "tags", value: fallback.tags, provenance: "fallback", aiUsed: false },
      { field: "riskAssessment", value: DeterministicFallbackEngine.generateRiskAssessment(event), provenance: "fallback", aiUsed: false }
    );
  }

  /**
   * Build AI request from failure event and deterministic fallback
   */
  private buildAIRequest(
    event: FailureEvent, 
    fallback: DeterministicFallback,
    history?: EnrichmentContext["history"]
  ): AIRequest {
    // Use historical context if available
    let historicalContext = "";
    if (history) {
      historicalContext = `This failure has a signature that has appeared ${history.similarCount} times in the last 30 days. `;
      if (history.isFlaky) {
        historicalContext += "This appears to be a FLAKY failure (alternating success/failure). ";
      }
      if (history.trend) {
        historicalContext += `The failure trend is currently ${history.trend.toUpperCase()}. `;
      }
    }

    return {
      logs: event.failure.logs || "",
      errorMessage: event.failure.errorMessage || "",
      stackTrace: event.failure.stackTrace || "",
      failedCommand: event.failure.failedCommand || "",
      exitCode: event.failure.exitCode,
      pipelineName: event.pipeline.name,
      repositoryName: event.repository.name,
      branch: event.branch,
      environment: event.environment,
      category: fallback.classification, // Use deterministic classification as hint
      historicalContext,
    };
  }

  /**
   * Create AI engine instance with mode-based configuration
   */
  static create(mode: "disabled" | "assist" | "full", config?: Partial<AIEngineConfig>): AIEngine {
    let engineConfig: AIEngineConfig = {
      maxTokens: 4096,
      temperature: 0.1,
      timeout: 30000,
      retryAttempts: 3,
      minConfidence: 0.6,
      enableThinking: false,
      thinkingBudget: 8000,
      ...config,
    };

    // Configure based on mode
    switch (mode) {
      case "disabled":
        // No AI provider configured
        return new AIEngine(engineConfig);
      
      case "assist":
        // Basic AI with conservative settings
        return new AIEngine({
          ...engineConfig,
          provider: engineConfig.provider || "gemini",
          temperature: 0.1,
          minConfidence: 0.7, // Higher confidence threshold
        });
      
      case "full":
        // Full AI with more aggressive settings
        return new AIEngine({
          ...engineConfig,
          provider: engineConfig.provider || "gemini",
          temperature: 0.3, // More creative
          minConfidence: 0.5, // Lower confidence threshold
          maxTokens: 8192,
        });
      default:
        return new AIEngine(engineConfig);
    }
  }

  private severityToPriority(severity: Severity): Priority {
    switch (severity) {
      case "Critical": return "Highest";
      case "High": return "High";
      case "Medium": return "Medium";
      case "Low": return "Low";
      default: return "Medium";
    }
  }
}
