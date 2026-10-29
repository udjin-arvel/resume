import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_controller.dart';

/// Ширина контента, ниже которой «Режим» показывается колонкой (без сжатия подписей).
const _kThemeModeColumnBreakpoint = 420.0;

const _kThemeModeChoices = <({
  ThemeMode mode,
  IconData icon,
  String label,
})>[
  (mode: ThemeMode.system, icon: Icons.brightness_auto, label: 'Система'),
  (mode: ThemeMode.light, icon: Icons.light_mode, label: 'Светлая'),
  (mode: ThemeMode.dark, icon: Icons.dark_mode, label: 'Тёмная'),
];

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  static const routePath = '/settings';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeSettings =
        ref.watch(themeControllerProvider).asData?.value ??
        const ThemeSettings();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Настройки')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('Оформление', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          Text(
            'Выберите режим яркости и цветовую гамму интерфейса.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 20),
          Text('Режим', style: theme.textTheme.titleMedium),
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth < _kThemeModeColumnBreakpoint) {
                return _ThemeModeColumn(
                  themeSettings: themeSettings,
                  onChanged: (mode) => ref
                      .read(themeControllerProvider.notifier)
                      .setThemeMode(mode),
                );
              }
              return SegmentedButton<ThemeMode>(
                segments: [
                  for (final c in _kThemeModeChoices)
                    ButtonSegment<ThemeMode>(
                      value: c.mode,
                      icon: Icon(c.icon),
                      label: Text(c.label),
                    ),
                ],
                selected: {themeSettings.themeMode},
                onSelectionChanged: (selection) {
                  final mode = selection.firstOrNull;
                  if (mode != null) {
                    ref
                        .read(themeControllerProvider.notifier)
                        .setThemeMode(mode);
                  }
                },
              );
            },
          ),
          const SizedBox(height: 28),
          Text('Цветовая гамма', style: theme.textTheme.titleMedium),
          const SizedBox(height: 10),
          for (final palette in AppTheme.palettes)
            _PaletteTile(
              palette: palette,
              selected: palette.id == themeSettings.paletteId,
              onTap: () => ref
                  .read(themeControllerProvider.notifier)
                  .setPalette(palette.id),
            ),
        ],
      ),
    );
  }
}

class _ThemeModeColumn extends StatelessWidget {
  const _ThemeModeColumn({
    required this.themeSettings,
    required this.onChanged,
  });

  final ThemeSettings themeSettings;
  final ValueChanged<ThemeMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final c in _kThemeModeChoices) ...[
          _ThemeModeColumnTile(
            choice: c,
            selected: themeSettings.themeMode == c.mode,
            colorScheme: colorScheme,
            onTap: () => onChanged(c.mode),
          ),
          if (c != _kThemeModeChoices.last) const SizedBox(height: 8),
        ],
      ],
    );
  }
}

class _ThemeModeColumnTile extends StatelessWidget {
  const _ThemeModeColumnTile({
    required this.choice,
    required this.selected,
    required this.colorScheme,
    required this.onTap,
  });

  final ({ThemeMode mode, IconData icon, String label}) choice;
  final bool selected;
  final ColorScheme colorScheme;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        selected: selected,
        onTap: onTap,
        leading: Icon(choice.icon),
        title: Text(choice.label),
        trailing: selected
            ? Icon(Icons.check, color: colorScheme.primary)
            : Icon(Icons.radio_button_unchecked, color: colorScheme.outline),
      ),
    );
  }
}

class _PaletteTile extends StatelessWidget {
  const _PaletteTile({
    required this.palette,
    required this.selected,
    required this.onTap,
  });

  final AppColorPalette palette;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: palette.seedColor,
          child: selected ? const Icon(Icons.check, color: Colors.white) : null,
        ),
        title: Text(palette.label),
        subtitle: selected ? const Text('Выбрана') : null,
        trailing: selected
            ? Icon(Icons.radio_button_checked, color: colorScheme.primary)
            : const Icon(Icons.radio_button_unchecked),
      ),
    );
  }
}
