import 'package:flutter_test/flutter_test.dart';
import 'package:agent_app/main.dart';
import 'package:agent_app/models/agent_application.dart';
import 'package:agent_app/services/agent_api_service.dart';

void main() {
  group('Agent App Models & Services Tests', () {
    test('AgentApplicationModel should parse JSON correctly', () {
      final json = {
        'id': 'app-123',
        'applicationNumber': 'APP-2026-9999',
        'customerId': 'cust-123',
        'agentId': 'agent-123',
        'productId': 'prod-123',
        'productVersionSnapshot': 1,
        'formData': {'fullName': 'Rajesh Kumar'},
        'documents': [
          {
            'id': 'doc-1',
            'applicationId': 'app-123',
            'documentType': 'PAN_CARD',
            's3Key': 'key/pan.pdf',
            'fileName': 'pan.pdf',
            'fileSizeBytes': 1000,
            'mimeType': 'application/pdf',
            'status': 'PENDING_VERIFICATION',
            'uploadedAt': '2026-10-01T12:00:00Z',
          }
        ],
        'statusHistory': [
          {'id': 'h-1', 'newStatus': 'SUBMITTED', 'createdAt': '2026-10-01T12:00:00Z'}
        ],
        'currentStatus': 'UNDER_REVIEW',
        'currentStep': 2,
        'createdAt': '2026-10-01T12:00:00Z',
        'updatedAt': '2026-10-01T12:00:00Z',
      };

      final app = AgentApplicationModel.fromJson(json);
      expect(app.id, equals('app-123'));
      expect(app.applicationNumber, equals('APP-2026-9999'));
      expect(app.documents.length, equals(1));
      expect(app.documents.first.documentType, equals('PAN_CARD'));
    });

    test('AgentDashboardMetrics should parse metrics correctly', () {
      final json = {
        'assignedCount': 5,
        'pendingInfoCount': 2,
        'completedCount': 10,
        'counts': {'SUBMITTED': 3, 'UNDER_REVIEW': 2, 'APPROVED': 8, 'REJECTED': 2},
        'recentApplications': [],
      };

      final metrics = AgentDashboardMetrics.fromJson(json);
      expect(metrics.assignedCount, equals(5));
      expect(metrics.pendingInfoCount, equals(2));
      expect(metrics.completedCount, equals(10));
      expect(metrics.counts['APPROVED'], equals(8));
    });

    test('AgentApiService claim and workflow status update flow', () async {
      final api = AgentApiService();
      final claimed = await api.claimApplication('app-002');
      expect(claimed.currentStatus, equals('UNDER_REVIEW'));
      expect(claimed.agentId, isNotNull);

      final updated = await api.updateApplicationStatus(
        applicationId: 'app-002',
        newStatus: 'ADDITIONAL_INFORMATION_REQUIRED',
        notes: 'Aadhaar Card copy is blurry',
      );
      expect(updated.currentStatus, equals('ADDITIONAL_INFORMATION_REQUIRED'));
      expect(updated.additionalInfoRequestedNotes, equals('Aadhaar Card copy is blurry'));
    });

    test('AgentApiService document verification flow', () async {
      final api = AgentApiService();
      final verified = await api.verifyDocument(documentId: 'doc-1', status: 'VERIFIED');
      expect(verified.status, equals('VERIFIED'));

      final rejected = await api.verifyDocument(
        documentId: 'doc-1',
        status: 'REJECTED',
        rejectionReason: 'Document expired',
      );
      expect(rejected.status, equals('REJECTED'));
      expect(rejected.rejectionReason, equals('Document expired'));
    });
  });

  group('Agent App Widget Tests', () {
    testWidgets('SrynAgentApp launches with Login screen', (WidgetTester tester) async {
      await tester.pumpWidget(const SrynAgentApp());
      await tester.pumpAndSettle();
      expect(find.text('Field Agent Portal'), findsOneWidget);
      expect(find.text('Sign In to Agent Portal'), findsOneWidget);
    });
  });
}
