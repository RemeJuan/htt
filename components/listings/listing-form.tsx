"use client";

import { useActionState, useCallback, useMemo, useState } from "react";

import type { ListingRow } from "@/lib/database.types";
import {
  generateListingSlug,
  listingStatusValues,
  platformOptions,
} from "@/lib/listing-validation";

export type ListingActionState = {
  errors: Partial<
    Record<"name" | "slug" | "platforms" | "website_url" | "description" | "status", string> &
      Record<string, string>
  >;
  message?: string;
};

type ListingFormAction = (
  state: ListingActionState,
  formData: FormData,
) => Promise<ListingActionState>;

type ListingFormProps = {
  action: ListingFormAction;
  listing?: ListingRow & {
    website_url?: string | null;
  };
  submitLabel: string;
};

const initialState: ListingActionState = { errors: {} };

export function ListingForm({ action, listing, submitLabel }: ListingFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEditing = !!listing;

  const initialSelectedPlatforms = useMemo(
    () =>
      listing?.platforms?.filter((platform) =>
        platformOptions.includes(platform as (typeof platformOptions)[number]),
      ) ?? [],
    [listing],
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialSelectedPlatforms);
  const [nameValue, setNameValue] = useState(listing?.name ?? "");
  const [slugValue, setSlugValue] = useState(listing?.slug ?? "");
  const [platformsOpen, setPlatformsOpen] = useState(false);
  const [platformUrlValues, setPlatformUrlValues] = useState<Record<string, string>>(() =>
    platformOptions.reduce<Record<string, string>>((acc, platform) => {
      const platformKey = platform.toLowerCase();
      acc[platformKey] = listing?.urls?.[platformKey] ?? "";
      return acc;
    }, {}),
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextName = e.target.value;
      setNameValue(nextName);

      if (!isEditing) {
        setSlugValue(generateListingSlug(nextName));
      }
    },
    [isEditing],
  );

  const handlePlatformToggle = useCallback((platform: string) => {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }, []);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      {state.message ? (
        <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" error={state.errors.name}>
          <input
            name="name"
            value={nameValue}
            required
            aria-label="Name"
            className={inputClassName}
            onChange={handleNameChange}
          />
        </Field>

        <Field label="Slug" error={state.errors.slug}>
          <input
            name="slug"
            value={slugValue}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            readOnly
            aria-label="Slug"
            className={`${inputClassName} bg-muted/50`}
          />
        </Field>

        <Field label="Platforms" error={state.errors.platforms}>
          <input
            tabIndex={-1}
            aria-hidden="true"
            required
            value={selectedPlatforms.join(",")}
            onChange={() => {}}
            className="sr-only"
          />
          <div className="relative">
            <button
              type="button"
              aria-label="Platforms"
              aria-haspopup="menu"
              aria-expanded={platformsOpen}
              onClick={() => setPlatformsOpen((current) => !current)}
              className={`${inputClassName} flex items-center justify-between gap-3 text-left`}
            >
              <span
                className={selectedPlatforms.length ? "text-foreground" : "text-muted-foreground"}
              >
                {selectedPlatforms.length ? selectedPlatforms.join(", ") : "Choose platforms"}
              </span>
              <span aria-hidden="true" className="text-muted-foreground">
                ▾
              </span>
            </button>

            {platformsOpen ? (
              <div
                role="menu"
                aria-label="Platforms"
                className="absolute z-10 mt-2 w-full rounded-xl border border-border bg-card p-2 shadow-lg"
              >
                {platformOptions.map((platform) => {
                  const checked = selectedPlatforms.includes(platform);

                  return (
                    <button
                      key={platform}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={checked}
                      onClick={() => handlePlatformToggle(platform)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                    >
                      <span>{platform}</span>
                      <span aria-hidden="true" className="text-muted-foreground">
                        {checked ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          {selectedPlatforms.map((platform) => (
            <input key={platform} type="hidden" name="platforms" value={platform} />
          ))}
        </Field>

        <Field label="Status" error={state.errors.status}>
          <select
            name="status"
            defaultValue={listing?.status ?? listingStatusValues[0]}
            aria-label="Status"
            className={inputClassName}
          >
            {listingStatusValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Website URL" error={state.errors.website_url} className="md:col-span-2">
          <input
            name="website_url"
            type="url"
            defaultValue={listing?.website_url ?? ""}
            placeholder="Company website"
            aria-label="Website URL"
            className={inputClassName}
          />
        </Field>

        {selectedPlatforms.length > 0 ? (
          <div className="md:col-span-2 space-y-3">
            <span className="text-sm font-medium text-foreground">Platform URLs</span>
            <div className="grid gap-4">
              {selectedPlatforms.map((platform) => {
                const platformKey = platform.toLowerCase();
                const platformError = state.errors[platform];

                return (
                  <Field key={platform} label={`${platform} URL`} error={platformError}>
                    <input
                      name={`url_${platformKey}`}
                      type="url"
                      value={platformUrlValues[platformKey] ?? ""}
                      onChange={(event) =>
                        setPlatformUrlValues((current) => ({
                          ...current,
                          [platformKey]: event.target.value,
                        }))
                      }
                      placeholder={`Enter URL for ${platform}`}
                      aria-label={`${platform} URL`}
                      className={inputClassName}
                    />
                  </Field>
                );
              })}
            </div>
          </div>
        ) : null}

        <Field label="Description" error={state.errors.description} className="md:col-span-2">
          <textarea
            name="description"
            defaultValue={listing?.description ?? ""}
            rows={5}
            aria-label="Description"
            className={`${inputClassName} min-h-28 py-3`}
          />
        </Field>

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
          className="inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`.trim()}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-background px-3 outline-none transition focus:border-foreground";
