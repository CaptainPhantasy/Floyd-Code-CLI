import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TerminalLayoutSpec } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: JSON Sanitizer ---
const cleanJson = (text: string) => {
  // Removes Markdown code block wrappers and trims whitespace
  return text.replace(/```json|```/g, '').trim();
};

// --- Schema Definitions ---

const rectSchema = {
  type: Type.OBJECT,
  properties: {
    x: { type: Type.INTEGER, description: "X position in char units. Relative to parent top-left if nested." },
    y: { type: Type.INTEGER, description: "Y position in char units. Relative to parent top-left if nested." },
    w: { type: Type.INTEGER, description: "Width in char units" },
    h: { type: Type.INTEGER, description: "Height in char units" },
  },
  required: ["x", "y", "w", "h"],
};

const styleSchema = {
  type: Type.OBJECT,
  properties: {
    border: { type: Type.BOOLEAN },
    borderStyle: {
      type: Type.STRING,
      enum: ["single", "round", "double", "bold", "dashed", "dotted"],
      description: "The ASCII/Unicode border style.",
    },
    padding: { type: Type.INTEGER },
    color: {
      type: Type.STRING,
      enum: ["cyan", "magenta", "green", "yellow", "white", "gray", "red", "blue", "black"],
    },
    // Flexbox & Constraints
    flexDirection: {
      type: Type.STRING,
      enum: ["row", "column"],
      description: "If this node contains children, are they stacked vertically (column) or side-by-side (row)?",
    },
    flexGrow: {
      type: Type.INTEGER,
      description: "If inside a flex container, how much should this expand? 0 = fixed, 1 = take available space.",
    },
    minWidth: { type: Type.INTEGER, description: "Minimum character width to maintain readability." },
    minHeight: { type: Type.INTEGER, description: "Minimum character height." },
  },
  required: ["border", "borderStyle", "padding", "color"],
};

const contentSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Visible title text." },
    body: { type: Type.STRING, description: "Raw text content or ASCII art inside the box." },
  },
  required: [],
};

const baseNodeProperties = {
  id: { type: Type.STRING, description: "Unique identifier (e.g., 'sidebar-left')" },
  name: { type: Type.STRING, description: "Human readable name" },
  type: {
    type: Type.STRING,
    // Expanded semantic types
    enum: [
        "header", "sidebar", "main", "log", "list", "table", "input", "status", "frame",
        "dataTable", "formInput", "progressBar"
    ],
    description: "Use specific types like 'dataTable' or 'formInput' if the visual content matches.",
  },
  rect: rectSchema,
  style: styleSchema,
  content: contentSchema,
  // Focus Management
  focusOrder: { type: Type.INTEGER, description: "The logical tab order index (1, 2, 3...). 0 if not focusable." },
  isFocusable: { type: Type.BOOLEAN },
};

// Level 2 Nesting (Grandchildren)
const grandChildNodeSchema = {
  type: Type.OBJECT,
  properties: {
    ...baseNodeProperties,
  },
  required: ["id", "name", "type", "rect", "style", "content"],
};

// Level 1 Nesting (Children)
const childNodeSchema = {
  type: Type.OBJECT,
  properties: {
    ...baseNodeProperties,
    children: {
      type: Type.ARRAY,
      items: grandChildNodeSchema,
    },
  },
  required: ["id", "name", "type", "rect", "style", "content"],
};

const layoutSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    meta: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        cols: { type: Type.INTEGER },
        rows: { type: Type.INTEGER },
      },
      required: ["name", "cols", "rows"],
    },
    theme: {
      type: Type.OBJECT,
      properties: {
        preset: { type: Type.STRING },
        secondaryPreset: { type: Type.STRING },
        dualMode: { type: Type.STRING, enum: ["blend", "split"] },
        animation: { type: Type.STRING, enum: ["none", "breathe", "rolling", "gradient"] },
        custom: {
            type: Type.OBJECT,
            properties: {
                primary: { type: Type.STRING, description: "Detected primary HEX color" },
                secondary: { type: Type.STRING, description: "Detected secondary HEX color" },
                background: { type: Type.STRING, description: "Detected background HEX color" }
            },
            description: "If 'auto' preset is selected, populate this with extracted colors."
        }
      },
      required: ["preset"],
    },
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ...baseNodeProperties,
          children: {
            type: Type.ARRAY,
            items: childNodeSchema,
          },
        },
        required: ["id", "name", "type", "rect", "style", "content"],
      },
    },
  },
  required: ["meta", "theme", "nodes"],
};

export async function analyzeTerminalImage(
    base64Image: string, 
    themePreset: string = 'floyd-neon',
    monitorConfig: { cols: number, rows: number } = { cols: 160, rows: 45 },
    addFloatingFrame: boolean = false,
    options: {
        secondaryTheme?: string;
        dualMode?: 'blend' | 'split';
        animation?: 'none' | 'breathe' | 'rolling' | 'gradient';
        useFlex?: boolean; 
        asciiArt?: string; // New: optional ASCII header input
    } = {}
): Promise<TerminalLayoutSpec> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const isAutoTheme = themePreset === 'auto';

  const asciiInstruction = options.asciiArt 
    ? `\n**IMPORTANT**: The user has provided the following ASCII Art to be used as a 'header' or 'hero' element. You MUST include a node (type='header' or 'frame') that contains this exact text in its 'content.body' field. Position it appropriately (usually top).
       \nASCII CONTENT:\n${options.asciiArt}\n`
    : "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          },
          {
            text: `Analyze this image of a terminal user interface (TUI).
            
            Goal: Reverse-engineer the layout into a hierarchical JSON specification.
            
            Context:
            - Full terminal grid: ${monitorConfig.cols} columns x ${monitorConfig.rows} rows.
            - Theme: ${isAutoTheme ? "AUTO-DETECT (Extract hex colors)" : `Primary="${themePreset}"${options.secondaryTheme ? `, Secondary="${options.secondaryTheme}"` : ''}`}.
            - Flexbox Mode: ${options.useFlex ? "ENABLED" : "DISABLED"}
            
            Instructions:
            
            1. **Structure & Hierarchy**:
               - Identify panels, containers, and visible elements.
               - Detect 'frames' (invisible groups).
               - Nest elements logically in 'children'.
            
            2. **Semantic Detection**:
               - Identify specific UI components.
               - If it looks like a grid of data, use 'dataTable'.
               - If it looks like a text field with cursor/underline, use 'formInput'.
               - If it looks like [###...], use 'progressBar'.
               
            3. **Coordinates & Constraints**:
               - Provide standard x,y,w,h (rect) for all nodes.
               - **IMPORTANT**: Estimate 'minWidth' and 'minHeight' based on content density.
            
            4. **Flexbox Logic** (Critical because Flexbox Mode is ${options.useFlex ? "ON" : "OFF"}):
               ${options.useFlex ? 
               `- **flexDirection**: For every container with children, determine if children are stacked vertically ('column') or side-by-side (row).
                - **flexGrow**: For every child, determine if it has fixed size (0) or expands to fill space (1).` 
               : `- Ignore flex properties.`}

            5. **Interaction**:
               - **focusOrder**: Assign a logical tab order (1, 2, 3) to interactive elements.

            6. **Visuals & Theme**:
               - Styles: border, borderStyle, color.
               ${isAutoTheme ? 
               `- **THEME EXTRACTION**: Detect the exact RGB/HEX colors used in the image.
                - Set 'theme.custom.primary' to the main border/text color.
                - Set 'theme.custom.secondary' to the highlight/accent color.
                - Set 'theme.custom.background' to the background color.` 
               : ''}
               
            7. **Floating Frame** (Requested: ${addFloatingFrame}):
               - If TRUE, append a centered 'frame' node named 'floating-popup'.

            ${asciiInstruction}

            Return valid JSON matching the schema.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: layoutSchema,
        thinkingConfig: {
          thinkingBudget: 32768, 
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const cleanedText = cleanJson(text);
    const data = JSON.parse(cleanedText) as TerminalLayoutSpec;
    
    // Post-processing to enforce UI state consistency
    if (data.theme) {
        if (!isAutoTheme) {
            data.theme.preset = themePreset;
        } else {
            data.theme.preset = 'auto'; 
        }

        if (options.secondaryTheme) {
            data.theme.secondaryPreset = options.secondaryTheme;
            data.theme.dualMode = options.dualMode || 'blend';
        }
        if (options.animation) {
            data.theme.animation = options.animation;
        }
    }

    if (data.meta) {
        data.meta.cols = monitorConfig.cols;
        data.meta.rows = monitorConfig.rows;
    }

    return data;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function refineLayout(
    currentSpec: TerminalLayoutSpec,
    instruction: string,
    originalImageBase64?: string | null
): Promise<TerminalLayoutSpec> {
    
    // Construct parts array. We include image if available for context, but mainly we are editing JSON.
    const parts: any[] = [];
    
    if (originalImageBase64) {
        const base64Data = originalImageBase64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({
            inlineData: {
                mimeType: "image/png",
                data: base64Data,
            },
        });
    }

    parts.push({
        text: `You are an expert TUI designer.
        
        TASK: Refine the existing Terminal UI JSON specification based on the user's natural language request.
        
        CURRENT JSON SPEC:
        \`\`\`json
        ${JSON.stringify(currentSpec)}
        \`\`\`
        
        USER INSTRUCTION: "${instruction}"
        
        RULES:
        1. Return ONLY the valid, updated JSON matching the original schema.
        2. Preserve existing structure unless the user asks to move/delete things.
        3. If the user asks to change the theme, update the 'theme' object.
        4. If the user asks to resize, update 'rect' (x, y, w, h).
        5. If the user asks to add an element, insert a new node into 'nodes' or 'children'.
        
        Return the full updated JSON.`
    });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: layoutSchema,
                thinkingConfig: { thinkingBudget: 16384 } // Lower budget for refinement
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini");
        
        const cleanedText = cleanJson(text);
        return JSON.parse(cleanedText) as TerminalLayoutSpec;

    } catch (error) {
        console.error("Refinement Error:", error);
        throw error;
    }
}