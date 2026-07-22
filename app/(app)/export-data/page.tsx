import type { Metadata } from "next";
import { ExportDataClient } from "@/components/export/export-data-client";

export const metadata: Metadata = {
  title: "Export Data — Swami Abhyasika",
};

export default function ExportDataPage() {
  return <ExportDataClient />;
}
