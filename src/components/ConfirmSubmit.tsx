"use client";

import type { ReactNode } from "react";
import { TrashIcon } from "./icons";

/** Submit button inside a <form> that asks for confirmation first. */
export function ConfirmSubmit({
  message,
  children,
  className = "",
}: {
  message: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={`inline-flex items-center gap-1.5 text-xs text-charcoal/70 underline-offset-2 hover:text-red-800 hover:underline ${className}`}
    >
      <TrashIcon />
      {children ?? "Delete"}
    </button>
  );
}
