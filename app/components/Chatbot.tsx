"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import AuthorizationModal from "./AuthorizationModal";
import { connectToMetaMask } from "../services/metamask";
import { sendUserData } from "../services/userDataApi";
import { callAI } from "../services/aiServices";

// Define ChatMessage interface to match the one in aiServices.ts
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  isLoading?: boolean;
  showButtons?: boolean;
  isSurfing?: boolean;
}

// AI model types
type AIModel = {
  id: string;
  name: string;
  provider: string;
  available: boolean;
};

const AI_MODELS: AIModel[] = [
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    available: true,
  },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", available: true },
  { id: "gemini-2.0", name: "Gemini 2.0", provider: "Google", available: true },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    available: false,
  },
  { id: "llama-3", name: "Llama 3", provider: "Meta", available: false },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "Mistral AI",
    available: false,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    available: false,
  },
];

const TypingIndicator = () => (
  <div className="flex space-x-2 items-center px-2">
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
  </div>
);

const TypewriterText = ({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((c) => c + 1);
      }, 30);

      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, onComplete, isComplete]);

  useEffect(() => {
    setDisplayText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return <span>{displayText}</span>;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! Welcome to A.pl Dashboard. How can I help you today?",
      sender: "ai",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [typingComplete, setTypingComplete] = useState<Record<number, boolean>>(
    {}
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-3.5-turbo");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "system",
      content:
        "You are a helpful assistant for the A.pl Dashboard. Be concise and friendly in your responses. Explain in detail.",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSurfingResponse = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now(),
        text: "Surfing...",
        sender: "ai",
        isSurfing: true,
      },
    ]);

    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages.filter((msg) => !msg.isSurfing),
        {
          id: Date.now(),
          text: "Based on my search through A.pl, here's what I found: [CUSTOM message result]",
          sender: "ai",
        },
      ]);
      setIsWaiting(false);
    }, 10000);
  };

  const handleButtonClick = (action: "go" | "stay") => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.showButtons ? { ...msg, showButtons: false } : msg
      )
    );

    if (action === "go") {
      setIsAuthModalOpen(true);
    } else {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now(),
          text: "Okay. I'll stay here.",
          sender: "ai",
        },
      ]);
      setIsWaiting(false);
    }
  };

  const handleAuthSubmit = async (authorized: boolean) => {
    try {
      setIsAuthModalOpen(false);

      if (!authorized) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now(),
            text: "Authorization denied. No data will be sent.",
            sender: "ai",
          },
        ]);
        setIsWaiting(false);
        return;
      }

      setIsProcessing(true);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now(),
          text: "Connecting to MetaMask...",
          sender: "ai",
          isSurfing: true,
        },
      ]);

      const walletAddress = await connectToMetaMask();

      if (!walletAddress) {
        throw new Error("Failed to get wallet address from MetaMask");
      }

      setMessages((prevMessages) => [
        ...prevMessages.filter((msg) => !msg.isSurfing),
        {
          id: Date.now(),
          text: "Connected to MetaMask. Sending data to API...",
          sender: "ai",
          isSurfing: true,
        },
      ]);

      // Get the most recent user message
      const userMessages = messages.filter((msg) => msg.sender === "user");
      const lastUserMessage =
        userMessages.length > 0
          ? userMessages[userMessages.length - 1].text
          : "";

      // Send user data using new API
      const payload = {
        personalData: {
          walletAddress,
          data: "", // Empty data as we're just authorizing
        },
        agentModel: selectedModel,
        prompt: lastUserMessage, // Send the last user message as the prompt
      };

      await sendUserData(payload);

      setMessages((prevMessages) => [
        ...prevMessages.filter((msg) => !msg.isSurfing),
        {
          id: Date.now(),
          text: "Data was successfully sent to the API. Key pair for Sepolia ETH has been created.",
          sender: "ai",
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      setMessages((prevMessages) => [
        ...prevMessages.filter((msg) => !msg.isSurfing),
        {
          id: Date.now(),
          text: `Error: ${errorMessage}`,
          sender: "ai",
        },
      ]);
    } finally {
      setIsWaiting(false);
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || isWaiting) return;

    const userMessage: Message = {
      id: Date.now(),
      text: newMessage,
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage("");
    setIsWaiting(true);

    const loadingMessage: Message = {
      id: Date.now() + 1,
      text: "",
      sender: "ai",
      isLoading: true,
    };

    setMessages((prevMessages) => [...prevMessages, loadingMessage]);

    // Check if the message contains the keyword "hard"
    if (newMessage.toLowerCase().includes("hard")) {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.isLoading)
      );

      const response =
        "It's over my scope. May I surf A.pl and get some trustworthy informations?";

      const aiMessage: Message = {
        id: Date.now() + 2,
        text: response,
        sender: "ai",
        showButtons: true,
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      // Don't set isWaiting to false here, as we're waiting for button click
    } else {
      // Handle normal message flow - update chat history
      const updatedHistory = [
        ...chatHistory,
        { role: "user" as const, content: newMessage },
      ];

      setChatHistory(updatedHistory);

      try {
        // Call the appropriate AI API based on selectedModel
        const aiResponse = await callAI(updatedHistory, selectedModel);

        setMessages((prevMessages) =>
          prevMessages.filter((msg) => !msg.isLoading)
        );

        // Add AI response to messages
        const aiMessage: Message = {
          id: Date.now() + 2,
          text: aiResponse.message,
          sender: "ai",
        };

        setMessages((prevMessages) => [...prevMessages, aiMessage]);

        // Update chat history with AI's response
        setChatHistory([
          ...updatedHistory,
          { role: "assistant" as const, content: aiResponse.message },
        ]);
      } catch (error) {
        console.error("Error getting AI response:", error);

        setMessages((prevMessages) =>
          prevMessages.filter((msg) => !msg.isLoading)
        );

        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";

        const aiMessage: Message = {
          id: Date.now() + 2,
          text: `Sorry, I encountered an error: ${errorMessage}`,
          sender: "ai",
        };

        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } finally {
        setIsWaiting(false);
      }
    }
  };

  const handleTypingComplete = useCallback((messageId: number) => {
    setTypingComplete((prev) => ({
      ...prev,
      [messageId]: true,
    }));
  }, []);

  return (
    <div className="flex flex-col h-[80vh] bg-gray-900/90 backdrop-blur-md rounded-lg overflow-hidden shadow-lg border border-gray-700/50">
      <div className="bg-gray-800/90 py-2 px-4 text-white border-b border-gray-700/50 flex justify-between items-center">
        <h2 className="text-lg font-bold">Chatbot</h2>
        <div className="flex items-center">
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors mr-3"
            >
              <span>
                {AI_MODELS.find((m) => m.id === selectedModel)?.name ||
                  selectedModel}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showModelSelector && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg z-50 border border-gray-700">
                <div className="py-1 max-h-48 overflow-y-auto">
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (model.available) {
                          setSelectedModel(model.id);
                          setShowModelSelector(false);
                        }
                      }}
                      className={`w-full text-left px-4 py-2 text-xs ${
                        model.id === selectedModel
                          ? "bg-blue-600"
                          : model.available
                          ? "hover:bg-gray-700"
                          : "opacity-50 cursor-not-allowed"
                      } ${!model.available ? "text-gray-500" : "text-white"}`}
                      disabled={!model.available}
                    >
                      <div className="font-semibold">{model.name}</div>
                      <div className="text-xs opacity-75">{model.provider}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-xs">Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.sender === "ai" && (
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-600 text-white mr-2 shadow-glow-blue">
                A
              </div>
            )}
            <div className="flex flex-col">
              <div
                className={`max-w-[250px] p-2 rounded-lg backdrop-blur-sm ${
                  message.sender === "user"
                    ? "bg-blue-600/90 text-white"
                    : "bg-gray-700/90 text-white"
                } text-sm`}
              >
                {message.isLoading ? (
                  <TypingIndicator />
                ) : message.isSurfing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    <span>{message.text}</span>
                  </div>
                ) : message.sender === "ai" ? (
                  <TypewriterText
                    text={message.text}
                    onComplete={() => handleTypingComplete(message.id)}
                  />
                ) : (
                  message.text
                )}
              </div>
              {message.showButtons && typingComplete[message.id] && (
                <div className="flex space-x-2 mt-2 transition duration-300 ease-out opacity-100">
                  <button
                    onClick={() => handleButtonClick("go")}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                  >
                    Go!
                  </button>
                  <button
                    onClick={() => handleButtonClick("stay")}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Stay.
                  </button>
                </div>
              )}
            </div>
            {message.sender === "user" && (
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-indigo-500 ml-2 shadow-glow-indigo">
                U
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-700/50 p-2 bg-gray-800/80"
      >
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isWaiting}
            className="flex-1 bg-gray-700/80 text-white rounded-l-lg px-3 py-2 focus:outline-none disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={isWaiting || newMessage.trim() === ""}
            className="bg-blue-600 text-white px-3 py-2 rounded-r-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-blue-800"
          >
            Send
          </button>
        </div>
      </form>

      <div className="bg-gray-800/90 py-1 px-2 text-center text-gray-400 text-[10px] border-t border-gray-700/50">
        © 2024 A.pl Dashboard
      </div>

      {/* Authorization Modal */}
      <AuthorizationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmit={handleAuthSubmit}
      />
    </div>
  );
}
