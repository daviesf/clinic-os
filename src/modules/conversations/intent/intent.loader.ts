import { INTENT_RULES, IntentRule } from "./intent.config";
import { normalizeText, tokenizeNormalized } from "../utils/normalize";
import { MessagePriority } from "../types";

export interface CompiledIntentRule extends IntentRule {
  regexes: RegExp[];
  patternCount: number;
  keywords: Set<string>;
}

export class IntentLoader {
  private highPriorityRules: CompiledIntentRule[] = [];
  private normalRules: CompiledIntentRule[] = [];

  constructor() {
    const compiled = this.normalize(INTENT_RULES);
    this.validate(compiled);

    for (const rule of compiled) {
      if (rule.priority === MessagePriority.HIGH) {
        this.highPriorityRules.push(rule);
      } else {
        this.normalRules.push(rule);
      }
    }
  }

  getHighPriorityRules(): CompiledIntentRule[] {
    return this.highPriorityRules;
  }

  getNormalRules(): CompiledIntentRule[] {
    return this.normalRules;
  }

  private normalize(rules: IntentRule[]): CompiledIntentRule[] {
    return rules.map((rule) => {
      const keywords = new Set<string>();
      rule.patterns.forEach((p) => {
        const normalized = normalizeText(p);
        tokenizeNormalized(normalized).forEach((token: string) =>
          keywords.add(token),
        );
      });

      return {
        ...rule,
        regexes: rule.patterns.map((p) => this.toRegex(p)),
        patternCount: Math.max(1, rule.patterns.length), // avoid division by zero
        keywords,
      };
    });
  }

  private toRegex(pattern: string): RegExp {
    const normalizedPattern = normalizeText(pattern);
    const words = normalizedPattern.split(/\s+/);

    // Create strategy: \bword\w*\b for each word
    const regexParts = words.map((word) => `\\b${word}\\w*\\b`);
    const regexStr = regexParts.join("\\s+");

    return new RegExp(regexStr, "i"); // "i" is safe
  }

  private validate(rules: IntentRule[]) {
    for (const rule of rules) {
      if (!rule.patterns || rule.patterns.length === 0) {
        throw new Error(`Intent ${rule.intent} must have at least one pattern`);
      }
    }
  }
}
