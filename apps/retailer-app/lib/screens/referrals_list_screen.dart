import 'package:flutter/material.dart';
import 'package:retailer_app/services/retailer_api_service.dart';
import 'package:retailer_app/models/retailer_partner.dart';
import 'package:retailer_app/screens/new_referral_screen.dart';

class ReferralsListScreen extends StatefulWidget {
  const ReferralsListScreen({super.key});

  @override
  State<ReferralsListScreen> createState() => _ReferralsListScreenState();
}

class _ReferralsListScreenState extends State<ReferralsListScreen> {
  List<CustomerReferralModel> _referrals = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReferrals();
  }

  Future<void> _loadReferrals() async {
    try {
      final list = await RetailerApiService().fetchCustomerReferrals();
      if (mounted) {
        setState(() {
          _referrals = list;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'CONVERTED':
        return Colors.green;
      case 'REJECTED':
        return Colors.red;
      case 'IN_PROGRESS':
        return Colors.blue;
      case 'INITIATED':
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Customer Referrals'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _referrals.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.people_outline, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('No Customer Referrals Yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const NewReferralScreen()),
                          ).then((_) => _loadReferrals());
                        },
                        icon: const Icon(Icons.person_add),
                        label: const Text('Add First Referral'),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF047857), foregroundColor: Colors.white),
                      )
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadReferrals,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _referrals.length,
                    itemBuilder: (context, index) {
                      final ref = _referrals[index];
                      final statusColor = _getStatusColor(ref.status);

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
                                  Text(ref.customerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusColor.withAlpha(25),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: statusColor),
                                    ),
                                    child: Text(
                                      ref.status,
                                      style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('Mobile: ${ref.customerPhone}', style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                              if (ref.customerEmail != null)
                                Text('Email: ${ref.customerEmail}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Code: ${ref.referralCode}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF0F172A))),
                                  Text(ref.createdAt.split('T').first, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
