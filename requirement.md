# Swami Abhyasika — Student Management System

A full-featured Student Management System (SMS) for **Swami Abhyasika**, a center for spiritual practice and learning. The app manages students, library seat bookings, fee collections, and reports — all in one place.

---

## Pages & Navigation

The app has a fixed sidebar with the following pages:

- **Dashboard** — Welcome screen with quick-access cards to both libraries
- **Students** — Full list of all enrolled students
- **New Admission** — Form to enroll a new student
- **Basement Library** — Seat booking and management for the basement library
- **2nd Floor Library** — Seat booking (coming soon / placeholder)
- **Fee Management** — View and record fee payments for all students
- **Reminders** — List students with overdue or upcoming payments
- **Statistics** — Revenue charts, collection summaries, and cash closing reports
- **Export Data** — Download student data in Excel, PDF, or CSV formats
- **Settings** — Configuration for fees, courses, reminders, themes, and data

---

## Features

### 🎓 Student Management

- **Enroll new students** with full profile: name, phone, email, gender, address, photo, course, conditions/remarks
- **Auto-generated Student ID** (e.g. `STU-0001`, sequential)
- **Edit existing students** — all fields editable including photo
- **View student details** in a modal popup with full history
- **Delete students** — protected by an Owner PIN approval workflow (pending delete → approve with PIN)
- **Filter students** by course, fee status (Active / Pending / Overdue / Inactive)
- **Search students** globally using the Command Palette (`Ctrl+K`)
- **Student photo upload** with automatic client-side image compression (max 250 KB, JPEG/PNG/WEBP)
- **Clickable student photos** open a fullscreen lightbox
- **Status tracking** — Active, Overdue, Inactive (auto-set after configurable overdue days)

---

### 💳 Fee Management

- **Record payments** per student via a modal with:
  - Payment amount
  - Payment date
  - From date & months subscribed
  - Next due date (auto-calculated)
  - Study shift (Day / Night / Both)
  - Payment method (Cash, UPI, Online Transfer, Cheque, DD, Card)
  - Optional notes / remarks
- **Payment receipt** generated and shown after recording
- **Subscription balance** — proportional remaining fee calculation displayed per student
- **Fee status** — Active, Overdue, Inactive, Expired
- **Auto-update due date** on fee renewal
- **Inline seat booking** inside the payment modal — book a library seat at the same time as recording a payment

---

### 📅 Subscription & Shift System

- Each student has a **Study Shift**: Day, Night, or Both
- Subscriptions are tracked by **months** (1, 2, 3, 6, 12)
- **Configurable fee tiers** per gender, shift, and duration — set in Settings
- Auto-fill fee amount when selecting gender + shift + months on admission or renewal

---

### 📚 Basement Library — Seat Booking

- **84 seats** in a visual, interactive seat map
- **Live seat overview** — shows all 84 seats at a glance with availability color coding (Available / Occupied / Selected / My Booking)
- **Seat hover tooltip** — hover any booked seat to see who booked it
- **Seat click popup** — click a booked seat for full booking details (student, phone, date, slot, fee, payment mode)
- **Book a Seat** panel:
  - Select a date
  - Search for a student by name, ID, phone, or course
  - Choose one or more **time slots** (preset slots like morning, afternoon, evening, full day)
  - Add **custom manual time ranges** (start time → end time)
  - Multi-slot selection supported
  - Visual seat map shows availability for the selected date & slots
  - Confirm booking with an optional fee and payment mode
- **My Bookings** tab — search and filter all bookings for a student or by date
- **Admin tab**:
  - Stats summary (total bookings, revenue, active now, unique students)
  - All bookings table (seat, student, phone, date, slots, fee, mode, status)
  - Filter bookings by date
  - Export bookings to CSV
  - Clear expired bookings
- **Auto-release** — seats are released when booking period expires
- **Seat booking from Admission form** — optionally book a library seat at the same time as admitting a student

---

### 🔔 Reminders

- Auto-detects students with **upcoming due dates** (configurable days-before reminder)
- Auto-detects **overdue** students
- **Filter tabs**: All / Overdue / Remaining
- **Send WhatsApp reminder** to individual student (opens WhatsApp with pre-filled message)
- **Send All Reminders** — bulk WhatsApp modal:
  - Lists all reminder-eligible students
  - Progress bar showing send progress
  - Sends WhatsApp links one-by-one with pause
- **Reminder badge** on the sidebar nav item shows count of students needing reminders
- WhatsApp message templates configurable in Settings

---

### 📊 Statistics & Reports

- **Period selector** — filter by This Month, Last Month, Last 3/6 Months, This Year, All Time
- **4 summary stat cards**: Total Students, New This Month, Fees Collected, Pending Fees
- **Charts**:
  - Fee Collection Overview (doughnut — Paid vs Pending)
  - Students by Course (bar chart)
  - Payment Method Breakdown (doughnut)
  - Monthly Revenue (bar chart)
- **Payment Method Summary Cards** — per-method totals (Cash, UPI, Online Transfer, etc.)
- **Cash Closing Report**:
  - Daily cash reconciliation
  - Enter opening cash, actual closing cash, closed-by name, and notes
  - Auto-calculates UPI/online total and difference
  - History table of all past cash closings (date, cash, UPI/online, total, difference, closed by, status)
- **Recent Admissions** table

---

### 📤 Export Data

- **Excel (.xlsx)** — full student data with fee details
- **PDF Report** — formatted for printing
- **CSV (.csv)** — raw data for any spreadsheet app

---

### ⚙️ Settings

- **Fee Configuration** — Add/remove fee tiers by gender, shift, and months with custom fees
- **Reminder Settings** — Set how many days before due date to show reminder; set auto-inactive threshold (days overdue)
- **Course Configuration** — Add, remove, and reorder courses available in the admission form (draggable)
- **Theme Options**:
  - Toggle Dark / Light mode
  - Accent color presets (Purple, Blue, Green, Amber, Red, Violet)
  - Font size (Small / Medium / Large)
- **Institution Profile** — Set institution name, admin name, phone, email, address (shows in sidebar and receipts)
- **WhatsApp Templates** — Customize reminder message templates
- **Student Delete Approval** — Set owner PIN; all deletes require PIN confirmation; pending delete requests queue
- **Data Management**:
  - Export full JSON backup
  - Import JSON backup (replaces all data)
  - Clear all data (with confirmation)
- **About** — App name, version, total students count, storage used

---

### 🔐 Authentication

- **Login page** (`login.html`) — username/password login
- JWT token stored in localStorage; all API requests are authenticated
- Redirect to login if token is missing or expired
- Admin card shown in sidebar footer

---

### 🌐 Cloud Sync

- All `localStorage` data is automatically synced to the backend database in real time
- On app boot, data is fetched from the server and written to `localStorage`
- Student photos uploaded as base64 are automatically offloaded to Cloudinary CDN; only the URL is stored in the database
- If Cloudinary is not configured, photos fall back to inline base64 (app still works)

---

### 📱 PWA (Progressive Web App)

- **Installable** — "Install App" banner appears; can be added to home screen
- **Offline support** via Service Worker (caches app shell)
- Mobile-responsive layout
- Safe area insets for notched devices

---

### 🎨 UI & UX

- **Dark mode** by default with full **light mode** support
- Dual font family: Syne (headings) + DM Sans (body)
- Animated page transitions
- Toast notifications (success / error / info)
- Animated stat cards with hover effects
- **Command Palette** (`Ctrl+K` or click search box) — search students and actions by keyboard
- **Mobile sidebar** — slide-in sidebar with backdrop on small screens
- Skip-to-content link for accessibility
- Keyboard navigation for all nav items and modals
- Responsive table with horizontal scroll on small screens
- Sticky table headers

---

### 🏛️ Institution Profile

- Institution name, administrator name, phone, email, and address stored in settings
- Institution name shown in sidebar logo area
- Admin name shown in admin card in sidebar footer
- Profile used in receipts and exports

---

## Data Model (per Student)

Each student record stores:

- ID, Name, Phone, Email, Gender, Address, Photo
- Conditions / Remarks
- Course, Shift (Day/Night/Both)
- Admission Date, Payment Date, Fee Due Date
- Subscription Months
- Total Fees, Paid Fees
- Status (Active / Overdue / Inactive)
- Payment history array (amount, date, method, notes)

---

## Courses (configurable)

Default courses available at admission:
- UPSC MPSC
- IIT JEE/MHT CET
- MEDICAL
- OTHER

Custom courses can be added and reordered from Settings.

---

## Payment Methods

- Cash
- UPI
- Online Transfer
- Cheque
- Demand Draft (DD)
- Card
- Free / Included (library-only bookings)
