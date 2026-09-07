"use client";
import { createContext, useContext, type RefObject } from "react";
import type { DemoState } from "../domain/types";
import type { articles } from "../lib/articles";

export type ArticleKey = keyof typeof articles;
export interface ShopContextValue {
  state: DemoState;
  add: () => void;
  openBag: () => void;
  openSettings: () => void;
  toggleDeclaration: () => void;
  openArticle: (key: ArticleKey) => void;
  openInspector: () => void;
  inspectorOpen: boolean;
  inspectorTrigger: RefObject<HTMLButtonElement | null>;
}
export const ShopContext = createContext<ShopContextValue | null>(null);
export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("Shop controls require the shop provider.");
  return value;
}
