"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AddStandardItemForm } from "./add-standard-item-form";
import { ScopeItemCard } from "./scope-item-card";
import type { AmendmentMeta, ScopeItem, StandardScopeSection } from "./scope-types";

/**
 * Standard scope section with add/edit/remove support.
 */
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
  const activeItems = items.filter(
    (item) => item.status === "active",
  );

  const removedItems = items.filter(
    (item) => item.status === "removed",
  );

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold">
          {title}
        </h3>

        {editable && !addFormOpen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStartAdd}
          >
            <Plus />
            Add
          </Button>
        )}
      </div>

      <div className="mt-3 space-y-3">
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

        {activeItems.length === 0 &&
          !addFormOpen && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No active items.
            </p>
          )}

        {addFormOpen && (
          <AddStandardItemForm
            saving={saving}
            onCancel={onCancelAdd}
            onAdd={onAdd}
          />
        )}

        {removedItems.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Removed from this version
            </p>

            <div className="mt-2 space-y-3">
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
    </section>
  );
}
