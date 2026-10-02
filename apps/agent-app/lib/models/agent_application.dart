class AgentDocumentModel {
  final String id;
  final String applicationId;
  final String documentType;
  final String s3Key;
  final String fileName;
  final int fileSizeBytes;
  final String mimeType;
  final String status; // PENDING_VERIFICATION, VERIFIED, REJECTED
  final String? rejectionReason;
  final String uploadedAt;

  AgentDocumentModel({
    required this.id,
    required this.applicationId,
    required this.documentType,
    required this.s3Key,
    required this.fileName,
    required this.fileSizeBytes,
    required this.mimeType,
    required this.status,
    this.rejectionReason,
    required this.uploadedAt,
  });

  factory AgentDocumentModel.fromJson(Map<String, dynamic> json) {
    return AgentDocumentModel(
      id: json['id'] ?? '',
      applicationId: json['applicationId'] ?? '',
      documentType: json['documentType'] ?? '',
      s3Key: json['s3Key'] ?? '',
      fileName: json['fileName'] ?? '',
      fileSizeBytes: json['fileSizeBytes'] ?? 0,
      mimeType: json['mimeType'] ?? '',
      status: json['status'] ?? 'PENDING_VERIFICATION',
      rejectionReason: json['rejectionReason'],
      uploadedAt: json['uploadedAt'] ?? '',
    );
  }
}

class AgentStatusHistoryItem {
  final String id;
  final String? previousStatus;
  final String newStatus;
  final String? changedByUserId;
  final String? notes;
  final String createdAt;

  AgentStatusHistoryItem({
    required this.id,
    this.previousStatus,
    required this.newStatus,
    this.changedByUserId,
    this.notes,
    required this.createdAt,
  });

  factory AgentStatusHistoryItem.fromJson(Map<String, dynamic> json) {
    return AgentStatusHistoryItem(
      id: json['id'] ?? '',
      previousStatus: json['previousStatus'] ?? json['fromStatus'],
      newStatus: json['newStatus'] ?? json['toStatus'] ?? '',
      changedByUserId: json['changedByUserId'],
      notes: json['notes'],
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class AgentApplicationModel {
  final String id;
  final String applicationNumber;
  final String customerId;
  final String? agentId;
  final String productId;
  final int productVersionSnapshot;
  final Map<String, dynamic> formData;
  final List<AgentDocumentModel> documents;
  final List<AgentStatusHistoryItem> statusHistory;
  final String currentStatus;
  final int currentStep;
  final String? additionalInfoRequestedNotes;
  final String? resubmittedAt;
  final String createdAt;
  final String updatedAt;

  AgentApplicationModel({
    required this.id,
    required this.applicationNumber,
    required this.customerId,
    this.agentId,
    required this.productId,
    required this.productVersionSnapshot,
    required this.formData,
    required this.documents,
    required this.statusHistory,
    required this.currentStatus,
    required this.currentStep,
    this.additionalInfoRequestedNotes,
    this.resubmittedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AgentApplicationModel.fromJson(Map<String, dynamic> json) {
    return AgentApplicationModel(
      id: json['id'] ?? '',
      applicationNumber: json['applicationNumber'] ?? '',
      customerId: json['customerId'] ?? '',
      agentId: json['agentId'],
      productId: json['productId'] ?? '',
      productVersionSnapshot: json['productVersionSnapshot'] ?? 1,
      formData: json['formData'] is Map ? Map<String, dynamic>.from(json['formData']) : {},
      documents: (json['documents'] as List? ?? [])
          .map((d) => AgentDocumentModel.fromJson(d))
          .toList(),
      statusHistory: (json['statusHistory'] as List? ?? [])
          .map((h) => AgentStatusHistoryItem.fromJson(h))
          .toList(),
      currentStatus: json['currentStatus'] ?? 'SUBMITTED',
      currentStep: json['currentStep'] ?? 1,
      additionalInfoRequestedNotes: json['additionalInfoRequestedNotes'],
      resubmittedAt: json['resubmittedAt'],
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
    );
  }
}

class AgentDashboardMetrics {
  final int assignedCount;
  final int pendingInfoCount;
  final int completedCount;
  final Map<String, int> counts;
  final List<AgentApplicationModel> recentApplications;

  AgentDashboardMetrics({
    required this.assignedCount,
    required this.pendingInfoCount,
    required this.completedCount,
    required this.counts,
    required this.recentApplications,
  });

  factory AgentDashboardMetrics.fromJson(Map<String, dynamic> json) {
    final rawCounts = json['counts'] as Map? ?? {};
    final parsedCounts = <String, int>{};
    rawCounts.forEach((k, v) => parsedCounts[k.toString()] = (v as num).toInt());

    return AgentDashboardMetrics(
      assignedCount: json['assignedCount'] ?? 0,
      pendingInfoCount: json['pendingInfoCount'] ?? 0,
      completedCount: json['completedCount'] ?? 0,
      counts: parsedCounts,
      recentApplications: (json['recentApplications'] as List? ?? [])
          .map((a) => AgentApplicationModel.fromJson(a))
          .toList(),
    );
  }
}

class AgentProfileModel {
  final String id;
  final String email;
  final String role;
  final String? fullName;
  final String? phoneNumber;
  final bool isActive;

  AgentProfileModel({
    required this.id,
    required this.email,
    required this.role,
    this.fullName,
    this.phoneNumber,
    this.isActive = true,
  });

  factory AgentProfileModel.fromJson(Map<String, dynamic> json) {
    return AgentProfileModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'AGENT',
      fullName: json['fullName'] ?? json['full_name'] ?? json['name'],
      phoneNumber: json['phoneNumber'] ?? json['phone_number'] ?? json['phone'],
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }
}
