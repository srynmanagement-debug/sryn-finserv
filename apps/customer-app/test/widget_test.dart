import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/main.dart';

void main() {
  testWidgets('Customer App renders main widget', (WidgetTester tester) async {
    await tester.pumpWidget(const SrynCustomerApp());
    await tester.pumpAndSettle(const Duration(seconds: 3));
    expect(find.text('Customer Login'), findsOneWidget);
  });
}
