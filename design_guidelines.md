# Design Guidelines: Academic Staff Service Request Portal

## Design Approach

**Selected Approach**: Design System-Based (Utility-Focused)

**Primary References**: Carbon Design System (enterprise/data-heavy patterns) + Linear (clean productivity aesthetics) + Notion (organizational clarity)

**Rationale**: This is an information-dense, workflow-management enterprise application where efficiency, learnability, and data clarity are paramount. The system prioritizes functional excellence over visual flair.

---

## Core Design Principles

1. **Clarity Over Decoration**: Every element serves a functional purpose
2. **Scannable Hierarchy**: Users must quickly identify status, actions, and priorities
3. **Workflow Visibility**: Approval stages and request status are always clear
4. **Role-Optimized Views**: Each user role sees precisely what they need
5. **Form Efficiency**: Minimize cognitive load in data entry

---

## Typography

**Font Stack**: Inter (primary), system-ui (fallback)

**Hierarchy**:
- Page Titles: text-3xl font-semibold (Dashboard, Request Management)
- Section Headers: text-xl font-semibold (My Requests, Pending Approvals)
- Card Titles/Labels: text-base font-medium
- Body Text: text-sm font-normal
- Metadata/Timestamps: text-xs text-gray-600
- Table Headers: text-xs font-semibold uppercase tracking-wide
- Form Labels: text-sm font-medium
- Helper Text: text-xs text-gray-500

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section spacing: mb-6 or mb-8
- Form field gaps: gap-4
- Card spacing: space-y-4

**Container Strategy**:
- Main content area: max-w-7xl mx-auto px-4
- Form containers: max-w-3xl
- Dashboard widgets: Full-width grid with responsive columns

---

## Component Library

### Navigation & Layout

**Sidebar Navigation** (Persistent, Left-aligned)
- Width: w-64 fixed
- Sections grouped by role (My Requests, Approvals, Admin)
- Active state: Subtle background highlight
- Icons from Heroicons (outline style)
- User profile card at bottom with role badge

**Top Bar**
- Height: h-16 with shadow-sm
- Left: Breadcrumb navigation (Home / Requests / Leave Request #1234)
- Right: Notification bell (with count badge), user dropdown
- Sticky: sticky top-0 z-50

### Dashboard Components

**Statistics Cards** (4-column grid on desktop, stack on mobile)
- Compact design: p-6, rounded-lg, border
- Number: text-3xl font-bold
- Label: text-sm text-gray-600
- Trend indicator: Small arrow icon + percentage
- Layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4

**Request Status Table**
- Striped rows for readability
- Columns: Request ID, Type, Subject, Requester, Status, Date, Actions
- Status badges: Pill-shaped with text-xs, uppercase, font-semibold
- Sortable headers with arrow indicators
- Pagination: Bottom-aligned, showing "1-20 of 145 requests"
- Row hover: Subtle background change
- Action buttons: Icon-only (View, Edit) with tooltips

**Timeline/Activity Feed**
- Vertical line connecting events
- Each event: Dot indicator, timestamp (right-aligned), action description, user name
- Most recent at top
- Compact spacing: gap-3 between items

### Forms

**Request Creation Form**
- Two-column layout on desktop: grid-cols-2 gap-6
- Full-width on mobile
- Field groups with subtle borders and p-4 spacing
- Required field indicator: Red asterisk after label
- Input fields: h-10 with border, rounded-md, focus:ring-2
- Textareas: min-h-32
- Select dropdowns: Native styling enhanced with chevron icon
- Date pickers: Calendar icon prefix
- File upload: Drag-and-drop zone with dashed border, h-32
  - Shows file list below with name, size, remove button
- Form actions: Sticky bottom bar with Save Draft, Submit, Cancel buttons

**Search & Filters Bar**
- Horizontal layout with gap-4
- Search input: w-full md:w-96 with magnifying glass icon
- Filter dropdowns: Inline, each w-48
- Clear filters button: text-sm underline
- Results count: "Showing 23 results"

### Cards & Containers

**Request Summary Card**
- Border, rounded-lg, p-6
- Header: Title + Status badge (right-aligned)
- Metadata grid: 2-column with text-sm (Request Type, Department, Date Submitted, Current Approver)
- Footer: Action buttons (primary: Approve/Reject, secondary: View Details)
- Attachment count indicator with paperclip icon

**Approval Action Panel**
- Sticky side panel or modal overlay
- Request details summary at top
- Decision buttons: Large, full-width, stacked vertically (Approve, Reject, Request Modification)
- Comments textarea: Required, h-24
- Attachments section: Optional file upload
- Submit button: Disabled until comment added (for reject/modify)

**Notification Item**
- Horizontal layout: Icon + Content + Timestamp
- Unread indicator: Blue dot
- Dismiss button: Top-right X icon
- Click: Navigate to relevant request
- Grouped by date: "Today", "Yesterday", "Last 7 days"

### Admin Components

**User Management Table**
- Columns: Name, Email, Staff ID, Department, Role(s), Status, Actions
- Inline edit capability: Click to edit role or status
- Bulk actions: Checkbox column, action bar appears when selected
- Create User button: Top-right, primary style

**Workflow Configuration**
- Visual workflow builder: Boxes connected by arrows
- Each stage: Role selector, optional conditions, timeout settings
- Add Stage button: Dashed box with plus icon
- Drag-to-reorder stages
- Preview panel showing example flow

**Reports Dashboard**
- Chart widgets: 2-column grid
- Chart types: Bar charts (requests by type), line charts (trends), pie charts (department distribution)
- Export buttons per chart: CSV, PDF icons
- Date range selector: Top-right of each widget
- Full-screen mode button for detailed analysis

### Modals & Overlays

**Confirmation Dialogs**
- Centered overlay with backdrop blur
- Max-width: max-w-md
- Padding: p-6
- Icon at top (warning, success, info)
- Title: text-lg font-semibold
- Message: text-sm
- Buttons: Horizontal layout, right-aligned (Cancel, Confirm)

**Request Details Modal**
- Large modal: max-w-4xl
- Tabbed interface: Details, Timeline, Attachments, Comments
- Close button: Top-right
- Scrollable content area
- Fixed action footer

---

## Responsive Behavior

- Desktop (lg:): Full sidebar navigation visible
- Tablet (md:): Collapsible sidebar with hamburger menu
- Mobile: Bottom navigation bar with 4-5 key actions, sidebar as overlay

---

## Accessibility

- All interactive elements: Keyboard navigable with visible focus states (ring-2 ring-offset-2)
- Form labels: Properly associated with inputs via htmlFor
- ARIA labels on icon-only buttons
- Status badges: Include sr-only text describing status
- Tables: Proper thead/tbody structure with scope attributes
- Modals: Focus trap and ESC to close

---

## Animation Guidelines

**Use Sparingly**:
- Page transitions: None (instant navigation for efficiency)
- Hover states: Subtle opacity/background changes (no transform)
- Loading states: Simple spinner or skeleton screens
- Notifications: Slide-in from top-right (300ms ease-out)
- Modal open/close: Fade + scale (200ms)
- Avoid: Elaborate animations, parallax, scroll-triggered effects

---

## Images

**No hero images** - This is an internal enterprise tool, not a marketing site.

**Relevant imagery**:
- User avatars: Circular, 40x40px in headers, 32x32px in lists
- Empty states: Simple illustration (e.g., empty inbox graphic) centered with text
- Department/role icons: Minimal, line-style icons from Heroicons