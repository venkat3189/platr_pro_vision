import { GoogleGenAI, Type } from "@google/genai";
import { RecognitionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function recognizeNumberPlate(base64Image: string, mimeType: string): Promise<RecognitionResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this image and identify ALL vehicle license plates (number plates) visible.
    
    For each plate detected, provide:
    1. plateNumber: The exact alphanumeric characters on the plate.
    2. confidence: "high", "medium", or "low".
    3. vehicleType: e.g., Sedan, SUV, Truck, Bus, Motorcycle.
    4. vehicleModel: Specific make and model if identifiable (e.g., Toyota Camry).
    5. color: Primary color of the vehicle.
    6. region: State or country of the plate.
    7. ownerName: Identify or simulate a plausible owner name for this vehicle.
    8. registrationDate: Identify or simulate a plausible registration date.
    9. plateBoundingBox: CRITICAL - Provide the precise normalized bounding box [ymin, xmin, ymax, xmax] where each value is between 0 and 1000. Ensure the box tightly encloses ONLY the license plate itself.
    
    Return the result as a JSON object with a "plates" array.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                plateNumber: { type: Type.STRING },
                confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
                vehicleType: { type: Type.STRING },
                vehicleModel: { type: Type.STRING },
                color: { type: Type.STRING },
                region: { type: Type.STRING },
                ownerName: { type: Type.STRING },
                registrationDate: { type: Type.STRING },
                plateBoundingBox: {
                  type: Type.OBJECT,
                  properties: {
                    ymin: { type: Type.NUMBER },
                    xmin: { type: Type.NUMBER },
                    ymax: { type: Type.NUMBER },
                    xmax: { type: Type.NUMBER },
                  },
                  required: ["ymin", "xmin", "ymax", "xmax"],
                },
              },
              required: ["plateNumber", "confidence", "plateBoundingBox"],
            },
          },
        },
        required: ["plates"],
      },
    },
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to recognize number plate");
  }
}
