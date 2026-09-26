import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';

import '../../core/network/api_client.dart';
import '../models/substance.dart';

final substanceRepositoryProvider = Provider<SubstanceRepository>((ref) {
  return SubstanceRepository(apiClient: ref.watch(apiClientProvider));
});

class SubstanceRepository {
  SubstanceRepository({required ApiClient apiClient}) : _apiClient = apiClient;

  static const _boxName = 'substances_cache_v1';
  static const _versionKey = '__version__';

  final ApiClient _apiClient;

  Future<List<Substance>> getLocalSubstances() async {
    final box = await _openBox();
    await _seedIfNeeded(box);

    return box.values
        .whereType<Map>()
        .map((value) => Substance.fromJson(Map<String, dynamic>.from(value)))
        .where((item) => item.isActive)
        .toList(growable: false);
  }

  Future<List<Substance>> syncDelta() async {
    final box = await _openBox();
    await _seedIfNeeded(box);

    final since = box.get(_versionKey) as int? ?? 0;
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/v1/substances',
      queryParameters: {'since': since, 'limit': 200},
    );
    final payload = SubstanceListResponse.fromJson(response.data!);

    for (final item in payload.items) {
      if (item.isActive) {
        await box.put(item.id, item.toJson());
      } else {
        await box.delete(item.id);
      }
    }
    await box.put(_versionKey, payload.nextVersion);

    return getLocalSubstances();
  }

  Future<Box<dynamic>> _openBox() async {
    if (Hive.isBoxOpen(_boxName)) {
      return Hive.box<dynamic>(_boxName);
    }
    return Hive.openBox<dynamic>(_boxName);
  }

  Future<void> _seedIfNeeded(Box<dynamic> box) async {
    if (box.get(_versionKey) != null) {
      return;
    }

    final raw = await rootBundle.loadString('assets/substances_v1.json');
    final items = (jsonDecode(raw) as List<dynamic>)
        .whereType<Map>()
        .map((item) => Substance.fromJson(Map<String, dynamic>.from(item)))
        .toList(growable: false);

    var maxVersion = 0;
    for (final item in items) {
      await box.put(item.id, item.toJson());
      if (item.version > maxVersion) {
        maxVersion = item.version;
      }
    }
    await box.put(_versionKey, maxVersion);
  }
}
