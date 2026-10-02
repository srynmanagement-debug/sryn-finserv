import 'package:flutter/material.dart';
import 'package:agent_app/services/agent_api_service.dart';
import 'package:agent_app/models/agent_application.dart';
import 'package:agent_app/screens/agent_review_screen.dart';

class AgentQueueScreen extends StatefulWidget {
  const AgentQueueScreen({super.key});

  @override
  State<AgentQueueScreen> createState() => _AgentQueueScreenState();
}

class _AgentQueueScreenState extends State<AgentQueueScreen> {
  List<AgentApplicationModel> _queue = [];
  bool _isLoading = true;
  String? _selectedStatusFilter;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadQueue();
  }

  Future<void> _loadQueue() async {
    setState(() => _isLoading = true);
    try {
      final apps = await AgentApiService().fetchApplicationQueue(
        status: _selectedStatusFilter,
        search: _searchController.text.trim(),
      );
      if (mounted) {
        setState(() {
          _queue = apps;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _claimApplication(String applicationId) async {
    try {
      await AgentApiService().claimApplication(applicationId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application claimed for processing!'), backgroundColor: Colors.green),
        );
        _loadQueue();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to claim application: $e'), backgroundColor: Colors.red),
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
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Application Processing Queue'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by App Ref or Customer ID...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _loadQueue();
                      },
                    ),
                    border: const OutlineInputBorder(),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 12),
                  ),
                  onSubmitted: (_) => _loadQueue(),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      FilterChip(
                        label: const Text('All Statuses'),
                        selected: _selectedStatusFilter == null,
                        onSelected: (_) {
                          setState(() => _selectedStatusFilter = null);
                          _loadQueue();
                        },
                      ),
                      const SizedBox(width: 6),
                      ...['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RESUBMITTED', 'APPROVED', 'REJECTED'].map((st) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 6.0),
                          child: FilterChip(
                            label: Text(st.replaceAll('_', ' ')),
                            selected: _selectedStatusFilter == st,
                            onSelected: (selected) {
                              setState(() => _selectedStatusFilter = selected ? st : null);
                              _loadQueue();
                            },
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Main Queue List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _queue.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.search_off, size: 64, color: Colors.grey),
                            const SizedBox(height: 16),
                            const Text('No Matching Applications', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            Text('Try clearing filters or search query.', style: TextStyle(color: Colors.grey.shade600)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadQueue,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _queue.length,
                          itemBuilder: (context, index) {
                            final app = _queue[index];
                            final statusColor = _getStatusColor(app.currentStatus);
                            final isUnassigned = app.agentId == null || app.agentId!.isEmpty;

                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(app.applicationNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: statusColor.withAlpha(25),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: statusColor),
                                          ),
                                          child: Text(
                                            app.currentStatus.replaceAll('_', ' '),
                                            style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text('Customer: ${app.customerId}', style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                                    Text('Product ID: ${app.productId}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        if (isUnassigned)
                                          ElevatedButton.icon(
                                            onPressed: () => _claimApplication(app.id),
                                            icon: const Icon(Icons.touch_app, size: 16),
                                            label: const Text('Claim Application'),
                                            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade800, foregroundColor: Colors.white),
                                          )
                                        else
                                          Text('Assigned to Agent', style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontStyle: FontStyle.italic)),
                                        OutlinedButton.icon(
                                          onPressed: () {
                                            Navigator.of(context).push(
                                              MaterialPageRoute(builder: (_) => AgentReviewScreen(application: app)),
                                            ).then((_) => _loadQueue());
                                          },
                                          icon: const Icon(Icons.rate_review, size: 16),
                                          label: const Text('Review Application'),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
