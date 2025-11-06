import React, { useState } from 'react';

interface CodeBlockProps {
  title: string;
  data: object;
  isEditable?: boolean;
  content?: string;
  onChange?: (content: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ title, data, isEditable = false, content, onChange }) => {
  const [copied, setCopied] = useState(false);
  const displayString = content ?? JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50 rounded-md overflow-hidden my-4 border border-gray-200">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
        <h3 className="font-mono text-sm text-text-secondary font-semibold">{title}</h3>
        <button
          onClick={handleCopy}
          className="text-xs bg-gray-200 hover:bg-gray-300 text-text-secondary font-bold py-1 px-2 rounded transition-colors duration-200"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {isEditable ? (
        <textarea
            className="w-full p-4 font-mono text-sm text-text-main bg-white h-48 border-0 focus:ring-2 focus:ring-primary"
            value={content}
            onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
         <pre className="p-4 text-sm text-text-main overflow-x-auto">
            <code>{displayString}</code>
         </pre>
      )}
    </div>
  );
};