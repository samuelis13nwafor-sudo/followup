import { useState, useEffect, useRef } from "react";
import { Lead } from "../contexts/LeadsContext";
import { useLeads } from "../hooks/useLeads";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotebookPen, Check, Loader2, Clock } from "lucide-react";

interface NotesModalProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

type SaveState = "idle" | "saving" | "saved";

export function NotesModal({ lead, open, onClose }: NotesModalProps) {
  const { updateLead } = useLeads();
  const [text, setText] = useState(lead.notes ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (open) {
      setText(lead.notes ?? "");
      setSaveState("idle");
      isFirstRender.current = true;
    }
  }, [open, lead.notes]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveState("saving");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateLead(lead.id, { notes: text });
      setSaveState("saved");
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  const lastUpdated = lead.updatedAt
    ? format(parseISO(lead.updatedAt), "MMM d, yyyy 'at' h:mm a")
    : null;

  const activity = [...(lead.activity ?? [])].reverse();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg w-full max-h-[90dvh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <NotebookPen className="h-4 w-4 text-muted-foreground" />
            Notes — {lead.name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{lead.service}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Notes textarea */}
          <div className="space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add notes about this lead…"
              rows={5}
              className="w-full rounded-lg border bg-muted/30 px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />

            <div className="flex items-center justify-between gap-3">
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Last updated {lastUpdated}
                </p>
              )}
              <div className="ml-auto flex items-center gap-1.5 text-xs min-w-[60px] justify-end">
                {saveState === "saving" && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Saving…</span>
                  </>
                )}
                {saveState === "saved" && (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Saved</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Activity section */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Activity
            </h3>

            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No activity yet.</p>
            ) : (
              <ol className="space-y-2">
                {activity.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2.5 text-xs">
                    <span className="mt-0.5 shrink-0 w-16 text-muted-foreground font-medium">
                      {format(parseISO(entry.date), "MMM d")}
                    </span>
                    <span className="text-foreground leading-snug">{entry.message}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
