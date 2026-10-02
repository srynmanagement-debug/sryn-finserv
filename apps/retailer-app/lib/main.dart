import 'package:flutter/material.dart';

void main() {
  runApp(const SrynRetailerApp());
}

class SrynRetailerApp extends StatelessWidget {
  const SrynRetailerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SRYN FinServ Retailer Portal',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F172A)),
        useMaterial3: true,
      ),
      home: const RetailerHomeScreen(),
    );
  }
}

class RetailerHomeScreen extends StatelessWidget {
  const RetailerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Retailer & Partner Portal'),
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.storefront, size: 64, color: Color(0xFF0F172A)),
            SizedBox(height: 16),
            Text(
              'Retailer Network',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('Customer Sourcing & Commission Tracking'),
          ],
        ),
      ),
    );
  }
}
