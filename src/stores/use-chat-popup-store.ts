// Chat popup state management - チャットポップアップの状態管理
import { create } from 'zustand';

interface ChatPopupState {
  isOpen: boolean;
  isHidden: boolean; // When true, the chat popup is completely hidden (e.g., during flight simulation)
  pageContext: string | null; // Current page context for AI to reference
  toggle: () => void;
  open: () => void;
  close: () => void;
  hide: () => void; // Hide the popup entirely (for flight sim)
  show: () => void; // Show the popup again
  setPageContext: (context: string | null) => void;
}

export const useChatPopupStore = create<ChatPopupState>((set) => ({
  isOpen: false,
  isHidden: false,
  pageContext: null,
  
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  hide: () => set({ isHidden: true, isOpen: false }),
  show: () => set({ isHidden: false }),
  setPageContext: (context) => set({ pageContext: context }),
}));
