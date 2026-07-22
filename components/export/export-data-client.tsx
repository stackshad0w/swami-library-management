"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/server";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, FileDown, Download } from "lucide-react";
import { format } from "date-fns";

export function ExportDataClient() {
  const [loading, setLoading] = useState<string | null>(null);

  const fetchStudents = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("students").select("*").order("created_at");
    return data ?? [];
  };

  const exportCSV = async () => {
    setLoading("csv");
    const students = await fetchStudents();
    const header =
      "Student ID,Name,Phone,Email,Gender,Course,Shift,Admission Date,Fee Due Date,Total Fees,Paid Fees,Status\n";
    const rows = students.map((s: Record<string, unknown>) =>
      [
        s.student_id, s.name, s.phone, s.email ?? "",
        s.gender, s.course, s.shift,
        s.admission_date, s.fee_due_date ?? "",
        s.total_fees, s.paid_fees, s.fee_status,
      ].join(",")
    );
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
    setLoading(null);
  };

  const exportExcel = async () => {
    setLoading("excel");
    try {
      const { utils, writeFile } = await import("xlsx");
      const students = await fetchStudents();
      const rows = students.map((s: Record<string, unknown>) => ({
        "Student ID": s.student_id,
        Name: s.name,
        Phone: s.phone,
        Email: s.email ?? "",
        Gender: s.gender,
        Course: s.course,
        Shift: s.shift,
        "Admission Date": s.admission_date,
        "Fee Due Date": s.fee_due_date ?? "",
        "Total Fees": s.total_fees,
        "Paid Fees": s.paid_fees,
        Balance: Math.max(0, Number(s.total_fees) - Number(s.paid_fees)),
        Status: s.fee_status,
      }));
      const wb = utils.book_new();
      const ws = utils.json_to_sheet(rows);
      utils.book_append_sheet(wb, ws, "Students");
      writeFile(wb, `students-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel exported!");
    } catch {
      toast.error("Excel export failed. Make sure the xlsx package is installed.");
    }
    setLoading(null);
  };

  const exportPDF = async () => {
    setLoading("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const students = await fetchStudents();
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(16);
      doc.text("Swami Abhyasika — Student Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, 14, 28);

      let y = 40;
      const lineH = 7;
      const cols = [14, 42, 80, 110, 135, 160, 185, 220, 255];
      const headers = ["ID", "Name", "Phone", "Course", "Shift", "Due Date", "Total", "Paid", "Status"];

      doc.setFillColor(80, 40, 160);
      doc.rect(12, y - 5, 278, 9, "F");
      doc.setTextColor(255);
      headers.forEach((h, i) => doc.text(h, cols[i], y));

      doc.setTextColor(0);
      y += lineH;

      students.forEach((s: Record<string, unknown>, idx: number) => {
        if (y > 185) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) {
          doc.setFillColor(245, 240, 255);
          doc.rect(12, y - 5, 278, 8, "F");
        }
        doc.setFontSize(8);
        const vals = [
          String(s.student_id ?? ""),
          String(s.name ?? "").substring(0, 18),
          String(s.phone ?? ""),
          String(s.course ?? "").substring(0, 14),
          String(s.shift ?? ""),
          String(s.fee_due_date ?? ""),
          String(s.total_fees ?? ""),
          String(s.paid_fees ?? ""),
          String(s.fee_status ?? ""),
        ];
        vals.forEach((v, i) => doc.text(v, cols[i], y));
        y += lineH;
      });

      doc.save(`students-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF exported!");
    } catch {
      toast.error("PDF export failed.");
    }
    setLoading(null);
  };

  const exports = [
    {
      key: "excel",
      title: "Excel (.xlsx)",
      description: "Full student data with all fields, ideal for spreadsheet analysis",
      icon: FileSpreadsheet,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      onClick: exportExcel,
    },
    {
      key: "pdf",
      title: "PDF Report",
      description: "Formatted tabular report suitable for printing and sharing",
      icon: FileText,
      color: "text-red-500",
      bg: "bg-red-500/10",
      onClick: exportPDF,
    },
    {
      key: "csv",
      title: "CSV (.csv)",
      description: "Raw comma-separated data for any spreadsheet or data tool",
      icon: FileDown,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      onClick: exportCSV,
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-heading">Export Data</h1>
        <p className="text-muted-foreground mt-1">
          Download student records in your preferred format
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {exports.map((exp) => {
          const Icon = exp.icon;
          return (
            <Card
              key={exp.key}
              className="border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              onClick={exp.onClick}
            >
              <CardHeader className="pb-2">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${exp.bg} mb-2`}
                >
                  <Icon className={`h-6 w-6 ${exp.color}`} />
                </div>
                <CardTitle className="font-heading text-lg">{exp.title}</CardTitle>
                <CardDescription>{exp.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  disabled={loading === exp.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    exp.onClick();
                  }}
                >
                  {loading === exp.key ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
