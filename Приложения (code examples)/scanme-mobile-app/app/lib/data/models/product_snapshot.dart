import 'package:hive_ce/hive.dart';

import 'product.dart';

class ProductSnapshot {
  const ProductSnapshot({
    required this.barcode,
    required this.name,
    required this.savedAt,
    this.brands = '',
    this.imageUrl = '',
    this.source = 'unknown',
    this.overallDanger = 'safe',
    this.fetchedAt,
  });

  final String barcode;
  final String name;
  final String brands;
  final String imageUrl;
  final String source;
  final String overallDanger;
  final DateTime? fetchedAt;
  final DateTime savedAt;

  factory ProductSnapshot.fromProduct(Product product, {DateTime? savedAt}) {
    return ProductSnapshot(
      barcode: product.barcode,
      name: product.name,
      brands: product.brands,
      imageUrl: product.imageUrl,
      source: product.source,
      overallDanger: product.analysis.overallDanger,
      fetchedAt: product.fetchedAt,
      savedAt: savedAt ?? DateTime.now().toUtc(),
    );
  }

  factory ProductSnapshot.fromJson(Map<String, dynamic> json) {
    return ProductSnapshot(
      barcode: json['barcode'] as String,
      name: json['name'] as String? ?? 'Без названия',
      brands: json['brands'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      source: json['source'] as String? ?? 'unknown',
      overallDanger: json['overallDanger'] as String? ?? 'safe',
      fetchedAt: _parseDate(json['fetchedAt']),
      savedAt: _parseDate(json['savedAt']) ?? DateTime.now().toUtc(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'barcode': barcode,
      'name': name,
      'brands': brands,
      'imageUrl': imageUrl,
      'source': source,
      'overallDanger': overallDanger,
      'fetchedAt': fetchedAt?.toIso8601String(),
      'savedAt': savedAt.toIso8601String(),
    };
  }
}

class ProductSnapshotAdapter extends TypeAdapter<ProductSnapshot> {
  @override
  final int typeId = 1;

  @override
  ProductSnapshot read(BinaryReader reader) {
    return ProductSnapshot(
      barcode: reader.readString(),
      name: reader.readString(),
      brands: reader.readString(),
      imageUrl: reader.readString(),
      source: reader.readString(),
      overallDanger: reader.readString(),
      fetchedAt: _readDate(reader),
      savedAt: _readDate(reader) ?? DateTime.now().toUtc(),
    );
  }

  @override
  void write(BinaryWriter writer, ProductSnapshot obj) {
    writer
      ..writeString(obj.barcode)
      ..writeString(obj.name)
      ..writeString(obj.brands)
      ..writeString(obj.imageUrl)
      ..writeString(obj.source)
      ..writeString(obj.overallDanger)
      ..writeInt(obj.fetchedAt?.millisecondsSinceEpoch ?? 0)
      ..writeInt(obj.savedAt.millisecondsSinceEpoch);
  }
}

DateTime? _parseDate(Object? value) {
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value)?.toUtc();
  }
  return null;
}

DateTime? _readDate(BinaryReader reader) {
  final value = reader.readInt();
  if (value <= 0) {
    return null;
  }
  return DateTime.fromMillisecondsSinceEpoch(value, isUtc: true);
}
