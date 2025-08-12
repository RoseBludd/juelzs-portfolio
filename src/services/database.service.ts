import { Pool, PoolClient } from 'pg';

interface DatabaseRow {
  id: string;
  name: string;
  type: 'ui_components' | 'api_endpoints' | 'functions' | 'database' | 'tests' | 'pages' | 'styles' | 'config' | 'tools' | 'documentation';
  description: string;
  category: string;
  module_count: number;
  technologies: string[];
  created_at: Date;
  updated_at: Date;
  metadata?: {
    preview?: string;
    examples?: string[];
    dependencies?: string[];
    usage?: string;
  };
}

export interface ModuleRegistryItem {
  id: string;
  name: string;
  type: 'ui_components' | 'api_endpoints' | 'functions' | 'database' | 'tests' | 'pages' | 'styles' | 'config' | 'tools' | 'documentation';
  description: string;
  category: string;
  moduleCount: number;
  technologies: string[];
  created_at: Date;
  updated_at: Date;
  metadata?: {
    preview?: string;
    examples?: string[];
    dependencies?: string[];
    usage?: string;
  };
}

export interface RegistryStats {
  totalModules: number;
  modulesByType: Record<string, number>;
  recentModules: ModuleRegistryItem[];
  topCategories: Array<{ name: string; count: number }>;
}

class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool | null = null;
  private isConnected = false;
  private connectionString: string;
  private poolSize: number;

  private constructor() {
    this.connectionString = process.env.SUPABASE_DB || '';
    // Use singleton connection in dev, pool in production
    this.poolSize = process.env.NODE_ENV === 'development' ? 1 : 10;
    
    if (!this.connectionString) {
      console.warn('SUPABASE_DB connection string not found in environment variables');
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (!this.connectionString) {
      console.warn('Database connection string not available, using fallback data');
      return;
    }

    try {
      // Temporarily disable SSL verification for development
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      this.pool = new Pool({
        connectionString: this.connectionString,
        max: this.poolSize,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
      });

      // Test connection with timeout
      const client = await Promise.race([
        this.pool.connect(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);
      
      await client.query('SELECT 1');
      client.release();

      this.isConnected = true;
      console.log(`Database connected successfully (pool size: ${this.poolSize})`);
    } catch (error) {
      console.warn('Database connection failed, using fallback data:', (error as Error).message);
      // Don't throw error, just continue with fallback data
      this.isConnected = false;
    }
  }

  /**
   * Get database client (private)
   */
  private async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      await this.initialize();
    }
    
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not available');
    }

    return this.pool.connect();
  }

  /**
   * Get database client (public for other services)
   */
  async getPoolClient(): Promise<PoolClient> {
    return this.getClient();
  }

  /**
   * Get all modules from registry
   */
  async getModules(): Promise<ModuleRegistryItem[]> {
    try {
      const client = await this.getClient();
      
      try {
        const query = `
          SELECT 
            id,
            name,
            type,
            description,
            category,
            module_count,
            technologies,
            created_at,
            updated_at,
            metadata
          FROM module_registry 
          ORDER BY updated_at DESC
        `;
        
        const result = await client.query(query);
        
        return result.rows.map((row: DatabaseRow) => ({
          id: row.id,
          name: row.name,
          type: row.type,
          description: row.description,
          category: row.category,
          moduleCount: row.module_count,
          technologies: row.technologies || [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          metadata: row.metadata
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      // Return fallback data for development
      return this.getFallbackModules();
    }
  }

  /**
   * Get modules by type
   */
  async getModulesByType(type: string): Promise<ModuleRegistryItem[]> {
    try {
      const client = await this.getClient();
      
      try {
        const query = `
          SELECT 
            id,
            name,
            type,
            description,
            category,
            module_count,
            technologies,
            created_at,
            updated_at,
            metadata
          FROM module_registry 
          WHERE type = $1
          ORDER BY updated_at DESC
        `;
        
        const result = await client.query(query, [type]);
        
        return result.rows.map((row: DatabaseRow) => ({
          id: row.id,
          name: row.name,
          type: row.type,
          description: row.description,
          category: row.category,
          moduleCount: row.module_count,
          technologies: row.technologies || [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          metadata: row.metadata
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching modules by type:', error);
      const fallbackModules = this.getFallbackModules();
      return fallbackModules.filter(m => m.type === type);
    }
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<RegistryStats> {
    try {
      const client = await this.getClient();
      
      try {
        // Get total modules
        const totalQuery = 'SELECT COUNT(*) as total FROM module_registry';
        const totalResult = await client.query(totalQuery);
        const totalModules = parseInt(totalResult.rows[0].total);

        // Get modules by type
        const typeQuery = `
          SELECT type, COUNT(*) as count 
          FROM module_registry 
          GROUP BY type 
          ORDER BY count DESC
        `;
        const typeResult = await client.query(typeQuery);
        const modulesByType = typeResult.rows.reduce((acc: Record<string, number>, row: { type: string; count: string }) => {
          acc[row.type] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>);

        // Get recent modules
        const recentQuery = `
          SELECT * FROM module_registry 
          ORDER BY updated_at DESC 
          LIMIT 5
        `;
        const recentResult = await client.query(recentQuery);
        const recentModules = recentResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          type: row.type,
          description: row.description,
          category: row.category,
          moduleCount: row.module_count,
          technologies: row.technologies || [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          metadata: row.metadata
        }));

        // Get top categories
        const categoryQuery = `
          SELECT category, COUNT(*) as count 
          FROM module_registry 
          GROUP BY category 
          ORDER BY count DESC 
          LIMIT 5
        `;
        const categoryResult = await client.query(categoryQuery);
        const topCategories = categoryResult.rows.map(row => ({
          name: row.category,
          count: parseInt(row.count)
        }));

        return {
          totalModules,
          modulesByType,
          recentModules,
          topCategories
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching registry stats:', error);
      return this.getFallbackStats();
    }
  }

  /**
   * Search modules
   */
  async searchModules(query: string): Promise<ModuleRegistryItem[]> {
    try {
      const client = await this.getClient();
      
      try {
        const searchQuery = `
          SELECT 
            id,
            name,
            type,
            description,
            category,
            module_count,
            technologies,
            created_at,
            updated_at,
            metadata
          FROM module_registry 
          WHERE 
            name ILIKE $1 OR 
            description ILIKE $1 OR 
            category ILIKE $1 OR 
            array_to_string(technologies, ' ') ILIKE $1
          ORDER BY updated_at DESC
        `;
        
        const result = await client.query(searchQuery, [`%${query}%`]);
        
        return result.rows.map(row => ({
          id: row.id,
          name: row.name,
          type: row.type,
          description: row.description,
          category: row.category,
          moduleCount: row.module_count,
          technologies: row.technologies || [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          metadata: row.metadata
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error searching modules:', error);
      const fallbackModules = this.getFallbackModules();
      return fallbackModules.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase()) ||
        m.category.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    poolSize: number;
    environment: string;
  } {
    return {
      connected: this.isConnected,
      poolSize: this.poolSize,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('Database connection closed');
    }
  }

  /**
   * Fallback data for development/testing
   */
  private getFallbackModules(): ModuleRegistryItem[] {
    return [
      {
        id: 'ui-components',
        name: 'UI Components',
        type: 'ui_components',
        description: 'User Interface Components',
        category: 'Frontend',
        moduleCount: 60,
        technologies: ['React', 'TypeScript', 'Tailwind CSS'],
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {
          preview: 'Interactive components with modern design',
          examples: ['Button', 'Card', 'Modal', 'Form'],
          dependencies: ['react', 'tailwindcss'],
          usage: 'Reusable UI building blocks'
        }
      },
      {
        id: 'api-endpoints',
        name: 'API Endpoints',
        type: 'api_endpoints',
        description: 'API Endpoints and Routes',
        category: 'Backend',
        moduleCount: 51,
        technologies: ['Node.js', 'Express', 'REST'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'functions',
        name: 'Utility Functions',
        type: 'functions',
        description: 'Utility Functions and Helpers',
        category: 'Core',
        moduleCount: 85,
        technologies: ['TypeScript', 'JavaScript', 'Utils'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'database',
        name: 'Database Models',
        type: 'database',
        description: 'Database Models and Migrations',
        category: 'Data',
        moduleCount: 57,
        technologies: ['PostgreSQL', 'Prisma', 'Supabase'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tests',
        name: 'Test Suites',
        type: 'tests',
        description: 'Unit and Integration Tests',
        category: 'Testing',
        moduleCount: 2,
        technologies: ['Jest', 'Testing Library', 'Cypress'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'pages',
        name: 'Page Components',
        type: 'pages',
        description: 'Page Components and Layouts',
        category: 'Frontend',
        moduleCount: 7,
        technologies: ['Next.js', 'React', 'SSR'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'styles',
        name: 'Styles',
        type: 'styles',
        description: 'CSS and Styling Components',
        category: 'Design',
        moduleCount: 1,
        technologies: ['Tailwind CSS', 'CSS Modules'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'config',
        name: 'Configuration',
        type: 'config',
        description: 'Configuration Files',
        category: 'Setup',
        moduleCount: 4,
        technologies: ['TypeScript', 'JSON', 'ENV'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'tools',
        name: 'Development Tools',
        type: 'tools',
        description: 'Development Tools and Scripts',
        category: 'DevOps',
        moduleCount: 3,
        technologies: ['Node.js', 'Scripts', 'Automation'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'documentation',
        name: 'Documentation',
        type: 'documentation',
        description: 'Documentation and Guides',
        category: 'Docs',
        moduleCount: 0,
        technologies: ['Markdown', 'README'],
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
  }

  /**
   * Fallback stats for development/testing
   */
  private getFallbackStats(): RegistryStats {
    const fallbackModules = this.getFallbackModules();
    const totalModules = fallbackModules.reduce((sum, m) => sum + m.moduleCount, 0);
    
    const modulesByType = fallbackModules.reduce((acc, m) => {
      acc[m.type] = m.moduleCount;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = fallbackModules
      .reduce((acc, m) => {
        const existing = acc.find(c => c.name === m.category);
        if (existing) {
          existing.count += m.moduleCount;
        } else {
          acc.push({ name: m.category, count: m.moduleCount });
        }
        return acc;
      }, [] as Array<{ name: string; count: number }>)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalModules,
      modulesByType,
      recentModules: fallbackModules.slice(0, 5),
      topCategories
    };
  }
}

export default DatabaseService; 