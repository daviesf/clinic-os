import { IntentLoader, CompiledIntentRule } from "./intent.loader";
import {
  AIClassification,
  MessageIntent,
  MessagePriority,
  ConversationStatus,
  EvaluatedRule,
} from "../types";
import { normalizeText, tokenizeNormalized } from "../utils/normalize";

export class IntentResolver {
  private cache = new Map<string, AIClassification>();
  private readonly MAX_CACHE_SIZE = 500;

  constructor(private readonly loader: IntentLoader) {}

  resolve(message: string, debug = false, tenantId?: string): AIClassification {
    const text = normalizeText(message);
    if (!text) {
      return this.fallback();
    }

    const key = tenantId ? `${text}-${tenantId}` : text;

    if (!debug && this.cache.has(key)) {
      const cachedResult = this.cache.get(key)!;
      // LRU refresh
      this.cache.delete(key);
      this.cache.set(text, cachedResult);
      return cachedResult;
    }

    const messageTokens = tokenizeNormalized(text);

    let skippedRulesCount = 0;
    const evaluatedRules: EvaluatedRule[] = [];

    // --- PHASE 1: HIGH PRIORITY DETECTION ---
    const highPriorityRules = this.loader.getHighPriorityRules();
    for (const rule of highPriorityRules) {
      if (!this.hasIntersection(messageTokens, rule.keywords)) {
        skippedRulesCount++;
        continue;
      }

      let matches = 0;
      const matchedPatterns: string[] = [];

      for (let i = 0; i < rule.regexes.length; i++) {
        if (rule.regexes[i].test(text)) {
          matches++;
          matchedPatterns.push(rule.patterns[i]);
        }
      }

      const score = rule.weight; // Constant score for High Priority

      if (debug) {
        evaluatedRules.push({
          intent: rule.intent,
          matches,
          score,
          matchedPatterns,
        });
      }

      if (matches > 0) {
        return this.returnResult(
          text,
          {
            intent: rule.intent,
            priority: rule.priority,
            action: rule.action,
            score,
            matchedPatterns,
            skippedRulesCount,
            ...(debug && { evaluatedRules }),
          },
          debug,
        );
      }
    }

    // --- PHASE 2: SCORING (Non-HIGH priority) ---
    const normalRules = this.loader.getNormalRules();
    let bestRule: CompiledIntentRule | null = null;
    let bestScore = -1;
    let bestMatchedPatterns: string[] = [];

    for (const rule of normalRules) {
      if (!this.hasIntersection(messageTokens, rule.keywords)) {
        skippedRulesCount++;
        continue;
      }

      let matches = 0;
      const matchedPatterns: string[] = [];

      for (let i = 0; i < rule.regexes.length; i++) {
        if (rule.regexes[i].test(text)) {
          matches++;
          matchedPatterns.push(rule.patterns[i]);
        }
      }

      if (debug) {
        evaluatedRules.push({
          intent: rule.intent,
          matches,
          score: rule.weight + matches / rule.patternCount,
          matchedPatterns,
        });
      }

      if (matches > 0) {
        const score = rule.weight + matches / rule.patternCount;

        if (score > bestScore) {
          bestScore = score;
          bestRule = rule;
          bestMatchedPatterns = matchedPatterns;
        }
      }
    }

    if (bestRule) {
      return this.returnResult(
        text,
        {
          intent: bestRule.intent,
          priority: bestRule.priority,
          action: bestRule.action,
          score: bestScore,
          matchedPatterns: bestMatchedPatterns,
          skippedRulesCount,
          ...(debug && { evaluatedRules }),
        },
        debug,
      );
    }

    return this.returnResult(
      text,
      this.fallback(skippedRulesCount, debug ? evaluatedRules : undefined),
      debug,
    );
  }

  private hasIntersection(tokens: Set<string>, keywords: Set<string>): boolean {
    if (keywords.size === 0) return false; // Rule matches nothing if empty
    for (const token of tokens) {
      if (keywords.has(token)) return true;
    }
    return false;
  }

  private fallback(
    skippedRulesCount = 0,
    evaluatedRules?: EvaluatedRule[],
  ): AIClassification {
    return {
      intent: MessageIntent.UNKNOWN,
      priority: MessagePriority.LOW,
      action: ConversationStatus.AUTO,
      score: 0,
      matchedPatterns: [],
      skippedRulesCount,
      ...(evaluatedRules && { evaluatedRules }),
    };
  }

  private returnResult(
    key: string,
    result: AIClassification,
    debug: boolean,
  ): AIClassification {
    if (!debug) {
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) this.cache.delete(firstKey);
      }
      this.cache.set(key, result);
    }
    return result;
  }
}
