import 'package:flutter/material.dart';
import 'package:retailer_app/services/retailer_api_service.dart';
import 'package:retailer_app/models/retailer_partner.dart';
import 'package:retailer_app/screens/new_referral_screen.dart';

class RetailerDashboardScreen extends StatefulWidget {
  const RetailerDashboardScreen({super.key});

  @override
  State<RetailerDashboardScreen> createState() => _RetailerDashboardScreenState();
}

class _RetailerDashboardScreenState extends State<RetailerDashboardScreen> {
  PartnerDashboardMetrics? _metrics;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMetrics();
  }

  Future<void> _loadMetrics() async {
    try {
      final results = await Future.wait([
        RetailerApiService().fetchDashboardMetrics(),
        RetailerApiService().fetchPartnerProfile(),
      ]);

      if (mounted) {
        setState(() {
          _metrics = results[0] as PartnerDashboardMetrics;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = RetailerApiService().partnerProfile;
    final partnerName = profile?.name ?? 'Partner Store';
    final status = profile?.onboardingStatus ?? 'APPROVED';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        title: Row(
          children: [
            const Icon(Icons.storefront, color: Color(0xFF10B981)),
            const SizedBox(width: 8),
            Text(partnerName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
                    // Onboarding Status Banner
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: status == 'APPROVED' ? const Color(0xFFDCFCE7) : Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: status == 'APPROVED' ? Colors.green : Colors.amber),
                      ),
                      child: Row(
                        children: [
                          Icon(status == 'APPROVED' ? Icons.check_circle : Icons.hourglass_top, color: status == 'APPROVED' ? Colors.green : Colors.amber.shade800),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  status == 'APPROVED' ? 'Account Active & Verified' : 'Onboarding Pending Admin Review',
                                  style: TextStyle(fontWeight: FontWeight.bold, color: status == 'APPROVED' ? Colors.green.shade900 : Colors.amber.shade900),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  status == 'APPROVED' ? 'Code: ${profile?.code ?? "RETAILER-001"} • Type: ${profile?.partnerType ?? "RETAILER"}' : 'Your registration details are currently under review.',
                                  style: const TextStyle(fontSize: 11, color: Colors.black87),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Quick Action Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const NewReferralScreen()),
                          ).then((_) => _loadMetrics());
                        },
                        icon: const Icon(Icons.person_add),
                        label: const Text('Initiate Customer Referral', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Commission Summary Cards
                    const Text('Commission Earnings Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildCommCard(
                            title: 'Pending',
                            amount: '₹${(_metrics?.commissions['PENDING'] ?? 0).toStringAsFixed(0)}',
                            color: Colors.amber.shade800,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildCommCard(
                            title: 'Approved',
                            amount: '₹${(_metrics?.commissions['APPROVED'] ?? 0).toStringAsFixed(0)}',
                            color: Colors.blue.shade800,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildCommCard(
                            title: 'Paid',
                            amount: '₹${(_metrics?.commissions['PAID'] ?? 0).toStringAsFixed(0)}',
                            color: Colors.green.shade800,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Referral Activity Breakdown
                    const Text('Referrals Activity Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 1,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: (_metrics?.referralCounts ?? {}).entries.map((e) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(e.key.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                                  Chip(
                                    label: Text('${e.value}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    backgroundColor: Colors.grey.shade100,
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

                    // Recent Customer Referrals List
                    const Text('Recent Sourced Customers', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    const SizedBox(height: 12),
                    if ((_metrics?.recentReferrals ?? []).isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                        child: const Center(child: Text('No customer referrals yet. Click Initiate Referral to start.', style: TextStyle(color: Colors.grey))),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _metrics!.recentReferrals.length,
                        itemBuilder: (context, index) {
                          final ref = _metrics!.recentReferrals[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: const CircleAvatar(
                                backgroundColor: Color(0xFFDCFCE7),
                                child: Icon(Icons.person, color: Colors.green),
                              ),
                              title: Text(ref.customerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              subtitle: Text('${ref.customerPhone} • Status: ${ref.status}', style: const TextStyle(fontSize: 12)),
                              trailing: Chip(
                                label: Text(ref.status, style: const TextStyle(fontSize: 10)),
                                backgroundColor: ref.status == 'CONVERTED' ? const Color(0xFFDCFCE7) : Colors.amber.shade50,
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

  Widget _buildCommCard({required String title, required String amount, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
          const SizedBox(height: 4),
          Text(amount, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}
