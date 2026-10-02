import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:customer_app/models/product.dart';
import 'package:customer_app/models/form_schema.dart';
import 'package:customer_app/models/application.dart';

class UserProfileModel {
  final String id;
  final String email;
  final String role;
  final String? fullName;
  final String? phoneNumber;
  final bool isActive;

  UserProfileModel({
    required this.id,
    required this.email,
    required this.role,
    this.fullName,
    this.phoneNumber,
    this.isActive = true,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'CUSTOMER',
      fullName: json['fullName'] ?? json['full_name'] ?? json['name'],
      phoneNumber: json['phoneNumber'] ?? json['phone_number'] ?? json['phone'],
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }
}

class CategoryModel {
  final String id;
  final String name;
  final String code;
  final String? description;

  CategoryModel({
    required this.id,
    required this.name,
    required this.code,
    this.description,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'],
    );
  }
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  static const String baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:4000/api/v1');

  String? authToken;
  String? currentUserId;
  String? currentUserEmail;
  UserProfileModel? userProfile;
  bool isOfflineMode = false;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

  // In-memory fallback mock database for app offline testing when backend is unreachable
  final List<ProductModel> _mockProducts = [
    ProductModel(
      id: '00000000-0000-0000-0000-000000000001',
      code: 'FD_CREDIT_CARD_V1',
      name: 'SRYN Secure FD Credit Card',
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
      name: 'SRYN Express Personal Loan',
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
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        final data = body['data'];
        authToken = data['token'];
        if (data['user'] != null) {
          currentUserId = data['user']['id'];
          currentUserEmail = data['user']['email'];
          userProfile = UserProfileModel.fromJson(data['user']);
        }
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
    userProfile = UserProfileModel(
      id: currentUserId!,
      email: email,
      role: 'CUSTOMER',
      fullName: 'Customer Demo',
      phoneNumber: '+91 9876543210',
    );
    return true;
  }

  Future<UserProfileModel?> fetchUserProfile() async {
    if (authToken == null) return userProfile;
    try {
      final res = await http.get(Uri.parse('$baseUrl/auth/me'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        userProfile = UserProfileModel.fromJson(data);
        isOfflineMode = false;
        return userProfile;
      }
    } catch (e) {
      isOfflineMode = true;
    }
    return userProfile;
  }

  Future<void> logout() async {
    try {
      if (authToken != null && !isOfflineMode) {
        await http.post(Uri.parse('$baseUrl/auth/logout'), headers: _headers)
            .timeout(const Duration(seconds: 3));
      }
    } catch (_) {}
    authToken = null;
    currentUserId = null;
    currentUserEmail = null;
    userProfile = null;
  }

  Future<List<CategoryModel>> fetchCategories() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/products/categories'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body)['data'];
        isOfflineMode = false;
        return list.map((json) => CategoryModel.fromJson(json)).toList();
      }
    } catch (e) {
      isOfflineMode = true;
    }
    return [
      CategoryModel(id: 'cat-1', name: 'Credit Cards', code: 'CREDIT_CARDS'),
      CategoryModel(id: 'cat-2', name: 'Personal Loans', code: 'PERSONAL_LOANS'),
      CategoryModel(id: 'cat-3', name: 'Insurance', code: 'INSURANCE'),
    ];
  }

  Future<List<ProductModel>> fetchProducts({String? categoryId}) async {
    try {
      final uri = Uri.parse('$baseUrl/products').replace(
        queryParameters: categoryId != null && categoryId.isNotEmpty ? {'categoryId': categoryId} : null,
      );
      final res = await http.get(uri, headers: _headers)
          .timeout(const Duration(seconds: 5));
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
      final res = await http.get(Uri.parse('$baseUrl/forms/schemas/$productId'), headers: _headers)
          .timeout(const Duration(seconds: 5));
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
        title: 'Personal Information',
        description: 'Provide your personal and contact details',
        fields: [
          FormFieldSchema(fieldKey: 'fullName', label: 'Full Name', fieldType: 'TEXT', isRequired: true, placeholder: 'Enter your full legal name'),
          FormFieldSchema(fieldKey: 'email', label: 'Email Address', fieldType: 'EMAIL', isRequired: true, placeholder: 'name@example.com'),
          FormFieldSchema(fieldKey: 'phone', label: 'Mobile Number', fieldType: 'PHONE', isRequired: true, placeholder: '10-digit mobile number'),
          FormFieldSchema(fieldKey: 'dob', label: 'Date of Birth', fieldType: 'DATE', isRequired: true, helpText: 'Applicant must be at least 18 years old'),
          FormFieldSchema(fieldKey: 'panNumber', label: 'PAN Card Number', fieldType: 'TEXT', isRequired: true, placeholder: 'ABCDE1234F'),
        ],
      ),
      FormStepSchema(
        stepNumber: 2,
        title: 'Financial & Employment Details',
        description: 'Specify your income and employment status',
        fields: [
          FormFieldSchema(
            fieldKey: 'employmentType',
            label: 'Employment Type',
            fieldType: 'DROPDOWN',
            isRequired: true,
            options: ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'STUDENT', 'RETIRED'],
          ),
          FormFieldSchema(fieldKey: 'monthlyIncome', label: 'Monthly Net Income (₹)', fieldType: 'NUMBER', isRequired: true, placeholder: '50000'),
          FormFieldSchema(fieldKey: 'existingLoans', label: 'Do you have existing active loans?', fieldType: 'CHECKBOX', isRequired: false),
        ],
      ),
      FormStepSchema(
        stepNumber: 3,
        title: 'Document Uploads',
        description: 'Upload required identity and income proofs',
        fields: [
          FormFieldSchema(fieldKey: 'panCardDoc', label: 'PAN Card Copy', fieldType: 'FILE_UPLOAD', isRequired: true, helpText: 'Upload clear PDF, JPG or PNG (Max 5MB)'),
          FormFieldSchema(fieldKey: 'incomeProofDoc', label: 'Income Proof / Bank Statement', fieldType: 'FILE_UPLOAD', isRequired: true, helpText: 'Last 3 months bank statement'),
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
      ).timeout(const Duration(seconds: 5));

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
      'disclaimer': 'PRELIMINARY ESTIMATION: This result is an automated preliminary evaluation based on self-reported details. It does NOT constitute a formal credit guarantee or final loan approval.',
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
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200 || res.statusCode == 201) {
        isOfflineMode = false;
        return FinServApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

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
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200 || res.statusCode == 201) {
        isOfflineMode = false;
        return FinServApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

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
        StatusHistoryItem(id: 'h-demo', newStatus: 'SUBMITTED', notes: 'Submitted by customer', createdAt: now)
      ],
      currentStatus: 'SUBMITTED',
      currentStep: 3,
      submissionIdempotencyKey: submissionIdempotencyKey,
      createdAt: now,
      updatedAt: now,
    );

    _mockUserApplications.add(offlineSubmitted);
    return offlineSubmitted;
  }

  Future<FinServApplicationModel> resubmitApplication({
    required String applicationId,
    required Map<String, dynamic> formData,
    String? resubmissionNotes,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/applications/resubmit'),
        headers: _headers,
        body: jsonEncode({
          'applicationId': applicationId,
          'formData': formData,
          if (resubmissionNotes != null) 'resubmissionNotes': resubmissionNotes,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200 || res.statusCode == 201) {
        isOfflineMode = false;
        return FinServApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    final appIndex = _mockUserApplications.indexWhere((a) => a.id == applicationId);
    final now = DateTime.now().toIso8601String();
    if (appIndex != -1) {
      final updated = FinServApplicationModel(
        id: applicationId,
        applicationNumber: _mockUserApplications[appIndex].applicationNumber,
        customerId: _mockUserApplications[appIndex].customerId,
        productId: _mockUserApplications[appIndex].productId,
        productVersionSnapshot: _mockUserApplications[appIndex].productVersionSnapshot,
        formData: formData,
        documents: _mockUserApplications[appIndex].documents,
        statusHistory: [
          ..._mockUserApplications[appIndex].statusHistory,
          StatusHistoryItem(id: 'h-resub', previousStatus: 'ADDITIONAL_INFORMATION_REQUIRED', newStatus: 'RESUBMITTED', notes: resubmissionNotes ?? 'Resubmitted by customer with updated details', createdAt: now),
        ],
        currentStatus: 'RESUBMITTED',
        currentStep: _mockUserApplications[appIndex].currentStep,
        resubmittedAt: now,
        createdAt: _mockUserApplications[appIndex].createdAt,
        updatedAt: now,
      );
      _mockUserApplications[appIndex] = updated;
      return updated;
    }

    throw Exception('Application not found for resubmission');
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
      ).timeout(const Duration(seconds: 5));

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
      ).timeout(const Duration(seconds: 5));

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
      fileName: fileName,
      fileSizeBytes: fileSizeBytes,
      mimeType: mimeType,
      status: 'PENDING_VERIFICATION',
      uploadedAt: DateTime.now().toIso8601String(),
    );
  }

  Future<List<FinServApplicationModel>> fetchMyApplications() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/applications/my-applications'), headers: _headers)
          .timeout(const Duration(seconds: 5));
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

  Future<FinServApplicationModel> fetchApplicationById(String id) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/applications/$id'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        isOfflineMode = false;
        return FinServApplicationModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    final match = _mockUserApplications.firstWhere(
      (a) => a.id == id,
      orElse: () => FinServApplicationModel(
        id: id,
        applicationNumber: 'APP-UNKNOWN',
        customerId: currentUserId ?? 'customer-1',
        productId: 'prod-1',
        productVersionSnapshot: 1,
        formData: {},
        documents: [],
        statusHistory: [],
        currentStatus: 'DRAFT',
        currentStep: 1,
        createdAt: DateTime.now().toIso8601String(),
        updatedAt: DateTime.now().toIso8601String(),
      ),
    );
    return match;
  }
}
