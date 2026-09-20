import type { NormalizedScope } from "@/lib/scope-schema";

type ScopeVersionViewerProps = {
  scope: NormalizedScope;
};

type StandardItem =
  | NormalizedScope["deliverables"][number]
  | NormalizedScope["features"][number]
  | NormalizedScope["exclusions"][number]
  | NormalizedScope["clientResponsibilities"][number];

type RevisionLimit = NormalizedScope["revisionLimits"][number];

type Assumption = NormalizedScope["assumptions"][number];

type LifecycleItem = {
  provenance:
    | {
        type: "document_extraction";
      }
    | {
        type: "manual_amendment";
        rationale: string;
        referenceId: string;
      };
  status: "active" | "removed";
  amendment?: {
    rationale: string;
    referenceId: string;
  };
  removal?: {
    rationale: string;
    referenceId: string;
  };
};

function EvidenceList({
  references,
}: {
  references: Array<{
    quote: string;
    section?: string;
  }>;
}) {
  if (references.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {references.map((reference, index) => (
        <div
          key={`${reference.quote}-${index}`}
          className="rounded-md border bg-muted/30 p-3"
        >
          <p className="text-xs font-medium text-muted-foreground">
            Evidence
          </p>

          <p className="mt-1 whitespace-pre-wrap font-mono text-xs leading-relaxed">
            {reference.quote}
          </p>

          {reference.section && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Source section: {reference.section}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function LifecycleMeta({ item }: { item: LifecycleItem }) {
  const manualProvenance =
    item.provenance.type === "manual_amendment"
      ? item.provenance
      : null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
          {manualProvenance
            ? "Manual amendment"
            : "Document extraction"}
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            item.status === "removed"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {item.status === "removed" ? "Removed" : "Active"}
        </span>
      </div>

      {manualProvenance && (
        <div className="rounded-md border bg-muted/20 p-3 text-xs">
          <p className="font-medium">Amendment provenance</p>

          <p className="mt-1 text-muted-foreground">
            Reference: {manualProvenance.referenceId}
          </p>

          <p className="mt-2 text-muted-foreground">
            {manualProvenance.rationale}
          </p>
        </div>
      )}

      {item.amendment && (
        <div className="rounded-md border bg-muted/20 p-3 text-xs">
          <p className="font-medium">Scope amendment</p>

          <p className="mt-1 text-muted-foreground">
            Reference: {item.amendment.referenceId}
          </p>

          <p className="mt-2 text-muted-foreground">
            {item.amendment.rationale}
          </p>
        </div>
      )}

      {item.removal && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs">
          <p className="font-medium text-destructive">
            Removal record
          </p>

          <p className="mt-1 text-muted-foreground">
            Reference: {item.removal.referenceId}
          </p>

          <p className="mt-2 text-muted-foreground">
            {item.removal.rationale}
          </p>
        </div>
      )}
    </div>
  );
}

function StandardItemCard({
  item,
}: {
  item: StandardItem;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-medium">{item.title}</h4>

      {item.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      )}

      <LifecycleMeta item={item} />

      <EvidenceList references={item.sourceReferences} />
    </div>
  );
}

function RevisionLimitCard({
  item,
}: {
  item: RevisionLimit;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-medium">{item.type}</h4>

      <p className="mt-2 text-sm text-muted-foreground">
        {item.limit}
      </p>

      <LifecycleMeta item={item} />

      <EvidenceList references={item.sourceReferences} />
    </div>
  );
}

function AssumptionCard({
  item,
}: {
  item: Assumption;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm">{item.statement}</p>

      <LifecycleMeta item={item} />

      <EvidenceList references={item.sourceReferences} />
    </div>
  );
}

function StandardSection({
  title,
  items,
}: {
  title: string;
  items: StandardItem[];
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold">{title}</h3>

        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5">
          <p className="text-sm text-muted-foreground">
            No entries in this section.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <StandardItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export function ScopeVersionViewer({
  scope,
}: ScopeVersionViewerProps) {
  const timeline = scope.timeline;

  return (
    <div className="space-y-8">
      <StandardSection
        title="Deliverables"
        items={scope.deliverables}
      />

      <StandardSection
        title="Features"
        items={scope.features}
      />

      <StandardSection
        title="Exclusions"
        items={scope.exclusions}
      />

      <StandardSection
        title="Client Responsibilities"
        items={scope.clientResponsibilities}
      />

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">Revision Limits</h3>

          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {scope.revisionLimits.length}
          </span>
        </div>

        {scope.revisionLimits.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5">
            <p className="text-sm text-muted-foreground">
              No revision limits recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scope.revisionLimits.map((item) => (
              <RevisionLimitCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold">Timeline</h3>

        <div className="rounded-lg border p-4">
          {timeline.duration && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Duration
              </p>

              <p className="mt-1 text-sm">
                {timeline.duration}
              </p>
            </div>
          )}

          {timeline.startCondition && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">
                Start condition
              </p>

              <p className="mt-1 text-sm">
                {timeline.startCondition}
              </p>
            </div>
          )}

          {timeline.dependencies.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground">
                Dependencies
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {timeline.dependencies.map((dependency) => (
                  <span
                    key={dependency}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs"
                  >
                    {dependency}
                  </span>
                ))}
              </div>
            </div>
          )}

          {timeline.provenance && (
            <LifecycleMeta
              item={{
                provenance: timeline.provenance,
                status: "active",
                amendment: timeline.amendment,
              }}
            />
          )}

          <EvidenceList references={timeline.sourceReferences} />

          {!timeline.duration &&
            !timeline.startCondition &&
            timeline.dependencies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No timeline details recorded.
              </p>
            )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">Assumptions</h3>

          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {scope.assumptions.length}
          </span>
        </div>

        {scope.assumptions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5">
            <p className="text-sm text-muted-foreground">
              No assumptions recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scope.assumptions.map((item) => (
              <AssumptionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}