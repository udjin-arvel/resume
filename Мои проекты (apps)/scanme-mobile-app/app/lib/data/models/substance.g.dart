// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'substance.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Substance _$SubstanceFromJson(Map<String, dynamic> json) => _Substance(
  id: json['id'] as String,
  code: json['code'] as String? ?? '',
  name: json['name'] as String,
  aliases:
      (json['aliases'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  category: json['category'] as String? ?? 'other',
  dangerLevel: $enumDecode(_$DangerLevelEnumMap, json['dangerLevel']),
  description: json['description'] as String? ?? '',
  sources:
      (json['sources'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const <String>[],
  isActive: json['isActive'] as bool? ?? true,
  version: (json['version'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$SubstanceToJson(_Substance instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'name': instance.name,
      'aliases': instance.aliases,
      'category': instance.category,
      'dangerLevel': _$DangerLevelEnumMap[instance.dangerLevel]!,
      'description': instance.description,
      'sources': instance.sources,
      'isActive': instance.isActive,
      'version': instance.version,
    };

const _$DangerLevelEnumMap = {
  DangerLevel.safe: 'safe',
  DangerLevel.controversial: 'controversial',
  DangerLevel.dangerous: 'dangerous',
};

_SubstanceListResponse _$SubstanceListResponseFromJson(
  Map<String, dynamic> json,
) => _SubstanceListResponse(
  items:
      (json['items'] as List<dynamic>?)
          ?.map((e) => Substance.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const <Substance>[],
  nextVersion: (json['nextVersion'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$SubstanceListResponseToJson(
  _SubstanceListResponse instance,
) => <String, dynamic>{
  'items': instance.items,
  'nextVersion': instance.nextVersion,
};
