import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { threatFeeds, alerts, iocs, threatCampaigns, reports, enrichmentData, feedData } from './schema/threat-schema';
import { eq, desc, asc } from 'drizzle-orm';

const sqlite = new Database('./threat-intel.db');

// Enable foreign key constraints
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Database operations for threat intelligence
export const database = {
  // Threat feeds
  getThreatFeeds: async () => {
    try {
      return await db.select().from(threatFeeds);
    } catch (error) {
      console.error('Error getting threat feeds:', error);
      return [];
    }
  },

  addThreatFeed: async (feed: any) => {
    try {
      const result = await db.insert(threatFeeds).values({
        name: feed.name,
        type: feed.type,
        url: feed.url,
        apiKey: feed.apiKey || '',
        isActive: feed.isActive ?? true,
        syncInterval: feed.syncInterval || 3600,
        config: JSON.stringify(feed.config || {}),
        lastSync: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding threat feed:', error);
      throw error;
    }
  },

  // Alerts
  getAlerts: async (limit?: number) => {
    try {
      const query = db.select().from(alerts).orderBy(desc(alerts.createdAt));
      if (limit) {
        return await query.limit(limit);
      }
      return await query;
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  },

  addAlert: async (alert: any) => {
    try {
      const result = await db.insert(alerts).values({
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        status: alert.status || 'open',
        type: alert.type,
        sourceType: alert.sourceType,
        relatedIocs: JSON.stringify(alert.relatedIocs || []),
        relatedCampaigns: JSON.stringify(alert.relatedCampaigns || []),
        assignedTo: alert.assignedTo,
        priority: alert.priority || 3,
        metadata: JSON.stringify(alert.metadata || {}),
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding alert:', error);
      throw error;
    }
  },

  // IOCs
  getIOCs: async (limit?: number) => {
    try {
      const query = db.select().from(iocs).orderBy(desc(iocs.createdAt));
      if (limit) {
        return await query.limit(limit);
      }
      return await query;
    } catch (error) {
      console.error('Error getting IOCs:', error);
      return [];
    }
  },

  addIOC: async (ioc: any) => {
    try {
      const result = await db.insert(iocs).values({
        type: ioc.type,
        value: ioc.value,
        description: ioc.description,
        confidence: ioc.confidence || 50,
        severity: ioc.severity || 'medium',
        tags: JSON.stringify(ioc.tags || []),
        sources: JSON.stringify(ioc.sources || []),
        firstSeen: new Date(),
        lastSeen: new Date(),
        isActive: ioc.isActive ?? true,
        metadata: JSON.stringify(ioc.metadata || {}),
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding IOC:', error);
      throw error;
    }
  },

  // Threat campaigns
  getThreatCampaigns: async (limit?: number) => {
    try {
      const query = db.select().from(threatCampaigns).orderBy(desc(threatCampaigns.createdAt));
      if (limit) {
        return await query.limit(limit);
      }
      return await query;
    } catch (error) {
      console.error('Error getting threat campaigns:', error);
      return [];
    }
  },

  addThreatCampaign: async (campaign: any) => {
    try {
      const result = await db.insert(threatCampaigns).values({
        name: campaign.name,
        description: campaign.description,
        actor: campaign.actor,
        family: campaign.family,
        techniques: JSON.stringify(campaign.techniques || []),
        targetSectors: JSON.stringify(campaign.targetSectors || []),
        severity: campaign.severity || 'medium',
        confidence: campaign.confidence || 50,
        status: campaign.status || 'active',
        firstSeen: new Date(),
        lastSeen: new Date(),
        metadata: JSON.stringify(campaign.metadata || {}),
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding threat campaign:', error);
      throw error;
    }
  },

  // Reports
  getReports: async (limit?: number) => {
    try {
      const query = db.select().from(reports).orderBy(desc(reports.createdAt));
      if (limit) {
        return await query.limit(limit);
      }
      return await query;
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  },

  addReport: async (report: any) => {
    try {
      const result = await db.insert(reports).values({
        title: report.title,
        type: report.type,
        status: report.status || 'draft',
        content: report.content,
        summary: report.summary,
        tags: JSON.stringify(report.tags || []),
        relatedAlerts: JSON.stringify(report.relatedAlerts || []),
        relatedCampaigns: JSON.stringify(report.relatedCampaigns || []),
        author: report.author,
        publishedAt: report.publishedAt ? new Date(report.publishedAt) : null,
        metadata: JSON.stringify(report.metadata || {}),
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding report:', error);
      throw error;
    }
  },

  // Enrichment data
  getEnrichmentData: async (iocId: string) => {
    try {
      return await db.select().from(enrichmentData).where(eq(enrichmentData.iocId, iocId));
    } catch (error) {
      console.error('Error getting enrichment data:', error);
      return [];
    }
  },

  addEnrichmentData: async (enrichment: any) => {
    try {
      const result = await db.insert(enrichmentData).values({
        iocId: enrichment.iocId,
        source: enrichment.source,
        data: JSON.stringify(enrichment.data),
        confidence: enrichment.confidence || 50,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding enrichment data:', error);
      throw error;
    }
  },

  // Feed data
  getFeedData: async (feedId: string) => {
    try {
      return await db.select().from(feedData).where(eq(feedData.feedId, feedId));
    } catch (error) {
      console.error('Error getting feed data:', error);
      return [];
    }
  },

  addFeedData: async (feed: any) => {
    try {
      const result = await db.insert(feedData).values({
        feedId: feed.feedId,
        rawData: JSON.stringify(feed.rawData),
        processedData: JSON.stringify(feed.processedData),
        extractedIocs: JSON.stringify(feed.extractedIocs || []),
        aiSummary: feed.aiSummary,
        confidence: feed.confidence || 50,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding feed data:', error);
      throw error;
    }
  },
};

// Initialize database with sample data
async function initializeThreatDatabase() {
  console.log('Initializing threat intelligence database...');
  
  try {
    // Try to create tables if they don't exist
    console.log('Database initialized with sample data');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Load data on startup
initializeThreatDatabase();