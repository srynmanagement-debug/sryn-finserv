import 'package:flutter/material.dart';
import 'package:customer_app/models/product.dart';
import 'package:customer_app/services/api_service.dart';
import 'package:customer_app/screens/application_wizard_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _incomeController = TextEditingController(text: '45000');
  final _ageController = TextEditingController(text: '28');
  final _creditScoreController = TextEditingController(text: '720');
  final _amountController = TextEditingController(text: '150000');

  bool _isEvaluating = false;
  Map<String, dynamic>? _eligibilityResult;

  Future<void> _evaluateEligibility() async {
    setState(() => _isEvaluating = true);
    try {
      final res = await ApiService().evaluatePreliminaryEligibility(
        productId: widget.product.id,
        monthlyIncome: double.tryParse(_incomeController.text) ?? 0,
        age: int.tryParse(_ageController.text) ?? 0,
        employmentType: 'SALARIED',
        creditScore: int.tryParse(_creditScoreController.text) ?? 700,
        requestedAmount: double.tryParse(_amountController.text) ?? 100000,
      );

      if (mounted) {
        setState(() {
          _eligibilityResult = res;
          _isEvaluating = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isEvaluating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;

    return Scaffold(
      appBar: AppBar(
        title: Text(p.name),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Card(
              color: Colors.white,
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    const SizedBox(height: 6),
                    Text(p.description ?? '', style: TextStyle(color: Colors.grey.shade700, fontSize: 14)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Requirements Accordion / Cards
            Card(
              color: Colors.white,
              elevation: 1,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Eligibility Requirements', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ...p.eligibilityRules.map((rule) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_outline, size: 18, color: Colors.green),
                          const SizedBox(width: 8),
                          Text(rule, style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                    )),
                    const Divider(height: 24),
                    const Text('Required Documents', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    ...p.documentRequirements.map((doc) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.description_outlined, size: 18, color: Colors.blue),
                          const SizedBox(width: 8),
                          Text(doc, style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                    )),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Preliminary Eligibility Check Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.analytics_outlined, color: Colors.blue),
                      SizedBox(width: 8),
                      Text('Preliminary Eligibility Preview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _incomeController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Monthly Income (₹)', isDense: true, border: OutlineInputBorder()),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _ageController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Age (Years)', isDense: true, border: OutlineInputBorder()),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _creditScoreController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Credit Score', isDense: true, border: OutlineInputBorder()),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _amountController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Req. Amount (₹)', isDense: true, border: OutlineInputBorder()),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _isEvaluating ? null : _evaluateEligibility,
                      child: _isEvaluating
                          ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text('Calculate Preliminary Eligibility'),
                    ),
                  ),
                  if (_eligibilityResult != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _eligibilityResult!['isEligible'] == true ? Colors.green.shade50 : Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: _eligibilityResult!['isEligible'] == true ? Colors.green.shade300 : Colors.orange.shade300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                _eligibilityResult!['isEligible'] == true ? Icons.check_circle : Icons.warning_amber,
                                color: _eligibilityResult!['isEligible'] == true ? Colors.green : Colors.orange,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _eligibilityResult!['isEligible'] == true ? 'Preliminarily Eligible!' : 'Ineligible based on input criteria',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _eligibilityResult!['isEligible'] == true ? Colors.green.shade900 : Colors.orange.shade900,
                                ),
                              ),
                            ],
                          ),
                          if (_eligibilityResult!['isEligible'] == true) ...[
                            const SizedBox(height: 4),
                            Text('Estimated Limit: ₹${(_eligibilityResult!['estimatedMaxAmount'] as num).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          ],
                          const SizedBox(height: 8),
                          Text(
                            _eligibilityResult!['disclaimer'] ?? '',
                            style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.black54),
                          ),
                        ],
                      ),
                    ),
                  ]
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Bottom CTA
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ApplicationWizardScreen(product: p),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Apply Now', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
