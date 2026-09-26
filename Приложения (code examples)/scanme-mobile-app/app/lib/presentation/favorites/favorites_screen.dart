import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/product_snapshot.dart';
import '../../data/repositories/favorite_repository.dart';
import '../common/product_snapshot_tile.dart';

final _favoriteSortProvider =
    NotifierProvider<_FavoriteSortNotifier, _FavoriteSort>(
      _FavoriteSortNotifier.new,
    );

class _FavoriteSortNotifier extends Notifier<_FavoriteSort> {
  @override
  _FavoriteSort build() => _FavoriteSort.savedAtDesc;

  void setSort(_FavoriteSort sort) {
    state = sort;
  }
}

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  static const routePath = '/favorites';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favorites = ref.watch(favoritesProvider);
    final sort = ref.watch(_favoriteSortProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Избранное'),
        actions: [
          PopupMenuButton<_FavoriteSort>(
            tooltip: 'Сортировка',
            onSelected: (value) =>
                ref.read(_favoriteSortProvider.notifier).setSort(value),
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: _FavoriteSort.savedAtDesc,
                child: Text('Сначала новые'),
              ),
              PopupMenuItem(
                value: _FavoriteSort.nameAsc,
                child: Text('По названию'),
              ),
              PopupMenuItem(
                value: _FavoriteSort.dangerDesc,
                child: Text('По опасности'),
              ),
            ],
          ),
        ],
      ),
      body: favorites.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) =>
            const Center(child: Text('Не удалось загрузить избранное')),
        data: (items) {
          final sortedItems = _sortItems(items, sort);
          if (sortedItems.isEmpty) {
            return const Center(
              child: Text('Добавленные в избранное продукты появятся здесь'),
            );
          }

          return ListView.separated(
            itemCount: sortedItems.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final snapshot = sortedItems[index];
              return ProductSnapshotTile(
                snapshot: snapshot,
                trailing: IconButton(
                  tooltip: 'Убрать из избранного',
                  onPressed: () async {
                    await ref
                        .read(favoriteRepositoryProvider)
                        .remove(snapshot.barcode);
                    ref
                      ..invalidate(favoritesProvider)
                      ..invalidate(favoriteStatusProvider(snapshot.barcode));
                  },
                  icon: const Icon(Icons.star),
                ),
                onTap: () => context.push(
                  '/result/${Uri.encodeComponent(snapshot.barcode)}',
                ),
              );
            },
          );
        },
      ),
    );
  }

  List<ProductSnapshot> _sortItems(
    List<ProductSnapshot> items,
    _FavoriteSort sort,
  ) {
    final sortedItems = [...items];
    switch (sort) {
      case _FavoriteSort.savedAtDesc:
        sortedItems.sort((a, b) => b.savedAt.compareTo(a.savedAt));
      case _FavoriteSort.nameAsc:
        sortedItems.sort(
          (a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()),
        );
      case _FavoriteSort.dangerDesc:
        sortedItems.sort(
          (a, b) => _dangerRank(
            b.overallDanger,
          ).compareTo(_dangerRank(a.overallDanger)),
        );
    }
    return sortedItems;
  }

  int _dangerRank(String level) {
    return switch (level) {
      'dangerous' => 3,
      'controversial' => 2,
      _ => 1,
    };
  }
}

enum _FavoriteSort { savedAtDesc, nameAsc, dangerDesc }
