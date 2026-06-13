import { useState } from "react";
import { useAppData } from "../context/AppDataContext";

/** Manage categories: defaults are pre-seeded; add/edit/remove your own. */
export function CategoryManager() {
  const { data, addCategory, updateCategory, removeCategory } = useAppData();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  const add = () => {
    if (!name.trim()) return;
    addCategory({ name, icon: icon || "🏷️" });
    setName("");
    setIcon("");
  };

  const expenseCount = (catId: string) =>
    data.expenses.filter((e) => e.categoryId === catId).length;

  return (
    <div className="manager">
      <div className="add-row">
        <input
          className="icon-input"
          placeholder="🏷️"
          value={icon}
          maxLength={2}
          onChange={(e) => setIcon(e.target.value)}
          aria-label="Category icon"
        />
        <input
          placeholder="Add a category (e.g. Pets, Subscriptions)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="New category name"
        />
        <button className="btn btn-primary" onClick={add}>+ Add category</button>
      </div>

      <ul className="manager-list">
        {data.categories.map((c) => (
          <li key={c.id}>
            <input
              type="color"
              value={c.color}
              onChange={(e) => updateCategory(c.id, { color: e.target.value })}
              aria-label={`Color for ${c.name}`}
              className="color-swatch"
            />
            <input
              className="icon-input"
              value={c.icon}
              maxLength={2}
              onChange={(e) => updateCategory(c.id, { icon: e.target.value })}
              aria-label="Category icon"
            />
            <input
              className="manager-name"
              value={c.name}
              onChange={(e) => updateCategory(c.id, { name: e.target.value })}
              aria-label="Category name"
            />
            {c.isDefault && <span className="tag-default">default</span>}
            <span className="muted small">{expenseCount(c.id)} item(s)</span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={data.categories.length <= 1}
              title={data.categories.length <= 1 ? "Keep at least one category" : "Remove"}
              onClick={() => removeCategory(c.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
