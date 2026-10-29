import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'core/auth/auth_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_controller.dart';
import 'data/models/product_snapshot.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  if (!Hive.isAdapterRegistered(1)) {
    Hive.registerAdapter(ProductSnapshotAdapter());
  }

  await SentryFlutter.init((options) {
    options.dsn = const String.fromEnvironment('SENTRY_DSN');
    options.tracesSampleRate = 0.0;
    options.beforeSend = (event, hint) {
      event.request?.headers.remove('Authorization');
      return event;
    };
  }, appRunner: () => runApp(const ProviderScope(child: ScanMeApp())));
}

class ScanMeApp extends ConsumerWidget {
  const ScanMeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeSettings =
        ref.watch(themeControllerProvider).asData?.value ??
        const ThemeSettings();
    final palette = themeSettings.palette;
    ref.watch(authBootstrapProvider);

    return MaterialApp.router(
      title: 'ScanMe',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(palette),
      darkTheme: AppTheme.dark(palette),
      themeMode: themeSettings.themeMode,
      routerConfig: router,
    );
  }
}
