import React, { useState, KeyboardEvent } from 'react';
import { Tag, X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

const TagInput: React.FC<TagInputProps> = ({ tags = [], onChange, placeholder = '输入标签后回车...', suggestions = [] }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = input.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 p-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-shadow">
        <Tag size={16} className="text-slate-400 ml-1" />

        {tags.map((tag, index) => (
          <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 animate-fade-in">
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:text-indigo-900 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder-slate-400 py-1"
        />
      </div>

      {input && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions
            .filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s))
            .slice(0, 5)
            .map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange([...tags, s]);
                  setInput('');
                }}
                className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 flex items-center gap-1"
              >
                <Plus size={10} /> {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
