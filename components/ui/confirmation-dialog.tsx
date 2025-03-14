import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  requireValidation?: boolean;
  validationText?: string;
  validationLabel?: string;
  customContent?: React.ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  requireValidation = false,
  validationText = "",
  validationLabel = "Type the name to confirm",
  customContent,
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const isValid = !requireValidation || inputValue === validationText;

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="pb-0">{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {customContent}

        {requireValidation && validationText && (
          <div className="pt-3 mb-4 border-t border-gray-200 dark:border-gray-700 mt-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {validationLabel}
            </p>
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="border border-gray-300 dark:border-gray-600"
              autoComplete="off"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!isValid}
            className={`cursor-pointer ${destructive ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white dark:text-white" : ""} 
                ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 