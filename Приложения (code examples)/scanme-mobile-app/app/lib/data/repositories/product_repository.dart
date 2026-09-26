import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_flutter.dart';

import '../../core/network/api_client.dart';
import '../models/product.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(apiClient: ref.watch(apiClientProvider));
});

final productByBarcodeProvider = FutureProvider.family<Product, String>((
  ref,
  barcode,
) async {
  return ref.watch(productRepositoryProvider).getByBarcode(barcode);
});

class ProductRepository {
  ProductRepository({
    required ApiClient apiClient,
    Dio? offDio,
    Duration cacheTtl = const Duration(days: 30),
  }) : _apiClient = apiClient,
       _offDio =
           offDio ??
           Dio(
             BaseOptions(
               baseUrl: 'https://world.openfoodfacts.org',
               connectTimeout: const Duration(seconds: 8),
               receiveTimeout: const Duration(seconds: 12),
               headers: const {'Accept': 'application/json'},
             ),
           ),
       _cacheTtl = cacheTtl;

  static const _boxName = 'product_cache_v1';

  final ApiClient _apiClient;
  final Dio _offDio;
  final Duration _cacheTtl;

  Future<Product> getByBarcode(String barcode) async {
    final normalizedBarcode = barcode.trim();
    if (normalizedBarcode.isEmpty) {
      throw const ProductRepositoryException('Пустой штрих-код');
    }

    try {
      final remoteProduct = await _fetchFromBackend(normalizedBarcode);
      await _saveToCache(remoteProduct);
      return remoteProduct;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw const ProductRepositoryException('Продукт не найден');
      }
      final cachedProduct = await _readFreshCache(normalizedBarcode);
      if (cachedProduct != null) {
        return cachedProduct;
      }

      final offProduct = await _fetchFromOpenFoodFacts(normalizedBarcode);
      await _saveToCache(offProduct);
      return offProduct;
    }
  }

  Future<Product> _fetchFromBackend(String barcode) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/v1/products/$barcode',
    );
    return Product.fromJson(response.data!);
  }

  Future<Product> _fetchFromOpenFoodFacts(String barcode) async {
    try {
      final response = await _offDio.get<Map<String, dynamic>>(
        '/api/v2/product/$barcode.json',
        queryParameters: const {
          'fields':
              'code,product_name,brands,image_front_url,image_url,ingredients_text,ingredients',
        },
      );
      final data = response.data;
      final productData = data?['product'] as Map<String, dynamic>?;
      if (data?['status'] != 1 || productData == null) {
        throw const ProductRepositoryException('Продукт не найден');
      }

      return _productFromOffJson(productData, barcode);
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) {
        throw const ProductRepositoryException('Продукт не найден');
      }
      throw const ProductRepositoryException('Не удалось загрузить продукт');
    }
  }

  Product _productFromOffJson(
    Map<String, dynamic> json,
    String fallbackBarcode,
  ) {
    final now = DateTime.now().toUtc();
    final ingredients = _ingredientsFromOffJson(json);

    return Product(
      barcode: json['code'] as String? ?? fallbackBarcode,
      name: (json['product_name'] as String?)?.trim().isNotEmpty == true
          ? (json['product_name'] as String).trim()
          : 'Без названия',
      brands: json['brands'] as String? ?? '',
      imageUrl:
          json['image_front_url'] as String? ??
          json['image_url'] as String? ??
          '',
      ingredients: ingredients,
      source: 'open_food_facts_direct',
      fetchedAt: now,
      cachedUntil: now.add(_cacheTtl),
    );
  }

  List<ProductIngredient> _ingredientsFromOffJson(Map<String, dynamic> json) {
    final ingredients = (json['ingredients'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) {
          final value = Map<String, dynamic>.from(item);
          final id = (value['id'] as String? ?? '').replaceFirst('en:', '');
          final text = value['text'] as String? ?? id;
          return ProductIngredient(
            id: id,
            text: text,
            percent: _formatPercent(value['percent_estimate']),
            rank: value['rank'] as int? ?? 0,
            vegan: value['vegan'] as String? ?? '',
            vegetarian: value['vegetarian'] as String? ?? '',
          );
        })
        .where((ingredient) => ingredient.text.trim().isNotEmpty)
        .toList(growable: false);

    if (ingredients.isNotEmpty) {
      return ingredients;
    }

    final ingredientsText = json['ingredients_text'] as String? ?? '';
    return ingredientsText
        .split(',')
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .indexed
        .map((entry) => ProductIngredient(text: entry.$2, rank: entry.$1 + 1))
        .toList(growable: false);
  }

  String _formatPercent(Object? value) {
    final percent = switch (value) {
      int number => number.toDouble(),
      double number => number,
      _ => 0.0,
    };
    if (percent <= 0) {
      return '';
    }
    if (percent == percent.roundToDouble()) {
      return '${percent.toInt()}%';
    }
    return '${percent.toStringAsFixed(1)}%';
  }

  Future<Product?> _readFreshCache(String barcode) async {
    final box = await _openCacheBox();
    final value = box.get(barcode);
    if (value is! Map) {
      return null;
    }

    final product = Product.fromJson(
      Map<String, dynamic>.from(value['product'] as Map),
    );
    if (DateTime.now().toUtc().isAfter(product.cachedUntil)) {
      await box.delete(barcode);
      return null;
    }

    return product;
  }

  Future<void> _saveToCache(Product product) async {
    final box = await _openCacheBox();
    await box.put(product.barcode, {
      'product': product.toJson(),
      'cachedAt': DateTime.now().toUtc().toIso8601String(),
    });
  }

  Future<Box<dynamic>> _openCacheBox() async {
    if (Hive.isBoxOpen(_boxName)) {
      return Hive.box<dynamic>(_boxName);
    }
    return Hive.openBox<dynamic>(_boxName);
  }
}

class ProductRepositoryException implements Exception {
  const ProductRepositoryException(this.message);

  final String message;

  @override
  String toString() => message;
}
