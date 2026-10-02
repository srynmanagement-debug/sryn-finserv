import 'package:flutter/material.dart';
import 'package:agent_app/services/agent_api_service.dart';
import 'package:agent_app/models/agent_application.dart';
import 'package:agent_app/screens/agent_review_screen.dart';

class AgentDashboardScreen extends StatefulWidget {
  const AgentDashboardScreen({super.key});

  @override
  State<AgentDashboardScreen> createState() => _AgentDashboardScreenState();
}

class _AgentDashboardScreenState extends State<AgentDashboardScreen> {
  AgentDashboardMetrics? _metrics;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMetrics();
  }

  Future<void> _loadMetrics() async {
    try {
      final data = await AgentApiService().fetchDashboardMetrics();
      if (mounted) {
        setState(() {
          _metrics = data;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
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
    final agent = AgentApiService().agentProfile;
    final agentName = agent?.fullName ?? agent?.email.split('@').first ?? 'Agent';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        title: Row(
          children: [
            const Icon(Icons.badge, color: Colors.blueAccent),
            const SizedBox(width: 8),
            Text('Agent Dashboard — $agentName', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadMetrics,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Overview Summary Cards
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricCard(
                            title: 'Active Processing',
                            value: '${_metrics?.assignedCount ?? 0}',
                            icon: Icons.pending_actions,
                            color: Colors.blue,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricCard(
                            title: 'Pending Info',
                            value: '${_metrics?.pendingInfoCount ?? 0}',
                            icon: Icons.contact_support,
                            color: Colors.orange,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricCard(
                            title: 'Completed',
                            value: '${_metrics?.completedCount ?? 0}',
                            icon: Icons.verified,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Processing Queue Breakdown
                    const Text('Status Breakdown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 1,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: (_metrics?.counts ?? {}).entries.map((e) {
                            final statusColor = _getStatusColor(e.key);
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(radius: 5, backgroundColor: statusColor),
                                      const SizedBox(width: 8),
                                      Text(e.key.replaceAll('_', ' '), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                                    ],
                                  ),
                                  Chip(
                                    label: Text('${e.value}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: statusColor)),
                                    backgroundColor: statusColor.withAlpha(25),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Recent Application Activity
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Recent Customer Applications', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                        if (AgentApiService().isOfflineMode)
                          const Text('DEMO OFFLINE MODE', style: TextStyle(fontSize: 10, color: Colors.orange, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if ((_metrics?.recentApplications ?? []).isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                        child: const Center(child: Text('No applications in queue.', style: TextStyle(color: Colors.grey))),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _metrics!.recentApplications.length,
                        itemBuilder: (context, index) {
                          final app = _metrics!.recentApplications[index];
                          final statusColor = _getStatusColor(app.currentStatus);

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 1,
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: CircleAvatar(
                                backgroundColor: Colors.blue.shade50,
                                child: const Icon(Icons.assignment, color: Color(0xFF0F172A)),
                              ),
                              title: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(app.applicationNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: statusColor.withAlpha(25),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: statusColor),
                                    ),
                                    child: Text(
                                      app.currentStatus.replaceAll('_', ' '),
                                      style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 6),
                                  Text('Customer ID: ${app.customerId}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                  Text('Submitted: ${app.createdAt.split('T').first}', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                                ],
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => AgentReviewScreen(application: app)),
                                ).then((_) => _loadMetrics());
                              },
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMetricCard({required String title, required String value, required IconData icon, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 2),
          Text(title, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
        ],
      ),
    );
  }
}
