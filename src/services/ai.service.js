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
    { "id": "C", "label": "Decision", "type": "diamond" },
    {
      "id": "AWS_VPC",
      "label": "Virtual Private Cloud",
      "type": "group",
      "direction": "LR",
      "nodes": [
        { "id": "D", "label": "Database", "type": "cylinder" },
        { "id": "E", "label": "File Log", "type": "document" }
      ]
    }
  ],
  "edges": [
    { "from": "A", "to": "B", "label": "Optional label" },
    { "from": "B", "to": "D" },
    { "from": "D", "to": "E" }
  ]
}

RULES:
1. Node types MUST be one of: "rectangle", "ellipse", "diamond", "cylinder", "parallelogram", "hexagon", "document", "group".
2. Keep maximum 50 nodes overall.
3. Keep labels short (2–5 words).
4. Use simple IDs like A, B, C, N1, N2...
5. Include a TITLE node as the first node if appropriate:
   { "id": "TITLE", "label": "Diagram Title", "type": "rectangle" }
6. Choose "direction" based on diagram shape:
   - Use "LR" (left-to-right) for: pipelines, CI/CD, state machines, parallel computations.
   - Use "TB" (top-to-bottom) for: flowcharts, org charts, sequences.
7. Nested Layouts (Hybrid Mode) - HIGHLY ENCOURAGED:
   - To create hybrid horizontal + vertical diagrams, nest nodes inside a "group" node.
   - You MUST use alternating directions (e.g. if the root is "TB", the group should be "LR").
   - This is the BEST way to make complex flowcharts look professional, organized, and compact.
   - The "group" node MUST HAVE a \`direction\` ("TB" or "LR") and a \`nodes\` array containing its child nodes.
   - ALL EDGES (even for nodes inside groups) MUST BE FLAT in the root \`edges\` array. Do NOT put edges inside groups.
   - Edges can link from/to any node ID, regardless of what group it is inside.
8. Do NOT explain anything.
9. Do NOT wrap the JSON in markdown code blocks (\`\`\`json).
10. Return raw JSON text only.

--------------------------------------------------

If the request is not visual, respond with a plain text string starting with:
NON_VISUAL: <short suggestion>
`;

export const promptExpanderInstruction = `
You are a highly analytical Technical Architect and Creative Illustrator.

Your task is to take a short user prompt and EXPAND IT into a detailed plan, while explicitly classifying the INTENT into one of three categories: "diagram", "sketch", or "non_visual".

CATEGORIES:
1. "diagram": Structural/technical graphs like flowcharts, architectures, mind maps, pipelines. Things that require nodes and connecting edges.
2. "non_visual": Questions, code generation, or math problems that cannot be drawn on a whiteboard.

RULES for "diagram":
1. Break down into Nodes and Connections.
2. Assign shape types: "rectangle", "ellipse", "diamond", "cylinder", "parallelogram", "hexagon", "document", "group".
3. Suggest a layout: "TB" (top-to-bottom) or "LR" (left-to-right).
   *CRITICAL: If the diagram has distinct phases, multiple parallel steps, or sub-processes, ALWAYS suggest a HYBRID layout using nested groups with alternating directions (e.g., a TB root with several LR groups inside).*

OUTPUT FORMAT (You must strictly follow this):
INTENT: <diagram/non_visual>

<If diagram>
Title: ...
Layout: ...
Entities:
- ...
Connections:
- ...
</If diagram>

<If non_visual>
Excuse: ... (Explain briefly why this isn't a whiteboard request)
</If non_visual>
`;


export class AIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Using Groq's latest Llama 3.3 model for reasoning
    this.model = "llama-3.3-70b-versatile";
  }

  async expandPrompt(userPrompt) {
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
            { role: "system", content: promptExpanderInstruction },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.5, // slightly more creative for expansion
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error [${response.status}]: ${errText}`);
      }

      const resData = await response.json();
      return resData.choices[0]?.message?.content?.trim() || userPrompt;
    } catch (error) {
      console.error("AI Prompt Expansion Error:", error);
      // Fallback to original prompt if expansion fails
      return userPrompt;
    }
  }

  async generateGraphJSON(prompt, retryCount = 0) {
    try {
      // Step 1: Expand prompt and classify intent
      const expandedPlan = await this.expandPrompt(prompt);

      // Extract Intent
      const intentMatch = expandedPlan.match(/INTENT:\s*(diagram|non_visual)/i);
      const intentType = intentMatch ? intentMatch[1].toLowerCase() : 'diagram';

      if (intentType === 'non_visual') {
        const excuseMatch = expandedPlan.match(/Excuse:\s*(.*)/is);
        return {
          intent_type: "non_visual",
          suggestion: excuseMatch ? excuseMatch[1].trim() : "The request is not visual. Please provide a description for a diagram."
        };
      }

      // Step 2: Choose Specialist Prompt
      const systemPrompt = aiEngineSystemInstruction;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Here is the detailed plan to execute:\n\n${expandedPlan}` }
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
        intent_type: intentType,
        graph: parsedJson
      };

    } catch (error) {
      console.error("AI Generation Error:", error);
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
