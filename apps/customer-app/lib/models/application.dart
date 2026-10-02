class ApplicationDocumentModel {
  final String id;
  final String applicationId;
  final String documentType;
  final String s3Key;
  final String fileName;
  final int fileSizeBytes;
  final String mimeType;
  final String status;
  final String? rejectionReason;
  final String uploadedAt;

  ApplicationDocumentModel({
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

  factory ApplicationDocumentModel.fromJson(Map<String, dynamic> json) {
    return ApplicationDocumentModel(
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

class StatusHistoryItem {
  final String id;
  final String? previousStatus;
  final String newStatus;
  final String? notes;
  final String createdAt;

  StatusHistoryItem({
    required this.id,
    this.previousStatus,
    required this.newStatus,
    this.notes,
    required this.createdAt,
  });

  factory StatusHistoryItem.fromJson(Map<String, dynamic> json) {
    return StatusHistoryItem(
      id: json['id'] ?? '',
      previousStatus: json['previousStatus'],
      newStatus: json['newStatus'] ?? '',
      notes: json['notes'],
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class FinServApplicationModel {
  final String id;
  final String applicationNumber;
  final String customerId;
  final String productId;
  final int productVersionSnapshot;
  final Map<String, dynamic> formData;
  final List<ApplicationDocumentModel> documents;
  final List<StatusHistoryItem> statusHistory;
  final String currentStatus;
  final int currentStep;
  final String? submissionIdempotencyKey;
  final String? additionalInfoRequestedNotes;
  final String? resubmittedAt;
  final String createdAt;
  final String updatedAt;

  FinServApplicationModel({
    required this.id,
    required this.applicationNumber,
    required this.customerId,
    required this.productId,
    required this.productVersionSnapshot,
    required this.formData,
    required this.documents,
    required this.statusHistory,
    required this.currentStatus,
    required this.currentStep,
    this.submissionIdempotencyKey,
    this.additionalInfoRequestedNotes,
    this.resubmittedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FinServApplicationModel.fromJson(Map<String, dynamic> json) {
    return FinServApplicationModel(
      id: json['id'] ?? '',
      applicationNumber: json['applicationNumber'] ?? '',
      customerId: json['customerId'] ?? '',
      productId: json['productId'] ?? '',
      productVersionSnapshot: json['productVersionSnapshot'] ?? 1,
      formData: json['formData'] is Map ? Map<String, dynamic>.from(json['formData']) : {},
      documents: (json['documents'] as List? ?? [])
          .map((d) => ApplicationDocumentModel.fromJson(d))
          .toList(),
      statusHistory: (json['statusHistory'] as List? ?? [])
          .map((h) => StatusHistoryItem.fromJson(h))
          .toList(),
      currentStatus: json['currentStatus'] ?? 'DRAFT',
      currentStep: json['currentStep'] ?? 1,
      submissionIdempotencyKey: json['submissionIdempotencyKey'],
      additionalInfoRequestedNotes: json['additionalInfoRequestedNotes'],
      resubmittedAt: json['resubmittedAt'],
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
    );
  }
}
