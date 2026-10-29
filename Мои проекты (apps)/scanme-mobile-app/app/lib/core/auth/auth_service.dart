import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import 'device_id_provider.dart';
import 'token_storage.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(
    dio: createBaseDio(),
    deviceIds: ref.watch(deviceIdProvider),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
});

final authBootstrapProvider = FutureProvider<TokenPair>((ref) async {
  return ref.watch(authServiceProvider).ensureAuthenticated();
});

class TokenPair {
  const TokenPair({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
  });

  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;

  factory TokenPair.fromJson(Map<String, dynamic> json) {
    return TokenPair(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }
}

class AuthService {
  AuthService({
    required Dio dio,
    required DeviceIdProvider deviceIds,
    required TokenStorage tokenStorage,
  }) : _dio = dio,
       _deviceIds = deviceIds,
       _tokenStorage = tokenStorage;

  final Dio _dio;
  final DeviceIdProvider _deviceIds;
  final TokenStorage _tokenStorage;

  Future<TokenPair> ensureAuthenticated() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken != null) {
      try {
        return await refresh(refreshToken);
      } on DioException {
        await _tokenStorage.clear();
      }
    }

    final deviceId = await _deviceIds.getDeviceId();
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/auth/device',
      data: {'deviceId': deviceId},
    );

    final tokens = TokenPair.fromJson(response.data!);
    await _tokenStorage.saveTokens(
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    );
    return tokens;
  }

  Future<TokenPair> refresh(String refreshToken) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/auth/refresh',
      data: {'refreshToken': refreshToken},
    );

    final tokens = TokenPair.fromJson(response.data!);
    await _tokenStorage.saveTokens(
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    );
    return tokens;
  }
}
