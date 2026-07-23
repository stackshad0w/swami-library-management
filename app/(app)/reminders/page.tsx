"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { Student, AppSettings } from "@/lib/types";
import {
  formatDate,
  getDaysUntilDue,
  buildWhatsAppUrl,
  getFeeStatusColor,
} from "@/lib/utils";

const DEFAULT_OVERDUE_TPL =
  "Dear {name}, your library fee was due on {due_date}. Please renew your subscription. Thank you!";
const DEFAULT_UPCOMING_TPL =
  "Dear {name}, your library fee is due on {due_date} (in {days} days). Please renew on time. Thank you!";

export default function RemindersPage() {
  const supabase = createClient();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<{
    reminder_days_before: number;
    whatsapp_template_overdue: string;
    whatsapp_template_upcoming: string;
  }>({
    reminder_days_before: 5,
    whatsapp_template_overdue: DEFAULT_OVERDUE_TPL,
    whatsapp_template_upcoming: DEFAULT_UPCOMING_TPL,
  });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkSending, setBulkSending] = useState(false);
  const [tab, setTab] = useState("all");

  const fetchData = useCallback(async () => {
    const [{ data: settingsData }, { data: studentsData }] = await Promise.all([
      supabase.from("app_settings").select("*").single(),
      supabase
        .from("students")
        .select("*")
        .eq("is_active", true)
        .order("fee_due_date"),
    ]);
    if (settingsData)
      setSettings({
        reminder_days_before: settingsData.reminder_days_before,
        whatsapp_template_overdue: settingsData.whatsapp_template_overdue,
        whatsapp_template_upcoming: settingsData.whatsapp_template_upcoming,
      });
    setAllStudents((studentsData ?? []) as Student[]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overdueStudents = allStudents.filter((s) => s.fee_status === "Overdue");
  const upcomingStudents = allStudents.filter((s) => {
    const days = getDaysUntilDue(s.fee_due_date);
    return days >= 0 && days <= settings.reminder_days_before;
  });
  const allReminders = [...overdueStudents, ...upcomingStudents].filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i
  );

  const displayStudents =
    tab === "overdue"
      ? overdueStudents
      : tab === "upcoming"
      ? upcomingStudents
      : allReminders;

  const sendWhatsApp = (student: Student) => {
    const daysLeft = getDaysUntilDue(student.fee_due_date);
    const isOverdue = daysLeft < 0;
    const template = isOverdue
      ? settings.whatsapp_template_overdue
      : settings.whatsapp_template_upcoming;
    const url = buildWhatsAppUrl(student.phone, template, {
      name: student.name,
      due_date: formatDate(student.fee_due_date),
      days: String(Math.abs(daysLeft)),
    });
    window.open(url, "_blank");
  };

  const sendAllWhatsApp = async () => {
    setBulkSending(true);
    for (let i = 0; i < allReminders.length; i++) {
      sendWhatsApp(allReminders[i]);
      setBulkProgress(Math.round(((i + 1) / allReminders.length) * 100));
      await new Promise((r) => setTimeout(r, 1500));
    }
    setBulkSending(false);
    setBulkOpen(false);
    setBulkProgress(0);
  };

  const StudentCard = ({ student }: { student: Student }) => {
    const daysLeft = getDaysUntilDue(student.fee_due_date);
    const isOverdue = daysLeft < 0;
    return (
      <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card px-4 py-3.5 hover:bg-muted/20 transition-colors">
        {student.photo_url ? (
          <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
            <img src={student.photo_url!} alt={student.name} className="object-cover w-full h-full" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
            {student.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{student.name}</p>
            <Badge className={`text-xs ${getFeeStatusColor(student.fee_status)}`}>
              {student.fee_status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {student.student_id} · {student.phone} · {student.course}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-2">
          <p className="text-sm font-medium">{formatDate(student.fee_due_date)}</p>
          <p className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-amber-500"}`}>
            {isOverdue
              ? `${Math.abs(daysLeft)} days overdue`
              : `Due in ${daysLeft} days`}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 flex-shrink-0 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10"
          onClick={() => sendWhatsApp(student)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading">Reminders</h1>
          <p className="text-muted-foreground mt-1">
            {allReminders.length} student{allReminders.length !== 1 ? "s" : ""} need attention
          </p>
        </div>
        {allReminders.length > 0 && (
          <Button
            onClick={() => setBulkOpen(true)}
            className="gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            <Send className="h-4 w-4" />
            Send All Reminders ({allReminders.length})
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All ({allReminders.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            Overdue ({overdueStudents.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Upcoming ({upcomingStudents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-0">
          <div className="space-y-2">
            {displayStudents.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="font-medium text-lg">All clear!</p>
                <p className="text-muted-foreground text-sm">
                  No students need reminders right now.
                </p>
              </div>
            ) : (
              displayStudents.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bulk Send Modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Send className="h-5 w-5 text-[#25D366]" />
              Send All Reminders
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              This will open WhatsApp links for all{" "}
              <strong>{allReminders.length}</strong> students one by one with a
              1.5-second pause between each.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{bulkProgress}%</span>
              </div>
              <Progress value={bulkProgress} className="h-2" />
            </div>
            {!bulkSending ? (
              <Button
                onClick={sendAllWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2"
              >
                <Send className="h-4 w-4" />
                Start Sending
              </Button>
            ) : (
              <Button disabled className="w-full gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending... {bulkProgress}%
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
