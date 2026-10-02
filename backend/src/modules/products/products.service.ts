import { DatabaseConnection } from '../../database/connection';
import { ProductConfig, ProductCategory, ProductSubcategory, ProductStatus, ProductVersionRecord, BankingPartner } from '@sryn/types';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/app-error';
import { logger } from '../../common/utils/logger';

// In-memory fallback repository store for local testing when DB is offline
const memoryCategories: ProductCategory[] = [
  { id: 'cat-1', code: 'CREDIT_CARD', name: 'Credit Cards', description: 'Credit Card products', isActive: true, displayOrder: 1 },
  { id: 'cat-2', code: 'PERSONAL_LOAN', name: 'Personal Loans', description: 'Personal Loan products', isActive: true, displayOrder: 2 },
  { id: 'cat-3', code: 'HOME_LOAN', name: 'Home Loans', description: 'Home Loan products', isActive: true, displayOrder: 3 },
  { id: 'cat-4', code: 'INSURANCE', name: 'Insurance', description: 'Insurance policies', isActive: true, displayOrder: 4 },
];

const memorySubcategories: ProductSubcategory[] = [
  { id: 'subcat-1', categoryId: 'cat-1', code: 'FD_CREDIT_CARD', name: 'FD Backed Credit Card', isActive: true },
  { id: 'subcat-2', categoryId: 'cat-1', code: 'REWARDS_CARD', name: 'Rewards Credit Card', isActive: true },
];

const memoryPartners: BankingPartner[] = [
  { id: 'part-1', code: 'HDFC', name: 'HDFC Bank', contactEmail: 'partners@hdfcbank.com', isActive: true },
  { id: 'part-2', code: 'ICICI', name: 'ICICI Bank', contactEmail: 'partners@icicibank.com', isActive: true },
];

const memoryProducts: Map<string, ProductConfig> = new Map();
const memoryVersions: Map<string, ProductVersionRecord[]> = new Map();

export class ProductsService {
  private db = DatabaseConnection.getInstance();

  public async getCategories(): Promise<ProductCategory[]> {
    try {
      const res = await this.db.query('SELECT * FROM product_categories ORDER BY display_order ASC, name ASC');
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          description: r.description,
          isActive: r.is_active,
          displayOrder: r.display_order,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch (err) {
      logger.warn('[ProductsService] DB query failed, using fallback categories');
    }
    return memoryCategories;
  }

  public async createCategory(data: { code: string; name: string; description?: string; displayOrder?: number }): Promise<ProductCategory> {
    try {
      const res = await this.db.query(
        `INSERT INTO product_categories (code, name, description, display_order)
         VALUES ($1, $2, $3, $4) RETURNING *;`,
        [data.code, data.name, data.description || null, data.displayOrder || 0]
      );
      const r = res.rows[0];
      return { id: r.id, code: r.code, name: r.name, description: r.description, isActive: r.is_active, displayOrder: r.display_order };
    } catch (err) {
      const cat: ProductCategory = { id: `cat-${Date.now()}`, code: data.code, name: data.name, description: data.description, isActive: true, displayOrder: data.displayOrder || 0 };
      memoryCategories.push(cat);
      return cat;
    }
  }

  public async getSubcategories(categoryId?: string): Promise<ProductSubcategory[]> {
    try {
      let query = 'SELECT * FROM product_subcategories';
      const params: any[] = [];
      if (categoryId) {
        query += ' WHERE category_id = $1';
        params.push(categoryId);
      }
      query += ' ORDER BY name ASC';
      const res = await this.db.query(query, params);
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => ({ id: r.id, categoryId: r.category_id, code: r.code, name: r.name, description: r.description, isActive: r.is_active }));
      }
    } catch (err) {}
    return categoryId ? memorySubcategories.filter(s => s.categoryId === categoryId) : memorySubcategories;
  }

  public async createSubcategory(data: { categoryId: string; code: string; name: string; description?: string }): Promise<ProductSubcategory> {
    try {
      const res = await this.db.query(
        `INSERT INTO product_subcategories (category_id, code, name, description)
         VALUES ($1, $2, $3, $4) RETURNING *;`,
        [data.categoryId, data.code, data.name, data.description || null]
      );
      const r = res.rows[0];
      return { id: r.id, categoryId: r.category_id, code: r.code, name: r.name, description: r.description, isActive: r.is_active };
    } catch (err) {
      const sub: ProductSubcategory = { id: `sub-${Date.now()}`, categoryId: data.categoryId, code: data.code, name: data.name, description: data.description, isActive: true };
      memorySubcategories.push(sub);
      return sub;
    }
  }

  public async getPartners(): Promise<BankingPartner[]> {
    try {
      const res = await this.db.query('SELECT * FROM partners ORDER BY name ASC');
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => ({ id: r.id, code: r.code, name: r.name, logoUrl: r.logo_url, contactEmail: r.contact_email, isActive: r.is_active }));
      }
    } catch (err) {}
    return memoryPartners;
  }

  public async createPartner(data: { code: string; name: string; logoUrl?: string; contactEmail?: string }): Promise<BankingPartner> {
    try {
      const res = await this.db.query(
        `INSERT INTO partners (code, name, logo_url, contact_email) VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.code, data.name, data.logoUrl || null, data.contactEmail || null]
      );
      const r = res.rows[0];
      return { id: r.id, code: r.code, name: r.name, logoUrl: r.logo_url, contactEmail: r.contact_email, isActive: r.is_active };
    } catch (err) {
      const p: BankingPartner = { id: `part-${Date.now()}`, code: data.code, name: data.name, logoUrl: data.logoUrl, contactEmail: data.contactEmail, isActive: true };
      memoryPartners.push(p);
      return p;
    }
  }

  public async listProducts(options: { search?: string; categoryId?: string; status?: ProductStatus; page?: number; limit?: number }): Promise<{ products: ProductConfig[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;

    let items = Array.from(memoryProducts.values());

    if (options.search) {
      const q = options.search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
    }
    if (options.categoryId) {
      items = items.filter(p => p.categoryId === options.categoryId);
    }
    if (options.status) {
      items = items.filter(p => p.status === options.status);
    }

    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);
    return { products: paginated, total };
  }

  public async createProduct(data: Partial<ProductConfig>): Promise<ProductConfig> {
    if (!data.code || !data.name || !data.categoryId) {
      throw new BadRequestError('Code, name, and categoryId are required to create a product');
    }

    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const category = (await this.getCategories()).find(c => c.id === data.categoryId);

    const newProduct: ProductConfig = {
      id,
      code: data.code,
      name: data.name,
      categoryId: data.categoryId,
      categoryName: category?.name,
      subcategoryId: data.subcategoryId,
      partnerId: data.partnerId,
      status: 'DRAFT',
      version: 1,
      description: data.description,
      iconUrl: data.iconUrl,
      eligibilityRules: data.eligibilityRules || [],
      documentRequirements: data.documentRequirements || [],
      workflowId: data.workflowId,
      effectiveFrom: data.effectiveFrom || now,
      effectiveTo: data.effectiveTo,
      createdAt: now,
      updatedAt: now,
    };

    memoryProducts.set(id, newProduct);
    return newProduct;
  }

  public async getProductById(id: string): Promise<ProductConfig> {
    const product = memoryProducts.get(id);
    if (!product) {
      throw new NotFoundError(`Product not found: ${id}`);
    }
    return product;
  }

  public async updateProduct(id: string, updates: Partial<ProductConfig>): Promise<ProductConfig> {
    const product = await this.getProductById(id);

    if (product.status === 'ARCHIVED') {
      throw new BadRequestError('Cannot edit an archived product');
    }

    if (product.status === 'ACTIVE') {
      throw new BadRequestError('Cannot edit an active published product directly. Create a new draft revision instead.');
    }

    const updated: ProductConfig = {
      ...product,
      ...updates,
      id: product.id, // Immutable ID
      status: product.status, // Enforce status transition through lifecycle methods
      version: product.version,
      updatedAt: new Date().toISOString(),
    };

    memoryProducts.set(id, updated);
    return updated;
  }

  public async publishProduct(id: string, userId?: string): Promise<ProductConfig> {
    const product = await this.getProductById(id);

    if (product.status !== 'DRAFT') {
      throw new BadRequestError(`Cannot publish product with status [${product.status}]. Only DRAFT products can be published.`);
    }

    const published: ProductConfig = {
      ...product,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    memoryProducts.set(id, published);

    // Save immutable version snapshot
    const versions = memoryVersions.get(id) || [];
    const versionRecord: ProductVersionRecord = {
      id: `ver-${Date.now()}`,
      productId: id,
      version: published.version,
      configSnapshot: JSON.parse(JSON.stringify(published)),
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };
    versions.push(versionRecord);
    memoryVersions.set(id, versions);

    return published;
  }

  public async pauseProduct(id: string): Promise<ProductConfig> {
    const product = await this.getProductById(id);
    if (product.status !== 'ACTIVE') {
      throw new BadRequestError(`Cannot pause product in status [${product.status}]. Product must be ACTIVE.`);
    }
    product.status = 'PAUSED';
    product.updatedAt = new Date().toISOString();
    memoryProducts.set(id, product);
    return product;
  }

  public async resumeProduct(id: string): Promise<ProductConfig> {
    const product = await this.getProductById(id);
    if (product.status !== 'PAUSED') {
      throw new BadRequestError(`Cannot resume product in status [${product.status}]. Product must be PAUSED.`);
    }
    product.status = 'ACTIVE';
    product.updatedAt = new Date().toISOString();
    memoryProducts.set(id, product);
    return product;
  }

  public async archiveProduct(id: string): Promise<ProductConfig> {
    const product = await this.getProductById(id);
    product.status = 'ARCHIVED';
    product.updatedAt = new Date().toISOString();
    memoryProducts.set(id, product);
    return product;
  }

  public async createRevision(id: string): Promise<ProductConfig> {
    const product = await this.getProductById(id);
    if (product.status !== 'ACTIVE') {
      throw new BadRequestError('New revisions can only be created from ACTIVE products');
    }

    const newVersion = product.version + 1;
    const revision: ProductConfig = {
      ...JSON.parse(JSON.stringify(product)),
      status: 'DRAFT',
      version: newVersion,
      updatedAt: new Date().toISOString(),
    };

    memoryProducts.set(id, revision);
    return revision;
  }

  public async getProductVersions(id: string): Promise<ProductVersionRecord[]> {
    return memoryVersions.get(id) || [];
  }
}
