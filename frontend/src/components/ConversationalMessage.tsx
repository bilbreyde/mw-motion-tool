import type { ReactNode } from 'react';

interface ConversationalMessageProps {
  children: ReactNode;
  loading?: boolean;
}

export function ConversationalMessage({ children, loading = false }: ConversationalMessageProps) {
  return (
    <div className="message-bubble">
      <div className="message-avatar">AI</div>
      <div className="message-content">
        <div className="message-sender">Motion AI</div>
        <div className="message-text">
          {loading ? (
            <div className="loading-dots">
              <span /><span /><span />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
