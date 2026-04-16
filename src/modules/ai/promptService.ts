import fs from "fs";
import path from "path";

export class PromptService {
  private promptsDir: string;

  constructor() {
    this.promptsDir = path.resolve(__dirname, "../../../src/prompts");
  }

  getPrompt(name: string): string {
    try {
      const promptPath = path.join(this.promptsDir, `${name}.txt`);
      return fs.readFileSync(promptPath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to load prompt: ${name}`);
    }
  }
}
