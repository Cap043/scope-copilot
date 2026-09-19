"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createScopeRevisionCandidateAction } from "@/app/(dashboard)/projects/[projectId]/actions";

type ScopeUpdateFormProps = {
  projectId: string;
  baseVersion: number;
};

export function ScopeUpdateForm({
  projectId,
  baseVersion,
}: ScopeUpdateFormProps) {
  const router = useRouter();

  const [sourceText, setSourceText] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState<{
      id: string;
      baseVersion: number;
    } | null>(null);

  async function handleSubmit() {
    const trimmedText =
      sourceText.trim();

    if (!trimmedText) {
      setError(
        "Paste the revised SOW before continuing.",
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const result =
        await createScopeRevisionCandidateAction({
          projectId,
          sourceText:
            trimmedText,
          sourceType: "PASTE",
        });

      setSuccess({
        id: result.id,
        baseVersion:
          result.baseVersion,
      });

      setSourceText("");

      // Refresh the server page so any persisted pending candidate
      // is rendered immediately.
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't process the revised SOW.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="revised-sow"
          className="text-sm font-medium"
        >
          Revised SOW
        </label>

        <p className="mt-1 text-sm text-muted-foreground">
          Paste the new version of the statement of
          work. It will be extracted and saved for
          review against approved scope v{baseVersion}.
        </p>

        <textarea
          id="revised-sow"
          value={sourceText}
          onChange={(event) =>
            setSourceText(
              event.target.value,
            )
          }
          disabled={submitting}
          placeholder="Paste the revised statement of work here..."
          className="mt-3 min-h-[420px] w-full resize-y rounded-lg border bg-background px-4 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <Check className="mt-0.5 size-4 shrink-0" />

          <div>
            <p className="font-medium">
              Revised SOW extracted successfully
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Candidate {success.id} is now pending
              review against approved scope v
              {success.baseVersion}.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            submitting ||
            !sourceText.trim()
          }
        >
          <FileText />

          {submitting
            ? "Extracting..."
            : "Extract revised SOW"}
        </Button>
      </div>
    </div>
  );
}