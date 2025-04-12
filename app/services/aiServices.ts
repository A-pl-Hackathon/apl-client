interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatResponse {
  message: string;
  error?: string;
}

export async function callOpenAI(
  messages: ChatMessage[],
  modelId: string
): Promise<ChatResponse> {
  try {
    const openAIModel = modelId === "gpt-4o" ? "gpt-4o" : "gpt-3.5-turbo";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: openAIModel,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to get response from OpenAI"
      );
    }

    const data = await response.json();
    return {
      message: data.choices[0]?.message?.content || "No response from OpenAI",
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      message: "Sorry, there was an error communicating with OpenAI.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function callGemini(
  messages: ChatMessage[]
): Promise<ChatResponse> {
  try {
    const geminiMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }],
    }));

    const apiEndpoint =
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

    const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topK: 40,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to get response from Gemini"
      );
    }

    const data = await response.json();
    return {
      message:
        data.candidates[0]?.content?.parts[0]?.text ||
        "No response from Gemini",
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      message: "Sorry, there was an error communicating with Gemini.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function callAI(
  messages: ChatMessage[],
  modelId: string
): Promise<ChatResponse> {
  try {
    if (modelId.startsWith("gpt")) {
      return await callOpenAI(messages, modelId);
    } else if (modelId.startsWith("gemini")) {
      return await callGemini(messages);
    } else {
      throw new Error(`Unsupported model: ${modelId}`);
    }
  } catch (error) {
    console.error("AI service error:", error);
    return {
      message: "Sorry, there was an error with the AI service.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
