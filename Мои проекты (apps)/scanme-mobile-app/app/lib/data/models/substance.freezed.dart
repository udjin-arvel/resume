// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'substance.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Substance {

 String get id; String get code; String get name; List<String> get aliases; String get category; DangerLevel get dangerLevel; String get description; List<String> get sources; bool get isActive; int get version;
/// Create a copy of Substance
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SubstanceCopyWith<Substance> get copyWith => _$SubstanceCopyWithImpl<Substance>(this as Substance, _$identity);

  /// Serializes this Substance to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Substance&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&const DeepCollectionEquality().equals(other.aliases, aliases)&&(identical(other.category, category) || other.category == category)&&(identical(other.dangerLevel, dangerLevel) || other.dangerLevel == dangerLevel)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other.sources, sources)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.version, version) || other.version == version));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,code,name,const DeepCollectionEquality().hash(aliases),category,dangerLevel,description,const DeepCollectionEquality().hash(sources),isActive,version);

@override
String toString() {
  return 'Substance(id: $id, code: $code, name: $name, aliases: $aliases, category: $category, dangerLevel: $dangerLevel, description: $description, sources: $sources, isActive: $isActive, version: $version)';
}


}

/// @nodoc
abstract mixin class $SubstanceCopyWith<$Res>  {
  factory $SubstanceCopyWith(Substance value, $Res Function(Substance) _then) = _$SubstanceCopyWithImpl;
@useResult
$Res call({
 String id, String code, String name, List<String> aliases, String category, DangerLevel dangerLevel, String description, List<String> sources, bool isActive, int version
});




}
/// @nodoc
class _$SubstanceCopyWithImpl<$Res>
    implements $SubstanceCopyWith<$Res> {
  _$SubstanceCopyWithImpl(this._self, this._then);

  final Substance _self;
  final $Res Function(Substance) _then;

/// Create a copy of Substance
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? name = null,Object? aliases = null,Object? category = null,Object? dangerLevel = null,Object? description = null,Object? sources = null,Object? isActive = null,Object? version = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,aliases: null == aliases ? _self.aliases : aliases // ignore: cast_nullable_to_non_nullable
as List<String>,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,dangerLevel: null == dangerLevel ? _self.dangerLevel : dangerLevel // ignore: cast_nullable_to_non_nullable
as DangerLevel,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,sources: null == sources ? _self.sources : sources // ignore: cast_nullable_to_non_nullable
as List<String>,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [Substance].
extension SubstancePatterns on Substance {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Substance value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Substance() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Substance value)  $default,){
final _that = this;
switch (_that) {
case _Substance():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Substance value)?  $default,){
final _that = this;
switch (_that) {
case _Substance() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code,  String name,  List<String> aliases,  String category,  DangerLevel dangerLevel,  String description,  List<String> sources,  bool isActive,  int version)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Substance() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.aliases,_that.category,_that.dangerLevel,_that.description,_that.sources,_that.isActive,_that.version);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code,  String name,  List<String> aliases,  String category,  DangerLevel dangerLevel,  String description,  List<String> sources,  bool isActive,  int version)  $default,) {final _that = this;
switch (_that) {
case _Substance():
return $default(_that.id,_that.code,_that.name,_that.aliases,_that.category,_that.dangerLevel,_that.description,_that.sources,_that.isActive,_that.version);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code,  String name,  List<String> aliases,  String category,  DangerLevel dangerLevel,  String description,  List<String> sources,  bool isActive,  int version)?  $default,) {final _that = this;
switch (_that) {
case _Substance() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.aliases,_that.category,_that.dangerLevel,_that.description,_that.sources,_that.isActive,_that.version);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Substance implements Substance {
  const _Substance({required this.id, this.code = '', required this.name, final  List<String> aliases = const <String>[], this.category = 'other', required this.dangerLevel, this.description = '', final  List<String> sources = const <String>[], this.isActive = true, this.version = 0}): _aliases = aliases,_sources = sources;
  factory _Substance.fromJson(Map<String, dynamic> json) => _$SubstanceFromJson(json);

@override final  String id;
@override@JsonKey() final  String code;
@override final  String name;
 final  List<String> _aliases;
@override@JsonKey() List<String> get aliases {
  if (_aliases is EqualUnmodifiableListView) return _aliases;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_aliases);
}

@override@JsonKey() final  String category;
@override final  DangerLevel dangerLevel;
@override@JsonKey() final  String description;
 final  List<String> _sources;
@override@JsonKey() List<String> get sources {
  if (_sources is EqualUnmodifiableListView) return _sources;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_sources);
}

@override@JsonKey() final  bool isActive;
@override@JsonKey() final  int version;

/// Create a copy of Substance
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SubstanceCopyWith<_Substance> get copyWith => __$SubstanceCopyWithImpl<_Substance>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SubstanceToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Substance&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&const DeepCollectionEquality().equals(other._aliases, _aliases)&&(identical(other.category, category) || other.category == category)&&(identical(other.dangerLevel, dangerLevel) || other.dangerLevel == dangerLevel)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other._sources, _sources)&&(identical(other.isActive, isActive) || other.isActive == isActive)&&(identical(other.version, version) || other.version == version));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,code,name,const DeepCollectionEquality().hash(_aliases),category,dangerLevel,description,const DeepCollectionEquality().hash(_sources),isActive,version);

@override
String toString() {
  return 'Substance(id: $id, code: $code, name: $name, aliases: $aliases, category: $category, dangerLevel: $dangerLevel, description: $description, sources: $sources, isActive: $isActive, version: $version)';
}


}

/// @nodoc
abstract mixin class _$SubstanceCopyWith<$Res> implements $SubstanceCopyWith<$Res> {
  factory _$SubstanceCopyWith(_Substance value, $Res Function(_Substance) _then) = __$SubstanceCopyWithImpl;
@override @useResult
$Res call({
 String id, String code, String name, List<String> aliases, String category, DangerLevel dangerLevel, String description, List<String> sources, bool isActive, int version
});




}
/// @nodoc
class __$SubstanceCopyWithImpl<$Res>
    implements _$SubstanceCopyWith<$Res> {
  __$SubstanceCopyWithImpl(this._self, this._then);

  final _Substance _self;
  final $Res Function(_Substance) _then;

/// Create a copy of Substance
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? name = null,Object? aliases = null,Object? category = null,Object? dangerLevel = null,Object? description = null,Object? sources = null,Object? isActive = null,Object? version = null,}) {
  return _then(_Substance(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,aliases: null == aliases ? _self._aliases : aliases // ignore: cast_nullable_to_non_nullable
as List<String>,category: null == category ? _self.category : category // ignore: cast_nullable_to_non_nullable
as String,dangerLevel: null == dangerLevel ? _self.dangerLevel : dangerLevel // ignore: cast_nullable_to_non_nullable
as DangerLevel,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,sources: null == sources ? _self._sources : sources // ignore: cast_nullable_to_non_nullable
as List<String>,isActive: null == isActive ? _self.isActive : isActive // ignore: cast_nullable_to_non_nullable
as bool,version: null == version ? _self.version : version // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}


/// @nodoc
mixin _$SubstanceListResponse {

 List<Substance> get items; int get nextVersion;
/// Create a copy of SubstanceListResponse
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SubstanceListResponseCopyWith<SubstanceListResponse> get copyWith => _$SubstanceListResponseCopyWithImpl<SubstanceListResponse>(this as SubstanceListResponse, _$identity);

  /// Serializes this SubstanceListResponse to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SubstanceListResponse&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.nextVersion, nextVersion) || other.nextVersion == nextVersion));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(items),nextVersion);

@override
String toString() {
  return 'SubstanceListResponse(items: $items, nextVersion: $nextVersion)';
}


}

/// @nodoc
abstract mixin class $SubstanceListResponseCopyWith<$Res>  {
  factory $SubstanceListResponseCopyWith(SubstanceListResponse value, $Res Function(SubstanceListResponse) _then) = _$SubstanceListResponseCopyWithImpl;
@useResult
$Res call({
 List<Substance> items, int nextVersion
});




}
/// @nodoc
class _$SubstanceListResponseCopyWithImpl<$Res>
    implements $SubstanceListResponseCopyWith<$Res> {
  _$SubstanceListResponseCopyWithImpl(this._self, this._then);

  final SubstanceListResponse _self;
  final $Res Function(SubstanceListResponse) _then;

/// Create a copy of SubstanceListResponse
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? items = null,Object? nextVersion = null,}) {
  return _then(_self.copyWith(
items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<Substance>,nextVersion: null == nextVersion ? _self.nextVersion : nextVersion // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [SubstanceListResponse].
extension SubstanceListResponsePatterns on SubstanceListResponse {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SubstanceListResponse value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SubstanceListResponse() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SubstanceListResponse value)  $default,){
final _that = this;
switch (_that) {
case _SubstanceListResponse():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SubstanceListResponse value)?  $default,){
final _that = this;
switch (_that) {
case _SubstanceListResponse() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<Substance> items,  int nextVersion)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SubstanceListResponse() when $default != null:
return $default(_that.items,_that.nextVersion);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<Substance> items,  int nextVersion)  $default,) {final _that = this;
switch (_that) {
case _SubstanceListResponse():
return $default(_that.items,_that.nextVersion);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<Substance> items,  int nextVersion)?  $default,) {final _that = this;
switch (_that) {
case _SubstanceListResponse() when $default != null:
return $default(_that.items,_that.nextVersion);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SubstanceListResponse implements SubstanceListResponse {
  const _SubstanceListResponse({final  List<Substance> items = const <Substance>[], this.nextVersion = 0}): _items = items;
  factory _SubstanceListResponse.fromJson(Map<String, dynamic> json) => _$SubstanceListResponseFromJson(json);

 final  List<Substance> _items;
@override@JsonKey() List<Substance> get items {
  if (_items is EqualUnmodifiableListView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_items);
}

@override@JsonKey() final  int nextVersion;

/// Create a copy of SubstanceListResponse
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SubstanceListResponseCopyWith<_SubstanceListResponse> get copyWith => __$SubstanceListResponseCopyWithImpl<_SubstanceListResponse>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SubstanceListResponseToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SubstanceListResponse&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.nextVersion, nextVersion) || other.nextVersion == nextVersion));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_items),nextVersion);

@override
String toString() {
  return 'SubstanceListResponse(items: $items, nextVersion: $nextVersion)';
}


}

/// @nodoc
abstract mixin class _$SubstanceListResponseCopyWith<$Res> implements $SubstanceListResponseCopyWith<$Res> {
  factory _$SubstanceListResponseCopyWith(_SubstanceListResponse value, $Res Function(_SubstanceListResponse) _then) = __$SubstanceListResponseCopyWithImpl;
@override @useResult
$Res call({
 List<Substance> items, int nextVersion
});




}
/// @nodoc
class __$SubstanceListResponseCopyWithImpl<$Res>
    implements _$SubstanceListResponseCopyWith<$Res> {
  __$SubstanceListResponseCopyWithImpl(this._self, this._then);

  final _SubstanceListResponse _self;
  final $Res Function(_SubstanceListResponse) _then;

/// Create a copy of SubstanceListResponse
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? items = null,Object? nextVersion = null,}) {
  return _then(_SubstanceListResponse(
items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<Substance>,nextVersion: null == nextVersion ? _self.nextVersion : nextVersion // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
