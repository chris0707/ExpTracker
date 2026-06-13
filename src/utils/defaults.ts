import type { AppData, Category, Member } from "../models/types";
import { newId } from "./id";

/** Palette reused for members and custom categories so colors stay harmonious. */
export const PALETTE = [
  "#0f766e", "#b45309", "#1d4ed8", "#be123c", "#7c3aed",
  "#0891b2", "#65a30d", "#c2410c", "#db2777", "#4338ca",
];

export function pickColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

/** Common household categories. Users can add/edit/remove on top of these. */
export function defaultCategories(): Category[] {
  const seed: Array<Omit<Category, "id" | "isDefault">> = [
    { name: "Groceries", color: "#65a30d", icon: "🛒" },
    { name: "Rent / Mortgage", color: "#1d4ed8", icon: "🏠" },
    { name: "Utilities", color: "#0891b2", icon: "💡" },
    { name: "Transport", color: "#c2410c", icon: "🚗" },
    { name: "Dining Out", color: "#db2777", icon: "🍽️" },
    { name: "Health", color: "#be123c", icon: "💊" },
    { name: "Education", color: "#4338ca", icon: "📚" },
    { name: "Entertainment", color: "#7c3aed", icon: "🎬" },
    { name: "Household", color: "#b45309", icon: "🧺" },
    { name: "Costco", color: "#1d4ed8", icon: "🏬" },
    { name: "Walmart", color: "#0891b2", icon: "🏪" },
    { name: "NoFrills", color: "#65a30d", icon: "🥬" },
    { name: "Dollarama", color: "#be123c", icon: "🏷️" },
    { name: "Amazon", color: "#c2410c", icon: "🛍️" },
    { name: "UberEats", color: "#db2777", icon: "🍔" },
    { name: "Other", color: "#0f766e", icon: "📦" },
  ];
  return seed.map((c) => ({ ...c, id: newId("cat"), isDefault: true }));
}

/** A starter member so the very first expense can be attributed to someone. */
export function defaultMembers(): Member[] {
  return [{ id: newId("mem"), name: "Household", color: PALETTE[0] }];
}

export function seedAppData(): AppData {
  return {
    members: defaultMembers(),
    categories: defaultCategories(),
    expenses: [],
  };
}
