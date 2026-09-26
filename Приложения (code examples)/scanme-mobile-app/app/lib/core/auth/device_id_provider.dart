import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';

import 'token_storage.dart';

final deviceIdProvider = Provider<DeviceIdProvider>((ref) {
  return DeviceIdProvider(DeviceInfoPlugin(), ref.watch(secureStorageProvider));
});

class DeviceIdProvider {
  DeviceIdProvider(this._deviceInfo, this._storage);

  static const _deviceIdKey = 'scanme.deviceId';

  final DeviceInfoPlugin _deviceInfo;
  final FlutterSecureStorage _storage;

  Future<String> getDeviceId() async {
    final stored = await _storage.read(key: _deviceIdKey);
    if (stored != null && stored.isNotEmpty) {
      return stored;
    }

    final platformId = await _platformDeviceId();
    final deviceId = platformId ?? const Uuid().v4();

    await _storage.write(key: _deviceIdKey, value: deviceId);
    return deviceId;
  }

  Future<String?> _platformDeviceId() async {
    if (kIsWeb) {
      return null;
    }

    return switch (defaultTargetPlatform) {
      TargetPlatform.android => (await _deviceInfo.androidInfo).id,
      TargetPlatform.iOS => (await _deviceInfo.iosInfo).identifierForVendor,
      TargetPlatform.windows => (await _deviceInfo.windowsInfo).deviceId,
      TargetPlatform.macOS => (await _deviceInfo.macOsInfo).systemGUID,
      TargetPlatform.linux => (await _deviceInfo.linuxInfo).machineId,
      TargetPlatform.fuchsia => null,
    };
  }
}
