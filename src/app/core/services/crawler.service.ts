import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import {
  CrawlJob,
  CrawlJobListParams,
  CrawlerPaginatedResponse,
  CreateCrawlPayload,
  Proxy,
  ProxyListParams,
  ProxyTestResult,
} from '../models/crawler-types';

@Injectable({ providedIn: 'root' })
export class CrawlerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin/crawler`;

  // --- Crawl operations ---

  /** Start a new crawl job */
  crawl(payload: CreateCrawlPayload): Observable<ApiResponse<CrawlJob>> {
    return this.http.post<ApiResponse<CrawlJob>>(`${this.base}/crawl`, payload);
  }

  /** Get available crawler driver names */
  getDrivers(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/drivers`);
  }

  // --- Job management ---

  /** Paginated job listing with filters */
  getJobs(params: CrawlJobListParams): Observable<CrawlerPaginatedResponse<CrawlJob>> {
    return this.http.get<CrawlerPaginatedResponse<CrawlJob>>(`${this.base}/jobs`, {
      params: this.toHttpParams(params),
    });
  }

  /** Single job detail (used for polling) */
  getJob(id: string): Observable<ApiResponse<CrawlJob>> {
    return this.http.get<ApiResponse<CrawlJob>>(`${this.base}/jobs/${id}`);
  }

  /** Retry a failed/partial job */
  retryJob(id: string): Observable<ApiResponse<CrawlJob>> {
    return this.http.post<ApiResponse<CrawlJob>>(`${this.base}/jobs/${id}/retry`, {});
  }

  /** Cancel a running/pending job */
  cancelJob(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/jobs/${id}`);
  }

  // --- Proxy management ---

  /** Paginated proxy list with stats */
  getProxies(params: ProxyListParams): Observable<CrawlerPaginatedResponse<Proxy>> {
    return this.http.get<CrawlerPaginatedResponse<Proxy>>(`${this.base}/proxies`, {
      params: this.toHttpParams(params),
    });
  }

  /** Create a single proxy */
  createProxy(data: Partial<Proxy>): Observable<ApiResponse<Proxy>> {
    return this.http.post<ApiResponse<Proxy>>(`${this.base}/proxies`, data);
  }

  /** Delete a proxy */
  deleteProxy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/proxies/${id}`);
  }

  /** Test proxy connectivity */
  testProxies(payload: { proxy_ids?: number[]; address?: string; type?: string }): Observable<ApiResponse<ProxyTestResult[]>> {
    return this.http.post<ApiResponse<ProxyTestResult[]>>(`${this.base}/proxies/test`, payload);
  }

  /** Bulk import proxies from text */
  importProxies(payload: { text: string; type: string }): Observable<ApiResponse<{ imported: number }>> {
    return this.http.post<ApiResponse<{ imported: number }>>(`${this.base}/proxies/import`, payload);
  }

  /** Remove all dead proxies */
  removeDeadProxies(): Observable<ApiResponse<{ removed: number }>> {
    return this.http.delete<ApiResponse<{ removed: number }>>(`${this.base}/proxies/dead`);
  }

  // --- Helpers ---

  /** Convert object to HttpParams, filtering out empty values */
  private toHttpParams(params: Record<string, any>): HttpParams {
    let hp = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        hp = hp.set(key, String(value));
      }
    }
    return hp;
  }
}
