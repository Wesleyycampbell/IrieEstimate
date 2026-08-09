import { z } from "zod";

const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;

export const leadSchema = z
  .object({
    contactValue: z.string().min(1, "Contact is required"),
    contactType: z.enum(["email", "phone"]),
    houseTypeId: z.string().uuid("Invalid house type"),
    parishId: z.string().uuid("Invalid parish").optional(),
    totalSquareFootage: z
      .number()
      .int()
      .positive("Square footage must be positive")
      .max(50000, "Square footage seems too large"),
    selectedOptionIds: z.array(z.string().uuid()).default([]),
    consentToSharePartners: z.literal(true, "You must consent to share with partners"),
  })
  .refine(
    (data) => {
      if (data.contactType === "email") {
        return z.string().email().safeParse(data.contactValue).success;
      }
      return phoneRegex.test(data.contactValue);
    },
    {
      message: "Please enter a valid email address or phone number",
      path: ["contactValue"],
    }
  );

export type LeadInput = z.infer<typeof leadSchema>;
