export const listingStatusValues = ["Draft", "Published"] as const;

export const listingSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const platformOptions = ["Android", "iOS", "macOS", "Windows", "Linux", "Web"] as const;

export type PlatformOption = (typeof platformOptions)[number];

export function getPlatformLabel(platform: string) {
  const normalizedPlatform = platform.trim().toLowerCase();

  return (
    platformOptions.find((option) => option.toLowerCase() === normalizedPlatform) ?? platform
  );
}

export function isValidListingSlug(slug: string) {
  return listingSlugPattern.test(slug);
}

export function generateListingSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const randomSuffix = Math.random().toString(36).slice(2, 7);

  return base ? `${base}-${randomSuffix}` : '';
}

export function isValidListingUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validatePlatformUrls(
  platforms: string[],
  urls: Record<string, string>,
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!platforms || platforms.length === 0) {
    errors.platforms = "Select at least one platform.";
    return { valid: false, errors };
  }

  for (const platform of platforms) {
    if (!platformOptions.includes(platform as PlatformOption)) {
      errors.platforms = `Invalid platform: ${platform}`;
      return { valid: false, errors };
    }

    const url = urls?.[platform.toLowerCase()];
    if (!url) {
      errors[platform] = `URL required for ${platform}`;
    } else if (!isValidListingUrl(url)) {
      errors[platform] = `Invalid URL for ${platform}`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateWebsiteUrl(url: string) {
  if (!url) {
    return { valid: true, error: null };
  }

  return isValidListingUrl(url)
    ? { valid: true, error: null }
    : { valid: false, error: "Invalid website URL." };
}

export const listingFieldRequirements = {
  name: "required",
  slug: "auto-generated, unique",
  platforms: "required, multi-select",
  website_url: "optional, valid url",
  urls: "required per selected platform, valid url",
  description: "optional",
  status: "Draft | Published",
  is_claimed: "defaults true",
} as const;
