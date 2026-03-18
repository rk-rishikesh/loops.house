"use client";

import { Pencil, Plus, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addSpeakerAction, removeSpeakerAction, updateSpeakerAction } from "@/lib/actions";
import type { StoredSpeaker } from "@/lib/data-mappers";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

interface Props {
  hackathonId: string;
  speakers: StoredSpeaker[];
  canEdit: boolean;
}

export function SpeakersManager({ hackathonId, speakers, canEdit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addSpeakerAction({
        hackathon_id: hackathonId,
        name: name.trim(),
        image_url: imageUrl.trim() || undefined,
      });
      if (result.success) {
        setName("");
        setImageUrl("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleRemove = (speakerId: string) => {
    startTransition(async () => {
      await removeSpeakerAction(speakerId, hackathonId);
      router.refresh();
    });
  };

  const handleUpdate = (speakerId: string) => {
    startTransition(async () => {
      const result = await updateSpeakerAction({
        id: speakerId,
        name: editName.trim() || undefined,
        image_url: editImageUrl.trim() || null,
      });
      if (result.success) {
        setEditingId(null);
        router.refresh();
      }
    });
  };

  const startEdit = (speaker: StoredSpeaker) => {
    setEditingId(speaker.id);
    setEditName(speaker.name);
    setEditImageUrl(speaker.image_url ?? "");
  };

  return (
    
    <div className="px-10 pt-10 pb-24">

      {/* ── Two-column body ───────────────────────────────────────────── */}
      <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* LEFT */}
        <div className="flex flex-col gap-10">
          {/* Step 01 — Add speaker */}
          <div>
            <div className="flex items-baseline gap-3 mb-5">
              <span
                className="font-black text-[#0F2C23]/18"
                style={{ fontFamily: FN, fontSize: 32, letterSpacing: "-0.025em" }}
              >
                01
              </span>
              <p
                className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40"
                style={{ fontFamily: FN }}
              >
                Add Speaker
              </p>
            </div>

            {canEdit ? (
              <>
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <p
                      className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/40 mb-2"
                      style={{ fontFamily: FN }}
                    >
                      Speaker Name
                    </p>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30"
                      style={{
                        backgroundColor: "#E2FEA5",
                        border: "none",
                        color: "#0F2C23",
                        fontFamily: FN,
                      }}
                      onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                      onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/40 mb-2"
                      style={{ fontFamily: FN }}
                    >
                      Image URL (optional)
                    </p>
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors placeholder-[#0F2C23]/30"
                      style={{
                        backgroundColor: "#E2FEA5",
                        border: "none",
                        color: "#0F2C23",
                        fontFamily: FN,
                      }}
                      onFocus={(e) => (e.currentTarget.style.backgroundColor = "#CBE595")}
                      onBlur={(e) => (e.currentTarget.style.backgroundColor = "#E2FEA5")}
                    />
                  </div>
                  <div className="mt-1">
                    <button
                      onClick={handleAdd}
                      disabled={isPending || !name.trim()}
                      className="inline-flex items-center gap-2 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-40 pl-5 pr-4 py-3.5 text-[9px] tracking-[0.15em] uppercase font-bold text-[#F8FFE8]"
                      style={{ backgroundColor: "#0F2C23", fontFamily: FN }}
                    >
                      <Plus size={12} />
                      {isPending ? "Adding..." : "Add Speaker"}
                    </button>
                  </div>
                </div>
                {error && (
                  <div
                    className="mt-4 flex items-start gap-3 rounded-2xl px-5 py-4"
                    style={{
                      backgroundColor: "rgba(200,60,60,0.07)",
                      border: "1px solid rgba(200,60,60,0.15)",
                    }}
                  >
                    <p className="text-sm text-red-700" style={{ fontFamily: FN }}>
                      {error}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}>
                This hackathon is finalized. Speakers can no longer be edited.
              </p>
            )}
          </div>

          {/* Step 02 — Current speakers table */}
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <div className="flex items-baseline gap-3">
                <span
                  className="font-black text-[#0F2C23]/18"
                  style={{ fontFamily: FN, fontSize: 32, letterSpacing: "-0.025em" }}
                >
                  02
                </span>
                <p
                  className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40"
                  style={{ fontFamily: FN }}
                >
                  Current Speakers
                </p>
              </div>
              {speakers.length > 0 && (
                <span
                  className="text-[10px] tracking-widest uppercase font-bold text-[#0F2C23]/30"
                  style={{ fontFamily: FN }}
                >
                  {speakers.length} speaker{speakers.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Table header */}
            <div
              className="grid border-b border-t border-[#0F2C23]/20 py-3"
              style={{ gridTemplateColumns: "64px 1fr 100px", gap: "0 20px" }}
            >
              {["No.", "Speaker", canEdit ? "Actions" : ""].map((col) => (
                <p
                  key={col}
                  className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#0F2C23]/40"
                  style={{ fontFamily: FN }}
                >
                  {col}
                </p>
              ))}
            </div>

            {/* Rows */}
            {speakers.length === 0 ? (
              <div className="py-20 text-center border-b border-[#0F2C23]/12">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                  style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23" }}
                >
                  <User size={20} />
                </div>
                <p
                  className="font-black text-[#0F2C23] uppercase mb-2"
                  style={{ fontFamily: PX, fontSize: 16, letterSpacing: "-0.02em" }}
                >
                  No speakers yet.
                </p>
                <p className="text-[#0F2C23]/50 text-sm" style={{ fontFamily: FN }}>
                  Add your first speaker using the form above.
                </p>
              </div>
            ) : (
              speakers.map((speaker, idx) => (
                <div
                  key={speaker.id}
                  className="grid items-center py-6 border-b border-[#0F2C23]/10 transition-all duration-150 hover:bg-[#0F2C23]/[0.02] rounded-sm"
                  style={{ gridTemplateColumns: "64px 1fr 100px", gap: "0 20px" }}
                >
                  <p className="font-bold text-[#0F2C23]" style={{ fontFamily: FN, fontSize: 14 }}>
                    {String(idx + 1).padStart(2, "0")}.
                  </p>

                  {editingId === speaker.id ? (
                    <div className="flex flex-1 gap-2 items-center col-span-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
                        style={{
                          backgroundColor: "#E2FEA5",
                          border: "none",
                          color: "#0F2C23",
                          fontFamily: FN,
                        }}
                      />
                      <input
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        placeholder="Image URL"
                        className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
                        style={{
                          backgroundColor: "#E2FEA5",
                          border: "none",
                          color: "#0F2C23",
                          fontFamily: FN,
                        }}
                      />
                      <button
                        onClick={() => handleUpdate(speaker.id)}
                        disabled={isPending}
                        className="rounded-full px-4 py-2 text-[9px] font-bold tracking-[0.16em] uppercase"
                        style={{
                          backgroundColor: "#0F2C23",
                          color: "#E2FEA5",
                          fontFamily: PX,
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-full px-3 py-2 text-[10px]"
                        style={{ color: "rgba(15,44,35,0.7)", fontFamily: FN }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        {speaker.image_url ? (
                          <img
                            src={speaker.image_url}
                            alt={speaker.name}
                            className="h-10 w-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                            style={{ background: "rgba(15,44,35,0.06)" }}
                          >
                            <User size={16} style={{ color: "#0F2C23", opacity: 0.4 }} />
                          </div>
                        )}
                        <span
                          className="text-[#0F2C23]/80 text-sm truncate"
                          style={{ fontFamily: FN }}
                        >
                          {speaker.name}
                        </span>
                      </div>
                      {canEdit ? (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => startEdit(speaker)}
                            className="rounded-full p-2 transition-colors hover:bg-[rgba(15,44,35,0.06)]"
                          >
                            <Pencil size={14} style={{ color: "#0F2C23" }} />
                          </button>
                          <button
                            onClick={() => handleRemove(speaker.id)}
                            disabled={isPending}
                            className="rounded-full p-2 transition-colors hover:bg-red-50"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <div />
                      )}
                    </>
                  )}
                </div>
              ))
            )}

            {/* Footer strip */}
            {speakers.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#0F2C23]/8">
                <p className="text-[11px] text-[#0F2C23]/40" style={{ fontFamily: FN }}>
                  {speakers.length} speaker{speakers.length !== 1 ? "s" : ""} listed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT sidebar */}
        <aside className="sticky top-[81px] flex flex-col gap-4">
          {/* Status card */}
          <div className="rounded-3xl p-7" style={{ backgroundColor: "rgba(15,44,35,0.04)" }}>
            <p
              className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-5"
              style={{ fontFamily: FN }}
            >
              Status
            </p>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "Total speakers",
                  value: speakers.length > 0 ? `${speakers.length} listed` : "None yet",
                  done: speakers.length > 0,
                },
                {
                  label: "With photo",
                  value: `${speakers.filter((s) => s.image_url).length} of ${speakers.length}`,
                  done:
                    speakers.filter((s) => s.image_url).length === speakers.length &&
                    speakers.length > 0,
                },
              ].map(({ label, value, done }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 py-3 border-b border-[#0F2C23]/08"
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: done ? "#0F2C23" : "rgba(15,44,35,0.1)",
                    }}
                  >
                    {done && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "#F8FFE8" }}
                      />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[9px] tracking-[0.14em] uppercase font-bold text-[#0F2C23]/38"
                      style={{ fontFamily: FN }}
                    >
                      {label}
                    </p>
                    <p className="text-sm text-[#0F2C23]/65 truncate" style={{ fontFamily: FN }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#E2FEA5" }}>
            <p
              className="text-[15px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-4"
              style={{ fontFamily: FN }}
            >
              How it works
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  n: "01",
                  t: "Add each speaker with their name and an optional avatar image URL.",
                },
                {
                  n: "02",
                  t: "Speakers will appear on the public hackathon page for builders to see.",
                },
                {
                  n: "03",
                  t: "You can update or remove speakers at any time while the program is editable.",
                },
              ].map(({ n, t }) => (
                <div key={n} className="flex items-start gap-3">
                  <span
                    className="font-black text-[#0F2C23]/20 leading-none shrink-0 mt-0.5"
                    style={{ fontFamily: FN, fontSize: 11, width: 20 }}
                  >
                    {n}
                  </span>
                  <p
                    className="text-xs text-[#0F2C23]/60 leading-relaxed"
                    style={{ fontFamily: FN }}
                  >
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
