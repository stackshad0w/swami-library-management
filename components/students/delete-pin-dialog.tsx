"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import type { Student } from "@/lib/types";

interface DeletePinDialogProps {
  student: Student;
  onClose: () => void;
}

export function DeletePinDialog({ student, onClose }: DeletePinDialogProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!pin) {
      setError("Please enter the owner PIN.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    // Verify PIN from settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("owner_pin")
      .single();

    if (!settings || settings.owner_pin !== pin) {
      setError("Incorrect PIN. Please try again.");
      setLoading(false);
      return;
    }

    // Delete student (cascades to payments and bookings)
    const { error: deleteError } = await supabase
      .from("students")
      .delete()
      .eq("id", student.id);

    setLoading(false);
    if (deleteError) {
      toast.error(deleteError.message);
    } else {
      toast.success(`${student.name} has been deleted.`);
      onClose();
      router.refresh();
    }
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            You are about to permanently delete{" "}
            <strong className="text-foreground">{student.name}</strong> ({student.student_id}).
            This will also delete all their payment history and seat bookings.
            <br />
            <br />
            This action <strong>cannot be undone</strong>. Enter the owner PIN to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <Label htmlFor="delete-pin">Owner PIN</Label>
          <Input
            id="delete-pin"
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
            maxLength={8}
            className="mt-1.5"
            onKeyDown={(e) => e.key === "Enter" && handleDelete()}
          />
          {error && <p className="text-sm text-destructive mt-1.5">{error}</p>}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </span>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
