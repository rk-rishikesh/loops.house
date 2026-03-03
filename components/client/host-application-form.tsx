"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hostApplicationCreateSchema } from "@/lib/validations/schemas";
import { submitHostApplicationAction } from "@/lib/actions";
import type { z } from "zod";

type HostApplicationFormData = z.infer<typeof hostApplicationCreateSchema>;

export function HostApplicationForm() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HostApplicationFormData>({
    resolver: zodResolver(hostApplicationCreateSchema),
    defaultValues: {
      booster_type: "idea",
    },
  });

  function onSubmit(data: HostApplicationFormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitHostApplicationAction(data);
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
            Application Submitted
          </h2>
          <p className="text-green-700 dark:text-green-300 text-sm">
            Your host application has been submitted for review. You&apos;ll be notified once an admin approves it.
          </p>
          <Link
            href="/host"
            className="mt-4 inline-block text-sm text-amber-600 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/builder" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 inline-block">
          &larr; Back
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Apply to Host a Booster
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          Submit your application to become a Booster Host. An admin will review and approve your request.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Booster Type
            </label>
            <select
              {...register("booster_type")}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            >
              <option value="idea">Idea Booster</option>
              <option value="momentum">Momentum Booster</option>
              <option value="capital">Capital Booster</option>
            </select>
            {errors.booster_type && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.booster_type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              {...register("event_name")}
              placeholder="e.g., AI Builders Sprint 2026"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            {errors.event_name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.event_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Expected Participants
            </label>
            <input
              type="number"
              {...register("expected_participants", { valueAsNumber: true })}
              placeholder="e.g., 50"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            {errors.expected_participants && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.expected_participants.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Contact Info
            </label>
            <input
              type="text"
              {...register("contact")}
              placeholder="Email or social link"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            {errors.contact && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.contact.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={5}
              {...register("description")}
              placeholder="Tell us about the event you want to host, its goals, target audience, and prize structure..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
