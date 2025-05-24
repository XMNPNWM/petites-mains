
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteNodeDialogProps {
  isOpen: boolean;
  nodeName: string;
  onConfirm: (deleteFromWorldbuilding: boolean) => void;
  onCancel: () => void;
}

const DeleteNodeDialog = ({ isOpen, nodeName, onConfirm, onCancel }: DeleteNodeDialogProps) => {
  const [deleteFromWorldbuilding, setDeleteFromWorldbuilding] = React.useState(false);

  const handleConfirm = () => {
    onConfirm(deleteFromWorldbuilding);
    setDeleteFromWorldbuilding(false);
  };

  const handleCancel = () => {
    onCancel();
    setDeleteFromWorldbuilding(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Node</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{nodeName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <input
            type="checkbox"
            id="deleteFromWorldbuilding"
            checked={deleteFromWorldbuilding}
            onChange={(e) => setDeleteFromWorldbuilding(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="deleteFromWorldbuilding" className="text-sm text-gray-700">
            Also delete this element from your worldbuilding library
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteNodeDialog;
