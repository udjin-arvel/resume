// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'product.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Product _$ProductFromJson(Map<String, dynamic> json) => _Product(
  barcode: json['barcode'] as String,
  name: json['name'] as String? ?? 'Без названия',
  brands: json['brands'] as String? ?? '',
  imageUrl: json['imageUrl'] as String? ?? '',
  ingredients:
      (json['ingredients'] as List<dynamic>?)
          ?.map((e) => ProductIngredient.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <ProductIngredient>[],
  source: json['source'] as String? ?? 'unknown',
  fetchedAt: DateTime.parse(json['fetchedAt'] as String),
  cachedUntil: DateTime.parse(json['cachedUntil'] as String),
  analysis: json['analysis'] == null
      ? const ProductAnalysis()
      : ProductAnalysis.fromJson(json['analysis'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ProductToJson(_Product instance) => <String, dynamic>{
  'barcode': instance.barcode,
  'name': instance.name,
  'brands': instance.brands,
  'imageUrl': instance.imageUrl,
  'ingredients': instance.ingredients.map((e) => e.toJson()).toList(),
  'source': instance.source,
  'fetchedAt': instance.fetchedAt.toIso8601String(),
  'cachedUntil': instance.cachedUntil.toIso8601String(),
  'analysis': instance.analysis.toJson(),
};

_ProductIngredient _$ProductIngredientFromJson(Map<String, dynamic> json) =>
    _ProductIngredient(
      id: json['id'] as String? ?? '',
      text: json['text'] as String,
      percent: json['percent'] as String? ?? '',
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      vegan: json['vegan'] as String? ?? '',
      vegetarian: json['vegetarian'] as String? ?? '',
    );

Map<String, dynamic> _$ProductIngredientToJson(_ProductIngredient instance) =>
    <String, dynamic>{
      'id': instance.id,
      'text': instance.text,
      'percent': instance.percent,
      'rank': instance.rank,
      'vegan': instance.vegan,
      'vegetarian': instance.vegetarian,
    };

_ProductAnalysis _$ProductAnalysisFromJson(Map<String, dynamic> json) =>
    _ProductAnalysis(
      overallDanger: json['overallDanger'] as String? ?? 'safe',
      matches:
          (json['matches'] as List<dynamic>?)
              ?.map((e) => IngredientMatch.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <IngredientMatch>[],
    );

Map<String, dynamic> _$ProductAnalysisToJson(_ProductAnalysis instance) =>
    <String, dynamic>{
      'overallDanger': instance.overallDanger,
      'matches': instance.matches.map((e) => e.toJson()).toList(),
    };

_IngredientMatch _$IngredientMatchFromJson(Map<String, dynamic> json) =>
    _IngredientMatch(
      ingredientText: json['ingredientText'] as String,
      substances:
          (json['substances'] as List<dynamic>?)
              ?.map((e) => MatchedSubstance.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <MatchedSubstance>[],
    );

Map<String, dynamic> _$IngredientMatchToJson(_IngredientMatch instance) =>
    <String, dynamic>{
      'ingredientText': instance.ingredientText,
      'substances': instance.substances.map((e) => e.toJson()).toList(),
    };

_MatchedSubstance _$MatchedSubstanceFromJson(Map<String, dynamic> json) =>
    _MatchedSubstance(
      id: json['id'] as String,
      code: json['code'] as String? ?? '',
      name: json['name'] as String,
      dangerLevel: json['dangerLevel'] as String,
      description: json['description'] as String? ?? '',
      sources:
          (json['sources'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
    );

Map<String, dynamic> _$MatchedSubstanceToJson(_MatchedSubstance instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'name': instance.name,
      'dangerLevel': instance.dangerLevel,
      'description': instance.description,
      'sources': instance.sources,
    };
