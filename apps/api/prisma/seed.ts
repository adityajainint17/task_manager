import dayjs from "dayjs";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword, makeAvatarColor } from "../src/utils/auth.js";

async function main() {
  console.log("Checking if database needs seeding...");
  
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already has data. Skipping seed.");
    return;
  }

  console.log("Seeding initial demo data...");
  const passwordHash = await hashPassword("Password123!");

  const usersData = [
    { name: "System Admin", email: "admin@demo.com", role: "ADMIN" },
    { name: "Project Lead", email: "lead@demo.com", role: "PLS" },
    { name: "Team Member", email: "member@demo.com", role: "TASKER" }
  ];

  const createdUsers = await Promise.all(
    usersData.map((user) =>
      prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash,
          avatarColor: makeAvatarColor(user.email),
          role: user.role
        }
      })
    )
  );

  const adminUser = createdUsers.find(u => u.role === "ADMIN")!;
  const leadUser = createdUsers.find(u => u.role === "PLS")!;
  const taskerUser = createdUsers.find(u => u.role === "TASKER")!;

  console.log("Creating demo project...");
  const project = await prisma.project.create({
    data: {
      name: "Nexus Workflow",
      key: "NEXUS",
      description: "Primary enterprise coordination workspace for team delivery.",
      color: "#6366f1",
      ownerId: adminUser.id,
      members: {
        create: [
          { userId: adminUser.id, role: "ADMIN" },
          { userId: leadUser.id, role: "ADMIN" },
          { userId: taskerUser.id, role: "MEMBER" }
        ]
      }
    }
  });

  console.log("Creating demo tasks...");
  await Promise.all([
    prisma.task.create({
      data: {
        title: "Platform Audit",
        description: "Review production configurations and deployment workflows.",
        projectId: project.id,
        creatorId: adminUser.id,
        assigneeId: leadUser.id,
        status: "IN_PROGRESS",
        priority: "HIGH",
        order: 1,
        dueDate: dayjs().add(2, "day").toDate()
      }
    }),
    prisma.task.create({
      data: {
        title: "CI/CD Implementation",
        description: "Set up automated deployment pipelines for Railway.",
        projectId: project.id,
        creatorId: leadUser.id,
        assigneeId: taskerUser.id,
        status: "TODO",
        priority: "URGENT",
        order: 2,
        dueDate: dayjs().add(1, "day").toDate()
      }
    })
  ]);

  console.log("Database seeded successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed error:", error);
    await prisma.$disconnect();
    process.exit(1);
  });


