import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:customer_app/models/product.dart';
import 'package:customer_app/models/form_schema.dart';
import 'package:customer_app/models/application.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String baseUrl = 'http://localhost:4000/api/v1';
  String? authToken;
  String? currentUserId;
  String? currentUserEmail;
  bool isOfflineMode = false;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

  // In-memory fallback mock database for app offline testing
  final List<ProductModel> _mockProducts = [
    ProductModel(
      id: '00000000-0000-0000-0000-000000000001',
      code: 'FD_CREDIT_CARD_V1',
      name: 'SRYN Secure FD Credit Card [DEMO]',
      categoryName: 'Credit Cards',
      status: 'ACTIVE',
      version: 1,
      description: 'Get up to 90% credit limit backed by your Fixed Deposit with 0 annual fees.',
      eligibilityRules: ['Min FD Amount: ₹10,000', 'Age 18 - 70 yrs', 'No CIBIL score mandatory'],
      documentRequirements: ['Aadhaar Card', 'PAN Card', 'FD Receipt / Deposit Proof'],
    ),
    ProductModel(
      id: '00000000-0000-0000-0000-000000000002',
      code: 'PERSONAL_LOAN_V1',
      name: 'SRYN Express Personal Loan [DEMO]',
      categoryName: 'Personal Loans',
      status: 'ACTIVE',
      version: 1,
      description: 'Instant personal loan up to ₹5,00,000 with flexible tenure from 12 to 60 months.',
      eligibilityRules: ['Min Monthly Income: ₹25,000', 'Age 21 - 60 yrs', 'Min CIBIL Score: 650'],
      documentRequirements: ['Aadhaar Card', 'PAN Card', '3 Months Bank Statements', 'Salary Slip / Income Proof'],
    ),
  ];

  final List<FinServApplicationModel> _mockUserApplications = [];

  Future<bool> login(String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: _headers,
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        authToken = data['token'];
        currentUserId = data['user']['id'];
        currentUserEmail = data['user']['email'];
        isOfflineMode = false;
        return true;
      }
    } catch (e) {
      isOfflineMode = true;
    }

    // Offline Demo Fallback
    authToken = 'demo-offline-token';
    currentUserId = '00000000-0000-0000-0000-000000000099';
    currentUserEmail = email;
    return true;
  }

  Future<List<ProductModel>> fetchProducts() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/products'), headers: _headers)
          .timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body)['data'];
        isOfflineMode = false;
        return list.map((json) => ProductModel.fromJson(json)).toList();
      }
    } catch (e) {
      isOfflineMode = true;
    }
    return _mockProducts;
  }

  Future<List<FormStepSchema>> fetchFormSchema(String productId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/forms/schema/$productId'), headers: _headers)
          .timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body)['data']['steps'] ?? [];
        isOfflineMode = false;
        return list.map((json) => FormStepSchema.fromJson(json)).toList();
      }
    } catch (e) {
      isOfflineMode = true;
    }

    return [
      FormStepSchema(
        stepNumber: 1,
        title: 'Personal Details [DEMO OFFLINE]',
        description: 'Demo mode: details will be processed in local offline state',
        fields: [
          FormFieldSchema(fieldKey: 'fullName', label: 'Full Name', fieldType: 'TEXT', isRequired: true),
          FormFieldSchema(fieldKey: 'email', label: 'Email Address', fieldType: 'EMAIL', isRequired: true),
          FormFieldSchema(fieldKey: 'panNumber', label: 'PAN Card Number', fieldType: 'TEXT', isRequired: true),
        ],
      ),
      FormStepSchema(
        stepNumber: 2,
        title: 'Income & Documents [DEMO OFFLINE]',
        fields: [
          FormFieldSchema(fieldKey: 'monthlyIncome', label: 'Monthly Net Income (₹)', fieldType: 'NUMBER', isRequired: true),
          FormFieldSchema(fieldKey: 'panCardDoc', label: 'Upload PAN Card', fieldType: 'FILE_UPLOAD', isRequired: true),
        ],
      ),
    ];
  }

  Future<Map<String, dynamic>> evaluatePreliminaryEligibility({
    required String productId,
    required double monthlyIncome,
    required int age,
    required String employmentType,
    required int creditScore,
    required double requestedAmount,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/applications/preliminary-eligibility'),
        headers: _headers,
        body: jsonEncode({
          'productId': productId,
          'monthlyIncome': monthlyIncome,
          'age': age,
          'employmentType': employmentType,
          'creditScore': creditScore,
          'requestedAmount': requestedAmount,
        }),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200) {
        isOfflineMode = false;
        return jsonDecode(res.body)['data'];
      }
    } catch (e) {
      isOfflineMode = true;
    }

    final agePassed = age >= 21 && age <= 65;
    final incomePassed = monthlyIncome >= 25000;
    final creditPassed = creditScore >= 650;
    final isEligible = agePassed && incomePassed && creditPassed;
    final multiplier = employmentType == 'SALARIED' ? 10 : 8;

    return {
      'isEligible': isEligible,
      'estimatedMaxAmount': isEligible ? (monthlyIncome * multiplier).clamp(0, requestedAmount) : 0,
      'isPreliminary': true,
      'disclaimer': '[DEMO OFFLINE PREVIEW] This is an offline preliminary estimation based on self-reported details and does not constitute a formal credit guarantee or final loan approval.',
      'rulesEvaluated': [
        {'rule': 'Age Eligibility (21 - 65 yrs)', 'passed': agePassed, 'details': 'Customer age is $age'},
        {'rule': 'Minimum Monthly Income (>= ₹25,000)', 'passed': incomePassed, 'details': 'Monthly income is ₹${monthlyIncome.toStringAsFixed(0)}'},
        {'rule': 'Minimum Credit Score (>= 650)', 'passed': creditPassed, 'details': 'Credit score is $creditScore'},
      ],
    };
  }

  Future<FinServApplicationModel> saveDraft({
    required String productId,
    required Map<String, dynamic> formData,
    required int currentStep,
    String? applicationId,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/applications/draft'),
        headers: _headers,
        body: jsonEncode({
          'productId': productId,
          'formData': formData,
          'currentStep': currentStep,
          if (applicationId != null) 'applicationId': applicationId,
        }),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200) {
        isOfflineMode = false;
        return FinServApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    // Offline Fallback - Tag application number explicitly as [OFFLINE DEMO]
    final appId = applicationId ?? '00000000-0000-0000-0000-000000000099';
    final now = DateTime.now().toIso8601String();

    final offlineApp = FinServApplicationModel(
      id: appId,
      applicationNumber: 'APP-DEMO-OFFLINE-${DateTime.now().millisecondsSinceEpoch}',
      customerId: currentUserId ?? 'customer-1',
      productId: productId,
      productVersionSnapshot: 1,
      formData: formData,
      documents: [],
      statusHistory: [],
      currentStatus: 'DRAFT',
      currentStep: currentStep,
      createdAt: now,
      updatedAt: now,
    );

    _mockUserApplications.add(offlineApp);
    return offlineApp;
  }

  Future<FinServApplicationModel> submitApplication({
    required String applicationId,
    required String submissionIdempotencyKey,
    required Map<String, dynamic> formData,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/applications/submit'),
        headers: _headers,
        body: jsonEncode({
          'applicationId': applicationId,
          'submissionIdempotencyKey': submissionIdempotencyKey,
          'formData': formData,
        }),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200 || res.statusCode == 201) {
        isOfflineMode = false;
        return FinServApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    // Offline Fallback - Tag application clearly
    final now = DateTime.now().toIso8601String();
    final offlineSubmitted = FinServApplicationModel(
      id: applicationId,
      applicationNumber: 'APP-DEMO-SUBMITTED-OFFLINE',
      customerId: currentUserId ?? 'customer-1',
      productId: '00000000-0000-0000-0000-000000000001',
      productVersionSnapshot: 1,
      formData: formData,
      documents: [],
      statusHistory: [
        StatusHistoryItem(id: 'h-demo', newStatus: 'SUBMITTED', notes: '[DEMO OFFLINE SUBMISSION - NOT RECORDED ON REAL SERVER]', createdAt: now)
      ],
      currentStatus: 'SUBMITTED',
      currentStep: 2,
      submissionIdempotencyKey: submissionIdempotencyKey,
      additionalInfoRequestedNotes: '[DEMO OFFLINE FALLBACK MODE]',
      createdAt: now,
      updatedAt: now,
    );

    _mockUserApplications.add(offlineSubmitted);
    return offlineSubmitted;
  }

  Future<Map<String, dynamic>> requestPresignedUrl({
    required String applicationId,
    required String documentType,
    required String fileName,
    required int fileSizeBytes,
    required String mimeType,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/documents/presigned-url'),
        headers: _headers,
        body: jsonEncode({
          'applicationId': applicationId,
          'documentType': documentType,
          'fileName': fileName,
          'fileSizeBytes': fileSizeBytes,
          'mimeType': mimeType,
        }),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200) {
        isOfflineMode = false;
        return jsonDecode(res.body)['data'];
      }
    } catch (e) {
      isOfflineMode = true;
    }

    final key = 'applications/$applicationId/$documentType/${DateTime.now().millisecondsSinceEpoch}_$fileName';
    return {
      'uploadUrl': 'https://sryn-finserv-uploads-dev.s3.ap-south-1.amazonaws.com/$key',
      's3Key': key,
      'expiresInSeconds': 900,
      'isOfflineDemo': true,
    };
  }

  Future<ApplicationDocumentModel> registerDocument({
    required String applicationId,
    required String documentType,
    required String s3Key,
    required String fileName,
    required int fileSizeBytes,
    required String mimeType,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/documents/register'),
        headers: _headers,
        body: jsonEncode({
          'applicationId': applicationId,
          'documentType': documentType,
          's3Key': s3Key,
          'fileName': fileName,
          'fileSizeBytes': fileSizeBytes,
          'mimeType': mimeType,
        }),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200 || res.statusCode == 201) {
        isOfflineMode = false;
        return ApplicationDocumentModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    return ApplicationDocumentModel(
      id: 'doc-demo-${DateTime.now().millisecondsSinceEpoch}',
      applicationId: applicationId,
      documentType: documentType,
      s3Key: s3Key,
      fileName: '[DEMO OFFLINE FILE] $fileName',
      fileSizeBytes: fileSizeBytes,
      mimeType: mimeType,
      status: 'PENDING_VERIFICATION',
      uploadedAt: DateTime.now().toIso8601String(),
    );
  }

  Future<List<FinServApplicationModel>> fetchMyApplications() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/applications/my-applications'), headers: _headers)
          .timeout(const Duration(seconds: 3));
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body)['data'];
        isOfflineMode = false;
        return list.map((json) => FinServApplicationModel.fromJson(json)).toList();
      }
    } catch (e) {
      isOfflineMode = true;
    }
    return _mockUserApplications;
  }
}
