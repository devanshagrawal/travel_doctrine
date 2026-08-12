import { create } from 'zustand';

// A tiny global store powering a single styled confirmation dialog.
// Using an in-app modal (instead of Alert.alert / window.confirm) means
// confirms work identically on web and native — the native dialogs either
// ignore the buttons array (web) or can't be driven reliably.
interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmConfig {
  open: boolean;
  show: (cfg: ConfirmConfig) => void;
  hide: () => void;
  accept: () => void;
}

export const useConfirm = create<ConfirmState>((set, get) => ({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Delete',
  destructive: true,
  onConfirm: () => {},

  show: (cfg) =>
    set({
      open: true,
      title: cfg.title,
      message: cfg.message,
      onConfirm: cfg.onConfirm,
      confirmLabel: cfg.confirmLabel ?? 'Delete',
      destructive: cfg.destructive ?? true,
    }),
  hide: () => set({ open: false }),
  accept: () => {
    const fn = get().onConfirm;
    set({ open: false });
    fn();
  },
}));
