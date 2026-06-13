import { useRef, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { downloadExpensesCsv, importExpensesFromCsv } from "../services/csvService";
import { config } from "../config";
import { todayIso } from "../utils/date";

/**
 * The "records" tools: download a CSV backup, or import one. Import resolves
 * category/member names to ids, creating any that don't exist yet so a file
 * from another household/device just works.
 */
export function DataTools() {
  const { data, addCategory, addMember, addExpensesBulk } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const doExport = () => {
    downloadExpensesCsv(data, todayIso());
    setMessage(`Exported ${data.expenses.length} expense(s).`);
  };

  const doImport = async (file: File) => {
    try {
      const text = await file.text();
      const result = importExpensesFromCsv(text, data);

      // Create any new categories/members the file referenced, building a
      // name -> id map so the placeholder ids ("name:Foo") can be resolved.
      const catIdByName = new Map(data.categories.map((c) => [c.name.toLowerCase(), c.id]));
      const memIdByName = new Map(data.members.map((m) => [m.name.toLowerCase(), m.id]));

      for (const catName of result.newCategoryNames) {
        const created = addCategory({ name: catName });
        catIdByName.set(catName.toLowerCase(), created.id);
      }
      for (const memName of result.newMemberNames) {
        const created = addMember(memName);
        memIdByName.set(memName.toLowerCase(), created.id);
      }

      const resolveMember = (id: string) =>
        id.startsWith("name:")
          ? memIdByName.get(id.slice(5).toLowerCase()) ?? data.members[0].id
          : id;

      const resolved = result.expenses.map((e) => ({
        ...e,
        categoryId: e.categoryId.startsWith("name:")
          ? catIdByName.get(e.categoryId.slice(5).toLowerCase()) ?? data.categories[0].id
          : e.categoryId,
        memberId: resolveMember(e.memberId),
        ...(e.splits
          ? { splits: e.splits.map((s) => ({ ...s, memberId: resolveMember(s.memberId) })) }
          : {}),
      }));

      addExpensesBulk(resolved);
      setMessage(
        `Imported ${result.imported} expense(s)` +
          (result.skipped ? `, skipped ${result.skipped} bad row(s).` : ".")
      );
    } catch (err) {
      console.error("[DataTools] import failed:", err);
      setMessage("Could not read that file. Make sure it's a CSV.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="data-tools">
      <p className="muted">
        Your records live in <strong>{config.storageProvider === "local" ? "this browser" : config.storageProvider}</strong>.
        Export a CSV anytime for backups or to open in Excel/Sheets.
      </p>
      <div className="add-row">
        <button className="btn btn-primary" onClick={doExport}>⬇️ Export CSV</button>
        <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
          ⬆️ Import CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
          }}
        />
      </div>
      {message && <p className="info-msg" role="status">{message}</p>}
    </div>
  );
}
