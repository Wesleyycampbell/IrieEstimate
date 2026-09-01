import { z } from "zod";

const phoneRegex = /^\+?1?[-.\s]?\(?(?:876|658)\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
const intlPhoneRegex = /^\+\d{1,3}[-.\s]?\d{4,14}$/;

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  return phoneRegex.test(value) || intlPhoneRegex.test(value);
}

function stripHtmlTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

export const leadSchema = z
  .object({
    contactValue: z.string().min(1, "Contact is required").max(200),
    contactType: z.enum(["email", "phone"]),
    houseTypeId: z.string().uuid("Invalid house type"),
    parishId: z.string().uuid("Invalid parish").optional(),
    totalSquareFootage: z
      .number()
      .int()
      .positive("Square footage must be positive")
      .max(50000, "Square footage seems too large"),
    selectedOptionIds: z.array(z.string().uuid()).max(20).default([]),
    consentToSharePartners: z.literal(true, "You must consent to share with partners"),
  })
  .refine(
    (data) => {
      if (data.contactType === "email") {
        return z.string().email().safeParse(data.contactValue).success;
      }
      return isValidPhone(data.contactValue);
    },
    {
      message: "Please enter a valid email address or phone number",
      path: ["contactValue"],
    }
  );

export type LeadInput = z.infer<typeof leadSchema>;

export const consultationSchema = z.object({
  leadId: z.string().uuid(),
  siteAddress: z
    .string()
    .min(5, "Site address is required")
    .max(500)
    .transform(stripHtmlTags),
  preferredDate: z.string().optional(),
  notes: z
    .string()
    .max(2000)
    .transform(stripHtmlTags)
    .optional(),
});
