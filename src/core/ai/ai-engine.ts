import type { IAIEngine, AIEngineConfig, AIProviderInterface } from "./types.js";
import type { FailureEvent, EnrichmentResult } from "../types/index.js";
import { DeterministicFallbackEngine } from "./fallbacks.js";
import { OpenAIProvider, AnthropicProvider, AzureOpenAIProvider, LocalAIProvider } from "./providers.js";

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
  async enrich(event: FailureEvent, config: AIEngineConfig): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];
    
    // Always generate deterministic fallback first
    const deterministicFallback = DeterministicFallbackEngine.generateFallback(event);
    
    // If AI is not available, return deterministic fallbacks
    if (!this.isAvailable()) {
      this.addDeterministicResults(results, deterministicFallback, event);
      return results;
    }

    // AI is available - try to get AI insights
    try {
      const aiRequest = this.buildAIRequest(event, deterministicFallback);
      const aiResponse = await this.provider!.generateInsights(aiRequest);
      
      // Check confidence threshold
      const meetsConfidence = !aiResponse.confidence || aiResponse.confidence >= (config.minConfidence || 0.6);
      
      if (meetsConfidence) {
        // Use AI response
        results.push(
          { field: "summary", value: aiResponse.summary, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "rootCause", value: aiResponse.rootCause, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "remediation", value: aiResponse.remediation, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "severity", value: aiResponse.severity, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "classification", value: aiResponse.classification, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "assignee", value: aiResponse.assignee, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "tags", value: aiResponse.tags, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true },
          { field: "riskAssessment", value: aiResponse.riskAssessment, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true }
        );
        if (aiResponse.postmortem) {
          results.push({ field: "postmortem", value: aiResponse.postmortem, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true });
        }
        if (aiResponse.timeline) {
          results.push({ field: "timeline", value: aiResponse.timeline, provenance: "ai", confidence: aiResponse.confidence, aiUsed: true });
        }
      } else {
        // AI response below confidence threshold - use deterministic fallbacks
        this.addDeterministicResults(results, deterministicFallback, event);
      }
    } catch (error) {
      console.warn(`AI enrichment failed: ${error}, falling back to deterministic`);
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
      { field: "assignee", value: fallback.assignee, provenance: "fallback", aiUsed: false },
      { field: "tags", value: fallback.tags, provenance: "fallback", aiUsed: false },
      { field: "riskAssessment", value: DeterministicFallbackEngine.generateRiskAssessment(event), provenance: "fallback", aiUsed: false }
    );
  }

  /**
   * Build AI request from failure event and deterministic fallback
   */
  private buildAIRequest(event: FailureEvent, fallback: any): any {
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
      historicalContext: "", // Would be populated from history in a full implementation
    };
  }

  /**
   * Create AI engine instance with mode-based configuration
   */
  static create(mode: "disabled" | "assist" | "full", config?: Partial<AIEngineConfig>): AIEngine {
    let engineConfig: AIEngineConfig = {
      maxTokens: 1000,
      temperature: 0.1,
      timeout: 30000,
      retryAttempts: 3,
      minConfidence: 0.6,
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
          provider: engineConfig.provider || "openai",
          temperature: 0.1,
          minConfidence: 0.7, // Higher confidence threshold
        });
      
      case "full":
        // Full AI with more aggressive settings
        return new AIEngine({
          ...engineConfig,
          provider: engineConfig.provider || "openai",
          temperature: 0.3, // More creative
          minConfidence: 0.5, // Lower confidence threshold
          maxTokens: 2000, // Larger context window
        });
      
      default:
        return new AIEngine(engineConfig);
    }
  }
}
