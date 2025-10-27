# Academic Staff Service Request Portal
## Federal University Wukari

### Project Overview
A comprehensive enterprise web application for managing academic staff service requests at Federal University Wukari. The system replaces manual/semi-digital processes with a centralized, secure, auditable, role-based portal.

### Technology Stack
- **Frontend**: React with TypeScript, Wouter (routing), TanStack Query (data fetching), Shadcn UI components, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL (Neon-backed)
- **Authentication**: Session-based with bcrypt password hashing
- **File Storage**: Local with secure access control

### User Roles
1. **Academic Staff** - Create and track service requests
2. **Admin Officer/HOD** - Review and approve department-level requests
3. **Dean** - Approve faculty-level requests
4. **Registrar** - Final approval authority for most request types
5. **System Admin** - Full system management and configuration

### Core Features
- Multi-stage approval workflows (HOD → Dean → Registrar)
- Request types: Leave, Conference/Training, Resource Requisition, Generic
- Real-time notifications (in-app and email)
- Comprehensive audit trail
- File attachment management
- Advanced search and filtering
- Reporting and analytics dashboards
- User and department management

### Database Schema
**Main Tables:**
- `users` - Staff accounts with role-based access
- `departments` - University organizational structure
- `requests` - Service request submissions
- `request_timeline` - Complete audit trail for each request
- `attachments` - File upload metadata
- `notifications` - In-app and email notifications
- `workflow_configs` - Configurable approval chains
- `audit_logs` - System-wide action logging
- `system_settings` - Application configuration

### API Endpoints Structure
```
/api/auth/* - Authentication (login, logout, password reset)
/api/requests/* - Request CRUD and workflow actions
/api/approvals/* - Pending approval queries
/api/notifications/* - Notification management
/api/departments/* - Department management
/api/admin/* - Admin operations (users, workflows, reports)
/api/dashboard/* - Dashboard statistics
```

### Development Setup
1. Database is automatically provisioned (PostgreSQL)
2. Run `npm run dev` to start both frontend (Vite) and backend (Express)
3. Application runs on port 5000
4. Hot reload enabled for both frontend and backend

### Security Features
- Password hashing with bcrypt (10 salt rounds)
- Session-based authentication with secure cookies
- Role-based access control (RBAC) enforced on all endpoints
- Input validation on both client and server
- File upload restrictions (type and size limits)
- Audit logging for all sensitive operations
- Account lockout after failed login attempts

### Design System
- **Colors**: Professional blue primary, semantic status colors
- **Typography**: Inter font family for clarity
- **Layout**: Responsive design with sidebar navigation
- **Components**: Shadcn UI library with custom enterprise styling
- **Spacing**: Consistent 4px/8px grid system
- **Dark Mode**: Full support with system preference detection

### Workflow Example
1. Staff member creates leave request
2. System validates and routes to HOD
3. HOD receives notification and reviews
4. Upon approval, routes to Dean (if configured)
5. Dean approves, routes to Registrar
6. Registrar provides final approval
7. System notifies staff and updates status
8. Complete timeline logged for audit

### Recent Changes
- Initial project setup completed
- All React components created with exceptional visual quality
- Complete data schema defined for MVP features
- Authentication system implemented
- Dashboard and statistics components built
- Request creation and management interfaces completed
- Approval workflow UI implemented
- Admin panel scaffolded (users, departments, reports)
- Notification system UI completed

### Next Steps
- Implement backend API endpoints
- Set up PostgreSQL database with Drizzle ORM
- Connect frontend to backend APIs
- Implement email notification service
- Add file upload/download functionality
- Create comprehensive test suite
