import React, { useState } from 'react';

interface CopyButtonProps {
  textToCopy: string;
  label: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 border-l border-slate-700
        ${copied 
          ? 'bg-green-600 text-white hover:bg-green-700' 
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      title={`Copiar ${label}`}
    >
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
};

export default React.memo(CopyButton);