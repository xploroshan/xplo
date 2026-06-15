import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { resolveTenant, tenantOwnerAccess } from "@/lib/tenant"
import { GuidelineManager } from "@/components/site/guideline-manager"

export const metadata = { title: "Manage guidelines" }

export default async function ManageGuidelines({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) notFound()
  const session = await auth()
  if (!(await tenantOwnerAccess(tenant, session?.user?.id, session?.user?.role))) notFound()

  return <GuidelineManager subdomain={tenant.subdomain} />
}
