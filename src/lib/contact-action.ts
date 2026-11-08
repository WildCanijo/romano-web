"use server";

import { headers } from "next/headers";
import { createContactSchema, readContactForm, toFieldErrors, type FieldErrors } from "@/lib/contact-schema";
import { deliverContactMessage } from "@/lib/contact-delivery";
import { clientIp, looksHuman, rateLimit } from "@/lib/form-guard";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export type ContactErrorReason = "not_configured" | "provider_error" | "rate_limited";

export type ContactResult =
  | { status: "success" }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "error"; reason: ContactErrorReason };

export async function submitContact(formData: FormData): Promise<ContactResult> {
  // 1. Invisible bot checks (see src/lib/form-guard.ts). Pretend it worked.
  if (!looksHuman(formData)) return { status: "success" };

  // 2. Rate limit per visitor.
  if (!rateLimit(clientIp(await headers()))) return { status: "error", reason: "rate_limited" };

  // 3. Validate the fields.
  const locale: Locale = formData.get("locale") === "es" ? "es" : "en";
  const schema = createContactSchema(getDictionary(locale).form.validation);
  const parsed = schema.safeParse(readContactForm(formData));
  if (!parsed.success) {
    return { status: "invalid", errors: toFieldErrors(parsed.error) };
  }

  // 4. Deliver.
  const result = await deliverContactMessage(parsed.data, locale);
  if (!result.ok) return { status: "error", reason: result.reason };
  return { status: "success" };
}
