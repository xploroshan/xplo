import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { resolveTenant, tenantOwnerAccess } from "@/lib/tenant"
import { BlogManager } from "@/components/site/blog-manager"

export const metadata = { title: "Manage blog" }

export default async function ManageBlog({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) notFound()
  const session = await auth()
  if (!(await tenantOwnerAccess(tenant, session?.user?.id, session?.user?.role))) notFound()

  return <BlogManager subdomain={tenant.subdomain} />
}
