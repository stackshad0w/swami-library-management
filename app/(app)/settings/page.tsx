"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/server";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  Bell,
  BookOpen,
  Palette,
  Building2,
  MessageCircle,
  Shield,
  Database,
  Info,
  Plus,
  Trash2,
  Save,
  GripVertical,
} from "lucide-react";
import type { FeeTier, Course, Gender, Shift } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

const ACCENT_COLORS = [
  { label: "Purple", value: "purple", cls: "bg-purple-500" },
  { label: "Blue", value: "blue", cls: "bg-blue-500" },
  { label: "Green", value: "green", cls: "bg-emerald-500" },
  { label: "Amber", value: "amber", cls: "bg-amber-500" },
  { label: "Red", value: "red", cls: "bg-red-500" },
  { label: "Violet", value: "violet", cls: "bg-violet-500" },
];

export default function SettingsPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("institution");
  const [loading, setLoading] = useState(false);

  // Institution
  const [instName, setInstName] = useState("Swami Abhyasika");
  const [adminName, setAdminName] = useState("");
  const [instPhone, setInstPhone] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instAddress, setInstAddress] = useState("");

  // Reminders
  const [reminderDays, setReminderDays] = useState(5);
  const [overdueDays, setOverdueDays] = useState(7);

  // Theme
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("purple");
  const [fontSize, setFontSize] = useState("medium");

  // PIN
  const [ownerPin, setOwnerPin] = useState("");
  const [newPin, setNewPin] = useState("");

  // WhatsApp templates
  const [tplOverdue, setTplOverdue] = useState(
    "Dear {name}, your library fee was due on {due_date}. Please renew. Thank you!"
  );
  const [tplUpcoming, setTplUpcoming] = useState(
    "Dear {name}, your library fee is due on {due_date} (in {days} days). Please renew on time. Thank you!"
  );

  // Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState("");

  // Fee Tiers
  const [feeTiers, setFeeTiers] = useState<FeeTier[]>([]);

  // About
  const [studentCount, setStudentCount] = useState(0);

  const loadSettings = useCallback(async () => {
    const [{ data: s }, { data: c }, { data: ft }, { count }] = await Promise.all([
      supabase.from("app_settings").select("*").single(),
      supabase.from("courses").select("*").order("sort_order"),
      supabase.from("fee_tiers").select("*"),
      supabase.from("students").select("*", { count: "exact", head: true }),
    ]);
    if (s) {
      setInstName(s.institution_name ?? "");
      setAdminName(s.institution_admin_name ?? "");
      setInstPhone(s.institution_phone ?? "");
      setInstEmail(s.institution_email ?? "");
      setInstAddress(s.institution_address ?? "");
      setReminderDays(s.reminder_days_before ?? 5);
      setOverdueDays(s.overdue_days_threshold ?? 7);
      setTheme(s.theme ?? "dark");
      setAccentColor(s.accent_color ?? "purple");
      setFontSize(s.font_size ?? "medium");
      setOwnerPin(s.owner_pin ?? "");
      setTplOverdue(s.whatsapp_template_overdue ?? "");
      setTplUpcoming(s.whatsapp_template_upcoming ?? "");
    }
    setCourses((c ?? []) as Course[]);
    setFeeTiers((ft ?? []) as FeeTier[]);
    setStudentCount(count ?? 0);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async () => {
    setLoading(true);
    const { error } = await supabase.from("app_settings").update({
      institution_name: instName,
      institution_admin_name: adminName,
      institution_phone: instPhone,
      institution_email: instEmail,
      institution_address: instAddress,
      reminder_days_before: reminderDays,
      overdue_days_threshold: overdueDays,
      theme,
      accent_color: accentColor,
      font_size: fontSize,
      owner_pin: newPin || ownerPin,
      whatsapp_template_overdue: tplOverdue,
      whatsapp_template_upcoming: tplUpcoming,
    }).eq("id", (await supabase.from("app_settings").select("id").single()).data?.id ?? "");
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Settings saved!"); if (newPin) setOwnerPin(newPin); setNewPin(""); }
  };

  const addCourse = async () => {
    if (!newCourse.trim()) return;
    const maxOrder = courses.reduce((m, c) => Math.max(m, c.sort_order), 0);
    const { error } = await supabase.from("courses").insert({ name: newCourse.trim(), sort_order: maxOrder + 1 });
    if (error) toast.error(error.message);
    else { toast.success("Course added!"); setNewCourse(""); loadSettings(); }
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Course removed."); loadSettings(); }
  };

  const addFeeTier = async () => {
    const { error } = await supabase.from("fee_tiers").insert({
      gender: "All", shift: "Day", months: 1, fee: 0
    });
    if (error) toast.error(error.message);
    else { toast.success("Fee tier added."); loadSettings(); }
  };

  const updateFeeTier = async (id: string, field: string, value: string | number) => {
    await supabase.from("fee_tiers").update({ [field]: value }).eq("id", id);
    setFeeTiers((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteFeeTier = async (id: string) => {
    const { error } = await supabase.from("fee_tiers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else loadSettings();
  };

  const exportBackup = async () => {
    const [{ data: s }, { data: st }, { data: p }, { data: b }] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("payment_history").select("*"),
      supabase.from("seat_bookings").select("*"),
      supabase.from("app_settings").select("*"),
    ]);
    const blob = new Blob([JSON.stringify({ students: s, payments: st, bookings: p, settings: b }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported!");
  };

  const TABS = [
    { value: "institution", label: "Institution", icon: Building2 },
    { value: "fees", label: "Fee Config", icon: CreditCard },
    { value: "reminders", label: "Reminders", icon: Bell },
    { value: "courses", label: "Courses", icon: BookOpen },
    { value: "theme", label: "Theme", icon: Palette },
    { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { value: "security", label: "Security", icon: Shield },
    { value: "data", label: "Data", icon: Database },
    { value: "about", label: "About", icon: Info },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-heading">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure fees, reminders, theme, and more</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="flex h-auto gap-1 flex-nowrap w-max mb-6">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5 text-sm whitespace-nowrap">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Institution */}
        <TabsContent value="institution">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">Institution Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Institution Name</Label>
                  <Input value={instName} onChange={(e) => setInstName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Administrator Name</Label>
                  <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={instPhone} onChange={(e) => setInstPhone(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={instEmail} onChange={(e) => setInstEmail(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea value={instAddress} onChange={(e) => setInstAddress(e.target.value)} rows={2} className="mt-1" />
              </div>
              <Button onClick={saveSettings} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Config */}
        <TabsContent value="fees">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-base">Fee Tiers</CardTitle>
              <Button size="sm" onClick={addFeeTier} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Tier
              </Button>
            </CardHeader>
            <CardContent>
              {feeTiers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No fee tiers configured.</p>
              ) : (
                <div className="space-y-2">
                  {feeTiers.map((tier) => (
                    <div key={tier.id} className="flex items-center gap-2 flex-wrap">
                      <Select value={tier.gender} onValueChange={(v) => { if (v) updateFeeTier(tier.id, "gender", v); }}>
                        <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={tier.shift} onValueChange={(v) => { if (v) updateFeeTier(tier.id, "shift", v); }}>
                        <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Day">Day</SelectItem>
                          <SelectItem value="Night">Night</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={String(tier.months)} onValueChange={(v) => { if (v) updateFeeTier(tier.id, "months", Number(v)); }}>
                        <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 6, 12].map((m) => <SelectItem key={m} value={String(m)}>{m} mo</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={tier.fee}
                          onChange={(e) => updateFeeTier(tier.id, "fee", Number(e.target.value))}
                          className="w-28 h-9 text-sm"
                          min={0}
                        />
                      </div>
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => deleteFeeTier(tier.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reminders */}
        <TabsContent value="reminders">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">Reminder Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Days Before Due to Show Reminder</Label>
                  <Input type="number" value={reminderDays} onChange={(e) => setReminderDays(Number(e.target.value))} min={1} max={30} className="mt-1 max-w-xs" />
                </div>
                <div>
                  <Label>Days Overdue Before Marking Inactive</Label>
                  <Input type="number" value={overdueDays} onChange={(e) => setOverdueDays(Number(e.target.value))} min={1} max={90} className="mt-1 max-w-xs" />
                </div>
              </div>
              <Button onClick={saveSettings} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">Course Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder="New course name..."
                  onKeyDown={(e) => e.key === "Enter" && addCourse()}
                />
                <Button onClick={addCourse} className="gap-2">
                  <Plus className="h-4 w-4" />Add
                </Button>
              </div>
              <div className="space-y-1.5">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{course.name}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteCourse(course.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme */}
        <TabsContent value="theme">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">Theme Options</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle between dark and light mode</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                />
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">Accent Color</Label>
                <div className="flex gap-3 flex-wrap">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setAccentColor(c.value)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${accentColor === c.value ? "border-foreground" : "border-transparent hover:border-border"}`}
                    >
                      <div className={`h-8 w-8 rounded-full ${c.cls}`} />
                      <span className="text-xs text-muted-foreground">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <Label>Font Size</Label>
                <Select value={fontSize} onValueChange={(v) => { if (v) setFontSize(v); }}>
                  <SelectTrigger className="mt-1 max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveSettings} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save Theme"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp */}
        <TabsContent value="whatsapp">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">WhatsApp Templates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use placeholders: <code className="bg-muted px-1 rounded text-xs">{"{name}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{due_date}"}</code>, <code className="bg-muted px-1 rounded text-xs">{"{days}"}</code>
              </p>
              <div>
                <Label>Overdue Template</Label>
                <Textarea value={tplOverdue} onChange={(e) => setTplOverdue(e.target.value)} rows={3} className="mt-1" />
              </div>
              <div>
                <Label>Upcoming Due Template</Label>
                <Textarea value={tplUpcoming} onChange={(e) => setTplUpcoming(e.target.value)} rows={3} className="mt-1" />
              </div>
              <Button onClick={saveSettings} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save Templates"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">Owner PIN</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The owner PIN is required to approve student deletions. Keep it safe.
              </p>
              <div>
                <Label>New PIN (4-8 digits)</Label>
                <Input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN"
                  maxLength={8}
                  className="mt-1 max-w-xs"
                />
              </div>
              <Button onClick={saveSettings} disabled={loading || !newPin} className="gap-2">
                <Shield className="h-4 w-4" />
                {loading ? "Saving..." : "Update PIN"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data */}
        <TabsContent value="data">
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-heading text-base">Data Management</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportBackup} variant="outline" className="w-full gap-2">
                  <Database className="h-4 w-4" />
                  Export Full JSON Backup
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger render={
                    <Button variant="destructive" className="w-full gap-2">
                      <Trash2 className="h-4 w-4" />
                      Clear All Data
                    </Button>
                  } />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete ALL student records, payment history, and seat bookings. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <Button variant="outline" onClick={() => {}}>Cancel</Button>
                      <Button variant="destructive" onClick={async () => {
                        await supabase.from("seat_bookings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        await supabase.from("payment_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        await supabase.from("students").delete().neq("id", "00000000-0000-0000-0000-000000000000");
                        toast.success("All data cleared.");
                      }}>Clear All Data</Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* About */}
        <TabsContent value="about">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-heading text-base">About</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                ["App Name", "Swami Abhyasika SMS"],
                ["Version", "1.0.0"],
                ["Total Students", studentCount.toString()],
                ["Tech Stack", "Next.js 16 · Supabase · Shadcn UI"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
