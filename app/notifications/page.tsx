import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getPendingInvitationsServer } from "@/lib/server-data";
import { NotificationsList } from "./notifications-list";

export default async function NotificationsPage() {
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/notifications");

  const invitations = await getPendingInvitationsServer(auth.email);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      <div className="px-10 pt-16 pb-24">
        {/* Hero heading */}
        <div className="mb-16">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(46px, 8vw, 120px)",
              letterSpacing: "-0.025em",
            }}
          >
            Notifications
          </h1>
          <div className="flex justify-end mt-6">
            <p
              className="text-[#2d4a3e]/55 max-w-[420px] text-right leading-relaxed"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(14px, 1.5vw, 18px)",
              }}
            >
              Pending invitations and updates. Accept or decline to manage your roles.
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <NotificationsList invitations={invitations} />
        </div>
      </div>
    </div>
  );
}
