"use client";

import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /** Display as a compact circle (avatar), square, or rectangle */
  variant?: "rect" | "circle" | "square";
}

export function ImageUpload({
  value,
  onChange,
  placeholder = "Upload image",
  variant = "rect",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        onChange(json.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) upload(file);
  };

  const isCircle = variant === "circle";
  const isSquare = variant === "square";

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className="relative inline-block">
          <div
            className={`overflow-hidden ${
              isCircle
                ? "rounded-full w-28 h-28"
                : isSquare
                  ? "rounded-2xl w-32 h-32"
                  : "rounded-2xl w-full h-32"
            }`}
            style={{ backgroundColor: "rgba(45,74,62,0.06)" }}
          >
            <Image
              src={value}
              alt=""
              width={isCircle ? 112 : isSquare ? 128 : 560}
              height={isCircle ? 112 : isSquare ? 128 : 128}
              className={`object-cover ${
                isCircle ? "w-28 h-28" : isSquare ? "w-32 h-32" : "w-full h-32"
              }`}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-none cursor-pointer transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0" }}
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={`${isCircle || isSquare ? "inline-flex" : "w-full flex"} flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isCircle
              ? "rounded-full w-28 h-28"
              : isSquare
                ? "rounded-2xl w-32 h-32"
                : "rounded-2xl h-32"
          }`}
          style={{
            borderColor: dragOver ? "#2d4a3e" : "rgba(45,74,62,0.2)",
            backgroundColor: dragOver ? "rgba(45,74,62,0.06)" : "transparent",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" style={{ color: "#2d4a3e" }} />
          ) : (
            <>
              <Upload size={18} style={{ color: "#2d4a3e", opacity: 0.4 }} />
              <span
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: "rgba(45,74,62,0.4)" }}
              >
                {placeholder}
              </span>
              <span className="text-[10px]" style={{ color: "rgba(45,74,62,0.25)" }}>
                PNG, JPG, WebP &middot; max 5 MB
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ─── Multi-image variant ──────────────────────────────────────── */
interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  placeholder?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  max = 10,
  placeholder = "Upload screenshots",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (files: FileList) => {
      setError(null);
      setUploading(true);
      const newUrls: string[] = [];
      try {
        for (const file of Array.from(files).slice(0, max - value.length)) {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: form,
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Upload failed");
          newUrls.push(json.url);
        }
        onChange([...value, ...newUrls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        if (newUrls.length > 0) onChange([...value, ...newUrls]);
      } finally {
        setUploading(false);
      }
    },
    [onChange, value, max],
  );

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full max-w-lg">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {value.map((url, i) => (
            <div
              key={i}
              className="relative group rounded-xl overflow-hidden"
              style={{ aspectRatio: "16/9", backgroundColor: "rgba(45,74,62,0.06)" }}
            >
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0" }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 hover:border-[#2d4a3e]/40"
          style={{
            borderColor: "rgba(45,74,62,0.2)",
            backgroundColor: "transparent",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" style={{ color: "#2d4a3e" }} />
          ) : (
            <>
              <Upload size={14} style={{ color: "#2d4a3e", opacity: 0.4 }} />
              <span
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: "rgba(45,74,62,0.4)" }}
              >
                {placeholder} ({value.length}/{max})
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
