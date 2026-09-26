import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';
import 'package:scanme/data/models/product.dart';
import 'package:scanme/data/repositories/product_repository.dart';
import 'package:scanme/presentation/result/result_screen.dart';

void main() {
  setUpAll(() {
    final tempDir = Directory.systemTemp.createTempSync('scanme_hive_test_');
    Hive.init(tempDir.path);
  });

  tearDown(() async {
    if (Hive.isBoxOpen('favorites_box')) {
      await Hive.box<dynamic>('favorites_box').close();
    }
    await Hive.deleteBoxFromDisk('favorites_box');
  });

  testWidgets('shows loaded product for scanned barcode', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          productByBarcodeProvider.overrideWith(
            (ref, barcode) async => Product(
              barcode: barcode,
              name: 'Test Yogurt',
              brands: 'ScanMe',
              ingredients: const [ProductIngredient(text: 'Milk')],
              source: 'cache',
              fetchedAt: DateTime(2026),
              cachedUntil: DateTime(2026, 2),
            ),
          ),
        ],
        child: const MaterialApp(home: ResultScreen(barcode: '4601234567890')),
      ),
    );
    await tester.pump();

    expect(find.text('Test Yogurt'), findsOneWidget);
    expect(find.text('ScanMe'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Milk'), 300);
    expect(find.text('Milk'), findsOneWidget);
  });
}
