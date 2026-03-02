"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function CopyLinkButtonClient() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select URL bar
    }
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-muted/30 hover:bg-muted/60 text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 stroke-[3] text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="w-3 h-3 stroke-[3]" />
          Copy link
        </>
      )}
    </button>
  );
}
