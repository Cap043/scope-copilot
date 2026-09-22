"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { AddStandardItemForm } from "./add-standard-item-form";
import { ScopeItemCard } from "./scope-item-card";
import type {
  AmendmentMeta,
  ScopeItem,
  StandardScopeSection,
} from "./scope-types";

export function ScopeItemList({
  section,
  title,
  items,
  editable,
  saving,
  addFormOpen,
  onStartAdd,
  onCancelAdd,
  onAdd,
  onEdit,
  onRemove,
}: {
  section: StandardScopeSection;
  title: string;
  items: ScopeItem[];
  editable: boolean;
  saving: boolean;
  addFormOpen: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onAdd: (
    item: {
      title: string;
      description?: string;
    },
    meta: AmendmentMeta,
  ) => Promise<void>;
  onEdit: (
    item: ScopeItem,
    meta: AmendmentMeta,
  ) => Promise<void>;
  onRemove: (
    item: ScopeItem,
    meta: AmendmentMeta,
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  const activeItems = items.filter(
    (item) => item.status === "active",
  );

  const removedItems = items.filter(
    (item) => item.status === "removed",
  );

  // Opening the add form should automatically open the section.
  useEffect(() => {
    if (addFormOpen) {
      setOpen(true);
    }
  }, [addFormOpen]);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {open ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">
              {title}
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeItems.length} active
              {removedItems.length > 0
                ? ` · ${removedItems.length} removed`
                : ""}
            </p>
          </div>

          <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
        </button>

        {editable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onStartAdd}
            disabled={saving || addFormOpen}
            className="shrink-0"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        )}
      </div>

      {/* Expandable content */}
      {open && (
        <div className="border-t border-border">
          {activeItems.length > 0 && (
            <div className="divide-y">
              {activeItems.map((item) => (
                <ScopeItemCard
                  key={item.id}
                  item={item}
                  editable={editable}
                  saving={saving}
                  onSave={onEdit}
                  onRemove={onRemove}
                />
              ))}
            </div>
          )}

          {activeItems.length === 0 &&
            !addFormOpen && (
              <div className="px-4 py-5 sm:px-5">
                <p className="text-sm text-muted-foreground">
                  No active items in this section.
                </p>
              </div>
            )}

          {addFormOpen && (
            <div className="border-t border-border bg-muted/20 p-4 sm:p-5">
              <AddStandardItemForm
                saving={saving}
                onCancel={onCancelAdd}
                onAdd={onAdd}
              />
            </div>
          )}

          {removedItems.length > 0 && (
            <div className="border-t border-border bg-muted/10 px-4 py-4 sm:px-5">
              <div className="mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Removed from this version
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border/70 bg-background/70">
                {removedItems.map((item) => (
                  <ScopeItemCard
                    key={item.id}
                    item={item}
                    editable={false}
                    saving={false}
                    onSave={async () => {}}
                    onRemove={async () => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}