
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
          <AlertDialogTitle>Delete Storyline Node</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the storyline node "{nodeName}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="deleteFromWorldbuilding"
              checked={deleteFromWorldbuilding}
              onChange={(e) => setDeleteFromWorldbuilding(e.target.checked)}
              className="mt-1 rounded border-gray-300"
            />
            <div className="flex-1">
              <label htmlFor="deleteFromWorldbuilding" className="text-sm font-medium text-gray-900 cursor-pointer">
                Also delete from worldbuilding library
              </label>
              <p className="text-xs text-gray-600 mt-1">
                {deleteFromWorldbuilding 
                  ? "The linked worldbuilding element will be permanently deleted."
                  : "The worldbuilding element will be kept but unlinked from this storyline node."
                }
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Node
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteNodeDialog;
