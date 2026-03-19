import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: apiKey || "" });

export async function summarizeAbstract(abstract: string): Promise<string> {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Skipping summarization.");
    return "";
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following academic dissertation abstract in 2-3 concise sentences for a general audience:\n\n${abstract}`,
      config: {
        systemInstruction: "You are an expert academic summarizer. Provide clear, professional, and concise summaries.",
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Error summarizing abstract:", error);
    return "";
  }
}
