"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";

import { createScopeBaselineAction } from "@/app/(dashboard)/projects/[projectId]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScopeInputProps = {
  projectId: string;
};

export function ScopeInput({ projectId }: ScopeInputProps) {
  const [scopeText, setScopeText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");

    const trimmedText = scopeText.trim();

    if (!trimmedText) {
      setError("Paste your project scope before continuing.");
      return;
    }

    setLoading(true);

    try {
      await createScopeBaselineAction({
        projectId,
        sourceText: trimmedText,
      });

      // The review screen comes next. For now we simply reload so the
      // project page reflects that a baseline has been created.
      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "We couldn't save the project scope.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Define your project scope</CardTitle>

        <p className="text-sm text-muted-foreground">
          Add the scope you agreed with the client. This becomes the
          reference point for future scope decisions.
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="default"
            className="justify-start"
          >
            <FileText />
            Paste scope
          </Button>

          <Button
            type="button"
            variant="outline"
            className="justify-start"
            disabled
          >
            <Upload />
            Upload file
          </Button>
        </div>

        <div className="mt-6">
          <label
            htmlFor="scope-text"
            className="text-sm font-medium"
          >
            Scope text
          </label>

          <textarea
            id="scope-text"
            name="scope-text"
            value={scopeText}
            onChange={(event) => setScopeText(event.target.value)}
            placeholder="Paste your SOW or project scope here..."
            className="mt-2 min-h-64 w-full resize-y rounded-lg border bg-background px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Paste your original client-approved scope.
          </p>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving scope..." : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}