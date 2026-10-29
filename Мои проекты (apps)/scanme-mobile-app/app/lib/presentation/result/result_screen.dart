import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/analytics/analytics_service.dart';
import '../../data/models/product.dart';
import '../../data/repositories/favorite_repository.dart';
import '../../data/repositories/history_repository.dart';
import '../../data/repositories/product_repository.dart';
import '../scanner/scanner_screen.dart';

class ResultScreen extends ConsumerWidget {
  const ResultScreen({
    required this.barcode,
    this.recordScan = false,
    super.key,
  });

  static const routePath = '/result/:barcode';

  final String barcode;
  final bool recordScan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productState = ref.watch(productByBarcodeProvider(barcode));

    final router = GoRouter.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Продукт'),
        automaticallyImplyLeading: false,
        leading: router.canPop()
            ? IconButton(
                tooltip: 'Назад',
                onPressed: () => router.pop(),
                icon: const Icon(Icons.arrow_back),
              )
            : null,
        actions: [
          IconButton(
            tooltip: 'В главное меню',
            onPressed: () => context.go(ScannerScreen.routePath),
            icon: const Icon(Icons.home_outlined),
          ),
        ],
      ),
      body: productState.when(
        loading: () => _LoadingProduct(barcode: barcode),
        error: (error, _) => _ProductError(
          barcode: barcode,
          message: _messageFor(error),
          onRetry: () => context.go(ScannerScreen.routePath),
        ),
        data: (product) =>
            _ProductResult(product: product, recordScan: recordScan),
      ),
    );
  }

  String _messageFor(Object error) {
    if (error is ProductRepositoryException) {
      return error.message;
    }
    return 'Не удалось загрузить продукт';
  }
}

class _LoadingProduct extends StatelessWidget {
  const _LoadingProduct({required this.barcode});

  final String barcode;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _SkeletonBox(height: 220, borderRadius: 28),
        const SizedBox(height: 20),
        _SkeletonBox(height: 28, widthFactor: 0.72),
        const SizedBox(height: 10),
        _SkeletonBox(height: 18, widthFactor: 0.42),
        const SizedBox(height: 18),
        Row(
          children: const [
            Expanded(child: _SkeletonBox(height: 44, borderRadius: 16)),
            SizedBox(width: 12),
            Expanded(child: _SkeletonBox(height: 44, borderRadius: 16)),
          ],
        ),
        const SizedBox(height: 28),
        Text('Загружаем продукт $barcode'),
        const SizedBox(height: 12),
        for (var index = 0; index < 4; index++) ...[
          const _SkeletonBox(height: 72, borderRadius: 18),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _SkeletonBox extends StatefulWidget {
  const _SkeletonBox({
    required this.height,
    this.widthFactor = 1,
    this.borderRadius = 12,
  });

  final double height;
  final double widthFactor;
  final double borderRadius;

  @override
  State<_SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<_SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return FractionallySizedBox(
      widthFactor: widget.widthFactor,
      alignment: Alignment.centerLeft,
      child: FadeTransition(
        opacity: Tween<double>(begin: 0.45, end: 0.9).animate(_controller),
        child: Container(
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            color: colorScheme.surfaceContainerHighest,
          ),
        ),
      ),
    );
  }
}

class _ProductResult extends ConsumerStatefulWidget {
  const _ProductResult({required this.product, required this.recordScan});

  final Product product;
  final bool recordScan;

  @override
  ConsumerState<_ProductResult> createState() => _ProductResultState();
}

class _ProductResultState extends ConsumerState<_ProductResult> {
  bool _recorded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(analyticsServiceProvider).track('result_opened', {
        'barcode': widget.product.barcode,
      });
    });
    _recordScanIfNeeded();
  }

  @override
  void didUpdateWidget(covariant _ProductResult oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.product.barcode != widget.product.barcode ||
        oldWidget.recordScan != widget.recordScan) {
      _recorded = false;
      _recordScanIfNeeded();
    }
  }

  void _recordScanIfNeeded() {
    if (!widget.recordScan || _recorded) {
      return;
    }
    _recorded = true;
    unawaited(ref.read(historyRepositoryProvider).recordScan(widget.product));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final product = widget.product;
    final favoriteState = ref.watch(favoriteStatusProvider(product.barcode));
    final isFavorite = favoriteState.when(
      data: (value) => value,
      error: (_, _) => false,
      loading: () => false,
    );

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _ProductHero(product: product),
        const SizedBox(height: 16),
        _ProductActions(
          isFavorite: isFavorite,
          onFavoritePressed: () async {
            await ref.read(favoriteRepositoryProvider).toggle(product);
            ref
              ..invalidate(favoriteStatusProvider(product.barcode))
              ..invalidate(favoritesProvider);
          },
          onSharePressed: () => _shareProduct(product),
        ),
        const SizedBox(height: 24),
        Text('Состав', style: theme.textTheme.titleLarge),
        const SizedBox(height: 8),
        if (product.ingredients.isEmpty)
          const _EmptyState(
            icon: Icons.list_alt,
            title: 'Состав не указан',
            message: 'У продукта нет данных об ингредиентах.',
          )
        else
          for (final ingredient in product.ingredients)
            _IngredientTile(
              ingredient: ingredient,
              matches: _matchesForIngredient(ingredient.text),
            ),
      ],
    );
  }

  List<MatchedSubstance> _matchesForIngredient(String text) {
    for (final match in widget.product.analysis.matches) {
      if (match.ingredientText.trim().toLowerCase() ==
          text.trim().toLowerCase()) {
        return match.substances;
      }
    }
    return const [];
  }

  Future<void> _shareProduct(Product product) {
    final danger = _dangerLabel(product.analysis.overallDanger);
    final text = [
      product.name,
      if (product.brands.isNotEmpty) product.brands,
      'Код: ${product.barcode}',
      'Оценка: $danger',
    ].join('\n');

    return SharePlus.instance.share(ShareParams(text: text));
  }
}

class _ProductActions extends StatelessWidget {
  const _ProductActions({
    required this.isFavorite,
    required this.onFavoritePressed,
    required this.onSharePressed,
  });

  final bool isFavorite;
  final VoidCallback onFavoritePressed;
  final VoidCallback onSharePressed;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final useVerticalLayout = constraints.maxWidth < 360;
        final favoriteButton = FilledButton.icon(
          onPressed: onFavoritePressed,
          icon: Icon(isFavorite ? Icons.star : Icons.star_border),
          label: _SingleLineButtonLabel(
            isFavorite ? 'В избранном' : 'В избранное',
          ),
        );
        final shareButton = OutlinedButton.icon(
          onPressed: onSharePressed,
          icon: const Icon(Icons.ios_share),
          label: const _SingleLineButtonLabel('Поделиться'),
        );

        if (useVerticalLayout) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [favoriteButton, const SizedBox(height: 10), shareButton],
          );
        }

        return Row(
          children: [
            Expanded(child: favoriteButton),
            const SizedBox(width: 12),
            Expanded(child: shareButton),
          ],
        );
      },
    );
  }
}

class _SingleLineButtonLabel extends StatelessWidget {
  const _SingleLineButtonLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      maxLines: 1,
      overflow: TextOverflow.fade,
      softWrap: false,
    );
  }
}

class _ProductHero extends StatelessWidget {
  const _ProductHero({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 10,
            child: product.imageUrl.isEmpty
                ? const _ImagePlaceholder()
                : Image.network(
                    product.imageUrl,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) {
                        return child;
                      }
                      return const _ProductImageSkeleton();
                    },
                    errorBuilder: (_, _, _) => const _ImagePlaceholder(),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _DangerBadge(level: product.analysis.overallDanger),
                const SizedBox(height: 12),
                Text(product.name, style: theme.textTheme.headlineSmall),
                if (product.brands.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(product.brands, style: theme.textTheme.bodyLarge),
                ],
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Chip(label: Text('Код: ${product.barcode}')),
                    Chip(label: Text(_sourceLabel(product.source))),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Скелетон под сетевое изображение в карточке (16:10), пока идёт загрузка.
class _ProductImageSkeleton extends StatelessWidget {
  const _ProductImageSkeleton();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return _SkeletonBox(
          height: constraints.maxHeight,
          widthFactor: 1,
          borderRadius: 0,
        );
      },
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: const Center(child: Icon(Icons.image_not_supported, size: 48)),
    );
  }
}

class _IngredientTile extends StatelessWidget {
  const _IngredientTile({required this.ingredient, required this.matches});

  final ProductIngredient ingredient;
  final List<MatchedSubstance> matches;

  @override
  Widget build(BuildContext context) {
    final color = _dangerColor(context, _tileDangerLevel);
    final subtitle = [
      if (ingredient.percent.isNotEmpty) 'Примерно ${ingredient.percent}',
      if (matches.isEmpty) 'Совпадений в справочнике не найдено',
    ].join(' · ');

    return Card(
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.16),
          foregroundColor: color,
          child: Icon(matches.isEmpty ? Icons.check : Icons.warning_amber),
        ),
        title: Text(ingredient.text),
        subtitle: subtitle.isEmpty ? null : Text(subtitle),
        children: [
          if (matches.isEmpty)
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('Деталей по этому ингредиенту пока нет.'),
              ),
            )
          else
            for (final substance in matches)
              _SubstanceDetails(substance: substance),
        ],
      ),
    );
  }

  String get _tileDangerLevel {
    if (matches.any((item) => item.dangerLevel == 'dangerous')) {
      return 'dangerous';
    }
    if (matches.any((item) => item.dangerLevel == 'controversial')) {
      return 'controversial';
    }
    return 'safe';
  }
}

class _SubstanceDetails extends StatelessWidget {
  const _SubstanceDetails({required this.substance});

  final MatchedSubstance substance;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(
                    substance.code.isEmpty
                        ? substance.name
                        : '${substance.code} · ${substance.name}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  _DangerBadge(level: substance.dangerLevel, compact: true),
                ],
              ),
              if (substance.description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(substance.description),
              ],
              const SizedBox(height: 8),
              SelectableText(
                substance.sources.isEmpty
                    ? 'Источник: справочник ScanMe'
                    : 'Источник: ${substance.sources.first}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DangerBadge extends StatelessWidget {
  const _DangerBadge({required this.level, this.compact = false});

  final String level;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final color = _dangerColor(context, level);

    return Chip(
      visualDensity: compact ? VisualDensity.compact : null,
      avatar: Icon(_dangerIcon(level), size: compact ? 16 : 18, color: color),
      label: Text(_dangerLabel(level)),
      backgroundColor: color.withValues(alpha: 0.14),
      labelStyle: TextStyle(color: color, fontWeight: FontWeight.w700),
      side: BorderSide(color: color.withValues(alpha: 0.28)),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(icon, size: 48, color: theme.colorScheme.outline),
            const SizedBox(height: 12),
            Text(title, style: theme.textTheme.titleMedium),
            const SizedBox(height: 6),
            Text(message, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

String _sourceLabel(String source) {
  return switch (source) {
    'cache' => 'Backend cache',
    'open_food_facts_direct' => 'OFF fallback',
    _ => 'Open Food Facts',
  };
}

String _dangerLabel(String level) {
  return switch (level) {
    'dangerous' => 'Опасно',
    'controversial' => 'Спорно',
    _ => 'Безопасно',
  };
}

IconData _dangerIcon(String level) {
  return switch (level) {
    'dangerous' => Icons.dangerous,
    'controversial' => Icons.warning_amber,
    _ => Icons.verified,
  };
}

Color _dangerColor(BuildContext context, String level) {
  final colorScheme = Theme.of(context).colorScheme;
  return switch (level) {
    'dangerous' => colorScheme.error,
    'controversial' => Colors.orange,
    _ => Colors.green,
  };
}

class _ProductError extends StatelessWidget {
  const _ProductError({
    required this.barcode,
    required this.message,
    required this.onRetry,
  });

  final String barcode;
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 64, color: colorScheme.error),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Код: $barcode',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Повторить'),
            ),
          ],
        ),
      ),
    );
  }
}
