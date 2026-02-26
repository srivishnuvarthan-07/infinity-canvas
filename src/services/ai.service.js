export const aiEngineSystemInstruction = `
You are the Creative Whiteboard AI engine for Infinity Canvas.

Your task:
Generate ONLY valid Mermaid diagram code.

--------------------------------------------------

RULES:

1. Use flowchart syntax:
   graph TD
   graph LR

2. Keep maximum 25 nodes.

3. Keep labels short (2–5 words).

4. Use clear IDs:
   A, B, C, D...
   or
   N1, N2, N3...

5. Use:
   A[Rectangle]
   A((Circle))
   A{Decision}

6. Use arrows:
   A --> B
   A -->|Label| B

7. Add a TITLE as the first node:
   TITLE[Diagram Title]

8. Do NOT explain anything.
9. Do NOT wrap in markdown.
10. Return plain Mermaid code only.

--------------------------------------------------

If the request is not visual, respond with:

NON_VISUAL: <short suggestion>
`;

export class AIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Using Groq's latest Llama 3.3 model for reasoning
    this.model = "llama-3.3-70b-versatile";
  }

  async generateMermaid(prompt, retryCount = 0) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: aiEngineSystemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error [${response.status}]: ${errText}`);
      }

      const resData = await response.json();
      const text = resData.choices[0]?.message?.content?.trim() || "";

      // Detect non-visual
      if (text.startsWith("NON_VISUAL:")) {
        return {
          intent_type: "non_visual",
          suggestion: text.replace("NON_VISUAL:", "").trim()
        };
      }

      // Validate Mermaid start
      if (!text.startsWith("graph")) {
        if (retryCount < 2) {
          return this.generateMermaid(
            prompt + "\n\nReturn valid Mermaid starting with 'graph TD' or 'graph LR'. No explanation.",
            retryCount + 1
          );
        }
        throw new Error("Invalid Mermaid response.");
      }

      return {
        intent_type: "visual",
        mermaid: text
      };

    } catch (error) {
      console.error("AI Mermaid Generation Error:", error);
      throw error;
    }
  }
}

// Singleton instance wrapper to easily change key
let instance = null;
export const getAIService = (apiKey) => {
  if (!instance && apiKey) {
    instance = new AIService(apiKey);
  }
  return instance;
};
