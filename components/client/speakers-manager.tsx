"use client";

import { Pencil, Plus, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addSpeakerAction, removeSpeakerAction, updateSpeakerAction } from "@/lib/actions";
import type { StoredSpeaker } from "@/lib/data-mappers";

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

  const inputStyle = {
    background: "rgba(15,44,35,0.04)",
    border: "1px solid rgba(15,44,35,0.12)",
    color: "#2d4a3e",
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: "rgba(15,44,35,0.1)", background: "white" }}
        >
          <h3 className="mb-3 text-sm font-medium" style={{ color: "#2d4a3e" }}>
            Add Speaker
          </h3>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Speaker name"
              className="flex-1 rounded-xl px-3 py-2 text-sm"
              style={inputStyle}
            />
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="flex-1 rounded-xl px-3 py-2 text-sm"
              style={inputStyle}
            />
            <button
              onClick={handleAdd}
              disabled={isPending || !name.trim()}
              className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
              style={{ background: "#2d4a3e", color: "#f0ebe0" }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}

      <div className="space-y-2">
        {speakers.length === 0 && (
          <p className="text-sm opacity-50" style={{ color: "#2d4a3e" }}>
            No speakers added yet.
          </p>
        )}
        {speakers.map((speaker) => (
          <div
            key={speaker.id}
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: "rgba(15,44,35,0.08)", background: "white" }}
          >
            {speaker.image_url ? (
              <img
                src={speaker.image_url}
                alt={speaker.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "rgba(15,44,35,0.06)" }}
              >
                <User size={16} style={{ color: "#2d4a3e", opacity: 0.4 }} />
              </div>
            )}

            {editingId === speaker.id ? (
              <div className="flex flex-1 gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-lg px-2 py-1 text-sm"
                  style={inputStyle}
                />
                <input
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1 rounded-lg px-2 py-1 text-sm"
                  style={inputStyle}
                />
                <button
                  onClick={() => handleUpdate(speaker.id)}
                  disabled={isPending}
                  className="rounded-lg px-3 py-1 text-xs font-medium"
                  style={{ background: "#2d4a3e", color: "#f0ebe0" }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-lg px-3 py-1 text-xs"
                  style={{ color: "#2d4a3e" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium" style={{ color: "#2d4a3e" }}>
                  {speaker.name}
                </span>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(speaker)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
                    >
                      <Pencil size={14} style={{ color: "#2d4a3e" }} />
                    </button>
                    <button
                      onClick={() => handleRemove(speaker.id)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
