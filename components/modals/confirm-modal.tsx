"use client";

import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmModalProps {
  children: React.ReactNode;
  onConfirm: () => void;
  title?: string;
  subText?: string;
  cancelText?: string;
  confirmText?: string;
}

const ConfirmModal = ({
  children,
  title,
  subText,
  cancelText,
  confirmText,
  onConfirm,
}: ConfirmModalProps) => {
  const handleConfirm = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.stopPropagation();
    onConfirm();
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger onClick={(e) => e.stopPropagation()} asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title ? title : "Are you absolutely sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {subText ? subText : "This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
            {cancelText ? cancelText : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {confirmText ? confirmText : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmModal;
