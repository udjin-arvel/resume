import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../network/api_client.dart';

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  final api = ref.watch(apiClientProvider);
  final service = AnalyticsService(dio: api.dio);
  ref.onDispose(service.dispose);
  return service;
});

class AnalyticsService {
  AnalyticsService({required Dio dio}) : _dio = dio;

  static const _flushInterval = Duration(seconds: 30);
  static const _maxBatch = 20;

  final Dio _dio;
  final List<Map<String, dynamic>> _pending = [];
  final _uuid = const Uuid();
  Timer? _timer;

  void track(String name, [Map<String, dynamic>? props]) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) {
      return;
    }

    _pending.add({
      'name': trimmed,
      'props': props ?? <String, dynamic>{},
      'ts': DateTime.now().toUtc().toIso8601String(),
      'id': _uuid.v4(),
    });

    if (_pending.length >= _maxBatch) {
      unawaited(flush());
    } else {
      _ensureTimer();
    }
  }

  void _ensureTimer() {
    _timer ??= Timer(_flushInterval, () {
      _timer = null;
      unawaited(flush());
    });
  }

  Future<void> flush() async {
    _timer?.cancel();
    _timer = null;
    if (_pending.isEmpty) {
      return;
    }

    final batch = List<Map<String, dynamic>>.from(_pending);
    _pending.clear();

    try {
      await _dio.post<Map<String, dynamic>>(
        '/v1/events',
        data: {'events': batch},
      );
    } catch (_) {
      _pending.insertAll(0, batch);
      _ensureTimer();
    }
  }

  void dispose() {
    _timer?.cancel();
    unawaited(flush());
  }
}
