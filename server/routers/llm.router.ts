import { GoogleGenerativeAI } from "@google/generative-ai";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { executeLLMSchema } from "@/server/schemas/workflow.schema";

// Initialize Gemini API
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!apiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Google Generative AI API key not configured",
    });
  }

  return new GoogleGenerativeAI(apiKey);
};

export const llmRouter = createTRPCRouter({
  /**
   * Execute an LLM node with Gemini API
   * Supports text and multimodal (text + images) requests
   */
  execute: protectedProcedure
    .input(executeLLMSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Initialize Gemini
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
          model: input.model,
          systemInstruction: input.systemPrompt,
          generationConfig: {
            temperature: input.temperature,
            ...(input.maxTokens && { maxOutputTokens: input.maxTokens }),
          },
        });

        // Prepare content
        let content: any;

        if (input.images && input.images.length > 0) {
          // Multimodal request with images
          const imageParts = input.images.map((imageData) => {
            // Remove data:image/...;base64, prefix if present
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
            
            return {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg", // You may want to detect this dynamically
              },
            };
          });

          content = [input.userMessage, ...imageParts];
        } else {
          // Text-only request
          content = input.userMessage;
        }

        // Generate response
        const result = await model.generateContent(content);
        const response = result.response;
        const text = response.text();

        return {
          output: text,
          model: input.model,
          success: true,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to execute LLM",
          cause: error,
        });
      }
    }),

  /**
   * Get available Gemini models
   */
  getModels: protectedProcedure.query(async () => {
    // Return list of available Gemini models
    return [
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Latest fast model with enhanced capabilities",
        supportsVision: true,
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        description: "Fast and efficient model for most tasks",
        supportsVision: true,
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "Most capable model for complex tasks",
        supportsVision: true,
      },
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash (Experimental)",
        description: "Latest experimental flash model",
        supportsVision: true,
      },
    ];
  }),
});
