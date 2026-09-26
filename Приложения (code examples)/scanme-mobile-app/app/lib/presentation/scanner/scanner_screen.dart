import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/analytics/analytics_service.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  static const routePath = '/scanner';

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  late MobileScannerController _controller;
  _ScanMode _scanMode = _ScanMode.productBarcode;
  bool _isHandlingScan = false;
  DateTime? _lastUnreadableWarningAt;

  @override
  void initState() {
    super.initState();
    _controller = _createController(_scanMode);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(analyticsServiceProvider).track('scan_started');
    });
  }

  @override
  void dispose() {
    unawaited(_controller.dispose());
    super.dispose();
  }

  MobileScannerController _createController(_ScanMode mode) {
    return MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      detectionTimeoutMs: 700,
      facing: CameraFacing.back,
      formats: mode.formats,
    );
  }

  void _setScanMode(_ScanMode mode) {
    if (mode == _scanMode) {
      return;
    }

    final previousController = _controller;
    setState(() {
      _scanMode = mode;
      _isHandlingScan = false;
      _controller = _createController(mode);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(previousController.dispose());
    });
  }

  Future<void> _handleDetect(BarcodeCapture capture) async {
    if (_isHandlingScan) {
      return;
    }

    final code = capture.barcodes
        .map((barcode) => barcode.rawValue?.trim())
        .whereType<String>()
        .where((value) => value.isNotEmpty)
        .firstOrNull;

    if (code == null) {
      _showUnreadableCodeHint();
      return;
    }

    _isHandlingScan = true;
    await HapticFeedback.mediumImpact();
    await SystemSound.play(SystemSoundType.click);
    ref.read(analyticsServiceProvider).track('scan_completed', {'barcode': code});
    await _controller.stop();

    if (!mounted) {
      return;
    }

    context.go('/result/${Uri.encodeComponent(code)}?recordScan=true');
  }

  void _showUnreadableCodeHint() {
    final now = DateTime.now();
    final lastWarningAt = _lastUnreadableWarningAt;
    if (lastWarningAt != null &&
        now.difference(lastWarningAt) < const Duration(seconds: 2)) {
      return;
    }

    _lastUnreadableWarningAt = now;
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Код не прочитан, попробуйте ещё раз')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ScanMe')),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final scanWindow = _scanWindowFor(constraints.biggest);

          return Stack(
            fit: StackFit.expand,
            children: [
              MobileScanner(
                key: ValueKey(_scanMode),
                controller: _controller,
                scanWindow: scanWindow,
                onDetect: _handleDetect,
                errorBuilder: (context, error) => _ScannerErrorView(
                  error: error,
                  onRetry: () => unawaited(_controller.start()),
                ),
                placeholderBuilder: (_) => const ColoredBox(
                  color: Colors.black,
                  child: Center(child: CircularProgressIndicator()),
                ),
              ),
              _ScannerOverlay(scanWindow: scanWindow),
              _ScannerControls(
                controller: _controller,
                scanMode: _scanMode,
                onScanModeChanged: _setScanMode,
              ),
            ],
          );
        },
      ),
    );
  }

  Rect _scanWindowFor(Size size) {
    final width = size.width * 0.78;
    final height = _scanMode == _ScanMode.qr ? width : width * 0.62;
    return Rect.fromCenter(
      center: Offset(size.width / 2, size.height * 0.42),
      width: width,
      height: height,
    );
  }
}

enum _ScanMode {
  productBarcode(
    label: 'Штрих-код',
    icon: Icons.view_week,
    formats: [
      BarcodeFormat.ean13,
      BarcodeFormat.ean8,
      BarcodeFormat.upcA,
      BarcodeFormat.upcE,
    ],
  ),
  qr(label: 'QR', icon: Icons.qr_code, formats: [BarcodeFormat.qrCode]);

  const _ScanMode({
    required this.label,
    required this.icon,
    required this.formats,
  });

  final String label;
  final IconData icon;
  final List<BarcodeFormat> formats;
}

class _ScannerOverlay extends StatelessWidget {
  const _ScannerOverlay({required this.scanWindow});

  final Rect scanWindow;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return IgnorePointer(
      child: CustomPaint(
        painter: _ScannerOverlayPainter(
          scanWindow: scanWindow,
          borderColor: colorScheme.primary,
        ),
        child: Align(
          alignment: Alignment.topCenter,
          child: Padding(
            padding: EdgeInsets.only(top: scanWindow.bottom + 24),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.58),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Text(
                  'Наведите рамку на код',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ScannerOverlayPainter extends CustomPainter {
  const _ScannerOverlayPainter({
    required this.scanWindow,
    required this.borderColor,
  });

  final Rect scanWindow;
  final Color borderColor;

  @override
  void paint(Canvas canvas, Size size) {
    final dimPaint = Paint()..color = Colors.black.withValues(alpha: 0.48);
    final overlayPath = Path()..addRect(Offset.zero & size);
    final windowPath = Path()
      ..addRRect(
        RRect.fromRectAndRadius(scanWindow, const Radius.circular(28)),
      );
    canvas.drawPath(
      Path.combine(PathOperation.difference, overlayPath, windowPath),
      dimPaint,
    );

    final borderPaint = Paint()
      ..color = borderColor
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final radius = RRect.fromRectAndRadius(
      scanWindow,
      const Radius.circular(28),
    );
    canvas.drawRRect(radius, borderPaint);
  }

  @override
  bool shouldRepaint(covariant _ScannerOverlayPainter oldDelegate) {
    return oldDelegate.scanWindow != scanWindow ||
        oldDelegate.borderColor != borderColor;
  }
}

class _ScannerControls extends StatelessWidget {
  const _ScannerControls({
    required this.controller,
    required this.scanMode,
    required this.onScanModeChanged,
  });

  final MobileScannerController controller;
  final _ScanMode scanMode;
  final ValueChanged<_ScanMode> onScanModeChanged;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            SegmentedButton<_ScanMode>(
              segments: [
                for (final mode in _ScanMode.values)
                  ButtonSegment(
                    value: mode,
                    icon: Icon(mode.icon),
                    label: Text(mode.label),
                  ),
              ],
              selected: {scanMode},
              onSelectionChanged: (selection) {
                final selectedMode = selection.firstOrNull;
                if (selectedMode != null) {
                  onScanModeChanged(selectedMode);
                }
              },
            ),
            const SizedBox(height: 12),
            ValueListenableBuilder<MobileScannerState>(
              valueListenable: controller,
              builder: (context, state, _) {
                final torchAvailable =
                    state.torchState != TorchState.unavailable;
                final torchEnabled = state.torchState == TorchState.on;

                return FilledButton.tonalIcon(
                  onPressed: torchAvailable
                      ? () => unawaited(controller.toggleTorch())
                      : null,
                  icon: Icon(torchEnabled ? Icons.flash_on : Icons.flash_off),
                  label: Text(torchEnabled ? 'Выключить фонарик' : 'Фонарик'),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ScannerErrorView extends StatelessWidget {
  const _ScannerErrorView({required this.error, required this.onRetry});

  final MobileScannerException error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final message = switch (error.errorCode) {
      MobileScannerErrorCode.permissionDenied =>
        'Нет доступа к камере. Разрешите доступ в настройках устройства.',
      MobileScannerErrorCode.unsupported =>
        'Сканирование на этом устройстве не поддерживается.',
      _ => 'Не удалось запустить камеру.',
    };

    return ColoredBox(
      color: colorScheme.surface,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.no_photography, size: 64, color: colorScheme.error),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRetry, child: const Text('Повторить')),
            ],
          ),
        ),
      ),
    );
  }
}
