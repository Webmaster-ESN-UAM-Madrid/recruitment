'use client';

import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
