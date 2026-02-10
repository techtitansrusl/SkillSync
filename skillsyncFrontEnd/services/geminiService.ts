/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

// This service handles AI interactions.
// API Key is obtained from process.env.API_KEY as per guidelines.

export const generateJobDescriptionAI = async (title: string): Promise<string> => {
  // Guidelines: API key must be obtained exclusively from import.meta.env.VITE_API_KEY
  const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
  if (!apiKey) {
    // Fallback if no key provided in env
    return `Responsibilites for ${title}:\n- Lead the development team.\n- Coordinate with stakeholders.\n- Ensure code quality.\n\nRequirements:\n- 5+ years experience.\n- Strong communication skills.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Write a professional job description for a "${title}". 
      Include a brief summary, key responsibilities, and required qualifications. 
      Format it clearly with bullet points. Keep it under 200 words.`,
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please check your API Key configuration.";
  }
};

export const analyzeResumeAI = async (resumeText: string, jobDescription: string): Promise<{ score: number; insights: string }> => {
  const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
  if (!apiKey) {
    // Fallback simulation
    return {
      score: Math.floor(Math.random() * 40) + 60,
      insights: "Candidate has strong matching skills in React and Node.js but lacks experience in cloud infrastructure."
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Act as a professional technical recruiter.
      Job Description: ${jobDescription}
      Resume Content: ${resumeText}
      
      Task:
      1. Rate the candidate's fit for this job on a scale of 0-100.
      2. Provide a 1-2 sentence insight summarizing the match quality, highlighting key strengths and missing skills.
      
      Return the output as JSON in this format: { "score": number, "insights": "string" }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const json = JSON.parse(text);
    return {
      score: json.score || 0,
      insights: json.insights || "Could not analyze."
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      score: 0,
      insights: "AI Analysis failed."
    };
  }
};