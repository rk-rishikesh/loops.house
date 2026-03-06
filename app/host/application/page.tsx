import { getServerAuth } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { HostApplicationForm } from "@/components/client/host-application-form";

export default async function HostApplicationPage() {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login?redirect=/host/application");
  }

  return <HostApplicationForm userId={auth.userId} />;
}

