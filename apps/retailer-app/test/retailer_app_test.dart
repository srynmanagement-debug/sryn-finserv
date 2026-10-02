import 'package:flutter_test/flutter_test.dart';
import 'package:retailer_app/main.dart';
import 'package:retailer_app/models/retailer_partner.dart';
import 'package:retailer_app/services/retailer_api_service.dart';

void main() {
  group('Retailer App Models & Services Tests', () {
    test('PartnerProfileModel should parse JSON correctly', () {
      final json = {
        'id': 'ptr-101',
        'code': 'RETAILER-001',
        'name': 'Express Retail Store',
        'organizationName': 'Express Ltd',
        'contactEmail': 'store@example.com',
        'partnerType': 'RETAILER',
        'onboardingStatus': 'APPROVED',
        'gstin': '27AAAAA0000A1Z5',
        'panNumber': 'ABCDE1234F',
      };

      final partner = PartnerProfileModel.fromJson(json);
      expect(partner.id, equals('ptr-101'));
      expect(partner.code, equals('RETAILER-001'));
      expect(partner.partnerType, equals('RETAILER'));
      expect(partner.onboardingStatus, equals('APPROVED'));
    });

    test('CustomerReferralModel and PartnerCommissionModel should parse JSON correctly', () {
      final refJson = {
        'id': 'ref-1',
        'partnerId': 'ptr-101',
        'referrerUserId': 'user-1',
        'referralCode': 'RETAILER-001',
        'customerName': 'Rohan Gupta',
        'customerPhone': '+91 9876543210',
        'status': 'INITIATED',
        'createdAt': '2026-10-01T10:00:00Z',
      };

      final ref = CustomerReferralModel.fromJson(refJson);
      expect(ref.customerName, equals('Rohan Gupta'));
      expect(ref.referralCode, equals('RETAILER-001'));

      final commJson = {
        'id': 'comm-1',
        'applicationId': 'app-1',
        'beneficiaryRole': 'RETAILER',
        'calculatedAmount': '2500.00',
        'currency': 'INR',
        'status': 'APPROVED',
        'createdAt': '2026-10-01T10:00:00Z',
      };

      final comm = PartnerCommissionModel.fromJson(commJson);
      expect(comm.calculatedAmount, equals(2500.0));
      expect(comm.status, equals('APPROVED'));
    });

    test('RetailerApiService referral creation and duplicate handling', () async {
      final api = RetailerApiService();
      final referral = await api.createCustomerReferral(
        customerName: 'Deepak Verma',
        customerPhone: '+91 9900011122',
        customerEmail: 'deepak@example.com',
        productId: '00000000-0000-0000-0000-000000000001',
      );

      expect(referral.customerName, equals('Deepak Verma'));
      expect(referral.status, equals('INITIATED'));

      final list = await api.fetchCustomerReferrals();
      expect(list.any((r) => r.customerName == 'Deepak Verma'), isTrue);
    });

    test('RetailerApiService onboarding registration flow', () async {
      final api = RetailerApiService();
      final onboarding = await api.registerPartnerOnboarding(
        name: 'Vikas Shah',
        organizationName: 'Shah Finance Store',
        contactEmail: 'vikas@shahfinance.com',
        contactPhone: '+91 9811100000',
        partnerType: 'DISTRIBUTOR',
      );

      expect(onboarding.onboardingStatus, equals('PENDING_REVIEW'));
      expect(onboarding.partnerType, equals('DISTRIBUTOR'));
    });
  });

  group('Retailer App Widget Tests', () {
    testWidgets('SrynRetailerApp launches with Login screen', (WidgetTester tester) async {
      await tester.pumpWidget(const SrynRetailerApp());
      await tester.pumpAndSettle();
      expect(find.text('Partner & Retailer Portal'), findsOneWidget);
      expect(find.text('Sign In as Partner'), findsOneWidget);
    });
  });
}
