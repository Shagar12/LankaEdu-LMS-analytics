/**
 * Supabase-compatible Backend Client Interface for LankaEdu LMS
 * Connects frontend modules to the PostgreSQL relational backend and syncs with Firebase Firestore.
 */

export interface SupabaseResponse<T = any> {
  data: T | null;
  error: Error | null;
  count?: number;
}

export interface SupabaseQueryBuilder<T = any> {
  select: (columns?: string) => SupabaseQueryBuilder<T>;
  eq: (column: string, value: any) => SupabaseQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder<T>;
  limit: (count: number) => SupabaseQueryBuilder<T>;
  insert: (values: any | any[]) => Promise<SupabaseResponse<T>>;
  update: (values: any) => SupabaseQueryBuilder<T>;
  delete: () => SupabaseQueryBuilder<T>;
  then: (resolve: (value: SupabaseResponse<T>) => void, reject?: (reason: any) => void) => Promise<any>;
}

class SupabaseTableClient<T = any> implements SupabaseQueryBuilder<T> {
  private tableName: string;
  private selectedColumns: string = '*';
  private filters: Array<{ column: string; value: any }> = [];
  private orderConfig?: { column: string; ascending?: boolean };
  private limitCount?: number;
  private pendingUpdate?: any;
  private isDelete: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*'): SupabaseQueryBuilder<T> {
    this.selectedColumns = columns;
    return this;
  }

  eq(column: string, value: any): SupabaseQueryBuilder<T> {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder<T> {
    this.orderConfig = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): SupabaseQueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  async insert(values: any | any[]): Promise<SupabaseResponse<T>> {
    try {
      const payload = Array.isArray(values) ? values[0] : values;
      const endpoint = this.tableName === 'users' ? '/api/users/sync' :
                       this.tableName === 'mark_submissions' ? '/api/marks/submit' :
                       `/api/table/${this.tableName}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return { data: (data.record || data.user || data.submission || data) as T, error: null };
    } catch (err: any) {
      console.warn(`Supabase insert to [${this.tableName}] error:`, err);
      return { data: null, error: err };
    }
  }

  update(values: any): SupabaseQueryBuilder<T> {
    this.pendingUpdate = values;
    return this;
  }

  delete(): SupabaseQueryBuilder<T> {
    this.isDelete = true;
    return this;
  }

  async execute(): Promise<SupabaseResponse<T>> {
    try {
      // If there's an update operation
      if (this.pendingUpdate) {
        const idFilter = this.filters.find(f => f.column === 'id' || f.column === 'uid');
        const endpoint = `/api/table/${this.tableName}`;
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: this.filters,
            values: this.pendingUpdate,
          }),
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return { data: data.updated as T, error: null };
      }

      // Query table
      const queryParams = new URLSearchParams();
      if (this.selectedColumns !== '*') queryParams.append('select', this.selectedColumns);
      if (this.limitCount) queryParams.append('limit', this.limitCount.toString());
      this.filters.forEach(f => queryParams.append(`filter_${f.column}`, String(f.value)));

      const endpoint = this.tableName === 'users' 
        ? `/api/users?${queryParams.toString()}`
        : this.tableName === 'mark_submissions'
        ? `/api/marks/submissions?${queryParams.toString()}`
        : this.tableName === 'curriculum_standards'
        ? `/api/curriculum/standards?${queryParams.toString()}`
        : `/api/table/${this.tableName}?${queryParams.toString()}`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return { data: (data.items || data.users || data.submissions || data.standards || data) as T, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  then(resolve: (value: SupabaseResponse<T>) => void, reject?: (reason: any) => void): Promise<any> {
    return this.execute().then(resolve, reject);
  }
}

class SupabaseClient {
  from<T = any>(table: string): SupabaseQueryBuilder<T> {
    return new SupabaseTableClient<T>(table);
  }

  async health(): Promise<{
    status: 'online' | 'degraded' | 'offline';
    database: string;
    latencyMs: number;
    details: Record<string, any>;
  }> {
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) throw new Error(`Health status: ${res.status}`);
      const info = await res.json();
      return {
        status: info.status === 'ok' ? 'online' : 'degraded',
        database: info.database || 'PostgreSQL (Cloud SQL / Supabase compatible)',
        latencyMs,
        details: info,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        status: 'offline',
        database: 'PostgreSQL',
        latencyMs,
        details: { error: err.message },
      };
    }
  }
}

export const supabase = new SupabaseClient();
