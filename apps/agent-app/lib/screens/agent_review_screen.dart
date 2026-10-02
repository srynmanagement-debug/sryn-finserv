import 'package:flutter/material.dart';
import 'package:agent_app/models/agent_application.dart';
import 'package:agent_app/services/agent_api_service.dart';

class AgentReviewScreen extends StatefulWidget {
  final AgentApplicationModel application;

  const AgentReviewScreen({super.key, required this.application});

  @override
  State<AgentReviewScreen> createState() => _AgentReviewScreenState();
}

class _AgentReviewScreenState extends State<AgentReviewScreen> {
  late AgentApplicationModel _app;
  bool _isProcessingAction = false;
  final _reviewNotesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _app = widget.application;
  }

  Future<void> _handleWorkflowAction(String targetStatus, String dialogTitle, String notesLabel) async {
    _reviewNotesController.clear();
    final notes = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(dialogTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Confirm transitioning application state to ${targetStatus.replaceAll('_', ' ')}:', style: const TextStyle(fontSize: 13)),
            const SizedBox(height: 12),
            TextField(
              controller: _reviewNotesController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: notesLabel,
                border: const OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: targetStatus == 'APPROVED' ? Colors.green.shade800 : targetStatus == 'REJECTED' ? Colors.red.shade800 : Colors.orange.shade800,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.of(ctx).pop(_reviewNotesController.text.trim()),
            child: const Text('Confirm Action'),
          ),
        ],
      ),
    );

    if (notes != null && mounted) {
      setState(() => _isProcessingAction = true);
      try {
        final updated = await AgentApiService().updateApplicationStatus(
          applicationId: _app.id,
          newStatus: targetStatus,
          notes: notes.isNotEmpty ? notes : 'Status updated by field agent',
        );

        if (mounted) {
          setState(() {
            _app = updated;
            _isProcessingAction = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Application status updated to ${targetStatus.replaceAll('_', ' ')}'), backgroundColor: Colors.green),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isProcessingAction = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Workflow action failed: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  Future<void> _verifyDocument(AgentDocumentModel doc, String status) async {
    String? rejectionReason;
    if (status == 'REJECTED') {
      final reasonController = TextEditingController();
      rejectionReason = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Reject Document'),
          content: TextField(
            controller: reasonController,
            decoration: const InputDecoration(hintText: 'Enter reason for document rejection...', border: OutlineInputBorder()),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
              onPressed: () => Navigator.of(ctx).pop(reasonController.text.trim()),
              child: const Text('Reject Document'),
            ),
          ],
        ),
      );
      if (rejectionReason == null) return;
    }

    try {
      final updatedDoc = await AgentApiService().verifyDocument(
        documentId: doc.id,
        status: status,
        rejectionReason: rejectionReason,
      );

      if (mounted) {
        setState(() {
          final docIdx = _app.documents.indexWhere((d) => d.id == doc.id);
          if (docIdx != -1) {
            _app.documents[docIdx] = updatedDoc;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Document marked as $status'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Document verification failed: $e'), backgroundColor: Colors.red),
        );
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
        title: Text('Review — ${_app.applicationNumber}'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status Header Card
                  Card(
                    elevation: 1,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: statusColor.withAlpha(25),
                            child: Icon(Icons.shield, color: statusColor),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Current Workflow Status', style: TextStyle(color: Colors.grey, fontSize: 12)),
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

                  // Submitted Form Data Summary
                  const Text('Customer Form Data', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
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

                  // Document Verification Section
                  const Text('Document Verification Queue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                  const SizedBox(height: 8),
                  if (_app.documents.isEmpty)
                    const Text('No documents attached to this application.', style: TextStyle(color: Colors.grey, fontSize: 13))
                  else
                    Column(
                      children: _app.documents.map((doc) {
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.insert_drive_file, color: Colors.blue),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(doc.fileName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    ),
                                    Chip(
                                      label: Text(doc.status, style: const TextStyle(fontSize: 10)),
                                      backgroundColor: doc.status == 'VERIFIED'
                                          ? const Color(0xFFDCFCE7)
                                          : doc.status == 'REJECTED'
                                              ? Colors.red.shade50
                                              : Colors.amber.shade50,
                                    ),
                                  ],
                                ),
                                if (doc.rejectionReason != null) ...[
                                  const SizedBox(height: 4),
                                  Text('Rejection Reason: ${doc.rejectionReason}', style: const TextStyle(color: Colors.red, fontSize: 12)),
                                ],
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    OutlinedButton.icon(
                                      onPressed: () => _verifyDocument(doc, 'REJECTED'),
                                      icon: const Icon(Icons.close, size: 14, color: Colors.red),
                                      label: const Text('Reject', style: TextStyle(color: Colors.red, fontSize: 12)),
                                    ),
                                    const SizedBox(width: 8),
                                    ElevatedButton.icon(
                                      onPressed: () => _verifyDocument(doc, 'VERIFIED'),
                                      icon: const Icon(Icons.check, size: 14),
                                      label: const Text('Verify', style: TextStyle(fontSize: 12)),
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade800, foregroundColor: Colors.white),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  const SizedBox(height: 16),

                  // Workflow History Timeline
                  if (_app.statusHistory.isNotEmpty) ...[
                    const Text('Status History & Notes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 1,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: _app.statusHistory.map((history) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6.0),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.history, size: 18, color: Colors.blueAccent),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(history.newStatus.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                        if (history.notes != null)
                                          Text('Notes: ${history.notes}', style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
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
          ),

          // Bottom Workflow Decision Action Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 4, offset: const Offset(0, -2))],
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isProcessingAction
                        ? null
                        : () => _handleWorkflowAction('ADDITIONAL_INFORMATION_REQUIRED', 'Request Additional Info', 'Notes for customer...'),
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.orange.shade900),
                    child: const Text('Req Info', style: TextStyle(fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isProcessingAction
                        ? null
                        : () => _handleWorkflowAction('REJECTED', 'Reject Application', 'Rejection reason...'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade800, foregroundColor: Colors.white),
                    child: const Text('Reject', style: TextStyle(fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isProcessingAction
                        ? null
                        : () => _handleWorkflowAction('APPROVED', 'Approve Application', 'Approval notes...'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade800, foregroundColor: Colors.white),
                    child: const Text('Approve', style: TextStyle(fontSize: 12)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
