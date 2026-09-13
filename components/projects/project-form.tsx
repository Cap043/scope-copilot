"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { createProject } from "@/lib/projects";
import { createProjectAction } from "@/app/(dashboard)/projects/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProjectForm() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>,
) {
  // Prevent the browser's normal form submission/reload.
  event.preventDefault();

  // Send the form data to the server action.
  // The server action handles the database operation safely.
  const project = await createProjectAction({
    name,
    client,
    value: Number(value),
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Reset the form after successful creation.
  setOpen(false);
  setName("");
  setClient("");
  setValue("");
  setStartDate("");
  setEndDate("");

  // Open the newly created project.
  router.push(`/projects/${project.id}`);
}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        New Project
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>

          <DialogDescription>
            Add the basic details for your client project. You&apos;ll add
            the project scope next.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              placeholder="Acme website redesign"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              placeholder="Acme Inc."
              value={client}
              onChange={(event) => setClient(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Project value</Label>
            <Input
              id="value"
              type="number"
              min="0"
              step="0.01"
              placeholder="5000"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Target end date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}