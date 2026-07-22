"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhotoUpload } from "./photo-upload";
import type { Student, Gender, Shift, FeeTier, Course } from "@/lib/types";
import { calculateNextDueDate } from "@/lib/utils";
import { lookupFee } from "@/lib/fee-utils";
import { format, addDays } from "date-fns";

interface StudentFormProps {
  student?: Student;
  courses: Course[];
  feeTiers: FeeTier[];
  onSuccess?: () => void;
  nextSeq?: number;
}

const MONTHS_OPTIONS = [1, 2, 3, 6, 12];

export function StudentForm({
  student,
  courses,
  feeTiers,
  onSuccess,
  nextSeq = 1,
}: StudentFormProps) {
  const router = useRouter();
  const isEdit = !!student;
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form state
  const [name, setName] = useState(student?.name ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [email, setEmail] = useState(student?.email ?? "");
  const [gender, setGender] = useState<Gender>(student?.gender ?? "Male");
  const [address, setAddress] = useState(student?.address ?? "");
  const [conditions, setConditions] = useState(student?.conditions ?? "");
  const [course, setCourse] = useState(student?.course ?? "");
  const [shift, setShift] = useState<Shift>(student?.shift ?? "Day");
  const [admissionDate, setAdmissionDate] = useState(
    student?.admission_date ?? format(new Date(), "yyyy-MM-dd")
  );
  const [months, setMonths] = useState<number>(student?.subscription_months ?? 1);
  const [totalFees, setTotalFees] = useState<number>(student?.total_fees ?? 0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(student?.photo_url ?? null);

  // Auto-fill fee
  useEffect(() => {
    const fee = lookupFee(feeTiers, gender, shift, months);
    if (fee > 0) setTotalFees(fee);
  }, [gender, shift, months, feeTiers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !course) {
      toast.error("Name, phone, and course are required.");
      return;
    }
    setLoading(true);

    try {
      let finalPhotoUrl = student?.photo_url ?? null;

      // Upload photo if changed
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("student-photos")
          .upload(path, photoFile, { upsert: true });
        if (uploadErr) {
          toast.error("Photo upload failed: " + uploadErr.message);
        } else {
          const { data: publicData } = supabase.storage
            .from("student-photos")
            .getPublicUrl(path);
          finalPhotoUrl = publicData.publicUrl;
        }
      }

      const nextDueDate = format(
        calculateNextDueDate(new Date(admissionDate), months),
        "yyyy-MM-dd"
      );

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        gender,
        address: address.trim() || null,
        conditions: conditions.trim() || null,
        course,
        shift,
        admission_date: admissionDate,
        fee_due_date: nextDueDate,
        subscription_months: months,
        total_fees: totalFees,
        photo_url: finalPhotoUrl,
        fee_status: "Active",
      };

      if (isEdit) {
        const { error } = await supabase
          .from("students")
          .update(payload)
          .eq("id", student.id);
        if (error) throw error;
        toast.success("Student updated successfully!");
      } else {
        // Get next sequence
        const studentIdStr = `STU-${String(nextSeq).padStart(4, "0")}`;
        const { error } = await supabase.from("students").insert({
          ...payload,
          student_id: studentIdStr,
          paid_fees: 0,
        });
        if (error) throw error;
        toast.success(`Student enrolled! ID: ${studentIdStr}`);
      }

      onSuccess?.();
      router.push("/students");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo */}
      <div className="flex gap-6 items-start">
        <div>
          <Label className="mb-2 block">Photo</Label>
          <PhotoUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            onFileChange={setPhotoFile}
          />
        </div>
        <div className="flex-1 space-y-4 pt-1">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student name"
              required
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Optional"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gender */}
      <div>
        <Label className="mb-2 block">Gender *</Label>
        <RadioGroup
          value={gender}
          onValueChange={(v) => setGender(v as Gender)}
          className="flex gap-6"
        >
          {(["Male", "Female", "Other"] as Gender[]).map((g) => (
            <div key={g} className="flex items-center gap-2">
              <RadioGroupItem value={g} id={`gender-${g}`} />
              <Label htmlFor={`gender-${g}`} className="cursor-pointer font-normal">
                {g}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Course & Shift */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Course *</Label>
          <Select value={course} onValueChange={(v) => { if (v) setCourse(v); }}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Study Shift *</Label>
          <Select value={shift} onValueChange={(v) => { if (v) setShift(v as Shift); }}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Day">Day</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
              <SelectItem value="Both">Both (Day + Night)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Admission Date & Months */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="admission_date">Admission Date</Label>
          <Input
            id="admission_date"
            type="date"
            value={admissionDate}
            onChange={(e) => setAdmissionDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Subscription Months</Label>
          <Select
            value={String(months)}
            onValueChange={(v) => setMonths(Number(v))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} {m === 1 ? "Month" : "Months"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fee */}
      <div>
        <Label htmlFor="fee">Total Fee (₹)</Label>
        <Input
          id="fee"
          type="number"
          value={totalFees}
          onChange={(e) => setTotalFees(Number(e.target.value))}
          min={0}
          className="mt-1 max-w-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Auto-filled from fee tiers; you can override
        </p>
      </div>

      {/* Address */}
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Optional"
          rows={2}
          className="mt-1"
        />
      </div>

      {/* Conditions */}
      <div>
        <Label htmlFor="conditions">Conditions / Remarks</Label>
        <Textarea
          id="conditions"
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          placeholder="Any special conditions or remarks"
          rows={2}
          className="mt-1"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {isEdit ? "Saving..." : "Enrolling..."}
            </span>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Enroll Student"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
