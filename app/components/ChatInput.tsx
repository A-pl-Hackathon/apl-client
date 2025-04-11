import React, { useState } from "react";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  disabled: boolean;
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "A.pl is responding..." : "Type a message..."}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800"
      >
        Send
      </button>
    </form>
  );
};
