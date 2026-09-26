import 'package:flutter/material.dart';

import '../../data/models/product_snapshot.dart';

class ProductSnapshotTile extends StatelessWidget {
  const ProductSnapshotTile({
    required this.snapshot,
    required this.onTap,
    this.trailing,
    super.key,
  });

  final ProductSnapshot snapshot;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: _ProductThumb(imageUrl: snapshot.imageUrl),
      title: Text(snapshot.name, maxLines: 2, overflow: TextOverflow.ellipsis),
      subtitle: Text(_subtitle),
      trailing: trailing ?? _DangerDot(level: snapshot.overallDanger),
      onTap: onTap,
    );
  }

  String get _subtitle {
    final parts = [
      if (snapshot.brands.isNotEmpty) snapshot.brands,
      'Код: ${snapshot.barcode}',
    ];
    return parts.join(' · ');
  }
}

class _ProductThumb extends StatelessWidget {
  const _ProductThumb({required this.imageUrl});

  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: SizedBox.square(
        dimension: 56,
        child: imageUrl.isEmpty
            ? ColoredBox(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: const Icon(Icons.inventory_2_outlined),
              )
            : Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => const Icon(Icons.broken_image),
              ),
      ),
    );
  }
}

class _DangerDot extends StatelessWidget {
  const _DangerDot({required this.level});

  final String level;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = switch (level) {
      'dangerous' => colorScheme.error,
      'controversial' => Colors.orange,
      _ => Colors.green,
    };

    return Icon(Icons.circle, color: color, size: 14);
  }
}
