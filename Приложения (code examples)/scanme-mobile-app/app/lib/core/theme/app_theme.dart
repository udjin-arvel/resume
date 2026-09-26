import 'package:flutter/material.dart';

class AppTheme {
  static const defaultPaletteId = 'green';

  static const palettes = [
    AppColorPalette(
      id: defaultPaletteId,
      label: 'Зелёная',
      seedColor: Color(0xFF22C55E),
    ),
    AppColorPalette(id: 'blue', label: 'Синяя', seedColor: Color(0xFF2563EB)),
    AppColorPalette(
      id: 'purple',
      label: 'Пурпурная',
      seedColor: Color(0xFF9333EA),
    ),
    AppColorPalette(
      id: 'pastel_rose',
      label: 'Розовая',
      seedColor: Color(0xFFF472B6),
    ),
    AppColorPalette(
      id: 'pastel_mint',
      label: 'Мятная',
      seedColor: Color(0xFF5EEAD4),
    ),
    AppColorPalette(
      id: 'pastel_sand',
      label: 'Песочная',
      seedColor: Color(0xFFF59E0B),
    ),
  ];

  static AppColorPalette paletteById(String id) {
    return palettes.firstWhere(
      (palette) => palette.id == id,
      orElse: () => palettes.first,
    );
  }

  static ThemeData light(AppColorPalette palette) {
    return _buildTheme(Brightness.light, palette);
  }

  static ThemeData dark(AppColorPalette palette) {
    return _buildTheme(Brightness.dark, palette);
  }

  static ThemeData _buildTheme(Brightness brightness, AppColorPalette palette) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: palette.seedColor,
      brightness: brightness,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colorScheme.surface,
      appBarTheme: AppBarTheme(
        centerTitle: false,
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
      ),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: colorScheme.primaryContainer,
      ),
    );
  }
}

class AppColorPalette {
  const AppColorPalette({
    required this.id,
    required this.label,
    required this.seedColor,
  });

  final String id;
  final String label;
  final Color seedColor;
}
