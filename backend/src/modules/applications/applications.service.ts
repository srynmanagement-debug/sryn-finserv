import crypto from 'crypto';
import { DatabaseConnection } from '../../database/connection';
import { FinServApplication, ApplicationStatus, ApplicationDocument, ApplicationStatusHistory } from '@sryn/types';
import { saveDraftSchema, submitApplicationSchema, resubmitApplicationSchema, updateApplicationStatusSchema } from '@sryn/validation';
import { AppError, BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors/app-error';
import { AuditService } from '../audit/audit.service';
import { logger } from '../../common/utils/logger';

const auditService = new AuditService();

// Fallback in-memory application store for local development/testing when PostgreSQL is unavailable
const memoryApplications: Map<string, FinServApplication> = new Map();

export class ApplicationsService {
  private db = DatabaseConnection.getInstance();

  /**
   * Helper to format DB row to FinServApplication object with documents and history.
   */
  private async formatApplication(row: any): Promise<FinServApplication> {
    let documents: ApplicationDocument[] = [];
    let statusHistory: ApplicationStatusHistory[] = [];

    try {
      const docsRes = await this.db.query(
        'SELECT * FROM application_documents WHERE application_id = $1 ORDER BY uploaded_at DESC',
        [row.id]
      );
      documents = docsRes.rows.map((doc: any) => ({
        id: doc.id,
        applicationId: doc.application_id,
        documentType: doc.document_type,
        s3Key: doc.s3_key,
        fileName: doc.file_name,
        fileSizeBytes: Number(doc.file_size_bytes),
        mimeType: doc.mime_type,
        uploadedByUserId: doc.uploaded_by_user_id,
        status: doc.status,
        rejectionReason: doc.rejection_reason || undefined,
        uploadedAt: doc.uploaded_at.toISOString(),
      }));

      const historyRes = await this.db.query(
        'SELECT * FROM application_status_history WHERE application_id = $1 ORDER BY created_at ASC',
        [row.id]
      );
      statusHistory = historyRes.rows.map((h: any) => ({
        id: h.id,
        applicationId: h.application_id,
        previousStatus: h.from_status || h.previous_status || undefined,
        newStatus: h.to_status || h.new_status,
        changedByUserId: h.changed_by_user_id,
        notes: h.notes || undefined,
        createdAt: h.created_at.toISOString(),
      }));
    } catch (err) {
      logger.warn('[ApplicationsService] DB query failed in formatApplication, using empty docs/history fallback');
    }

    return {
      id: row.id,
      applicationNumber: row.application_number,
      customerId: row.customer_id,
      agentId: row.agent_id || undefined,
      retailerId: row.retailer_id || undefined,
      productId: row.product_id,
      productVersionSnapshot: row.product_version_snapshot || 1,
      pricingRuleSnapshot: row.pricing_rule_snapshot || row.pricing_snapshot ? JSON.parse(JSON.stringify(row.pricing_rule_snapshot || row.pricing_snapshot)) : null,
      commissionRuleSnapshot: row.commission_rule_snapshot || row.commission_snapshot ? JSON.parse(JSON.stringify(row.commission_rule_snapshot || row.commission_snapshot)) : null,
      formData: typeof row.form_data === 'string' ? JSON.parse(row.form_data) : row.form_data || {},
      documents,
      statusHistory,
      currentStatus: row.current_status as ApplicationStatus,
      currentStep: row.current_step || 1,
      submissionIdempotencyKey: row.submission_idempotency_key || undefined,
      additionalInfoRequestedNotes: row.additional_info_requested_notes || undefined,
      resubmittedAt: row.resubmitted_at ? new Date(row.resubmitted_at).toISOString() : undefined,
      assignedManagerId: row.assigned_manager_id || undefined,
      createdAt: new Date(row.created_at || Date.now()).toISOString(),
      updatedAt: new Date(row.updated_at || Date.now()).toISOString(),
    };
  }

  /**
   * Save or update draft application.
   */
  async saveDraft(customerId: string, payload: any): Promise<FinServApplication> {
    const validated = saveDraftSchema.parse(payload);

    try {
      let appRow: any = null;

      if (validated.applicationId) {
        const existingRes = await this.db.query(
          'SELECT * FROM applications WHERE id = $1 AND customer_id = $2',
          [validated.applicationId, customerId]
        );
        if (existingRes.rows.length === 0) {
          throw new NotFoundError('Draft application not found');
        }

        const currentApp = existingRes.rows[0];
        if (currentApp.current_status !== 'DRAFT') {
          throw new BadRequestError('Cannot update application draft after submission');
        }

        const updateRes = await this.db.query(
          `UPDATE applications
           SET form_data = $1, current_step = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3 AND customer_id = $4
           RETURNING *`,
          [JSON.stringify(validated.formData), validated.currentStep, validated.applicationId, customerId]
        );
        appRow = updateRes.rows[0];
      } else {
        const existingDraftRes = await this.db.query(
          'SELECT * FROM applications WHERE customer_id = $1 AND product_id = $2 AND current_status = \'DRAFT\' ORDER BY created_at DESC LIMIT 1',
          [customerId, validated.productId]
        );

        if (existingDraftRes.rows.length > 0) {
          const updateRes = await this.db.query(
            `UPDATE applications
             SET form_data = $1, current_step = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [JSON.stringify(validated.formData), validated.currentStep, existingDraftRes.rows[0].id]
          );
          appRow = updateRes.rows[0];
        } else {
          const appNum = `APP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

          const insertRes = await this.db.query(
            `INSERT INTO applications (
              application_number, customer_id, product_id, current_status, current_step, form_data
            ) VALUES ($1, $2, $3, 'DRAFT', $4, $5)
            RETURNING *`,
            [appNum, customerId, validated.productId, validated.currentStep, JSON.stringify(validated.formData)]
          );
          appRow = insertRes.rows[0];
        }
      }

      return this.formatApplication(appRow);
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof BadRequestError) {
        throw err;
      }
      logger.warn('[ApplicationsService] DB saveDraft failed, using memory store fallback');

      const now = new Date().toISOString();

      if (validated.applicationId) {
        const existing = memoryApplications.get(validated.applicationId);
        if (!existing || existing.customerId !== customerId) {
          throw new NotFoundError('Draft application not found');
        }
        if (existing.currentStatus !== 'DRAFT') {
          throw new BadRequestError('Cannot update application draft after submission');
        }
        existing.formData = validated.formData;
        existing.currentStep = validated.currentStep;
        existing.updatedAt = now;
        memoryApplications.set(existing.id, existing);
        return existing;
      } else {
        const existingDraft = Array.from(memoryApplications.values()).find(
          a => a.customerId === customerId && a.productId === validated.productId && a.currentStatus === 'DRAFT'
        );

        if (existingDraft) {
          existingDraft.formData = validated.formData;
          existingDraft.currentStep = validated.currentStep;
          existingDraft.updatedAt = now;
          memoryApplications.set(existingDraft.id, existingDraft);
          return existingDraft;
        }

        const id = crypto.randomUUID();
        const appNum = `APP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const newApp: FinServApplication = {
          id,
          applicationNumber: appNum,
          customerId,
          productId: validated.productId,
          productVersionSnapshot: 1,
          pricingRuleSnapshot: null,
          commissionRuleSnapshot: null,
          formData: validated.formData,
          documents: [],
          statusHistory: [],
          currentStatus: 'DRAFT',
          currentStep: validated.currentStep,
          createdAt: now,
          updatedAt: now,
        };
        memoryApplications.set(id, newApp);
        return newApp;
      }
    }
  }

  /**
   * Submit application with frozen product, pricing, and commission snapshots.
   */
  async submitApplication(customerId: string, payload: any): Promise<FinServApplication> {
    const validated = submitApplicationSchema.parse(payload);

    try {
      const appRes = await this.db.query(
        'SELECT * FROM applications WHERE id = $1',
        [validated.applicationId]
      );

      if (appRes.rows.length === 0) {
        throw new NotFoundError('Application not found');
      }

      const app = appRes.rows[0];

      if (app.customer_id !== customerId) {
        throw new ForbiddenError('Unauthorized access to application');
      }

      if (app.submission_idempotency_key === validated.submissionIdempotencyKey) {
        return this.formatApplication(app);
      }

      if (app.current_status !== 'DRAFT') {
        throw new BadRequestError(`Application cannot be submitted in status [${app.current_status}]`);
      }

      const keyCheck = await this.db.query(
        'SELECT id FROM applications WHERE submission_idempotency_key = $1 AND id != $2',
        [validated.submissionIdempotencyKey, validated.applicationId]
      );
      if (keyCheck.rows.length > 0) {
        throw new AppError('Idempotency key already used for another submission', 409);
      }

      const pricingRes = await this.db.query(
        "SELECT * FROM pricing_rules WHERE product_id = $1 AND (status = 'ACTIVE' OR is_published = true) LIMIT 1",
        [app.product_id]
      );
      const pricingSnapshot = pricingRes.rows[0]
        ? {
            ruleId: pricingRes.rows[0].id,
            feeType: pricingRes.rows[0].fee_type,
            fixedAmountPaise: Number(pricingRes.rows[0].fixed_amount_paise || 0),
            percentageBps: Number(pricingRes.rows[0].percentage_bps || 0),
            minAmountPaise: Number(pricingRes.rows[0].min_amount_paise || 0),
            maxAmountPaise: Number(pricingRes.rows[0].max_amount_paise || 0),
          }
        : { feeType: 'PROCESSING_FEE', fixedAmountPaise: 0 };

      const commRes = await this.db.query(
        "SELECT * FROM commission_rules WHERE product_id = $1 AND (status = 'ACTIVE' OR is_published = true) LIMIT 1",
        [app.product_id]
      );
      const commissionSnapshot = commRes.rows[0]
        ? {
            ruleId: commRes.rows[0].id,
            targetRole: commRes.rows[0].target_role,
            percentageBps: Number(commRes.rows[0].percentage_bps || 0),
          }
        : { agentCommissionPct: 2.5, retailerCommissionPct: 1.0 };

      const updateRes = await this.db.query(
        `UPDATE applications
         SET current_status = 'SUBMITTED',
             submission_idempotency_key = $1,
             form_data = $2,
             product_version_snapshot = $3,
             pricing_snapshot = $4,
             commission_snapshot = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [
          validated.submissionIdempotencyKey,
          JSON.stringify(validated.formData),
          app.product_version_snapshot || 1,
          JSON.stringify(pricingSnapshot),
          JSON.stringify(commissionSnapshot),
          validated.applicationId,
        ]
      );

      const updatedApp = updateRes.rows[0];

      await this.db.query(
        `INSERT INTO application_status_history (
          application_id, from_status, to_status, changed_by_user_id, notes
        ) VALUES ($1, 'DRAFT', 'SUBMITTED', $2, 'Application submitted by customer')`,
        [validated.applicationId, customerId]
      );

      await auditService.logEvent({
        actorUserId: customerId,
        action: 'APPLICATION_SUBMITTED',
        entityType: 'applications',
        entityId: validated.applicationId,
        metadata: {
          applicationNumber: updatedApp.application_number,
          submissionIdempotencyKey: validated.submissionIdempotencyKey,
        },
      });

      return this.formatApplication(updatedApp);
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError || err instanceof BadRequestError || err.statusCode === 409) {
        throw err;
      }
      logger.warn('[ApplicationsService] DB submitApplication failed, using memory store fallback');

      const app = memoryApplications.get(validated.applicationId);
      if (!app) {
        throw new NotFoundError('Application not found');
      }
      if (app.customerId !== customerId) {
        throw new ForbiddenError('Unauthorized access to application');
      }
      if (app.submissionIdempotencyKey === validated.submissionIdempotencyKey) {
        return app;
      }
      if (app.currentStatus !== 'DRAFT') {
        throw new BadRequestError(`Application cannot be submitted in status [${app.currentStatus}]`);
      }

      app.currentStatus = 'SUBMITTED';
      app.submissionIdempotencyKey = validated.submissionIdempotencyKey;
      app.formData = validated.formData;
      app.pricingRuleSnapshot = { feeType: 'FIXED', baseFee: 0, taxPercentage: 18 };
      app.commissionRuleSnapshot = { agentCommissionPct: 2.5, retailerCommissionPct: 1.0 };
      app.updatedAt = new Date().toISOString();
      memoryApplications.set(app.id, app);
      return app;
    }
  }

  /**
   * Resubmit application when additional information is requested.
   */
  async resubmitApplication(customerId: string, payload: any): Promise<FinServApplication> {
    const validated = resubmitApplicationSchema.parse(payload);

    try {
      const appRes = await this.db.query(
        'SELECT * FROM applications WHERE id = $1',
        [validated.applicationId]
      );

      if (appRes.rows.length === 0) {
        throw new NotFoundError('Application not found');
      }

      const app = appRes.rows[0];

      if (app.customer_id !== customerId) {
        throw new ForbiddenError('Unauthorized access to application');
      }

      if (app.current_status !== 'ADDITIONAL_INFORMATION_REQUIRED') {
        throw new BadRequestError(`Cannot resubmit application in status [${app.current_status}]. Must be ADDITIONAL_INFORMATION_REQUIRED.`);
      }

      const updateRes = await this.db.query(
        `UPDATE applications
         SET current_status = 'RESUBMITTED',
             form_data = $1,
             resubmitted_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [JSON.stringify(validated.formData), validated.applicationId]
      );

      const updatedApp = updateRes.rows[0];

      await this.db.query(
        `INSERT INTO application_status_history (
          application_id, from_status, to_status, changed_by_user_id, notes
        ) VALUES ($1, 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED', $2, $3)`,
        [validated.applicationId, customerId, validated.additionalNotes || 'Resubmitted with updated information']
      );

      return this.formatApplication(updatedApp);
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError || err instanceof BadRequestError) {
        throw err;
      }
      logger.warn('[ApplicationsService] DB resubmitApplication failed, using memory store fallback');

      const app = memoryApplications.get(validated.applicationId);
      if (!app) {
        throw new NotFoundError('Application not found');
      }
      if (app.customerId !== customerId) {
        throw new ForbiddenError('Unauthorized access to application');
      }
      if (app.currentStatus !== 'ADDITIONAL_INFORMATION_REQUIRED') {
        throw new BadRequestError(`Cannot resubmit application in status [${app.currentStatus}]. Must be ADDITIONAL_INFORMATION_REQUIRED.`);
      }

      app.currentStatus = 'RESUBMITTED';
      app.formData = validated.formData;
      app.resubmittedAt = new Date().toISOString();
      app.updatedAt = new Date().toISOString();
      memoryApplications.set(app.id, app);
      return app;
    }
  }

  /**
   * Customer cancels an application.
   */
  async cancelApplication(customerId: string, applicationId: string, reason?: string): Promise<FinServApplication> {
    try {
      const appRes = await this.db.query(
        'SELECT * FROM applications WHERE id = $1',
        [applicationId]
      );

      if (appRes.rows.length === 0) {
        throw new NotFoundError('Application not found');
      }

      const app = appRes.rows[0];

      if (app.customer_id !== customerId) {
        throw new ForbiddenError('Unauthorized access to application');
      }

      if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(app.current_status)) {
        throw new BadRequestError(`Cannot cancel application in terminal status [${app.current_status}]`);
      }

      const updateRes = await this.db.query(
        `UPDATE applications
         SET current_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [applicationId]
      );

      const updatedApp = updateRes.rows[0];

      await this.db.query(
        `INSERT INTO application_status_history (
          application_id, from_status, to_status, changed_by_user_id, notes
        ) VALUES ($1, $2, 'CANCELLED', $3, $4)`,
        [applicationId, app.current_status, customerId, reason || 'Cancelled by customer']
      );

      return this.formatApplication(updatedApp);
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError || err instanceof BadRequestError) {
        throw err;
      }
      logger.warn('[ApplicationsService] DB cancelApplication failed, using memory store fallback');

      const app = memoryApplications.get(applicationId);
      if (!app) {
        throw new NotFoundError('Application not found');
      }
      if (app.customerId !== customerId) {
        throw new ForbiddenError('Unauthorized access to application');
      }
      if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(app.currentStatus)) {
        throw new BadRequestError(`Cannot cancel application in terminal status [${app.currentStatus}]`);
      }

      app.currentStatus = 'CANCELLED';
      app.updatedAt = new Date().toISOString();
      memoryApplications.set(app.id, app);
      return app;
    }
  }

  /**
   * Update status (for staff/admin operations).
   */
  async updateStatus(staffUserId: string, payload: any): Promise<FinServApplication> {
    const validated = updateApplicationStatusSchema.parse(payload);

    try {
      const appRes = await this.db.query(
        'SELECT * FROM applications WHERE id = $1',
        [validated.applicationId]
      );

      if (appRes.rows.length === 0) {
        throw new NotFoundError('Application not found');
      }

      const app = appRes.rows[0];

      let updateQuery = `UPDATE applications SET current_status = $1, updated_at = CURRENT_TIMESTAMP`;
      const queryParams: any[] = [validated.newStatus];

      if (validated.newStatus === 'ADDITIONAL_INFORMATION_REQUIRED' && validated.notes) {
        updateQuery += `, additional_info_requested_notes = $2 WHERE id = $3 RETURNING *`;
        queryParams.push(validated.notes, validated.applicationId);
      } else {
        updateQuery += ` WHERE id = $2 RETURNING *`;
        queryParams.push(validated.applicationId);
      }

      const updateRes = await this.db.query(updateQuery, queryParams);
      const updatedApp = updateRes.rows[0];

      await this.db.query(
        `INSERT INTO application_status_history (
          application_id, from_status, to_status, changed_by_user_id, notes
        ) VALUES ($1, $2, $3, $4, $5)`,
        [validated.applicationId, app.current_status, validated.newStatus, staffUserId, validated.notes || null]
      );

      return this.formatApplication(updatedApp);
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        throw err;
      }
      logger.warn('[ApplicationsService] DB updateStatus failed, using memory store fallback');

      const app = memoryApplications.get(validated.applicationId);
      if (!app) {
        throw new NotFoundError('Application not found');
      }
      app.currentStatus = validated.newStatus as ApplicationStatus;
      if (validated.newStatus === 'ADDITIONAL_INFORMATION_REQUIRED' && validated.notes) {
        app.additionalInfoRequestedNotes = validated.notes;
      }
      app.updatedAt = new Date().toISOString();
      memoryApplications.set(app.id, app);
      return app;
    }
  }

  /**
   * Fetch customer's applications list.
   */
  async getCustomerApplications(customerId: string): Promise<FinServApplication[]> {
    try {
      const res = await this.db.query(
        'SELECT * FROM applications WHERE customer_id = $1 ORDER BY created_at DESC',
        [customerId]
      );

      const applications: FinServApplication[] = [];
      for (const row of res.rows) {
        applications.push(await this.formatApplication(row));
      }
      return applications;
    } catch (err) {
      logger.warn('[ApplicationsService] DB getCustomerApplications failed, using memory store fallback');
      return Array.from(memoryApplications.values()).filter(a => a.customerId === customerId);
    }
  }

  /**
   * Get single application by ID with ownership/permission check.
   */
  async getApplicationById(userId: string, applicationId: string): Promise<FinServApplication> {
    try {
      const res = await this.db.query(
        'SELECT * FROM applications WHERE id = $1',
        [applicationId]
      );

      if (res.rows.length === 0) {
        throw new NotFoundError('Application not found');
      }

      const app = res.rows[0];

      const userRes = await this.db.query(
        'SELECT r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.id = $1',
        [userId]
      );
      const role = userRes.rows[0]?.role;

      if (app.customer_id !== userId && !['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'AGENT'].includes(role)) {
        throw new ForbiddenError('Unauthorized access to application');
      }

      return this.formatApplication(app);
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) {
        throw err;
      }
      logger.warn('[ApplicationsService] DB getApplicationById failed, using memory store fallback');
      const app = memoryApplications.get(applicationId);
      if (!app) {
        throw new NotFoundError('Application not found');
      }
      if (app.customerId !== userId) {
        throw new ForbiddenError('Unauthorized access to application');
      }
      return app;
    }
  }

  /**
   * Dynamic preliminary eligibility calculator.
   */
  async evaluatePreliminaryEligibility(payload: {
    productId: string;
    monthlyIncome?: number;
    age?: number;
    employmentType?: string;
    creditScore?: number;
    requestedAmount?: number;
  }) {
    const { productId, monthlyIncome = 0, age = 0, employmentType = 'SALARIED', creditScore = 700, requestedAmount = 100000 } = payload;

    const rulesEvaluated: { rule: string; passed: boolean; details: string }[] = [];

    // Rule 1: Age check
    const minAge = 21;
    const maxAge = 65;
    const agePassed = age >= minAge && age <= maxAge;
    rulesEvaluated.push({
      rule: 'Age Eligibility (21 - 65 yrs)',
      passed: agePassed,
      details: age > 0 ? `Customer age is ${age}` : 'Age requirement not provided',
    });

    // Rule 2: Monthly Income check
    const minIncome = 25000;
    const incomePassed = monthlyIncome >= minIncome;
    rulesEvaluated.push({
      rule: 'Minimum Monthly Income (>= ₹25,000)',
      passed: incomePassed,
      details: `Monthly income provided is ₹${monthlyIncome.toLocaleString()}`,
    });

    // Rule 3: Credit Score / Risk Assessment check
    const minCreditScore = 650;
    const creditPassed = creditScore >= minCreditScore;
    rulesEvaluated.push({
      rule: 'Minimum Credit Score (>= 650)',
      passed: creditPassed,
      details: `Credit score evaluated is ${creditScore}`,
    });

    const isEligible = agePassed && incomePassed && creditPassed;
    const multiplier = employmentType === 'SALARIED' ? 10 : 8;
    const estimatedMaxAmount = isEligible ? Math.min(requestedAmount, monthlyIncome * multiplier) : 0;

    return {
      isEligible,
      estimatedMaxAmount,
      rulesEvaluated,
      isPreliminary: true,
      disclaimer: 'This is a preliminary estimation based on self-reported details and does not constitute a formal credit guarantee or final loan approval.',
    };
  }
}

export const applicationsService = new ApplicationsService();
