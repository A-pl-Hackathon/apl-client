"use client";

import React, { useState, useEffect } from "react";

type ChatMessageProps = {
  message: string;
  isUser: boolean;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(!isUser);
  const isLoadingMessage = !isUser && message === "A.pl is processing...";

  useEffect(() => {
    if (isUser || isLoadingMessage) {
      setDisplayedText(message);
      return;
    }

    let index = 0;
    setIsTyping(true);

    const interval = setInterval(() => {
      setDisplayedText(message.substring(0, index));
      index++;

      if (index > message.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20); // Speed of typing

    return () => clearInterval(interval);
  }, [message, isUser, isLoadingMessage]);

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-4 chat-fade-in`}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2">
          A
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none"
        }`}
      >
        {isLoadingMessage ? (
          <div className="flex items-center">
            <span>A.pl is processing</span>
            <span className="ml-1 flex">
              <span className="animate-bounce mx-0.5 delay-0">.</span>
              <span className="animate-bounce mx-0.5 delay-300">.</span>
              <span className="animate-bounce mx-0.5 delay-600">.</span>
            </span>
          </div>
        ) : (
          <>
            {displayedText}
            {isTyping && (
              <span className="inline-block ml-1 animate-pulse">▋</span>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 ml-2">
          U
        </div>
      )}
    </div>
  );
};
