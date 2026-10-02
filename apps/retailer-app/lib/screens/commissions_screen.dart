import 'package:flutter/material.dart';
import 'package:retailer_app/services/retailer_api_service.dart';
import 'package:retailer_app/models/retailer_partner.dart';

class CommissionsScreen extends StatefulWidget {
  const CommissionsScreen({super.key});

  @override
  State<CommissionsScreen> createState() => _CommissionsScreenState();
}

class _CommissionsScreenState extends State<CommissionsScreen> {
  List<PartnerCommissionModel> _commissions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCommissions();
  }

  Future<void> _loadCommissions() async {
    try {
      final list = await RetailerApiService().fetchPartnerCommissions();
      if (mounted) {
        setState(() {
          _commissions = list;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PAID':
        return Colors.green;
      case 'PAYABLE':
      case 'APPROVED':
        return Colors.blue;
      case 'PENDING':
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalEarned = _commissions
        .where((c) => c.status == 'PAID' || c.status == 'APPROVED' || c.status == 'PAYABLE')
        .fold(0.0, (sum, c) => sum + c.calculatedAmount);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Commission Ledger & Earnings'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadCommissions,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Earnings Banner Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF064E3B), Color(0xFF0F172A)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Earned Commission', style: TextStyle(color: Colors.white70, fontSize: 13)),
                          const SizedBox(height: 6),
                          Text('₹${totalEarned.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF10B981), fontSize: 28, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.white.withAlpha(20), borderRadius: BorderRadius.circular(6)),
                            child: const Row(
                              children: [
                                Icon(Icons.shield_outlined, color: Colors.white70, size: 16),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Commissions are calculated via rule snapshots and settled according to company payout policy.',
                                    style: TextStyle(color: Colors.white70, fontSize: 10),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Ledger Records Header
                    const Text('Commission Ledger Entries (Append-Only)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    const SizedBox(height: 12),

                    if (_commissions.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                        child: const Center(child: Text('No commission ledger records found for your account.', style: TextStyle(color: Colors.grey))),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _commissions.length,
                        itemBuilder: (context, index) {
                          final comm = _commissions[index];
                          final statusColor = _getStatusColor(comm.status);

                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: statusColor.withAlpha(25),
                                child: Icon(Icons.currency_rupee, color: statusColor, size: 20),
                              ),
                              title: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('₹${comm.calculatedAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  Chip(
                                    label: Text(comm.status, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                    backgroundColor: statusColor.withAlpha(25),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                ],
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text('Application: ${comm.applicationId}', style: TextStyle(color: Colors.grey.shade600, fontSize: 11)),
                                  Text('Role: ${comm.beneficiaryRole} • Currency: ${comm.currency}', style: TextStyle(color: Colors.grey.shade500, fontSize: 10)),
                                ],
                              ),
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
}
