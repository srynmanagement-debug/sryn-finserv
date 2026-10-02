import 'package:flutter/material.dart';

void main() {
  runApp(const SrynAgentApp());
}

class SrynAgentApp extends StatelessWidget {
  const SrynAgentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SRYN FinServ Agent Portal',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F172A)),
        useMaterial3: true,
      ),
      home: const AgentHomeScreen(),
    );
  }
}

class AgentHomeScreen extends StatelessWidget {
  const AgentHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Field Agent Portal'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.badge, size: 64, color: Color(0xFF0F172A)),
            SizedBox(height: 16),
            Text(
              'Agent Operations',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('Lead Generation & Customer Onboarding'),
          ],
        ),
      ),
    );
  }
}
