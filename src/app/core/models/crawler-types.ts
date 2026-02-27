/** Possible statuses of a crawl job */
export type CrawlJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial' | 'cancelled';
export type StorageType = 's3' | 'public' | 'hotlink';
export type ProxyType = 'http' | 'socks4' | 'socks5';

/** Image processing options sent with a crawl request */
export interface CrawlJobOptions {
  resize?: boolean;
  resize_width?: number;
  compress?: boolean;
  compress_quality?: number;
  watermark?: boolean;
  credit?: boolean;
}

/** CrawlJob record from backend */
export interface CrawlJob {
  id: string; // UUID
  source_driver: string;
  manga_url: string | null;
  manga_name: string | null;
  start_page: number | null;
  end_page: number | null;
  storage_type: StorageType;
  options: CrawlJobOptions | null;
  status: CrawlJobStatus;
  total_chapters: number;
  crawled_chapters: number;
  total_images: number;
  error_message: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Proxy record from backend */
export interface Proxy {
  id: number;
  address: string;
  type: ProxyType;
  username: string | null;
  password: string | null;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_result: boolean | null;
  created_at: string;
  updated_at: string;
}

/** Payload for POST /api/admin/crawler/crawl */
export interface CreateCrawlPayload {
  source_driver: string;
  mode: 'url' | 'page';
  manga_url?: string;
  start_page?: number;
  end_page?: number;
  storage_type: StorageType;
  options?: CrawlJobOptions;
  use_proxies?: boolean;
}

/** Query params for GET /api/admin/crawler/jobs */
export interface CrawlJobListParams {
  page?: number;
  per_page?: number;
  'filter[status]'?: string;
  'filter[source_driver]'?: string;
  'filter[manga_name]'?: string;
}

/** Query params for GET /api/admin/crawler/proxies */
export interface ProxyListParams {
  page?: number;
  per_page?: number;
  'filter[is_active]'?: number;
  'filter[type]'?: string;
}

/** Result of testing a single proxy */
export interface ProxyTestResult {
  id: number;
  address: string;
  success: boolean;
  response_time_ms?: number;
}

/** Proxy counts from GET /proxies (stats field) */
export interface ProxyStats {
  active: number;
  inactive: number;
  dead: number;
  total: number;
}

/** Crawler-specific paginated response (matches our controller format) */
export interface CrawlerPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  stats?: ProxyStats; // Included in proxy index response
}
