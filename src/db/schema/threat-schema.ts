import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

export const threatFeeds = sqliteTable("threat_feeds", {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    type: text('type').$type<"otx" | "misp" | "abuseipdb" | "urlhaus" | "twitter" | "honeypot" | "custom">().notNull(),
    url: text('url'),
    apiKey: text('api_key'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    lastSync: integer('last_sync', { mode: 'timestamp' }),
    syncInterval: integer('sync_interval').default(3600), // seconds
    config: text('config'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const iocs = sqliteTable("iocs", {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    type: text('type').$type<"ip" | "domain" | "url" | "hash" | "email" | "file">().notNull(),
    value: text('value').notNull(),
    description: text('description'),
    confidence: real('confidence').default(50.00),
    severity: text('severity').$type<"low" | "medium" | "high" | "critical">().default('medium'),
    tags: text('tags'),
    sources: text('sources'),
    firstSeen: integer('first_seen', { mode: 'timestamp' }).notNull(),
    lastSeen: integer('last_seen', { mode: 'timestamp' }).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    metadata: text('metadata'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const threatCampaigns = sqliteTable("threat_campaigns", {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    description: text('description'),
    actor: text('actor'),
    family: text('family'),
    techniques: text('techniques'), // MITRE ATT&CK techniques
    targetSectors: text('target_sectors'),
    severity: text('severity').$type<"low" | "medium" | "high" | "critical">().default('medium'),
    confidence: real('confidence').default(50.00),
    status: text('status').$type<"active" | "inactive" | "monitoring">().default('active'),
    firstSeen: integer('first_seen', { mode: 'timestamp' }).notNull(),
    lastSeen: integer('last_seen', { mode: 'timestamp' }).notNull(),
    metadata: text('metadata'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const alerts = sqliteTable("alerts", {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    title: text('title').notNull(),
    description: text('description'),
    severity: text('severity').$type<"low" | "medium" | "high" | "critical">().notNull(),
    status: text('status').$type<"open" | "investigating" | "resolved" | "false_positive">().default('open'),
    type: text('type').$type<"ioc_detected" | "campaign_detected" | "anomaly" | "custom">().notNull(),
    sourceType: text('source_type').$type<"feed" | "honeypot" | "manual" | "ai">().notNull(),
    relatedIocs: text('related_iocs'),
    relatedCampaigns: text('related_campaigns'),
    assignedTo: text('assigned_to'),
    priority: integer('priority').default(3), // 1-5 scale
    metadata: text('metadata'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const reports = sqliteTable("reports", {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    title: text('title').notNull(),
    type: text('type').$type<"executive" | "technical" | "incident" | "trend">().notNull(),
    status: text('status').$type<"draft" | "review" | "published">().default('draft'),
    content: text('content'),
    summary: text('summary'),
    tags: text('tags'),
    relatedAlerts: text('related_alerts'),
    relatedCampaigns: text('related_campaigns'),
    author: text('author').notNull(),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    metadata: text('metadata'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const enrichmentData = sqliteTable("enrichment_data", {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    iocId: text('ioc_id').notNull(),
    source: text('source').notNull(), // virustotal, passive_dns, etc.
    data: text('data'),
    confidence: real('confidence').default(50.00),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const feedData = sqliteTable("feed_data", {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    feedId: text('feed_id').notNull(),
    rawData: text('raw_data'),
    processedData: text('processed_data'),
    extractedIocs: text('extracted_iocs'),
    aiSummary: text('ai_summary'),
    confidence: real('confidence').default(50.00),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
}); 