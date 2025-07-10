import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';

interface DeleteButtonProps {
  onDelete: () => Promise<void>;
  itemName: string;
  itemType: string;
  className?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  onDelete,
  itemName,
  itemType,
  className = ""
}) => {
  const [confirmState, setConfirmState] = useState<'normal' | 'confirm' | 'dialog'>('normal');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (confirmState === 'confirm') {
      const timer = setTimeout(() => {
        setConfirmState('normal');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmState]);

  const handleFirstClick = () => {
    if (confirmState === 'normal') {
      setConfirmState('confirm');
    } else if (confirmState === 'confirm') {
      setConfirmState('dialog');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setConfirmState('normal');
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getButtonStyle = () => {
    switch (confirmState) {
      case 'confirm':
        return 'text-red-600 hover:text-red-700';
      default:
        return 'text-slate-400 hover:text-red-600';
    }
  };

  const getIcon = () => {
    if (confirmState === 'confirm') {
      return <AlertTriangle className="w-3 h-3" />;
    }
    return <Trash2 className="w-3 h-3" />;
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleFirstClick}
        disabled={isDeleting}
        className={`h-6 w-6 p-0 ${getButtonStyle()} ${className}`}
        title={confirmState === 'normal' ? `Delete ${itemType}` : 'Click again to confirm'}
      >
        {getIcon()}
      </Button>

      <AlertDialog open={confirmState === 'dialog'} onOpenChange={(open) => !open && setConfirmState('normal')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemType}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmState('normal')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};