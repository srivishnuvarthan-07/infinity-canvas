export const aiEngineSystemInstruction = `
You are the Creative Whiteboard AI engine for Infinity Canvas.

Your task:
Generate ONLY valid JSON matching the exact schema below.

--------------------------------------------------

SCHEMA:
{
  "direction": "TB",
  "nodes": [
    { "id": "A", "label": "Start", "type": "rectangle" },
    { "id": "B", "label": "Process", "type": "ellipse" },
    { "id": "C", "label": "Decision", "type": "diamond" }
  ],
  "edges": [
    { "from": "A", "to": "B", "label": "Optional label" },
    { "from": "B", "to": "C" }
  ]
}

RULES:
1. Node types MUST be one of: "rectangle", "ellipse", "diamond".
2. Keep maximum 25 nodes.
3. Keep labels short (2–5 words).
4. Use simple IDs like A, B, C, N1, N2...
5. Include a TITLE node as the first node if appropriate:
   { "id": "TITLE", "label": "Diagram Title", "type": "rectangle" }
6. Choose "direction" based on diagram shape:
   - Use "LR" (left-to-right) for: pipelines, CI/CD, state machines, parallel branches, horizontal flows.
   - Use "TB" (top-to-bottom) for: flowcharts, decision trees, org charts, sequences, vertical flows.
7. Do NOT explain anything.
8. Do NOT wrap the JSON in markdown code blocks (\`\`\`json).
9. Return raw JSON text only.

--------------------------------------------------

If the request is not visual, respond with a plain text string starting with:
NON_VISUAL: <short suggestion>
`;

export class AIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Using Groq's latest Llama 3.3 model for reasoning
    this.model = "llama-3.3-70b-versatile";
  }

  async generateGraphJSON(prompt, retryCount = 0) {
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
          temperature: 0.2,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error [${response.status}]: ${errText}`);
      }

      const resData = await response.json();
      let text = resData.choices[0]?.message?.content?.trim() || "";

      // Detect non-visual
      if (text.startsWith("NON_VISUAL:")) {
        return {
          intent_type: "non_visual",
          suggestion: text.replace("NON_VISUAL:", "").trim()
        };
      }

      // Sometimes Llama still wraps in markdown despite instructions if response_format JSON is buggy
      if (text.startsWith("\`\`\`json")) {
        text = text.replace(/^\`\`\`json\n?/, "").replace(/\n?\`\`\`$/, "");
      } else if (text.startsWith("\`\`\`")) {
        text = text.replace(/^\`\`\`\n?/, "").replace(/\n?\`\`\`$/, "");
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(text);
      } catch (parseErr) {
        if (retryCount < 2) {
          return this.generateGraphJSON(
            prompt + "\n\nReturn ONLY valid JSON. Your previous response failed to parse.",
            retryCount + 1
          );
        }
        throw new Error("Invalid output from AI: Not valid JSON.");
      }

      return {
        intent_type: "visual",
        graph: parsedJson
      };

    } catch (error) {
      console.error("AI Graph Generation Error:", error);
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
