import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const generateFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  try {
    // Initialize AI client directly with process.env.API_KEY as per guidelines
    // Note: process.env.API_KEY is polyfilled via vite.config.ts for browser compatibility
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Prepare a summary of the data to send to the model to save tokens
    const summary = transactions.slice(0, 50).map(t => ({
      date: t.date.toISOString().split('T')[0],
      type: t.type,
      amount: t.amount,
      category: t.category
    }));

    const prompt = `
      Analyze the following financial transaction history (last 60 days mock data).
      Provide 3 concise, actionable, and slightly witty financial insights or advice bullet points based on spending patterns.
      Format the output as valid HTML list items (<li>) without the <ul> tags.
      
      Data: ${JSON.stringify(summary)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster, simple text tasks
      }
    });

    return response.text || "<li>No insights available at the moment.</li>";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "<li>Unable to generate AI insights. Please check your API key or internet connection.</li>";
  }
};