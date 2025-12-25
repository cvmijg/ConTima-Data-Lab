import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, FileData } from '../types';

const SYSTEM_INSTRUCTION = `
You are "ConTima", a professional Content Performance & Revenue Analytics Engine. 
Your goal is to analyze multiple CSV files from YouTube Analytics uploaded by a user.

RULES:
1. Detect and classify each file based on its headers/content (Performance, Retention, Revenue, Traffic/CTR).
2. Do not mix raw tables blindly; treat each as a distinct source initially.
3. Merge insights only when Video ID, Title, or Date Ranges match.
4. Output must be strictly valid JSON matching the provided schema.
5. Identify charts that would be useful and provide the data for them.
6. Recommendations must be actionable and business-focused.

Ensure the "contentPerformance", "retention", "revenue", "thumbnails", and "combinedStrategicInsights" fields contain Markdown formatted text with headings, bullet points, and bold text for readability. 
Do not include the raw CSV data in the output text, summarize it.
`;

export const analyzeFiles = async (files: FileData[]): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare the prompt content
  let promptText = "Analyze the following CSV files:\n\n";
  files.forEach((file, index) => {
    promptText += `--- FILE ${index + 1}: ${file.name} ---\n`;
    promptText += `${file.content}\n\n`;
  });

  promptText += "\nProvide a detailed analysis following the ConTima structure.";

  // Define the output schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      filesDetected: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            purpose: { type: Type.STRING },
          },
          required: ["name", "purpose"],
        },
      },
      contentPerformance: { type: Type.STRING, description: "Markdown analysis for Content Performance" },
      retention: { type: Type.STRING, description: "Markdown analysis for Audience Retention" },
      revenue: { type: Type.STRING, description: "Markdown analysis for Revenue & ROI" },
      thumbnails: { type: Type.STRING, description: "Markdown analysis for CTR & Thumbnails" },
      combinedStrategicInsights: { type: Type.STRING, description: "Combined insights Markdown" },
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING },
            impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
            description: { type: Type.STRING },
          },
          required: ["action", "impact", "description"],
        },
      },
      charts: {
        type: Type.ARRAY,
        description: "Generate 2-4 key charts based on the data.",
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["bar", "line", "area"] },
            xAxisKey: { type: Type.STRING, description: "Key to use for X axis (e.g., date, video_title)" },
            dataKeys: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keys to plot lines/bars for" },
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "The label for the X-axis (value matching xAxisKey)" },
                  series: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING, description: "Metric name (must match one of dataKeys)" },
                        value: { type: Type.NUMBER, description: "Metric value" }
                      },
                      required: ["key", "value"]
                    }
                  }
                },
                required: ["name", "series"],
              },
            },
          },
          required: ["title", "type", "data", "xAxisKey", "dataKeys"],
        },
      },
    },
    required: ["filesDetected", "combinedStrategicInsights", "recommendations"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Efficient for large context
      contents: [
        { role: "user", parts: [{ text: promptText }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    // Parse the result
    const result = JSON.parse(text);

    // Transform charts data from schema-compliant format to flat format for Recharts
    if (result.charts && Array.isArray(result.charts)) {
        result.charts = result.charts.map((chart: any) => {
            const flatData = chart.data?.map((item: any) => {
                // Initialize object with the x-axis key using the 'name' property from schema
                const dataPoint: any = { [chart.xAxisKey]: item.name };
                
                // Add series data
                if (item.series && Array.isArray(item.series)) {
                    item.series.forEach((s: any) => {
                        dataPoint[s.key] = s.value;
                    });
                }
                return dataPoint;
            }) || [];

            return {
                ...chart,
                data: flatData
            };
        });
    }

    return result as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const initializeChat = async (files: FileData[], analysis: AnalysisResult): Promise<Chat> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are ConTima's interactive AI assistant. You are helpful, professional, and data-driven. You have access to the user's uploaded YouTube analytics CSVs and an initial analysis report. Your goal is to answer specific questions, drill down into the data, and provide deeper explanations for the recommendations. Keep answers concise but insightful.",
    }
  });

  // Construct context message
  let contextMsg = "Here is the context for our session:\n\n";
  files.forEach((f, i) => {
    contextMsg += `--- FILE ${i+1}: ${f.name} ---\n${f.content}\n\n`;
  });
  
  // Create a summary of the analysis to keep tokens manageable, or send full if reasonable
  const analysisSummary = {
    insights: analysis.combinedStrategicInsights,
    recommendations: analysis.recommendations,
    filesDetected: analysis.filesDetected
  };
  
  contextMsg += `--- INITIAL ANALYSIS SUMMARY ---\n${JSON.stringify(analysisSummary)}\n\n`;
  contextMsg += "Please acknowledge you have received the data and are ready for questions. Do not repeat the analysis.";

  // Send initial context (silent)
  await chat.sendMessage({ message: contextMsg });

  return chat;
};