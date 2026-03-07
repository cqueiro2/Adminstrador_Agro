
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { Animal } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Provide a fallback for type safety, though it won't work

export const estimateFinalWeight = async (
  animal: Animal,
  entryWeight: number,
  entryWeightDate: string,
  targetExitDate: string
): Promise<number | null> => {
  if (!API_KEY) {
    throw new Error("API_KEY for Gemini is not configured.");
  }

  const prompt = `
    Você é um especialista em pecuária e zootecnia.
    Um animal da raça '${animal.raca}', cor '${animal.cor}', com data de entrada geral de ${animal.dataEntradaAnimal} (YYYY-MM-DD).
    Para um período de controle de peso específico, este animal teve um peso de entrada de ${entryWeight} kg em ${entryWeightDate} (YYYY-MM-DD).
    A data de saída prevista para este período é ${targetExitDate} (YYYY-MM-DD).
    Com base nesses dados e no conhecimento geral sobre o crescimento da raça '${animal.raca}', qual seria o peso final estimado em kg para este animal ao final deste período?
    Por favor, forneça apenas o valor numérico do peso final estimado em kg.
    Exemplo de resposta: "150" ou "150.5".
    Se não for possível estimar, responda "Não estimável".
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.5, // Moderately creative for estimation
      }
    });

    const text = response.text.trim();
    
    // Attempt to extract number
    const numberMatch = text.match(/(\d+(\.\d+)?)/);
    if (numberMatch && numberMatch[1]) {
      return parseFloat(numberMatch[1]);
    }

    console.warn("Gemini response for weight estimation was not a clear number:", text);
    return null; 
  } catch (error) {
    console.error("Error calling Gemini API for weight estimation:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error("Unknown error calling Gemini API.");
  }
};
