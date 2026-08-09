import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// =============================================================================
// PRICING TABLES
// =============================================================================

export const houseTypes = pgTable("house_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  baseCostPerSqFt: numeric("base_cost_per_sq_ft", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customizationCategories = pgTable("customization_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customizationOptions = pgTable(
  "customization_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => customizationCategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    costModifier: numeric("cost_modifier", { precision: 10, scale: 2 }).notNull(),
    modifierType: text("modifier_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_options_category").on(table.categoryId)]
);

// =============================================================================
// PARISH TABLE (regional cost multipliers)
// =============================================================================

export const parishes = pgTable("parishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  costMultiplier: numeric("cost_multiplier", { precision: 5, scale: 3 }).notNull().default("1.000"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// LEAD & PARTNER TABLES
// =============================================================================

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactValue: text("contact_value").notNull(),
    contactType: text("contact_type").notNull(),
    houseTypeId: uuid("house_type_id")
      .notNull()
      .references(() => houseTypes.id),
    totalSquareFootage: integer("total_square_footage").notNull(),
    parishId: uuid("parish_id").references(() => parishes.id),
    finalEstimatedCost: numeric("final_estimated_cost", { precision: 12, scale: 2 }).notNull(),
    consentToSharePartners: boolean("consent_to_share_partners").notNull().default(false),
    ipAddress: text("ip_address"),
    country: text("country"),
    isLocal: boolean("is_local"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_leads_house_type").on(table.houseTypeId),
    index("idx_leads_created").on(table.createdAt),
    index("idx_leads_parish").on(table.parishId),
  ]
);

export const leadCustomizations = pgTable(
  "lead_customizations",
  {
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => customizationOptions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.leadId, table.optionId] }),
    index("idx_lead_customizations_lead").on(table.leadId),
  ]
);

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  partnerType: text("partner_type"),
  contactEmail: text("contact_email"),
  webhookUrl: text("webhook_url"),
  parishesServed: text("parishes_served").array().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leadDistributions = pgTable(
  "lead_distributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_lead_distributions_lead").on(table.leadId),
    index("idx_lead_distributions_partner").on(table.partnerId),
    index("idx_lead_distributions_status").on(table.status),
  ]
);

// =============================================================================
// BLOG TABLE
// =============================================================================

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverImage: text("cover_image"),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    authorEmail: text("author_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_blog_slug").on(table.slug),
    index("idx_blog_published").on(table.isPublished, table.publishedAt),
  ]
);

// =============================================================================
// ADS TABLE
// =============================================================================

export const ads = pgTable(
  "ads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    adType: text("ad_type").notNull().default("local"),
    targetUrl: text("target_url"),
    targetPages: text("target_pages").array().notNull().default([]),
    sponsorParishIds: text("sponsor_parish_ids").array().notNull().default([]),
    sponsorName: text("sponsor_name"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
    endDate: timestamp("end_date", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ads_active").on(table.isActive, table.startDate, table.endDate),
    index("idx_ads_type").on(table.adType),
  ]
);

// =============================================================================
// ESTIMATE SHARE LINKS
// =============================================================================

export const estimateShares = pgTable(
  "estimate_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    estimateData: text("estimate_data").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_estimate_shares_token").on(table.token),
    index("idx_estimate_shares_expires").on(table.expiresAt),
  ]
);

// =============================================================================
// WORKSPACE SETTINGS
// =============================================================================

export const workspaceSettings = pgTable("workspace_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// CONSULTATION & WORKSPACE TABLES
// =============================================================================

export const consultationRequests = pgTable(
  "consultation_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    siteAddress: text("site_address").notNull(),
    preferredDate: timestamp("preferred_date", { withTimezone: true }),
    notes: text("notes"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    meetingStatus: text("meeting_status").notNull().default("requested"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_consultations_lead").on(table.leadId),
    index("idx_consultations_payment").on(table.paymentStatus),
    index("idx_consultations_meeting").on(table.meetingStatus),
  ]
);

export const workspaceUsers = pgTable(
  "workspace_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_workspace_users_email").on(table.email)]
);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Parish = typeof parishes.$inferSelect;
export type HouseType = typeof houseTypes.$inferSelect;
export type NewHouseType = typeof houseTypes.$inferInsert;
export type CustomizationCategory = typeof customizationCategories.$inferSelect;
export type CustomizationOption = typeof customizationOptions.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Partner = typeof partners.$inferSelect;
export type LeadDistribution = typeof leadDistributions.$inferSelect;
export type ConsultationRequest = typeof consultationRequests.$inferSelect;
export type NewConsultationRequest = typeof consultationRequests.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type WorkspaceUser = typeof workspaceUsers.$inferSelect;
export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;
export type EstimateShare = typeof estimateShares.$inferSelect;
export type WorkspaceSetting = typeof workspaceSettings.$inferSelect;
