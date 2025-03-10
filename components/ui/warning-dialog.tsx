'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  warningPoints?: string[];
  confirmText?: string;
  cancelText?: string;
}

export function WarningDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningPoints = [],
  confirmText = "I understand",
  cancelText = "Cancel",
}: WarningDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-gray-100">{title}</AlertDialogTitle>
          <AlertDialogDescription className="pb-2">{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {warningPoints && warningPoints.length > 0 && (
          <div className="mb-4 border border-amber-200 dark:border-amber-800/30 rounded-md bg-amber-50 dark:bg-amber-900/20 p-4">
            <ul className="list-disc pl-5 space-y-2">
              {warningPoints.map((point, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 