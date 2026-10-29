import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';

import 'app_theme.dart';

final themeControllerProvider =
    AsyncNotifierProvider<ThemeController, ThemeSettings>(ThemeController.new);

class ThemeSettings {
  const ThemeSettings({
    this.themeMode = ThemeMode.system,
    this.paletteId = AppTheme.defaultPaletteId,
  });

  final ThemeMode themeMode;
  final String paletteId;

  AppColorPalette get palette => AppTheme.paletteById(paletteId);

  ThemeSettings copyWith({ThemeMode? themeMode, String? paletteId}) {
    return ThemeSettings(
      themeMode: themeMode ?? this.themeMode,
      paletteId: paletteId ?? this.paletteId,
    );
  }
}

class ThemeController extends AsyncNotifier<ThemeSettings> {
  static const _boxName = 'settings_box';
  static const _themeModeKey = 'themeMode';
  static const _paletteIdKey = 'paletteId';

  @override
  Future<ThemeSettings> build() async {
    final box = await _openBox();
    return ThemeSettings(
      themeMode: _themeModeFromName(box.get(_themeModeKey) as String?),
      paletteId: box.get(_paletteIdKey) as String? ?? AppTheme.defaultPaletteId,
    );
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    final current = state.asData?.value ?? const ThemeSettings();
    final next = current.copyWith(themeMode: mode);
    state = AsyncData(next);
    final box = await _openBox();
    await box.put(_themeModeKey, mode.name);
  }

  Future<void> setPalette(String paletteId) async {
    final current = state.asData?.value ?? const ThemeSettings();
    final next = current.copyWith(paletteId: paletteId);
    state = AsyncData(next);
    final box = await _openBox();
    await box.put(_paletteIdKey, paletteId);
  }

  ThemeMode _themeModeFromName(String? name) {
    return ThemeMode.values.firstWhere(
      (mode) => mode.name == name,
      orElse: () => ThemeMode.system,
    );
  }

  Future<Box<dynamic>> _openBox() async {
    if (Hive.isBoxOpen(_boxName)) {
      return Hive.box<dynamic>(_boxName);
    }
    return Hive.openBox<dynamic>(_boxName);
  }
}
