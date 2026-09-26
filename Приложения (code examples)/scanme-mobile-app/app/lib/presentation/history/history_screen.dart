import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/history_repository.dart';
import '../common/product_snapshot_tile.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  static const routePath = '/history';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(historyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('История'),
        actions: [
          IconButton(
            tooltip: 'Очистить историю',
            onPressed: history.maybeWhen(
              data: (items) => items.isEmpty
                  ? null
                  : () async {
                      final confirmed = await _confirmClear(context);
                      if (!confirmed) {
                        return;
                      }
                      await ref.read(historyRepositoryProvider).clear();
                      ref.invalidate(historyProvider);
                    },
              orElse: () => null,
            ),
            icon: const Icon(Icons.delete_sweep_outlined),
          ),
        ],
      ),
      body: history.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) =>
            const Center(child: Text('Не удалось загрузить историю')),
        data: (items) {
          if (items.isEmpty) {
            return const Center(
              child: Text('Сканированные продукты появятся здесь'),
            );
          }

          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final snapshot = items[index];
              return Dismissible(
                key: ValueKey(
                  '${snapshot.savedAt.toIso8601String()}_${snapshot.barcode}',
                ),
                background: const ColoredBox(
                  color: Colors.red,
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Padding(
                      padding: EdgeInsets.only(right: 24),
                      child: Icon(Icons.delete, color: Colors.white),
                    ),
                  ),
                ),
                direction: DismissDirection.endToStart,
                onDismissed: (_) async {
                  await ref.read(historyRepositoryProvider).deleteAt(index);
                  ref.invalidate(historyProvider);
                },
                child: ProductSnapshotTile(
                  snapshot: snapshot,
                  onTap: () => context.push(
                    '/result/${Uri.encodeComponent(snapshot.barcode)}',
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<bool> _confirmClear(BuildContext context) async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Очистить историю?'),
            content: const Text(
              'Локальная история сканирований будет удалена.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Отмена'),
              ),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Очистить'),
              ),
            ],
          ),
        ) ??
        false;
  }
}
