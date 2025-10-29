import { storage } from "./storage";
import bcrypt from "bcrypt";
import { USER_ROLES } from "@shared/schema";
import { Department, User, Request, RequestTimeline, Notification } from "./models";

export async function seedDatabase() {
  try {
    const isSeeded = await User.findOne({ email: "admin@fuwukari.edu.ng" });
    if (isSeeded) {
      console.log("🌱 Database already seeded. Skipping.");
      return;
    }

    console.log("🌱 Clearing existing data...");
    await Department.deleteMany({});
    await User.deleteMany({});
    await Request.deleteMany({});
    await RequestTimeline.deleteMany({});
    await Notification.deleteMany({});

    console.log("🌱 Seeding database...");

    // Create departments
    const csDept = await storage.createDepartment({
      name: "Computer Science",
      code: "CSC",
      faculty: "Science",
    });

    const mathDept = await storage.createDepartment({
      name: "Mathematics",
      code: "MAT",
      faculty: "Science",
    });

    const physicsDept = await storage.createDepartment({
      name: "Physics",
      code: "PHY",
      faculty: "Science",
    });

    console.log("✅ Created departments");

    // Create users with different roles
    const hashedPassword = await bcrypt.hash("password123", 10);

    // System Admin
    await storage.createUser({
      staffNumber: "ADMIN001",
      email: "admin@fuwukari.edu.ng",
      password: hashedPassword,
      fullName: "System Administrator",
      phone: "+234 800 000 0001",
      departmentId: csDept.id,
      role: USER_ROLES.SYS_ADMIN,
      status: "active",
    });

    // Registrar
    await storage.createUser({
      staffNumber: "REG001",
      email: "registrar@fuwukari.edu.ng",
      password: hashedPassword,
      fullName: "Dr. Ibrahim Musa",
      phone: "+234 800 000 0002",
      role: USER_ROLES.REGISTRAR,
      status: "active",
    });

    // Dean
    await storage.createUser({
      staffNumber: "DEAN001",
      email: "dean.science@fuwukari.edu.ng",
      password: hashedPassword,
      fullName: "Prof. Amina Bello",
      phone: "+234 800 000 0003",
      role: USER_ROLES.DEAN,
      status: "active",
    });

    // HOD/Admin Officer
    await storage.createUser({
      staffNumber: "HOD001",
      email: "hod.cs@fuwukari.edu.ng",
      password: hashedPassword,
      fullName: "Dr. Chukwudi Okafor",
      phone: "+234 800 000 0004",
      departmentId: csDept.id,
      role: USER_ROLES.ADMIN_OFFICER,
      status: "active",
    });

    // Academic Staff
    const staff1 = await storage.createUser({
      staffNumber: "STAFF001",
      email: "john.doe@fuwukari.edu.ng",
      password: hashedPassword,
      fullName: "Dr. John Doe",
      phone: "+234 800 000 0005",
      departmentId: csDept.id,
      role: USER_ROLES.ACADEMIC_STAFF,
      status: "active",
    });

    await storage.createUser({
      staffNumber: "STAFF002",
      email: "jane.smith@fuwukari.edu.ng",
      password: hashedPassword,
      fullName: "Dr. Jane Smith",
      phone: "+234 800 000 0006",
      departmentId: mathDept.id,
      role: USER_ROLES.ACADEMIC_STAFF,
      status: "active",
    });

    await storage.createUser({
      staffNumber: "STAFF003",
      email: "ahmed.ali@fuwukari.edu.ng",
      password: hashedPassword,
      fullName: "Prof. Ahmed Ali",
      phone: "+234 800 000 0007",
      departmentId: physicsDept.id,
      role: USER_ROLES.ACADEMIC_STAFF,
      status: "active",
    });

    console.log("✅ Created users");

    // Create some sample requests
    const request1 = await storage.createRequest({
      requestType: "leave",
      title: "Annual Leave Request - December 2024",
      description: "Requesting annual leave for the Christmas holiday period.",
      status: "submitted",
      priority: "normal",
      requestorId: staff1.id,
      departmentId: csDept.id,
      leaveType: "annual",
      startDate: new Date("2024-12-20"),
      endDate: new Date("2024-12-31"),
      totalWorkingDays: 8,
      substituteStaffName: "Dr. Jane Smith",
    });

    await storage.addTimelineEntry({
      requestId: request1.id,
      userId: staff1.id,
      action: "Request created and submitted",
    });

    await storage.createRequest({
      requestType: "conference_training",
      title: "International Conference on AI",
      description: "Request to attend and present paper at ICAI 2025 conference.",
      status: "draft",
      priority: "high",
      requestorId: staff1.id,
      departmentId: csDept.id,
      eventName: "International Conference on Artificial Intelligence 2025",
      organizer: "IEEE Computer Society",
      eventDates: "March 15-18, 2025",
      location: "Lagos, Nigeria",
      estimatedCost: "₦250,000",
      conferencePaper: true,
      travelRequest: true,
    });

    console.log("✅ Created sample requests");

    // Create sample notifications
    await storage.createNotification({
      userId: staff1.id,
      requestId: request1.id,
      type: "submission",
      title: "Request Submitted",
      message: "Your leave request has been submitted and is pending approval.",
      link: `/requests/${request1.id}`,
    });

    console.log("✅ Created sample notifications");

    console.log("\n✨ Database seeded successfully!");
    console.log("\n📝 Test Login Credentials:");
    console.log("  - Admin: admin@fuwukari.edu.ng / password123");
    console.log("  - Registrar: registrar@fuwukari.edu.ng / password123");
    console.log("  - Dean: dean.science@fuwukari.edu.ng / password123");
    console.log("  - HOD: hod.cs@fuwukari.edu.ng / password123");
    console.log("  - Staff: john.doe@fuwukari.edu.ng / password123");
    console.log("  - Staff: jane.smith@fuwukari.edu.ng / password123");
    console.log("  - Staff: ahmed.ali@fuwukari.edu.ng / password123\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}