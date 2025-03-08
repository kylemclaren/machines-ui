"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CopyableJsonProps {
  data: any;
  maxHeight?: string;
}

export function CopyableJson({ data, maxHeight = "max-h-60" }: CopyableJsonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md overflow-auto relative group" style={{ maxHeight: maxHeight }}>
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Copy to clipboard"
      >
        {isCopied ? (
          <Check size={16} className="text-green-500" />
        ) : (
          <Copy size={16} />
        )}
      </button>
      <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono pr-8">
        {jsonString}
      </pre>
    </div>
  );
} 