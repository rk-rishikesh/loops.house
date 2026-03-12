"use client";

import { useTransition } from "react";
import { respondToInvitationAction } from "@/lib/actions";
import { Bell, Users, Gavel, FolderOpen, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Invitation = {
  id: string;
  type: string;
  email: string;
  status: string;
  hackathon_id: string | null;
  project_id: string | null;
  created_at: string;
  users: { email: string; display_name: string | null } | null;
};

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  event_host: { label: "Event Host Invitations", icon: Crown, color: "#b8860b" },
  cohost: { label: "Co-host Invitations", icon: Users, color: "#2d6a9f" },
  judge: { label: "Judge Invitations", icon: Gavel, color: "#7c3aed" },
  project_member: { label: "Project Member Invitations", icon: FolderOpen, color: "#2d4a3e" },
};

function InvitationCard({ invitation }: { invitation: Invitation }) {
  const [pending, startTransition] = useTransition();

  function respond(accept: boolean) {
    startTransition(async () => {
      const result = await respondToInvitationAction({
        invitation_id: invitation.id,
        accept,
      });
      if (!result.success) {
        alert(result.error);
        return;
      }
      // Force full page reload to pick up new capabilities cookies
      window.location.reload();
    });
  }

  const inviterName =
    invitation.users?.display_name || invitation.users?.email || "Someone";
  const date = new Date(invitation.created_at).toLocaleDateString();

  return (
    <div
      className="flex items-center justify-between rounded-2xl px-5 py-4"
      style={{ backgroundColor: "rgba(45,74,62,0.06)" }}
    >
      <div className="flex flex-col gap-0.5">
        <span
          className="text-sm font-medium"
          style={{ color: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}
        >
          {inviterName} invited you
        </span>
        <span
          className="text-xs"
          style={{ color: "#2d4a3e", opacity: 0.45, fontFamily: "Georgia, serif" }}
        >
          {date}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(true)}
          className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide border-none cursor-pointer disabled:opacity-50 transition-colors"
          style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0" }}
        >
          Accept
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(false)}
          className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide border cursor-pointer disabled:opacity-50 transition-colors"
          style={{
            backgroundColor: "transparent",
            borderColor: "rgba(45,74,62,0.2)",
            color: "#2d4a3e",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export function NotificationsList({
  invitations,
}: {
  invitations: Invitation[];
}) {
  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2"
          style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}
        >
          <Bell size={24} />
        </div>
        <p
          className="font-black text-[#2d4a3e] uppercase"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(18px, 2.5vw, 28px)",
            letterSpacing: "-0.02em",
          }}
        >
          All caught up.
        </p>
        <p
          className="text-[#2d4a3e]/50 leading-relaxed"
          style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
        >
          No pending invitations or notifications.
        </p>
      </div>
    );
  }

  // Group by type, only show groups that have invitations
  const grouped = invitations.reduce<Record<string, Invitation[]>>(
    (acc, inv) => {
      (acc[inv.type] ??= []).push(inv);
      return acc;
    },
    {},
  );

  const typeOrder = ["event_host", "cohost", "judge", "project_member"];

  return (
    <div className="flex flex-col gap-8">
      {typeOrder
        .filter((type) => grouped[type]?.length)
        .map((type) => {
          const config = TYPE_CONFIG[type] ?? {
            label: type,
            icon: Bell,
            color: "#2d4a3e",
          };
          const Icon = config.icon;
          return (
            <div key={type} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} style={{ color: config.color }} />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: config.color, fontFamily: "'Inter', sans-serif" }}
                >
                  {config.label}
                </span>
              </div>
              {grouped[type].map((inv) => (
                <InvitationCard key={inv.id} invitation={inv} />
              ))}
            </div>
          );
        })}
    </div>
  );
}
