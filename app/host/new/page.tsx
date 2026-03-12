import { redirect } from "next/navigation";
import { HostApplicationForm } from "@/components/client/host-application-form";
import { getServerAuth } from "@/lib/server-auth";

export default async function HostApplicationPage() {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login?redirect=/host/new");
  }

  return <HostApplicationForm userId={auth.userId} />;
}
