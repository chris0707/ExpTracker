import { useState } from "react";
import { useAppData } from "../context/AppDataContext";

/** Add, rename, recolor, or remove household members. No fixed limit. */
export function MembersManager() {
  const { data, addMember, updateMember, removeMember } = useAppData();
  const [name, setName] = useState("");

  const add = () => {
    if (!name.trim()) return;
    addMember(name);
    setName("");
  };

  const expenseCount = (memberId: string) =>
    data.expenses.filter((e) => e.memberId === memberId).length;

  return (
    <div className="manager">
      <div className="add-row">
        <input
          placeholder="Add a member (e.g. Mom, Dad, Alex)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="New member name"
        />
        <button className="btn btn-primary" onClick={add}>+ Add member</button>
      </div>

      <ul className="manager-list">
        {data.members.map((m) => (
          <li key={m.id}>
            <input
              type="color"
              value={m.color}
              onChange={(e) => updateMember(m.id, { color: e.target.value })}
              aria-label={`Color for ${m.name}`}
              className="color-swatch"
            />
            <input
              className="manager-name"
              value={m.name}
              onChange={(e) => updateMember(m.id, { name: e.target.value })}
              aria-label="Member name"
            />
            <span className="muted small">{expenseCount(m.id)} item(s)</span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={data.members.length <= 1}
              title={data.members.length <= 1 ? "Keep at least one member" : "Remove"}
              onClick={() => removeMember(m.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
