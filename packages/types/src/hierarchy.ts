export interface TeamLeaderDashboardMetrics {
  teamLeaderId: string;
  assignedAgentsCount: number;
  activeApplicationsCount: number;
  pendingReviewsCount: number;
  approvedCount: number;
  rejectedCount: number;
  assignedPartnersCount: number;
  targetMetrics: {
    monthlyTargetApplications: number;
    currentAchievedApplications: number;
    targetProgressPct: number;
    effectiveFrom: string;
    effectiveTo?: string;
  };
  alerts: {
    id: string;
    type: 'PENDING_REVIEW' | 'DELAYED_APPLICATION' | 'PARTNER_APPROVAL';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
  }[];
}

export interface AgentPerformanceSummary {
  agentId: string;
  name: string;
  email: string;
  phone: string;
  activeLeads: number;
  submittedApplications: number;
  approvedApplications: number;
  targetApplications: number;
  conversionRatePct: number;
  isActive: boolean;
}

export interface ManagerDashboardMetrics {
  managerId: string;
  teamLeadersCount: number;
  agentsCount: number;
  partnersCount: number;
  pendingOnboardingCount: number;
  totalApplicationsCount: number;
  applicationsByStatus: Record<string, number>;
  regionalTargetMetrics: {
    monthlyTargetApplications: number;
    currentAchievedApplications: number;
    targetProgressPct: number;
    effectiveFrom: string;
  };
  alerts: {
    id: string;
    type: 'DELAYED_REVIEW' | 'PENDING_ONBOARDING' | 'TARGET_WARNING';
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
  }[];
}

export interface TeamLeaderSummary {
  teamLeaderId: string;
  name: string;
  email: string;
  phone: string;
  agentsCount: number;
  activeApplicationsCount: number;
  approvedApplicationsCount: number;
  targetApplications: number;
  targetProgressPct: number;
  isActive: boolean;
}
