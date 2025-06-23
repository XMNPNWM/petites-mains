
import React from 'react';

interface EditorStylesProviderProps {
  children: React.ReactNode;
}

const EditorStylesProvider = ({ children }: EditorStylesProviderProps) => {
  return (
    <>
      {children}
      <style dangerouslySetInnerHTML={{
        __html: `
          .page-break-node {
            margin: 2rem 0;
            padding: 1rem 0;
            border-top: 2px dashed #cbd5e1;
            border-bottom: 2px dashed #cbd5e1;
            background: linear-gradient(90deg, transparent 0%, #f1f5f9 50%, transparent 100%);
            text-align: center;
            user-select: none;
            position: relative;
          }
          
          .page-break-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
          }
          
          .page-break-line {
            flex: 1;
            height: 1px;
            background: #cbd5e1;
          }
          
          .page-break-text {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 500;
            background: white;
            padding: 0.25rem 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 9999px;
          }
          
          .page-break-node:hover {
            background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
          }
          
          .page-break-node:hover .page-break-text {
            background: #f8fafc;
          }
        `
      }} />
    </>
  );
};

export default EditorStylesProvider;
