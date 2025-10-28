// Admin Services - Centralized exports

export { variantService } from './variant.service'
export type { 
  ProductAttribute, 
  ProductVariant, 
  VariantResponse,
  GenerateVariantsData 
} from './variant.service'

export { analyticsService } from './analytics.service'
export type {
  ChatAnalytics,
  AnalyticsStats,
  ConversationTrend,
  ResponseTimeData,
  HourlyVolume,
  StatusDistribution,
  AgentPerformance,
  TopIssue
} from './analytics.service'

export { logsService } from './logs.service'
export type {
  ChatLog,
  LogsSummary,
  LogsResponse
} from './logs.service'

export { templatesService } from './templates.service'
export type {
  Template,
  TemplateStats,
  TemplatesResponse,
  CreateTemplateData,
  UpdateTemplateData
} from './templates.service'

export { settingsService } from './settings.service'
export type {
  ChatSettings
} from './settings.service'

