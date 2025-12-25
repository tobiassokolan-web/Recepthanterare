
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    prepTime: { type: Type.STRING },
    cookTime: { type: Type.STRING },
    servings: { type: Type.INTEGER },
    category: { type: Type.STRING, enum: ['Frukost', 'Lunch', 'Middag', 'Efterrätt', 'Mellanmål'] },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          amount: { type: Type.STRING }
        },
        required: ['item', 'amount']
      }
    },
    instructions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          instruction: { type: Type.STRING }
        },
        required: ['order', 'instruction']
      }
    }
  },
  required: ['title', 'description', 'ingredients', 'instructions', 'category']
};

export const generateRecipe = async (prompt: string): Promise<Partial<Recipe>> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Skapa ett detaljerat recept baserat på följande idé: ${prompt}. Svara på svenska.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA
    }
  });

  try {
    const data = JSON.parse(response.text);
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      isFavorite: false,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.title)}/800/600`
    };
  } catch (error) {
    console.error("Failed to parse recipe:", error);
    throw new Error("Kunde inte tolka receptet från AI:n.");
  }
};

export const importRecipeFromTextOrUrl = async (input: string): Promise<Partial<Recipe>> => {
  const isUrl = input.trim().startsWith('http');
  
  const prompt = isUrl 
    ? `Besök och extrahera receptet från denna URL: ${input}. Strukturera det korrekt. Rensa bort bloggtext, annonser och metadata. Om mått saknas, uppskatta dem logiskt. Svara på svenska.`
    : `Extrahera och strukturera ett recept från följande råtext. Rensa bort onödig bloggtext eller metadata. Om mått saknas, uppskatta dem. Svara på svenska. Text: ${input}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA,
      // Aktivera googleSearch för att säkerställa att AI:n kan nå URL:en om den är ny eller inte finns i träningsdata
      tools: isUrl ? [{ googleSearch: {} }] : []
    }
  });

  try {
    const data = JSON.parse(response.text);
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      isFavorite: false,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.title)}/800/600`
    };
  } catch (error) {
    console.error("Failed to parse imported recipe:", error);
    throw new Error("Kunde inte analysera innehållet. Se till att länken eller texten innehåller ett tydligt recept.");
  }
};
