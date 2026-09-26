// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

part 'substance.freezed.dart';
part 'substance.g.dart';

enum DangerLevel { safe, controversial, dangerous }

@freezed
abstract class Substance with _$Substance {
  const factory Substance({
    required String id,
    @Default('') String code,
    required String name,
    @Default(<String>[]) List<String> aliases,
    @Default('other') String category,
    required DangerLevel dangerLevel,
    @Default('') String description,
    @Default(<String>[]) List<String> sources,
    @Default(true) bool isActive,
    @Default(0) int version,
  }) = _Substance;

  factory Substance.fromJson(Map<String, dynamic> json) =>
      _$SubstanceFromJson(json);
}

@freezed
abstract class SubstanceListResponse with _$SubstanceListResponse {
  const factory SubstanceListResponse({
    @Default(<Substance>[]) List<Substance> items,
    @Default(0) int nextVersion,
  }) = _SubstanceListResponse;

  factory SubstanceListResponse.fromJson(Map<String, dynamic> json) =>
      _$SubstanceListResponseFromJson(json);
}
