import { Router, Response } from 'express';
import { HierarchyService } from './hierarchy.service';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { sendSuccess } from '../../common/utils/response.util';

export const hierarchyRouter = Router();
const hierarchyService = new HierarchyService();

hierarchyRouter.use(requireAuth);

/**
 * GET /api/v1/hierarchy/team-leader/dashboard
 */
hierarchyRouter.get(
  '/team-leader/dashboard',
  requireRole(['TEAM_LEADER', 'MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const data = await hierarchyService.getTeamLeaderDashboard(req.user!.id);
      return sendSuccess(res, data, 'Team Leader dashboard metrics fetched successfully');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/hierarchy/team-leader/agents
 */
hierarchyRouter.get(
  '/team-leader/agents',
  requireRole(['TEAM_LEADER', 'MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const data = await hierarchyService.getTeamLeaderAgents(req.user!.id);
      return sendSuccess(res, data, 'Assigned agents performance list fetched successfully');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/hierarchy/team-leader/applications
 */
hierarchyRouter.get(
  '/team-leader/applications',
  requireRole(['TEAM_LEADER', 'MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const filters = {
        status: req.query.status as string,
        agentId: req.query.agentId as string,
        productId: req.query.productId as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };
      const data = await hierarchyService.getTeamLeaderApplications(req.user!.id, filters);
      return sendSuccess(res, data, 'Team applications queue fetched successfully');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/hierarchy/team-leader/partners
 */
hierarchyRouter.get(
  '/team-leader/partners',
  requireRole(['TEAM_LEADER', 'MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const filters = {
        onboardingStatus: req.query.onboardingStatus as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };
      const data = await hierarchyService.getTeamLeaderPartners(req.user!.id, filters);
      return sendSuccess(res, data, 'Assigned partner network fetched successfully');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/hierarchy/team-leader/reports
 */
hierarchyRouter.get(
  '/team-leader/reports',
  requireRole(['TEAM_LEADER', 'MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const data = await hierarchyService.getPerformanceReport('TEAM_LEADER', req.user!.id, req.query);
      return sendSuccess(res, data, 'Team Leader performance report generated successfully');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/hierarchy/manager/dashboard
 */
hierarchyRouter.get(
  '/manager/dashboard',
  requireRole(['MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const data = await hierarchyService.getManagerDashboard(req.user!.id);
      return sendSuccess(res, data, 'Manager dashboard metrics fetched successfully');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/hierarchy/manager/team-leaders
 */
hierarchyRouter.get(
  '/manager/team-leaders',
  requireRole(['MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const data = await hierarchyService.getManagerTeamLeaders(req.user!.id);
      return sendSuccess(res, data, 'Managed Team Leaders list fetched successfully');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/hierarchy/manager/applications
 */
hierarchyRouter.get(
  '/manager/applications',
  requireRole(['MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const filters = {
        teamLeaderId: req.query.teamLeaderId as string,
        agentId: req.query.agentId as string,
        status: req.query.status as string,
        productId: req.query.productId as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };
      const data = await hierarchyService.getManagerApplications(req.user!.id, filters);
      return sendSuccess(res, data, 'Manager application oversight list fetched successfully');
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/v1/hierarchy/manager/reports
 */
hierarchyRouter.get(
  '/manager/reports',
  requireRole(['MANAGER', 'SUPER_ADMIN']),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const data = await hierarchyService.getPerformanceReport('MANAGER', req.user!.id, req.query);
      return sendSuccess(res, data, 'Manager performance report generated successfully');
    } catch (err) {
      return next(err);
    }
  }
);
