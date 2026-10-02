import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/main.dart';
import 'package:customer_app/models/product.dart';
import 'package:customer_app/models/form_schema.dart';
import 'package:customer_app/services/api_service.dart';

void main() {
  group('Customer App Models & Services', () {
    test('ProductModel should parse JSON correctly', () {
      final json = {
        'id': 'p-1',
        'code': 'FD_CARD',
        'name': 'FD Credit Card',
        'status': 'ACTIVE',
        'version': 1,
        'description': 'FD card',
        'eligibilityRules': ['Min FD ₹10k'],
        'documentRequirements': ['PAN Card'],
      };

      final product = ProductModel.fromJson(json);
      expect(product.id, equals('p-1'));
      expect(product.name, equals('FD Credit Card'));
      expect(product.eligibilityRules.length, equals(1));
    });

    test('FormFieldSchema should support conditional dependencies and multi-select', () {
      final fieldJson = {
        'fieldKey': 'existingLoanDetails',
        'label': 'Loan Details',
        'fieldType': 'MULTI_SELECT',
        'isRequired': true,
        'options': ['Home Loan', 'Car Loan', 'Personal Loan'],
        'dependsOnField': 'hasExistingLoans',
        'dependsOnValue': 'true',
      };

      final field = FormFieldSchema.fromJson(fieldJson);
      expect(field.fieldKey, equals('existingLoanDetails'));
      expect(field.fieldType, equals('MULTI_SELECT'));
      expect(field.dependsOnField, equals('hasExistingLoans'));
      expect(field.dependsOnValue, equals('true'));
      expect(field.options?.length, equals(3));
    });

    test('UserProfileModel should parse user profile response correctly', () {
      final userJson = {
        'id': 'user-123',
        'email': 'customer@sryn.local',
        'role': 'CUSTOMER',
        'full_name': 'John Doe',
        'phone_number': '+919876543210',
        'is_active': true,
      };

      final user = UserProfileModel.fromJson(userJson);
      expect(user.id, equals('user-123'));
      expect(user.fullName, equals('John Doe'));
      expect(user.role, equals('CUSTOMER'));
    });

    test('ApiService preliminary eligibility preview should evaluate rules', () async {
      final api = ApiService();
      final res = await api.evaluatePreliminaryEligibility(
        productId: 'p-1',
        monthlyIncome: 50000,
        age: 30,
        employmentType: 'SALARIED',
        creditScore: 750,
        requestedAmount: 200000,
      );

      expect(res['isEligible'], isTrue);
      expect(res['isPreliminary'], isTrue);
      expect((res['disclaimer'] as String).toLowerCase(), contains('preliminary estimation'));
    });

    test('ApiService preliminary eligibility should reject ineligible criteria', () async {
      final api = ApiService();
      final res = await api.evaluatePreliminaryEligibility(
        productId: 'p-1',
        monthlyIncome: 10000,
        age: 18,
        employmentType: 'SALARIED',
        creditScore: 500,
        requestedAmount: 200000,
      );

      expect(res['isEligible'], isFalse);
      expect(res['estimatedMaxAmount'], equals(0));
    });

    test('ApiService draft creation and idempotent submission flow', () async {
      final api = ApiService();
      final draft = await api.saveDraft(
        productId: '00000000-0000-0000-0000-000000000001',
        formData: {'fullName': 'Jane Doe', 'monthlyIncome': 60000},
        currentStep: 1,
      );

      expect(draft.currentStatus, equals('DRAFT'));
      expect(draft.formData['fullName'], equals('Jane Doe'));

      final submitted = await api.submitApplication(
        applicationId: draft.id,
        submissionIdempotencyKey: 'idemp_key_test_123',
        formData: {'fullName': 'Jane Doe', 'monthlyIncome': 60000},
      );

      expect(submitted.currentStatus, equals('SUBMITTED'));
      expect(submitted.submissionIdempotencyKey, equals('idemp_key_test_123'));
    });

    test('ApiService resubmission for ADDITIONAL_INFORMATION_REQUIRED status', () async {
      final api = ApiService();
      final draft = await api.saveDraft(
        productId: '00000000-0000-0000-0000-000000000001',
        formData: {'fullName': 'John Doe'},
        currentStep: 2,
      );

      final resubmitted = await api.resubmitApplication(
        applicationId: draft.id,
        formData: {'fullName': 'John Doe', 'updatedPan': 'ABCDE1234F'},
        resubmissionNotes: 'Updated PAN Card details provided',
      );

      expect(resubmitted.currentStatus, equals('RESUBMITTED'));
      expect(resubmitted.statusHistory.last.newStatus, equals('RESUBMITTED'));
      expect(resubmitted.statusHistory.last.notes, contains('Updated PAN'));
    });
  });

  group('Customer App Widget Tests', () {
    testWidgets('SrynCustomerApp launches successfully', (WidgetTester tester) async {
      await tester.pumpWidget(const SrynCustomerApp());
      await tester.pumpAndSettle(const Duration(seconds: 3));
      expect(find.text('Customer Login'), findsOneWidget);
    });
  });
}
