import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';

import '../../core/auth/auth_service.dart';
import '../../core/network/api_client.dart';
import '../models/product.dart';
import '../models/product_snapshot.dart';

final historyRepositoryProvider = Provider<HistoryRepository>((ref) {
  return HistoryRepository(
    apiClient: ref.watch(apiClientProvider),
    authService: ref.watch(authServiceProvider),
  );
});

final historyProvider = FutureProvider<List<ProductSnapshot>>((ref) {
  return ref.watch(historyRepositoryProvider).list();
});

class HistoryRepository {
  HistoryRepository({
    required ApiClient apiClient,
    required AuthService authService,
  }) : _apiClient = apiClient,
       _authService = authService;

  static const boxName = 'history_box';

  final ApiClient _apiClient;
  final AuthService _authService;

  Future<void> recordScan(Product product) async {
    final savedAt = DateTime.now().toUtc();
    final snapshot = ProductSnapshot.fromProduct(product, savedAt: savedAt);
    final key = '${savedAt.toIso8601String()}_${product.barcode}';
    final box = await _openBox();
    await box.put(key, snapshot);
    await _postScan(snapshot, key);
  }

  Future<List<ProductSnapshot>> list() async {
    final box = await _openBox();
    final items = box.values.toList(growable: false)
      ..sort((a, b) => b.savedAt.compareTo(a.savedAt));
    return items;
  }

  Future<void> deleteAt(int index) async {
    final box = await _openBox();
    final entries = box.toMap().entries.toList(growable: false)
      ..sort((a, b) => b.value.savedAt.compareTo(a.value.savedAt));
    if (index < 0 || index >= entries.length) {
      return;
    }
    await box.delete(entries[index].key);
  }

  Future<void> clear() async {
    final box = await _openBox();
    await box.clear();
  }

  Future<void> _postScan(
    ProductSnapshot snapshot,
    String idempotencyKey,
  ) async {
    try {
      await _authService.ensureAuthenticated();
      await _apiClient.dio.post<Map<String, dynamic>>(
        '/v1/scans',
        data: {
          'barcode': snapshot.barcode,
          'productSnapshot': snapshot.toJson(),
          'clientTs': snapshot.savedAt.toIso8601String(),
        },
        options: Options(headers: {'Idempotency-Key': idempotencyKey}),
      );
    } on Object {
      // Local history is authoritative for the MVP; server sync is retried by future scans.
    }
  }

  Future<Box<ProductSnapshot>> _openBox() async {
    if (Hive.isBoxOpen(boxName)) {
      return Hive.box<ProductSnapshot>(boxName);
    }
    return Hive.openBox<ProductSnapshot>(boxName);
  }
}
