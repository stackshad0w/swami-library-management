import { Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "2nd Floor Library — Swami Abhyasika",
};

export default function SecondFloorLibraryPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mx-auto mb-6">
          <Building2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold font-heading mb-3">2nd Floor Library</h1>
        <p className="text-muted-foreground mb-8">
          This library is currently being set up. Seat booking for the 2nd floor
          will be available soon. Stay tuned!
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/basement-library">
            <Button variant="default">Go to Basement Library</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
