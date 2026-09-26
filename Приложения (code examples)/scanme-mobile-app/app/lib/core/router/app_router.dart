import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../presentation/encyclopedia/encyclopedia_screen.dart';
import '../../presentation/favorites/favorites_screen.dart';
import '../../presentation/history/history_screen.dart';
import '../../presentation/result/result_screen.dart';
import '../../presentation/scanner/scanner_screen.dart';
import '../../presentation/settings/settings_screen.dart';
import '../../presentation/subscription/subscription_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: ScannerScreen.routePath,
    routes: [
      ShellRoute(
        builder: (context, state, child) => AppScaffold(child: child),
        routes: [
          GoRoute(
            path: ScannerScreen.routePath,
            builder: (context, state) => const ScannerScreen(),
          ),
          GoRoute(
            path: HistoryScreen.routePath,
            builder: (context, state) => const HistoryScreen(),
          ),
          GoRoute(
            path: EncyclopediaScreen.routePath,
            builder: (context, state) => const EncyclopediaScreen(),
          ),
          GoRoute(
            path: FavoritesScreen.routePath,
            builder: (context, state) => const FavoritesScreen(),
          ),
          GoRoute(
            path: SettingsScreen.routePath,
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
      GoRoute(
        path: ResultScreen.routePath,
        builder: (context, state) {
          final barcode = state.pathParameters['barcode'] ?? '';
          final recordScan = state.uri.queryParameters['recordScan'] == 'true';
          return ResultScreen(barcode: barcode, recordScan: recordScan);
        },
      ),
      GoRoute(
        path: SubscriptionScreen.routePath,
        builder: (context, state) => const SubscriptionScreen(),
      ),
    ],
  );
});

class AppScaffold extends StatelessWidget {
  const AppScaffold({required this.child, super.key});

  final Widget child;

  static const _tabs = [
    _NavigationTab(
      path: ScannerScreen.routePath,
      icon: Icons.qr_code_scanner,
      label: 'Сканер',
    ),
    _NavigationTab(
      path: HistoryScreen.routePath,
      icon: Icons.history,
      label: 'История',
    ),
    _NavigationTab(
      path: EncyclopediaScreen.routePath,
      icon: Icons.menu_book_outlined,
      label: 'Энциклопедия',
    ),
    _NavigationTab(
      path: FavoritesScreen.routePath,
      icon: Icons.star_border,
      label: 'Избранное',
    ),
    _NavigationTab(
      path: SettingsScreen.routePath,
      icon: Icons.settings,
      label: 'Настройки',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final selectedIndex = _tabs.indexWhere((tab) => location == tab.path);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex < 0 ? 0 : selectedIndex,
        onDestinationSelected: (index) => context.go(_tabs[index].path),
        destinations: [
          for (final tab in _tabs)
            NavigationDestination(icon: Icon(tab.icon), label: tab.label),
        ],
      ),
    );
  }
}

class _NavigationTab {
  const _NavigationTab({
    required this.path,
    required this.icon,
    required this.label,
  });

  final String path;
  final IconData icon;
  final String label;
}
