import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:retailer_app/models/retailer_partner.dart';

class RetailerApiService {
  static final RetailerApiService _instance = RetailerApiService._internal();
  factory RetailerApiService() => _instance;
  RetailerApiService._internal();

  static const String baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:4000/api/v1');

  String? authToken;
  String? currentUserId;
  PartnerProfileModel? partnerProfile;
  bool isOfflineMode = false;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

  final List<CustomerReferralModel> _mockReferrals = [
    CustomerReferralModel(
      id: 'ref-101',
      partnerId: 'ptr-001',
      referrerUserId: 'user-retailer-1',
      referralCode: 'RETAILER-001',
      customerName: 'Amit Verma',
      customerPhone: '+91 9811122233',
      customerEmail: 'amit.verma@example.com',
      productId: '00000000-0000-0000-0000-000000000001',
      status: 'CONVERTED',
      createdAt: '2026-10-01T09:00:00Z',
    ),
    CustomerReferralModel(
      id: 'ref-102',
      partnerId: 'ptr-001',
      referrerUserId: 'user-retailer-1',
      referralCode: 'RETAILER-001',
      customerName: 'Suresh Raina',
      customerPhone: '+91 9822233344',
      status: 'IN_PROGRESS',
      createdAt: '2026-10-02T10:30:00Z',
    ),
  ];

  final List<PartnerCommissionModel> _mockCommissions = [
    PartnerCommissionModel(
      id: 'comm-1',
      applicationId: 'app-101',
      beneficiaryRole: 'RETAILER',
      calculatedAmount: 1500.0,
      currency: 'INR',
      status: 'PENDING',
      createdAt: '2026-10-01T12:00:00Z',
    ),
    PartnerCommissionModel(
      id: 'comm-2',
      applicationId: 'app-100',
      beneficiaryRole: 'RETAILER',
      calculatedAmount: 3500.0,
      currency: 'INR',
      status: 'APPROVED',
      createdAt: '2026-09-28T14:00:00Z',
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
          partnerProfile = PartnerProfileModel(
            id: 'ptr-${data['user']['id']}',
            code: 'RETAILER-001',
            name: data['user']['name'] ?? 'Retailer Partner',
            contactEmail: data['user']['email'],
            partnerType: 'RETAILER',
            onboardingStatus: 'APPROVED',
          );
        }
        isOfflineMode = false;
        return true;
      }
    } catch (e) {
      isOfflineMode = true;
    }

    // Offline Demo Fallback
    authToken = 'demo-retailer-token';
    currentUserId = '00000000-0000-0000-0000-000000000077';
    partnerProfile = PartnerProfileModel(
      id: 'ptr-demo-001',
      code: 'RETAILER-001',
      name: 'SRYN Express Retail Store',
      organizationName: 'SRYN Partner Network Ltd',
      contactEmail: email,
      contactPhone: '+91 9876500000',
      partnerType: 'RETAILER',
      onboardingStatus: 'APPROVED',
      gstin: '27AAAAA0000A1Z5',
      panNumber: 'ABCDE1234F',
    );
    return true;
  }

  Future<PartnerProfileModel?> fetchPartnerProfile() async {
    if (authToken == null) return partnerProfile;
    try {
      final res = await http.get(Uri.parse('$baseUrl/partners/profile'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        partnerProfile = PartnerProfileModel.fromJson(data);
        isOfflineMode = false;
        return partnerProfile;
      }
    } catch (e) {
      isOfflineMode = true;
    }
    return partnerProfile;
  }

  Future<PartnerProfileModel> registerPartnerOnboarding({
    required String name,
    required String organizationName,
    required String contactEmail,
    required String contactPhone,
    required String partnerType,
    String? gstin,
    String? panNumber,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/partners/register'),
        headers: _headers,
        body: jsonEncode({
          'name': name,
          'organizationName': organizationName,
          'contactEmail': contactEmail,
          'contactPhone': contactPhone,
          'partnerType': partnerType,
          'gstin': gstin,
          'panNumber': panNumber,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200 || res.statusCode == 201) {
        isOfflineMode = false;
        partnerProfile = PartnerProfileModel.fromJson(jsonDecode(res.body)['data']);
        return partnerProfile!;
      }
    } catch (e) {
      isOfflineMode = true;
    }

    partnerProfile = PartnerProfileModel(
      id: 'ptr-demo-${DateTime.now().millisecondsSinceEpoch}',
      code: 'PTR-REG-${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      organizationName: organizationName,
      contactEmail: contactEmail,
      contactPhone: contactPhone,
      partnerType: partnerType,
      onboardingStatus: 'PENDING_REVIEW',
      gstin: gstin,
      panNumber: panNumber,
    );
    return partnerProfile!;
  }

  Future<void> logout() async {
    try {
      if (authToken != null && !isOfflineMode) {
        await http.post(Uri.parse('$baseUrl/auth/logout'), headers: _headers).timeout(const Duration(seconds: 3));
      }
    } catch (_) {}
    authToken = null;
    currentUserId = null;
    partnerProfile = null;
  }

  Future<PartnerDashboardMetrics> fetchDashboardMetrics() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/partners/dashboard'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        isOfflineMode = false;
        return PartnerDashboardMetrics.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    return PartnerDashboardMetrics(
      totalReferrals: _mockReferrals.length,
      referralCounts: {'INITIATED': 1, 'IN_PROGRESS': 1, 'CONVERTED': 1, 'REJECTED': 0},
      commissions: {'PENDING': 1500.0, 'APPROVED': 3500.0, 'PAYABLE': 2000.0, 'PAID': 5000.0},
      recentReferrals: _mockReferrals,
    );
  }

  Future<CustomerReferralModel> createCustomerReferral({
    required String customerName,
    required String customerPhone,
    String? customerEmail,
    String? productId,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/partners/referrals'),
        headers: _headers,
        body: jsonEncode({
          'customerName': customerName,
          'customerPhone': customerPhone,
          if (customerEmail != null) 'customerEmail': customerEmail,
          if (productId != null) 'productId': productId,
        }),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200 || res.statusCode == 201) {
        isOfflineMode = false;
        return CustomerReferralModel.fromJson(jsonDecode(res.body)['data']);
      }
    } catch (e) {
      isOfflineMode = true;
    }

    final referral = CustomerReferralModel(
      id: 'ref-${DateTime.now().millisecondsSinceEpoch}',
      partnerId: partnerProfile?.id ?? 'ptr-demo-001',
      referrerUserId: currentUserId ?? 'user-retailer-1',
      referralCode: partnerProfile?.code ?? 'RETAILER-001',
      customerName: customerName,
      customerPhone: customerPhone,
      customerEmail: customerEmail,
      productId: productId,
      status: 'INITIATED',
      createdAt: DateTime.now().toIso8601String(),
    );

    _mockReferrals.add(referral);
    return referral;
  }

  Future<List<CustomerReferralModel>> fetchCustomerReferrals() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/partners/referrals'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body)['data'];
        isOfflineMode = false;
        return list.map((j) => CustomerReferralModel.fromJson(j)).toList();
      }
    } catch (e) {
      isOfflineMode = true;
    }
    return _mockReferrals;
  }

  Future<List<PartnerCommissionModel>> fetchPartnerCommissions() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/partners/commissions'), headers: _headers)
          .timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body)['data'];
        isOfflineMode = false;
        return list.map((j) => PartnerCommissionModel.fromJson(j)).toList();
      }
    } catch (e) {
      isOfflineMode = true;
    }
    return _mockCommissions;
  }
}
