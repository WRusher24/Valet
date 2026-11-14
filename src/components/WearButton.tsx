"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logClosetWearAction } from "@/app/actions/closet";
import { logWearAction } from "@/app/actions/outfits";
import { formatDate } from "@/lib/constants";
import { CalendarIcon, CheckIcon } from "./icons";

function localToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function WearButton({ outfitId, kind = "lookbook" }: { outfitId: string; kind?: "lookbook" | "closet" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [today, setToday] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function openPanel() {
    const t = localToday();
    setToday(t);
    setDate(t);
    setMessage(null);
    setOpen(true);
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = kind === "closet" ? await logClosetWearAction({ outfitId, date }) : await logWearAction({ outfitId, date });
      if (result.ok) {
        setMessage({ kind: "ok", text: `Logged for ${formatDate(result.date)}.` });
        setOpen(false);
        router.refresh();
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  return (
    <div className="w-full sm:w-auto">
      {!open && (
        <button type="button" onClick={openPanel} className="btn-primary w-full sm:w-auto">
          <CalendarIcon />
          Wore This Today
        </button>
      )}
      {open && (
        <div className="rounded-2xl border border-charcoal/15 bg-white p-3">
          <label htmlFor={`wear-${outfitId}`} className="label">
            Date worn
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`wear-${outfitId}`}
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="field !py-2"
            />
            <button type="button" onClick={submit} disabled={pending || !date} className="btn-primary !px-4">
              {pending ? "Logging…" : "Log"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-outline !px-3" aria-label="Cancel">
              ✕
            </button>
          </div>
        </div>
      )}
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`mt-1 flex items-center gap-1 text-xs ${message.kind === "error" ? "text-red-800" : "text-bronze"}`}
        >
          {message.kind === "ok" && <CheckIcon />}
          {message.text}
        </p>
      )}
    </div>
  );
}
