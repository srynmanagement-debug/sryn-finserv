import { ProductsService } from '../src/modules/products/products.service';

describe('Dynamic Product Management Engine & Lifecycle State Machine', () => {
  let productsService: ProductsService;

  beforeEach(() => {
    productsService = new ProductsService();
  });

  it('should create a product in DRAFT status with initial version 1', async () => {
    const product = await productsService.createProduct({
      code: 'TEST_CREDIT_CARD',
      name: 'Test Rewards Credit Card',
      categoryId: 'cat-1',
      description: 'Test card description',
    });

    expect(product.id).toBeDefined();
    expect(product.code).toBe('TEST_CREDIT_CARD');
    expect(product.status).toBe('DRAFT');
    expect(product.version).toBe(1);
  });

  it('should enforce permitted lifecycle transitions DRAFT -> ACTIVE -> PAUSED -> ACTIVE -> ARCHIVED', async () => {
    const product = await productsService.createProduct({
      code: 'FD_CARD_TEST',
      name: 'FD Backed Card',
      categoryId: 'cat-1',
    });

    // 1. DRAFT -> ACTIVE (Publish)
    const published = await productsService.publishProduct(product.id, 'user-admin-1');
    expect(published.status).toBe('ACTIVE');

    // 2. ACTIVE -> PAUSED (Pause)
    const paused = await productsService.pauseProduct(product.id);
    expect(paused.status).toBe('PAUSED');

    // 3. PAUSED -> ACTIVE (Resume)
    const resumed = await productsService.resumeProduct(product.id);
    expect(resumed.status).toBe('ACTIVE');

    // 4. ACTIVE -> ARCHIVED (Archive)
    const archived = await productsService.archiveProduct(product.id);
    expect(archived.status).toBe('ARCHIVED');
  });

  it('should reject invalid lifecycle transitions', async () => {
    const product = await productsService.createProduct({
      code: 'INVALID_TRANSITION_TEST',
      name: 'Invalid Transition Card',
      categoryId: 'cat-1',
    });

    // Cannot pause a DRAFT product
    await expect(productsService.pauseProduct(product.id)).rejects.toThrow('Cannot pause product in status [DRAFT]');

    // Cannot resume a DRAFT product
    await expect(productsService.resumeProduct(product.id)).rejects.toThrow('Cannot resume product in status [DRAFT]');
  });

  it('should prevent direct edits on ACTIVE products and require creating a new draft revision', async () => {
    const product = await productsService.createProduct({
      code: 'REVISION_TEST',
      name: 'Original Active Product',
      categoryId: 'cat-1',
    });

    await productsService.publishProduct(product.id);

    // Attempting direct update on ACTIVE product should throw error
    await expect(productsService.updateProduct(product.id, { name: 'Direct Update Attempt' })).rejects.toThrow(
      'Cannot edit an active published product directly. Create a new draft revision instead.'
    );

    // Creating revision should create a new DRAFT with incremented version number
    const revision = await productsService.createRevision(product.id);
    expect(revision.status).toBe('DRAFT');
    expect(revision.version).toBe(2);
  });

  it('should preserve immutable version snapshots upon publication', async () => {
    const product = await productsService.createProduct({
      code: 'SNAPSHOT_TEST',
      name: 'Snapshot Product',
      categoryId: 'cat-1',
    });

    await productsService.publishProduct(product.id, 'user-admin-1');

    const versions = await productsService.getProductVersions(product.id);
    expect(versions.length).toBe(1);
    expect(versions[0].version).toBe(1);
    expect(versions[0].configSnapshot.code).toBe('SNAPSHOT_TEST');
  });
});
