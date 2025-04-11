"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { StatusIndicator } from "./StatusIndicator";

type Message = {
  text: string;
  isUser: boolean;
};

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAplActive, setIsAplActive] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        text: "Hello! Welcome to A.pl Dashboard. How can I help you today?",
        isUser: false,
      },
    ]);
  }, []);

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const handleSendMessage = (message: string) => {
    setMessages((prev) => [...prev, { text: message, isUser: true }]);

    setIsAplActive(true);
    setIsWaitingForResponse(true);
    setLoadingProgress(0);

    setMessages((prev) => [
      ...prev,
      { text: "A.pl is processing...", isUser: false },
    ]);

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev < 90) {
          return prev + (90 - prev) / 20;
        }
        return prev;
      });
    }, 200);

    setTimeout(() => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setLoadingProgress(100);

      setMessages((prev) => {
        const newMessages = [...prev];
        const loadingMsgIndex = newMessages.findIndex(
          (msg) => !msg.isUser && msg.text === "A.pl is processing..."
        );

        if (loadingMsgIndex !== -1) {
          newMessages[loadingMsgIndex] = {
            text: "I'm back!",
            isUser: false,
          };
        } else {
          newMessages.push({ text: "I'm back!", isUser: false });
        }

        return newMessages;
      });

      setTimeout(() => {
        setIsAplActive(false);
        setIsWaitingForResponse(false);
        setLoadingProgress(0);
      }, 500);
    }, 10000);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-center mb-4">
        <StatusIndicator isActive={isAplActive} />
      </div>

      {isAplActive && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-blue-500 transition-all duration-200 ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4 bg-white dark:bg-gray-900 rounded-lg shadow min-h-[300px] h-[calc(100vh-220px)]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Enter a message to start</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isWaitingForResponse}
      />
    </div>
  );
};
