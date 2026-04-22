"use client";

import { useActionState } from "react";

import type { ListingRow } from "@/lib/database.types";
import { listingStatusValues } from "@/lib/listing-validation";

export type ListingActionState = {
  errors: Partial<Record<"name" | "slug" | "platform" | "url" | "description" | "status", string>>;
  message?: string;
};

type ListingFormAction = (
  state: ListingActionState,
  formData: FormData,
) => Promise<ListingActionState>;

type ListingFormProps = {
  action: ListingFormAction;
  listing?: ListingRow;
  submitLabel: string;
};

const initialState: ListingActionState = { errors: {} };

export function ListingForm({ action, listing, submitLabel }: ListingFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-card p-6">
      {state.message ? (
        <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" error={state.errors.name}>
          <input name="name" defaultValue={listing?.name ?? ""} required className={inputClassName} />
        </Field>

        <Field label="Slug" error={state.errors.slug}>
          <input
            name="slug"
            defaultValue={listing?.slug ?? ""}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className={inputClassName}
          />
        </Field>

        <Field label="Platform" error={state.errors.platform}>
          <input name="platform" defaultValue={listing?.platform ?? ""} required className={inputClassName} />
        </Field>

        <Field label="Status" error={state.errors.status}>
          <select name="status" defaultValue={listing?.status ?? listingStatusValues[0]} className={inputClassName}>
            {listingStatusValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>

        <div className="md:col-span-2">
          <Field label="URL" error={state.errors.url}>
            <input
              name="url"
              type="url"
              defaultValue={listing?.url ?? ""}
              required
              className={inputClassName}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Description" error={state.errors.description}>
            <textarea
              name="description"
              defaultValue={listing?.description ?? ""}
              rows={5}
              className={`${inputClassName} min-h-28 py-3`}
            />
          </Field>
        </div>

        <label className="flex items-center gap-3 text-sm text-foreground md:col-span-2">
          <input
            name="is_claimed"
            type="checkbox"
            defaultChecked={listing?.is_claimed ?? true}
            className="size-4 rounded border-border"
          />
          Claimed listing
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </label>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-background px-3 outline-none transition focus:border-foreground";
