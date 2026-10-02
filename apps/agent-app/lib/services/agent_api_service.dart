import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:agent_app/models/agent_application.dart';

class AgentApiService {
  static final AgentApiService _instance = AgentApiService._internal();
  factory AgentApiService() => _instance;
  AgentApiService._internal();

  static const String baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:4000/api/v1');

  String? authToken;
  String? currentUserId;
  AgentProfileModel? agentProfile;
  bool isOfflineMode = false;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

  final List<AgentApplicationModel> _mockQueue = [
    AgentApplicationModel(
      id: 'app-001',
      applicationNumber: 'APP-2026-00101',
      customerId: 'cust-101',
      agentId: 'agent-101',
      productId: 'prod-001',
      productVersionSnapshot: 1,
      formData: {
        'fullName': 'Rahul Sharma',
        'monthlyIncome': 55000,
        'employmentType': 'SALARIED',
        'panNumber': 'ABCDE1234F',
        'requestedAmount': 150000,
      },
      documents: [
        AgentDocumentModel(
          id: 'doc-1',
          applicationId: 'app-001',
          documentType: 'PAN_CARD',
          s3Key: 'applications/app-001/PAN_CARD/pan.pdf',
          fileName: 'pan_card_rahul.pdf',
          fileSizeBytes: 450000,
          mimeType: 'application/pdf',
          status: 'PENDING_VERIFICATION',
          uploadedAt: '2026-10-01T10:00:00Z',
        ),
      ],
      statusHistory: [
        AgentStatusHistoryItem(id: 'h1', newStatus: 'SUBMITTED', createdAt: '2026-10-01T10:00:00Z', notes: 'Submitted by customer'),
        AgentStatusHistoryItem(id: 'h2', previousStatus: 'SUBMITTED', newStatus: 'UNDER_REVIEW', createdAt: '2026-10-01T11:00:00Z', notes: 'Claimed by agent'),
      ],
      currentStatus: 'UNDER_REVIEW',
      currentStep: 3,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T11:00:00Z',
    ),
    AgentApplicationModel(
      id: 'app-002',
      applicationNumber: 'APP-2026-00102',
      customerId: 'cust-102',
      productId: 'prod-002',
      productVersionSnapshot: 1,
      formData: {
        'fullName': 'Priya Verma',
        'monthlyIncome': 42000,
        'employmentType': 'SELF_EMPLOYED',
        'panNumber': 'PQRSW9876K',
      },
      documents: [],
      statusHistory: [
        AgentStatusHistoryItem(id: 'h3', newStatus: 'SUBMITTED', createdAt: '2026-10-02T08:30:00Z'),
      ],
      currentStatus: 'SUBMITTED',
      currentStep: 2,
      createdAt: '2026-10-02T08:30:00Z',
      updatedAt: '2026-10-02T08:30:00Z',
    ),
  ];

  Future<bool> login(String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: _headers,
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        authToken = data['token'];
        if (data['user'] != null) {
          currentUserId = data['user']['id'];
          agentProfile = AgentProfileModel.fromJson(data['user']);
        }
        isOfflineMode = false;
        return true;
      }
    } catch (e) {
      isOfflineMode = true;
    }

    // Offline Demo Fallback for Agent Testing
    authToken = 'demo-agent-token';
    currentUserId = '00000000-0000-0000-0000-000000000088';
    agentProfile = AgentProfileModel(
      id: currentUserId!,
      email: email,
      role: 'AGENT',
      fullName: 'Field Agent Demo',
      phoneNumber: '+91 9988776655',
    );
    return true;
  }

  Future<AgentProfileModel?> fetchAgentProfile() async {
    if (authToken == null) return agentProfile;
    try {
      final res = await http.get(Uri.parse('$baseUrl/auth/me'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        agentProfile = AgentProfileModel.fromJson(data);
        isOfflineMode = false;
        return agentProfile;
      }
    } catch (e) {
      isOfflineMode = true;
    }
    return agentProfile;
  }

  Future<void> logout() async {
    try {
      if (authToken != null && !isOfflineMode) {
        await http.post(Uri.parse('$baseUrl/auth/logout'), headers: _headers).timeout(const Duration(seconds: 3));
      }
    } catch (_) {}
    authToken = null;
    currentUserId = null;
    agentProfile = null;
  }

  Future<AgentDashboardMetrics> fetchDashboardMetrics() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/applications/agent/dashboard'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        isOfflineMode = false;
        return AgentDashboardMetrics.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    return AgentDashboardMetrics(
      assignedCount: 1,
      pendingInfoCount: 1,
      completedCount: 3,
      counts: {'SUBMITTED': 1, 'UNDER_REVIEW': 1, 'ADDITIONAL_INFORMATION_REQUIRED': 1, 'APPROVED': 2, 'REJECTED': 1},
      recentApplications: _mockQueue,
    );
  }

  Future<List<AgentApplicationModel>> fetchApplicationQueue({String? status, String? search}) async {
    try {
      final params = <String, String>{};
      if (status != null && status.isNotEmpty) params['status'] = status;
      if (search != null && search.isNotEmpty) params['search'] = search;

      final uri = Uri.parse('$baseUrl/applications/agent/queue').replace(queryParameters: params.isNotEmpty ? params : null);
      final res = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body)['data']['applications'] ?? [];
        isOfflineMode = false;
        return list.map((j) => AgentApplicationModel.fromJson(j)).toList();
      }
    } catch (e) {
      isOfflineMode = true;
    }

    if (status != null && status.isNotEmpty) {
      return _mockQueue.where((a) => a.currentStatus == status).toList();
    }
    return _mockQueue;
  }

  Future<AgentApplicationModel> fetchApplicationById(String id) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/applications/$id'), headers: _headers).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        isOfflineMode = false;
        return AgentApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    return _mockQueue.firstWhere((a) => a.id == id, orElse: () => _mockQueue.first);
  }

  Future<AgentApplicationModel> claimApplication(String applicationId) async {
    try {
      final res = await http.post(Uri.parse('$baseUrl/applications/$applicationId/claim'), headers: _headers)
          .timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        isOfflineMode = false;
        return AgentApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    final idx = _mockQueue.indexWhere((a) => a.id == applicationId);
    if (idx != -1) {
      final app = _mockQueue[idx];
      final claimed = AgentApplicationModel(
        id: app.id,
        applicationNumber: app.applicationNumber,
        customerId: app.customerId,
        agentId: currentUserId ?? 'agent-1',
        productId: app.productId,
        productVersionSnapshot: app.productVersionSnapshot,
        formData: app.formData,
        documents: app.documents,
        statusHistory: [
          ...app.statusHistory,
          AgentStatusHistoryItem(id: 'h-claim', previousStatus: app.currentStatus, newStatus: 'UNDER_REVIEW', notes: 'Claimed by field agent', createdAt: DateTime.now().toIso8601String()),
        ],
        currentStatus: 'UNDER_REVIEW',
        currentStep: app.currentStep,
        createdAt: app.createdAt,
        updatedAt: DateTime.now().toIso8601String(),
      );
      _mockQueue[idx] = claimed;
      return claimed;
    }
    throw Exception('Application not found');
  }

  Future<AgentApplicationModel> updateApplicationStatus({
    required String applicationId,
    required String newStatus,
    String? notes,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/applications/status'),
        headers: _headers,
        body: jsonEncode({
          'applicationId': applicationId,
          'newStatus': newStatus,
          if (notes != null) 'notes': notes,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        isOfflineMode = false;
        return AgentApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    final idx = _mockQueue.indexWhere((a) => a.id == applicationId);
    if (idx != -1) {
      final app = _mockQueue[idx];
      final updated = AgentApplicationModel(
        id: app.id,
        applicationNumber: app.applicationNumber,
        customerId: app.customerId,
        agentId: app.agentId,
        productId: app.productId,
        productVersionSnapshot: app.productVersionSnapshot,
        formData: app.formData,
        documents: app.documents,
        statusHistory: [
          ...app.statusHistory,
          AgentStatusHistoryItem(id: 'h-${DateTime.now().millisecondsSinceEpoch}', previousStatus: app.currentStatus, newStatus: newStatus, notes: notes, createdAt: DateTime.now().toIso8601String()),
        ],
        currentStatus: newStatus,
        currentStep: app.currentStep,
        additionalInfoRequestedNotes: newStatus == 'ADDITIONAL_INFORMATION_REQUIRED' ? notes : app.additionalInfoRequestedNotes,
        createdAt: app.createdAt,
        updatedAt: DateTime.now().toIso8601String(),
      );
      _mockQueue[idx] = updated;
      return updated;
    }
    throw Exception('Application not found');
  }

  Future<AgentDocumentModel> verifyDocument({
    required String documentId,
    required String status,
    String? rejectionReason,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/documents/$documentId/verify'),
        headers: _headers,
        body: jsonEncode({
          'status': status,
          if (rejectionReason != null) 'rejectionReason': rejectionReason,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        isOfflineMode = false;
        return AgentDocumentModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    return AgentDocumentModel(
      id: documentId,
      applicationId: 'app-001',
      documentType: 'PAN_CARD',
      s3Key: 'applications/app-001/PAN_CARD/pan.pdf',
      fileName: 'pan_card_rahul.pdf',
      fileSizeBytes: 450000,
      mimeType: 'application/pdf',
      status: status,
      rejectionReason: rejectionReason,
      uploadedAt: DateTime.now().toIso8601String(),
    );
  }
}
