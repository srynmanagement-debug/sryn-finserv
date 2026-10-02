import 'package:flutter/material.dart';
import 'package:retailer_app/screens/retailer_login_screen.dart';
import 'package:retailer_app/screens/retailer_dashboard_screen.dart';
import 'package:retailer_app/screens/referrals_list_screen.dart';
import 'package:retailer_app/screens/commissions_screen.dart';
import 'package:retailer_app/screens/retailer_profile_screen.dart';

void main() {
  runApp(const SrynRetailerApp());
}

class SrynRetailerApp extends StatelessWidget {
  const SrynRetailerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SRYN FinServ Partner Portal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F172A)),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          centerTitle: false,
        ),
      ),
      home: const RetailerLoginScreen(),
    );
  }
}

class RetailerMainShell extends StatefulWidget {
  const RetailerMainShell({super.key});

  @override
  State<RetailerMainShell> createState() => _RetailerMainShellState();
}

class _RetailerMainShellState extends State<RetailerMainShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    RetailerDashboardScreen(),
    ReferralsListScreen(),
    CommissionsScreen(),
    RetailerProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: const Color(0xFF0F172A),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        onTap: (idx) => setState(() => _currentIndex = idx),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Referrals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_outlined),
            activeIcon: Icon(Icons.account_balance_wallet),
            label: 'Commissions',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.storefront_outlined),
            activeIcon: Icon(Icons.storefront),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
