
import { z } from "zod";

const aiEngineSystemInstruction = `You are the Creative Whiteboard AI engine for Infinity Canvas.

Infinity Canvas is a freeform brainstorming whiteboard similar to Excalidraw.

You do NOT generate structured UML schemas.
You do NOT generate diagram categories.

You generate a VISUAL SCENE GRAPH describing whiteboard elements
and their spatial coordinates using normalized hints.

Return STRICT JSON only.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include any text outside JSON.

--------------------------------------------------

GOAL:

Transform the user request into a visual whiteboard scene
as if a human is sketching ideas on a board.

Break concepts into visual chunks.
Show relationships using arrows.
Group related ideas spatially.
Keep layout organic and readable.

--------------------------------------------------

SHAPE TYPES ALLOWED:

- rectangle  (systems, modules, concepts)
- circle     (entities, simple items)
- diamond    (decisions)
- text       (titles, notes)
- arrow      (relationships)
- group      (logical grouping container)

--------------------------------------------------

POSITION HINTS (HYBRID MODEL):

Infinity Canvas uses a HYBRID spatial model.
You do NOT generate pixel coordinates.
You generate normalized spatial hints.

COORDINATE RULES:

Each visual element must include:
"x_hint": number between -1.0 and 1.0
"y_hint": number between -1.0 and 1.0

Where:
- (0,0) is canvas center
- (-1,-1) is top-left zone
- (1,1) is bottom-right zone
- Values should generally stay within -0.9 to 0.9

Do NOT use pixel values.
Do NOT assume canvas size.
Do NOT generate coordinates outside range.

--------------------------------------------------

LAYOUT RULES:

1. Avoid overlapping by spacing elements logically.
2. Spread elements evenly when multiple exist.
3. Use relative spacing rather than stacking on same hints.
4. Keep titles near y_hint -0.8.
5. Keep main flow near y_hint 0.
6. Keep supporting components near y_hint 0.5 to 0.8.
7. Do not crowd center with too many elements.

--------------------------------------------------

RESPONSE FORMAT:

{
  "intent_type": "visual",
  "style": "hybrid_whiteboard",
  "confidence": 0.0-1.0,
  "scene": [
    {
      "id": "unique_id",
      "type": "rectangle | circle | diamond | text",
      "label": "short readable text",
      "x_hint": 0.5,
      "y_hint": -0.2
    },
    {
      "id": "unique_id",
      "type": "arrow",
      "from": "source_id",
      "to": "target_id",
      "label": "optional"
    }
  ]
}

--------------------------------------------------

WHITEBOARD BEHAVIOR RULES:

1. Keep maximum elements under 25 unless absolutely necessary.
2. Use clusters for related concepts.
3. Use arrows to show data flow or logical relationships.
4. Add a top-level title using type: "text".
5. Avoid overly detailed paragraphs.
6. Make it look like brainstorming, not documentation.
7. If the request is not visual, respond with:

{
  "intent_type": "non_visual",
  "confidence": 0.0-1.0,
  "suggestion": "Suggest a possible visual representation."
}`;

const BaseResponseSchema = z.object({
  intent_type: z.enum(["visual", "non_visual"]),
  confidence: z.number().min(0).max(1),
});

const VisualResponseSchema = BaseResponseSchema.extend({
  intent_type: z.literal("visual"),
  style: z.string(),
  layout_intent: z.string().optional(),
  scene: z.array(z.any()),
});

const NonVisualResponseSchema = BaseResponseSchema.extend({
  intent_type: z.literal("non_visual"),
  suggestion: z.string().optional(),
});

const DiagramIntentSchema = z.union([VisualResponseSchema, NonVisualResponseSchema]);

export class AIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Using Groq's latest Llama 3.3 model for reasoning
    this.model = "llama-3.3-70b-versatile";
  }

  async generateDiagramIntent(prompt, retryCount = 0) {
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
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API Error [${response.status}]: ${errText}`);
      }

      const resData = await response.json();
      const text = resData.choices[0]?.message?.content || "{}";
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        if (retryCount < 2) {
          return this.generateDiagramIntent(`${prompt}\n\nYou returned invalid JSON. Fix format only. Never trust AI blindly.`, retryCount + 1);
        }
        throw new Error("Failed to parse JSON from AI response after retries.");
      }

      const validation = DiagramIntentSchema.safeParse(json);
      if (!validation.success) {
        if (retryCount < 2) {
          return this.generateDiagramIntent(`${prompt}\n\nYou returned invalid JSON format. Fix format only. Validation errors: ${validation.error.message}`, retryCount + 1);
        }
        throw new Error("Invalid response schema from AI.");
      }

      return validation.data;
    } catch (error) {
      console.error("AI Diagram Generation Error:", error);
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
