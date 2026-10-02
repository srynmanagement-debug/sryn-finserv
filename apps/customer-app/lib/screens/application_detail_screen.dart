import 'package:flutter/material.dart';
import 'package:customer_app/models/application.dart';
import 'package:customer_app/services/api_service.dart';

class ApplicationDetailScreen extends StatefulWidget {
  final FinServApplicationModel application;

  const ApplicationDetailScreen({super.key, required this.application});

  @override
  State<ApplicationDetailScreen> createState() => _ApplicationDetailScreenState();
}

class _ApplicationDetailScreenState extends State<ApplicationDetailScreen> {
  late FinServApplicationModel _app;
  bool _isResubmitting = false;
  final _resubmissionNotesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _app = widget.application;
  }

  Future<void> _handleResubmit() async {
    final notes = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Resubmit Information'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Provide additional details or explain the updated documents for review:', style: TextStyle(fontSize: 13)),
            const SizedBox(height: 12),
            TextField(
              controller: _resubmissionNotesController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter notes regarding requested information...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade800, foregroundColor: Colors.white),
            onPressed: () => Navigator.of(ctx).pop(_resubmissionNotesController.text.trim()),
            child: const Text('Submit Response'),
          ),
        ],
      ),
    );

    if (notes != null && mounted) {
      setState(() => _isResubmitting = true);
      try {
        final updated = await ApiService().resubmitApplication(
          applicationId: _app.id,
          formData: _app.formData,
          resubmissionNotes: notes.isNotEmpty ? notes : 'Updated information submitted by customer',
        );

        if (mounted) {
          setState(() {
            _app = updated;
            _isResubmitting = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Application resubmitted successfully for review!'), backgroundColor: Colors.green),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isResubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Resubmission failed: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'APPROVED':
        return Colors.green;
      case 'REJECTED':
      case 'CANCELLED':
        return Colors.red;
      case 'ADDITIONAL_INFORMATION_REQUIRED':
        return Colors.orange;
      case 'SUBMITTED':
      case 'RESUBMITTED':
      case 'UNDER_REVIEW':
        return Colors.blue;
      case 'DRAFT':
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(_app.currentStatus);

    return Scaffold(
      appBar: AppBar(
        title: Text(_app.applicationNumber),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Card(
              elevation: 1,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: statusColor.withAlpha(25),
                      child: Icon(Icons.info_outline, color: statusColor),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Current Status', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          Text(
                            _app.currentStatus.replaceAll('_', ' '),
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: statusColor),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Additional Notes & Resubmission Prompt
            if (_app.currentStatus == 'ADDITIONAL_INFORMATION_REQUIRED' || _app.additionalInfoRequestedNotes != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.shade300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.warning_amber, color: Colors.orange),
                        SizedBox(width: 8),
                        Text('Action Required', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(_app.additionalInfoRequestedNotes ?? 'Further details or documents are required for application review.', style: const TextStyle(fontSize: 13)),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isResubmitting ? null : _handleResubmit,
                        icon: const Icon(Icons.send, size: 16),
                        label: _isResubmitting
                            ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Resubmit Application Details'),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.orange.shade800, foregroundColor: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Application Data Summary
            const Text('Application Data Summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            Card(
              elevation: 1,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: _app.formData.entries.map((e) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(e.key, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                          Text(e.value?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Documents List
            const Text('Uploaded Application Documents', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            _app.documents.isEmpty
                ? const Text('No documents uploaded yet.', style: TextStyle(color: Colors.grey, fontSize: 13))
                : Column(
                    children: _app.documents.map((doc) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: const Icon(Icons.insert_drive_file, color: Colors.blue),
                          title: Text(doc.fileName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text('${doc.documentType} • ${(doc.fileSizeBytes / 1024).toStringAsFixed(0)} KB', style: const TextStyle(fontSize: 12)),
                          trailing: Chip(
                            label: Text(doc.status, style: const TextStyle(fontSize: 10)),
                            backgroundColor: doc.status == 'VERIFIED' ? Colors.green.shade50 : Colors.amber.shade50,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
            const SizedBox(height: 16),

            // Status History Timeline
            if (_app.statusHistory.isNotEmpty) ...[
              const Text('Status History Timeline', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              const SizedBox(height: 8),
              Card(
                elevation: 1,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: _app.statusHistory.map((history) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle, size: 18, color: Colors.blueAccent),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    history.newStatus.replaceAll('_', ' '),
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  if (history.notes != null) ...[
                                    const SizedBox(height: 2),
                                    Text(history.notes!, style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
                                  ],
                                  const SizedBox(height: 2),
                                  Text(history.createdAt, style: TextStyle(color: Colors.grey.shade500, fontSize: 10)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
