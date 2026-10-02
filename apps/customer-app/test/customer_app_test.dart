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

    test('FormFieldSchema and FormStepSchema should parse JSON correctly', () {
      final stepJson = {
        'stepNumber': 1,
        'title': 'Personal Details',
        'fields': [
          {'fieldKey': 'fullName', 'label': 'Full Name', 'fieldType': 'TEXT', 'isRequired': true},
        ],
      };

      final step = FormStepSchema.fromJson(stepJson);
      expect(step.title, equals('Personal Details'));
      expect(step.fields.first.fieldKey, equals('fullName'));
      expect(step.fields.first.isRequired, isTrue);
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
      expect(res['disclaimer'], contains('preliminary estimation'));
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
  });

  group('Customer App Widget Tests', () {
    testWidgets('SrynCustomerApp launches successfully', (WidgetTester tester) async {
      await tester.pumpWidget(const SrynCustomerApp());
      await tester.pumpAndSettle(const Duration(seconds: 3));
      expect(find.text('Customer Login'), findsOneWidget);
    });
  });
}
