import 'package:flutter/material.dart';
import 'package:retailer_app/services/retailer_api_service.dart';
import 'package:retailer_app/main.dart';

class PartnerOnboardingScreen extends StatefulWidget {
  const PartnerOnboardingScreen({super.key});

  @override
  State<PartnerOnboardingScreen> createState() => _PartnerOnboardingScreenState();
}

class _PartnerOnboardingScreenState extends State<PartnerOnboardingScreen> {
  final _nameController = TextEditingController();
  final _orgController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _gstinController = TextEditingController();
  final _panController = TextEditingController();

  String _partnerType = 'RETAILER';
  bool _acceptedTerms = false;
  bool _isSubmitting = false;

  Future<void> _submitOnboarding() async {
    if (!_acceptedTerms) return;
    if (_nameController.text.isEmpty || _emailController.text.isEmpty || _phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete required fields (*)')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await RetailerApiService().registerPartnerOnboarding(
        name: _nameController.text.trim(),
        organizationName: _orgController.text.trim(),
        contactEmail: _emailController.text.trim(),
        contactPhone: _phoneController.text.trim(),
        partnerType: _partnerType,
        gstin: _gstinController.text.trim(),
        panNumber: _panController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Partner Onboarding application submitted for Admin Review!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const RetailerMainShell()),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Onboarding submission failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Partner Network Onboarding'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Register as Partner / Retailer',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Join the SRYN FinServ ecosystem to source loans, credit cards and earn structured commissions.',
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 24),

            // Partner Type Selection
            const Text('Partner Category *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Center(child: Text('Retailer Store')),
                    selected: _partnerType == 'RETAILER',
                    onSelected: (_) => setState(() => _partnerType = 'RETAILER'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ChoiceChip(
                    label: const Center(child: Text('Distributor Network')),
                    selected: _partnerType == 'DISTRIBUTOR',
                    onSelected: (_) => setState(() => _partnerType = 'DISTRIBUTOR'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Business & Contact Details Form
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Contact Person Name *', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _orgController,
              decoration: const InputDecoration(labelText: 'Organization / Store Name *', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Business Email *', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Contact Mobile Number *', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _panController,
              decoration: const InputDecoration(labelText: 'Business / Individual PAN Number', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _gstinController,
              decoration: const InputDecoration(labelText: 'GSTIN (Optional)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 24),

            // Declaration & Terms
            CheckboxListTile(
              value: _acceptedTerms,
              onChanged: (val) => setState(() => _acceptedTerms = val ?? false),
              title: const Text(
                'I declare that the business information provided is true and accurate. I agree to abide by SRYN FinServ partner partner code of conduct.',
                style: TextStyle(fontSize: 12),
              ),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _acceptedTerms && !_isSubmitting ? _submitOnboarding : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isSubmitting
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Submit Onboarding Application', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
