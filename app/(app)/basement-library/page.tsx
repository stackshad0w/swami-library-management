import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ListChecks, Settings } from "lucide-react";
import { BookSeatPanel } from "@/components/library/book-seat-panel";
import { MyBookingsTab } from "@/components/library/my-bookings-tab";
import { AdminTab } from "@/components/library/admin-tab";

export const metadata = {
  title: "Basement Library — Swami Abhyasika",
};

export default function BasementLibraryPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-heading">Basement Library</h1>
        <p className="text-muted-foreground mt-1">
          84-seat library — book seats, view bookings, and manage the library
        </p>
      </div>

      <Tabs defaultValue="book" className="space-y-5">
        <TabsList className="h-10">
          <TabsTrigger value="book" className="gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            Book a Seat
          </TabsTrigger>
          <TabsTrigger value="my-bookings" className="gap-2 text-sm">
            <ListChecks className="h-4 w-4" />
            All Bookings
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2 text-sm">
            <Settings className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="mt-0">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <BookSeatPanel />
          </div>
        </TabsContent>

        <TabsContent value="my-bookings" className="mt-0">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <MyBookingsTab />
          </div>
        </TabsContent>

        <TabsContent value="admin" className="mt-0">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <AdminTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
