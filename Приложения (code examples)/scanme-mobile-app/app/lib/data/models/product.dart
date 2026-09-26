// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

part 'product.freezed.dart';
part 'product.g.dart';

@freezed
abstract class Product with _$Product {
  @JsonSerializable(explicitToJson: true)
  const factory Product({
    required String barcode,
    @Default('Без названия') String name,
    @Default('') String brands,
    @Default('') String imageUrl,
    @Default(<ProductIngredient>[]) List<ProductIngredient> ingredients,
    @Default('unknown') String source,
    required DateTime fetchedAt,
    required DateTime cachedUntil,
    @Default(ProductAnalysis()) ProductAnalysis analysis,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) =>
      _$ProductFromJson(json);
}

@freezed
abstract class ProductIngredient with _$ProductIngredient {
  const factory ProductIngredient({
    @Default('') String id,
    required String text,
    @Default('') String percent,
    @Default(0) int rank,
    @Default('') String vegan,
    @Default('') String vegetarian,
  }) = _ProductIngredient;

  factory ProductIngredient.fromJson(Map<String, dynamic> json) =>
      _$ProductIngredientFromJson(json);
}

@freezed
abstract class ProductAnalysis with _$ProductAnalysis {
  @JsonSerializable(explicitToJson: true)
  const factory ProductAnalysis({
    @Default('safe') String overallDanger,
    @Default(<IngredientMatch>[]) List<IngredientMatch> matches,
  }) = _ProductAnalysis;

  factory ProductAnalysis.fromJson(Map<String, dynamic> json) =>
      _$ProductAnalysisFromJson(json);
}

@freezed
abstract class IngredientMatch with _$IngredientMatch {
  @JsonSerializable(explicitToJson: true)
  const factory IngredientMatch({
    required String ingredientText,
    @Default(<MatchedSubstance>[]) List<MatchedSubstance> substances,
  }) = _IngredientMatch;

  factory IngredientMatch.fromJson(Map<String, dynamic> json) =>
      _$IngredientMatchFromJson(json);
}

@freezed
abstract class MatchedSubstance with _$MatchedSubstance {
  const factory MatchedSubstance({
    required String id,
    @Default('') String code,
    required String name,
    required String dangerLevel,
    @Default('') String description,
    @Default(<String>[]) List<String> sources,
  }) = _MatchedSubstance;

  factory MatchedSubstance.fromJson(Map<String, dynamic> json) =>
      _$MatchedSubstanceFromJson(json);
}
