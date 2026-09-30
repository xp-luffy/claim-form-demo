"use client";

import { useState } from "react";
import { submitClaim } from "@/lib/actions/claim-actions";
import type { Department } from "@/lib/data/types";

type Item = { description: string; amount: string };

export function NewClaimForm({ departments }: { departments: Department[] }) {
  const [items, setItems] = useState<Item[]>([{ description: "", amount: "" }]);
  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const money = new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" });

  function changeItem(index: number, field: keyof Item, value: string) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  return (
    <form action={submitClaim} className="mt-7 space-y-5">
      <section className="panel p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="field-label">Claim title <span className="text-red-500">*</span></span>
            <input className="field" name="title" placeholder="e.g. Office stationery for the team" required maxLength={120} />
          </label>
          <label>
            <span className="field-label">Department <span className="text-red-500">*</span></span>
            <select className="select" name="department_id" defaultValue="" required>
              <option value="" disabled>Select a department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <label>
            <span className="field-label">Claim type</span>
            <select className="select" name="claim_type" defaultValue="petty_cash">
              <option value="petty_cash">Petty cash</option>
              <option value="expense">Expense</option>
              <option value="travel">Travel</option>
              <option value="others">Other</option>
            </select>
          </label>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-600">
              <input name="is_petty_cash" type="checkbox" defaultChecked className="size-4 accent-[#24594d]" />
              Treat this as a petty-cash claim
            </label>
          </div>
          <label className="sm:col-span-2">
            <span className="field-label">What was this for?</span>
            <textarea className="textarea" name="description" placeholder="Add a little context for the reviewer" maxLength={1000} />
          </label>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#eef0ee] px-5 py-4 sm:px-7">
          <div>
            <h2 className="text-sm font-bold">Line items</h2>
            <p className="mt-1 text-[11px] text-slate-500">Add each expense separately. The total is calculated for you.</p>
          </div>
          <button type="button" className="button button-light !min-h-8 !px-3 !text-[11px]" onClick={() => setItems((current) => [...current, { description: "", amount: "" }])}>+ Add item</button>
        </div>
        <div className="space-y-3 p-5 sm:px-7">
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-[1fr_165px_34px]">
              <label>
                <span className="sr-only">Item {index + 1} description</span>
                <input className="field" name="item_description" placeholder="Description, e.g. Pens and paper" value={item.description} onChange={(event) => changeItem(index, "description", event.target.value)} required maxLength={200} />
              </label>
              <label className="relative">
                <span className="absolute left-3 top-[13px] text-xs text-slate-400">RM</span>
                <span className="sr-only">Item {index + 1} amount in MYR</span>
                <input className="field pl-9 text-right tabular-nums" name="item_amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={item.amount} onChange={(event) => changeItem(index, "amount", event.target.value)} required />
              </label>
              <button type="button" className="grid size-[34px] place-items-center self-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-20" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={items.length === 1} aria-label={`Remove item ${index + 1}`}>×</button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[#eef0ee] bg-[#fafbfa] px-5 py-4 sm:px-7">
          <span className="text-xs font-semibold text-slate-500">Claim total</span>
          <span className="font-semibold tabular-nums">{money.format(total)}</span>
        </div>
      </section>

      <div className="flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
        <a className="button button-light" href="/claims">Cancel</a>
        <button className="button button-primary" type="submit" disabled={departments.length === 0}>Submit claim <span aria-hidden="true">→</span></button>
      </div>
      {departments.length === 0 && <p className="error-text text-right">Add a department before creating a claim.</p>}
    </form>
  );
}
