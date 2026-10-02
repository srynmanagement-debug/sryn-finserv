class PartnerProfileModel {
  final String id;
  final String code;
  final String name;
  final String? organizationName;
  final String contactEmail;
  final String? contactPhone;
  final String partnerType; // RETAILER, DISTRIBUTOR
  final String onboardingStatus; // PENDING_REVIEW, APPROVED, REJECTED, ADDITIONAL_INFO_REQUIRED
  final String? gstin;
  final String? panNumber;
  final bool isActive;

  PartnerProfileModel({
    required this.id,
    required this.code,
    required this.name,
    this.organizationName,
    required this.contactEmail,
    this.contactPhone,
    required this.partnerType,
    required this.onboardingStatus,
    this.gstin,
    this.panNumber,
    this.isActive = true,
  });

  factory PartnerProfileModel.fromJson(Map<String, dynamic> json) {
    return PartnerProfileModel(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
      organizationName: json['organizationName'] ?? json['organization_name'],
      contactEmail: json['contactEmail'] ?? json['contact_email'] ?? '',
      contactPhone: json['contactPhone'] ?? json['contact_phone'],
      partnerType: json['partnerType'] ?? json['partner_type'] ?? 'RETAILER',
      onboardingStatus: json['onboardingStatus'] ?? json['onboarding_status'] ?? 'APPROVED',
      gstin: json['gstin'],
      panNumber: json['panNumber'] ?? json['pan_number'],
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }
}

class CustomerReferralModel {
  final String id;
  final String partnerId;
  final String referrerUserId;
  final String referralCode;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String? productId;
  final String? applicationId;
  final String status; // INITIATED, IN_PROGRESS, CONVERTED, REJECTED
  final String createdAt;

  CustomerReferralModel({
    required this.id,
    required this.partnerId,
    required this.referrerUserId,
    required this.referralCode,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    this.productId,
    this.applicationId,
    required this.status,
    required this.createdAt,
  });

  factory CustomerReferralModel.fromJson(Map<String, dynamic> json) {
    return CustomerReferralModel(
      id: json['id'] ?? '',
      partnerId: json['partnerId'] ?? json['partner_id'] ?? '',
      referrerUserId: json['referrerUserId'] ?? json['referrer_user_id'] ?? '',
      referralCode: json['referralCode'] ?? json['referral_code'] ?? '',
      customerName: json['customerName'] ?? json['customer_name'] ?? '',
      customerPhone: json['customerPhone'] ?? json['customer_phone'] ?? '',
      customerEmail: json['customerEmail'] ?? json['customer_email'],
      productId: json['productId'] ?? json['product_id'],
      applicationId: json['applicationId'] ?? json['application_id'],
      status: json['status'] ?? 'INITIATED',
      createdAt: json['createdAt'] ?? json['created_at'] ?? '',
    );
  }
}

class PartnerCommissionModel {
  final String id;
  final String applicationId;
  final String beneficiaryRole;
  final double calculatedAmount;
  final String currency;
  final String status; // PENDING, APPROVED, PAYABLE, PAID
  final String createdAt;

  PartnerCommissionModel({
    required this.id,
    required this.applicationId,
    required this.beneficiaryRole,
    required this.calculatedAmount,
    required this.currency,
    required this.status,
    required this.createdAt,
  });

  factory PartnerCommissionModel.fromJson(Map<String, dynamic> json) {
    return PartnerCommissionModel(
      id: json['id'] ?? '',
      applicationId: json['applicationId'] ?? json['application_id'] ?? '',
      beneficiaryRole: json['beneficiaryRole'] ?? json['beneficiary_role'] ?? 'RETAILER',
      calculatedAmount: (double.tryParse(json['calculatedAmount']?.toString() ?? json['calculated_amount']?.toString() ?? '0') ?? 0),
      currency: json['currency'] ?? 'INR',
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? json['created_at'] ?? '',
    );
  }
}

class PartnerDashboardMetrics {
  final int totalReferrals;
  final Map<String, int> referralCounts;
  final Map<String, double> commissions;
  final List<CustomerReferralModel> recentReferrals;

  PartnerDashboardMetrics({
    required this.totalReferrals,
    required this.referralCounts,
    required this.commissions,
    required this.recentReferrals,
  });

  factory PartnerDashboardMetrics.fromJson(Map<String, dynamic> json) {
    final rawRefCounts = json['referralCounts'] as Map? ?? {};
    final parsedRefCounts = <String, int>{};
    rawRefCounts.forEach((k, v) => parsedRefCounts[k.toString()] = (v as num).toInt());

    final rawComm = json['commissions'] as Map? ?? {};
    final parsedComm = <String, double>{};
    rawComm.forEach((k, v) => parsedComm[k.toString()] = (v as num).toDouble());

    return PartnerDashboardMetrics(
      totalReferrals: json['totalReferrals'] ?? 0,
      referralCounts: parsedRefCounts,
      commissions: parsedComm,
      recentReferrals: (json['recentReferrals'] as List? ?? [])
          .map((r) => CustomerReferralModel.fromJson(r))
          .toList(),
    );
  }
}
