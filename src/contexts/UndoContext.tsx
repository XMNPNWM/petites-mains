import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UndoOperation {
  id: string;
  type: 'edit' | 'delete' | 'type-change';
  timestamp: number;
  description: string;
  undoAction: () => Promise<void>;
  entityType: string;
  entityId: string;
}

interface UndoContextType {
  addOperation: (operation: Omit<UndoOperation, 'id' | 'timestamp'>) => void;
  canUndo: (operationId: string) => boolean;
  executeUndo: (operationId: string) => Promise<void>;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);

export const useUndo = () => {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within an UndoProvider');
  }
  return context;
};

export const UndoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [operations, setOperations] = useState<UndoOperation[]>([]);
  const { toast } = useToast();

  const addOperation = useCallback((operation: Omit<UndoOperation, 'id' | 'timestamp'>) => {
    const newOperation: UndoOperation = {
      ...operation,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    setOperations(prev => {
      const updated = [newOperation, ...prev].slice(0, 10); // Keep only last 10 operations
      return updated;
    });

    // Show toast with undo option
    toast({
      title: operation.description,
      description: "Operation completed successfully",
      action: (
        <button
          onClick={() => executeUndo(newOperation.id)}
          className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"
        >
          Undo
        </button>
      ),
      duration: 5000,
    });
  }, [toast]);

  const canUndo = useCallback((operationId: string) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return false;
    
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;
    return operation.timestamp > thirtySecondsAgo;
  }, [operations]);

  const executeUndo = useCallback(async (operationId: string) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation || !canUndo(operationId)) {
      toast({
        title: "Cannot undo",
        description: "This operation can no longer be undone",
        variant: "destructive",
      });
      return;
    }

    try {
      await operation.undoAction();
      
      // Remove the operation from the list
      setOperations(prev => prev.filter(op => op.id !== operationId));
      
      toast({
        title: "Undone",
        description: `${operation.description} has been undone`,
      });
    } catch (error) {
      toast({
        title: "Undo failed",
        description: error instanceof Error ? error.message : 'Failed to undo operation',
        variant: "destructive",
      });
    }
  }, [operations, canUndo, toast]);

  return (
    <UndoContext.Provider value={{ addOperation, canUndo, executeUndo }}>
      {children}
    </UndoContext.Provider>
  );
};