interface ClassificationResult {
    intent: string;
    risk_level: string;
}

export function classifyMessage(message: string): ClassificationResult {
    return {
        intent: "unknown",
        risk_level: "low"
    };
}
