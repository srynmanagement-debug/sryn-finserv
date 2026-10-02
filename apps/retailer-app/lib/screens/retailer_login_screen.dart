import 'package:flutter/material.dart';
import 'package:retailer_app/services/retailer_api_service.dart';
import 'package:retailer_app/screens/partner_onboarding_screen.dart';
import 'package:retailer_app/main.dart';

class RetailerLoginScreen extends StatefulWidget {
  const RetailerLoginScreen({super.key});

  @override
  State<RetailerLoginScreen> createState() => _RetailerLoginScreenState();
}

class _RetailerLoginScreenState extends State<RetailerLoginScreen> {
  final _emailController = TextEditingController(text: 'partner@sryn.local');
  final _passwordController = TextEditingController(text: 'Partner@123');
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final success = await RetailerApiService().login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );

      if (mounted && success) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const RetailerMainShell()),
        );
      }
    } catch (err) {
      setState(() {
        _errorMessage = 'Partner authentication failed. Check credentials.';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Center(
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withAlpha(30),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.storefront, size: 56, color: Color(0xFF10B981)),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Partner & Retailer Portal',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'SRYN FinServ — Customer Sourcing & Commission Ledger',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.green.shade200, fontSize: 13),
                  ),
                  const SizedBox(height: 36),
                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.red.shade900.withAlpha(100), borderRadius: BorderRadius.circular(8)),
                      child: Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
                    ),
                    const SizedBox(height: 16),
                  ],
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Partner Email',
                      labelStyle: TextStyle(color: Colors.grey),
                      prefixIcon: Icon(Icons.email_outlined, color: Colors.grey),
                      enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                      focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF10B981))),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      labelStyle: TextStyle(color: Colors.grey),
                      prefixIcon: Icon(Icons.lock_outline, color: Colors.grey),
                      enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                      focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Color(0xFF10B981))),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Sign In as Partner', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const PartnerOnboardingScreen()),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.green.shade300,
                      side: BorderSide(color: Colors.green.shade600),
                    ),
                    child: const Text('Register as New Retailer / Distributor'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
