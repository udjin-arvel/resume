import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';

import '../models/product.dart';
import '../models/product_snapshot.dart';

final favoriteRepositoryProvider = Provider<FavoriteRepository>((ref) {
  return FavoriteRepository();
});

final favoriteStatusProvider = FutureProvider.family<bool, String>((
  ref,
  barcode,
) async {
  return ref.watch(favoriteRepositoryProvider).isFavorite(barcode);
});

final favoritesProvider = FutureProvider<List<ProductSnapshot>>((ref) {
  return ref.watch(favoriteRepositoryProvider).list();
});

class FavoriteRepository {
  static const boxName = 'favorites_box';

  Future<bool> isFavorite(String barcode) async {
    final box = await _openBox();
    return box.containsKey(barcode);
  }

  Future<bool> toggle(Product product) async {
    final box = await _openBox();
    if (box.containsKey(product.barcode)) {
      await box.delete(product.barcode);
      return false;
    }

    await box.put(product.barcode, ProductSnapshot.fromProduct(product));
    return true;
  }

  Future<List<ProductSnapshot>> list() async {
    final box = await _openBox();
    final items =
        box.values
            .map(_snapshotFromValue)
            .whereType<ProductSnapshot>()
            .toList(growable: false)
          ..sort((a, b) => b.savedAt.compareTo(a.savedAt));
    return items;
  }

  Future<void> remove(String barcode) async {
    final box = await _openBox();
    await box.delete(barcode);
  }

  ProductSnapshot? _snapshotFromValue(Object? value) {
    if (value is ProductSnapshot) {
      return value;
    }
    if (value is Map) {
      final savedAt = DateTime.tryParse(value['savedAt'] as String? ?? '');
      final productJson = value['product'];
      if (productJson is Map) {
        return ProductSnapshot.fromProduct(
          Product.fromJson(Map<String, dynamic>.from(productJson)),
          savedAt: savedAt?.toUtc(),
        );
      }
      return ProductSnapshot.fromJson(Map<String, dynamic>.from(value));
    }
    return null;
  }

  Future<Box<dynamic>> _openBox() async {
    if (Hive.isBoxOpen(boxName)) {
      return Hive.box<dynamic>(boxName);
    }
    return Hive.openBox<dynamic>(boxName);
  }
}
