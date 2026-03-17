import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getPendingInvitationsServer } from "@/lib/server-data";
import { NotificationsList } from "./notifications-list";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

export default async function NotificationsPage() {
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/notifications");

  const invitations = await getPendingInvitationsServer(auth.email);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-7 pt-10 pb-20">
        {/* Hero heading */}
        <div className="mb-14 flex flex-row items-end justify-between gap-6">
          <h1
            className="font-black text-[#0F2C23] leading-[0.9] uppercase"
            style={{
              fontFamily: PX,
              fontSize: "clamp(40px, 7vw, 90px)",
              letterSpacing: "-0.025em",
            }}
          >
            Notifications
          </h1>
          <p
            className="text-[#0F2C23]/55 max-w-[420px] text-right leading-relaxed"
            style={{
              fontFamily: FN,
              fontSize: "clamp(14px, 1.4vw, 17px)",
            }}
          >
            Pending invitations and updates. Accept or decline to manage your roles.
          </p>
        </div>

        <div className="flex flex-col justify-start max-w-2xl min-h-[50vh]">
          <NotificationsList invitations={invitations} />
        </div>
      </div>
    </div>
  );
}
