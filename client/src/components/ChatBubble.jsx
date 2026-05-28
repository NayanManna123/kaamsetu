import { Check, CheckCheck } from 'lucide-react';
import { timeAgo } from '../utils/helpers';

export default function ChatBubble({ message, isSent = false }) {
  const { text, timestamp, read } = message || {};

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 ${
          isSent
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${isSent ? 'text-primary-200' : 'text-gray-400'}`}>
          <span className="text-[10px]">{timeAgo(timestamp)}</span>
          {isSent && (
            read
              ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
              : <Check className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
    </div>
  );
}
