import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Set roshan.manuel@gmail.com as SUPER_ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: "roshan.manuel@gmail.com" },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: "roshan.manuel@gmail.com",
      name: "Roshan Manuel",
      role: "SUPER_ADMIN",
    },
  })

  console.log(`Super Admin set: ${superAdmin.email} (${superAdmin.role})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
