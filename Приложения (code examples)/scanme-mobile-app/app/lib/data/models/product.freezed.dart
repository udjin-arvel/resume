// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'product.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Product {

 String get barcode; String get name; String get brands; String get imageUrl; List<ProductIngredient> get ingredients; String get source; DateTime get fetchedAt; DateTime get cachedUntil; ProductAnalysis get analysis;
/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProductCopyWith<Product> get copyWith => _$ProductCopyWithImpl<Product>(this as Product, _$identity);

  /// Serializes this Product to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Product&&(identical(other.barcode, barcode) || other.barcode == barcode)&&(identical(other.name, name) || other.name == name)&&(identical(other.brands, brands) || other.brands == brands)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&const DeepCollectionEquality().equals(other.ingredients, ingredients)&&(identical(other.source, source) || other.source == source)&&(identical(other.fetchedAt, fetchedAt) || other.fetchedAt == fetchedAt)&&(identical(other.cachedUntil, cachedUntil) || other.cachedUntil == cachedUntil)&&(identical(other.analysis, analysis) || other.analysis == analysis));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,barcode,name,brands,imageUrl,const DeepCollectionEquality().hash(ingredients),source,fetchedAt,cachedUntil,analysis);

@override
String toString() {
  return 'Product(barcode: $barcode, name: $name, brands: $brands, imageUrl: $imageUrl, ingredients: $ingredients, source: $source, fetchedAt: $fetchedAt, cachedUntil: $cachedUntil, analysis: $analysis)';
}


}

/// @nodoc
abstract mixin class $ProductCopyWith<$Res>  {
  factory $ProductCopyWith(Product value, $Res Function(Product) _then) = _$ProductCopyWithImpl;
@useResult
$Res call({
 String barcode, String name, String brands, String imageUrl, List<ProductIngredient> ingredients, String source, DateTime fetchedAt, DateTime cachedUntil, ProductAnalysis analysis
});


$ProductAnalysisCopyWith<$Res> get analysis;

}
/// @nodoc
class _$ProductCopyWithImpl<$Res>
    implements $ProductCopyWith<$Res> {
  _$ProductCopyWithImpl(this._self, this._then);

  final Product _self;
  final $Res Function(Product) _then;

/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? barcode = null,Object? name = null,Object? brands = null,Object? imageUrl = null,Object? ingredients = null,Object? source = null,Object? fetchedAt = null,Object? cachedUntil = null,Object? analysis = null,}) {
  return _then(_self.copyWith(
barcode: null == barcode ? _self.barcode : barcode // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,brands: null == brands ? _self.brands : brands // ignore: cast_nullable_to_non_nullable
as String,imageUrl: null == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String,ingredients: null == ingredients ? _self.ingredients : ingredients // ignore: cast_nullable_to_non_nullable
as List<ProductIngredient>,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,fetchedAt: null == fetchedAt ? _self.fetchedAt : fetchedAt // ignore: cast_nullable_to_non_nullable
as DateTime,cachedUntil: null == cachedUntil ? _self.cachedUntil : cachedUntil // ignore: cast_nullable_to_non_nullable
as DateTime,analysis: null == analysis ? _self.analysis : analysis // ignore: cast_nullable_to_non_nullable
as ProductAnalysis,
  ));
}
/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductAnalysisCopyWith<$Res> get analysis {
  
  return $ProductAnalysisCopyWith<$Res>(_self.analysis, (value) {
    return _then(_self.copyWith(analysis: value));
  });
}
}


/// Adds pattern-matching-related methods to [Product].
extension ProductPatterns on Product {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Product value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Product() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Product value)  $default,){
final _that = this;
switch (_that) {
case _Product():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Product value)?  $default,){
final _that = this;
switch (_that) {
case _Product() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String barcode,  String name,  String brands,  String imageUrl,  List<ProductIngredient> ingredients,  String source,  DateTime fetchedAt,  DateTime cachedUntil,  ProductAnalysis analysis)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Product() when $default != null:
return $default(_that.barcode,_that.name,_that.brands,_that.imageUrl,_that.ingredients,_that.source,_that.fetchedAt,_that.cachedUntil,_that.analysis);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String barcode,  String name,  String brands,  String imageUrl,  List<ProductIngredient> ingredients,  String source,  DateTime fetchedAt,  DateTime cachedUntil,  ProductAnalysis analysis)  $default,) {final _that = this;
switch (_that) {
case _Product():
return $default(_that.barcode,_that.name,_that.brands,_that.imageUrl,_that.ingredients,_that.source,_that.fetchedAt,_that.cachedUntil,_that.analysis);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String barcode,  String name,  String brands,  String imageUrl,  List<ProductIngredient> ingredients,  String source,  DateTime fetchedAt,  DateTime cachedUntil,  ProductAnalysis analysis)?  $default,) {final _that = this;
switch (_that) {
case _Product() when $default != null:
return $default(_that.barcode,_that.name,_that.brands,_that.imageUrl,_that.ingredients,_that.source,_that.fetchedAt,_that.cachedUntil,_that.analysis);case _:
  return null;

}
}

}

/// @nodoc

@JsonSerializable(explicitToJson: true)
class _Product implements Product {
  const _Product({required this.barcode, this.name = 'Без названия', this.brands = '', this.imageUrl = '', final  List<ProductIngredient> ingredients = const <ProductIngredient>[], this.source = 'unknown', required this.fetchedAt, required this.cachedUntil, this.analysis = const ProductAnalysis()}): _ingredients = ingredients;
  factory _Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);

@override final  String barcode;
@override@JsonKey() final  String name;
@override@JsonKey() final  String brands;
@override@JsonKey() final  String imageUrl;
 final  List<ProductIngredient> _ingredients;
@override@JsonKey() List<ProductIngredient> get ingredients {
  if (_ingredients is EqualUnmodifiableListView) return _ingredients;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_ingredients);
}

@override@JsonKey() final  String source;
@override final  DateTime fetchedAt;
@override final  DateTime cachedUntil;
@override@JsonKey() final  ProductAnalysis analysis;

/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProductCopyWith<_Product> get copyWith => __$ProductCopyWithImpl<_Product>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProductToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Product&&(identical(other.barcode, barcode) || other.barcode == barcode)&&(identical(other.name, name) || other.name == name)&&(identical(other.brands, brands) || other.brands == brands)&&(identical(other.imageUrl, imageUrl) || other.imageUrl == imageUrl)&&const DeepCollectionEquality().equals(other._ingredients, _ingredients)&&(identical(other.source, source) || other.source == source)&&(identical(other.fetchedAt, fetchedAt) || other.fetchedAt == fetchedAt)&&(identical(other.cachedUntil, cachedUntil) || other.cachedUntil == cachedUntil)&&(identical(other.analysis, analysis) || other.analysis == analysis));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,barcode,name,brands,imageUrl,const DeepCollectionEquality().hash(_ingredients),source,fetchedAt,cachedUntil,analysis);

@override
String toString() {
  return 'Product(barcode: $barcode, name: $name, brands: $brands, imageUrl: $imageUrl, ingredients: $ingredients, source: $source, fetchedAt: $fetchedAt, cachedUntil: $cachedUntil, analysis: $analysis)';
}


}

/// @nodoc
abstract mixin class _$ProductCopyWith<$Res> implements $ProductCopyWith<$Res> {
  factory _$ProductCopyWith(_Product value, $Res Function(_Product) _then) = __$ProductCopyWithImpl;
@override @useResult
$Res call({
 String barcode, String name, String brands, String imageUrl, List<ProductIngredient> ingredients, String source, DateTime fetchedAt, DateTime cachedUntil, ProductAnalysis analysis
});


@override $ProductAnalysisCopyWith<$Res> get analysis;

}
/// @nodoc
class __$ProductCopyWithImpl<$Res>
    implements _$ProductCopyWith<$Res> {
  __$ProductCopyWithImpl(this._self, this._then);

  final _Product _self;
  final $Res Function(_Product) _then;

/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? barcode = null,Object? name = null,Object? brands = null,Object? imageUrl = null,Object? ingredients = null,Object? source = null,Object? fetchedAt = null,Object? cachedUntil = null,Object? analysis = null,}) {
  return _then(_Product(
barcode: null == barcode ? _self.barcode : barcode // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,brands: null == brands ? _self.brands : brands // ignore: cast_nullable_to_non_nullable
as String,imageUrl: null == imageUrl ? _self.imageUrl : imageUrl // ignore: cast_nullable_to_non_nullable
as String,ingredients: null == ingredients ? _self._ingredients : ingredients // ignore: cast_nullable_to_non_nullable
as List<ProductIngredient>,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as String,fetchedAt: null == fetchedAt ? _self.fetchedAt : fetchedAt // ignore: cast_nullable_to_non_nullable
as DateTime,cachedUntil: null == cachedUntil ? _self.cachedUntil : cachedUntil // ignore: cast_nullable_to_non_nullable
as DateTime,analysis: null == analysis ? _self.analysis : analysis // ignore: cast_nullable_to_non_nullable
as ProductAnalysis,
  ));
}

/// Create a copy of Product
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$ProductAnalysisCopyWith<$Res> get analysis {
  
  return $ProductAnalysisCopyWith<$Res>(_self.analysis, (value) {
    return _then(_self.copyWith(analysis: value));
  });
}
}


/// @nodoc
mixin _$ProductIngredient {

 String get id; String get text; String get percent; int get rank; String get vegan; String get vegetarian;
/// Create a copy of ProductIngredient
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProductIngredientCopyWith<ProductIngredient> get copyWith => _$ProductIngredientCopyWithImpl<ProductIngredient>(this as ProductIngredient, _$identity);

  /// Serializes this ProductIngredient to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProductIngredient&&(identical(other.id, id) || other.id == id)&&(identical(other.text, text) || other.text == text)&&(identical(other.percent, percent) || other.percent == percent)&&(identical(other.rank, rank) || other.rank == rank)&&(identical(other.vegan, vegan) || other.vegan == vegan)&&(identical(other.vegetarian, vegetarian) || other.vegetarian == vegetarian));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,text,percent,rank,vegan,vegetarian);

@override
String toString() {
  return 'ProductIngredient(id: $id, text: $text, percent: $percent, rank: $rank, vegan: $vegan, vegetarian: $vegetarian)';
}


}

/// @nodoc
abstract mixin class $ProductIngredientCopyWith<$Res>  {
  factory $ProductIngredientCopyWith(ProductIngredient value, $Res Function(ProductIngredient) _then) = _$ProductIngredientCopyWithImpl;
@useResult
$Res call({
 String id, String text, String percent, int rank, String vegan, String vegetarian
});




}
/// @nodoc
class _$ProductIngredientCopyWithImpl<$Res>
    implements $ProductIngredientCopyWith<$Res> {
  _$ProductIngredientCopyWithImpl(this._self, this._then);

  final ProductIngredient _self;
  final $Res Function(ProductIngredient) _then;

/// Create a copy of ProductIngredient
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? text = null,Object? percent = null,Object? rank = null,Object? vegan = null,Object? vegetarian = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,text: null == text ? _self.text : text // ignore: cast_nullable_to_non_nullable
as String,percent: null == percent ? _self.percent : percent // ignore: cast_nullable_to_non_nullable
as String,rank: null == rank ? _self.rank : rank // ignore: cast_nullable_to_non_nullable
as int,vegan: null == vegan ? _self.vegan : vegan // ignore: cast_nullable_to_non_nullable
as String,vegetarian: null == vegetarian ? _self.vegetarian : vegetarian // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [ProductIngredient].
extension ProductIngredientPatterns on ProductIngredient {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProductIngredient value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProductIngredient() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProductIngredient value)  $default,){
final _that = this;
switch (_that) {
case _ProductIngredient():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProductIngredient value)?  $default,){
final _that = this;
switch (_that) {
case _ProductIngredient() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String text,  String percent,  int rank,  String vegan,  String vegetarian)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProductIngredient() when $default != null:
return $default(_that.id,_that.text,_that.percent,_that.rank,_that.vegan,_that.vegetarian);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String text,  String percent,  int rank,  String vegan,  String vegetarian)  $default,) {final _that = this;
switch (_that) {
case _ProductIngredient():
return $default(_that.id,_that.text,_that.percent,_that.rank,_that.vegan,_that.vegetarian);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String text,  String percent,  int rank,  String vegan,  String vegetarian)?  $default,) {final _that = this;
switch (_that) {
case _ProductIngredient() when $default != null:
return $default(_that.id,_that.text,_that.percent,_that.rank,_that.vegan,_that.vegetarian);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ProductIngredient implements ProductIngredient {
  const _ProductIngredient({this.id = '', required this.text, this.percent = '', this.rank = 0, this.vegan = '', this.vegetarian = ''});
  factory _ProductIngredient.fromJson(Map<String, dynamic> json) => _$ProductIngredientFromJson(json);

@override@JsonKey() final  String id;
@override final  String text;
@override@JsonKey() final  String percent;
@override@JsonKey() final  int rank;
@override@JsonKey() final  String vegan;
@override@JsonKey() final  String vegetarian;

/// Create a copy of ProductIngredient
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProductIngredientCopyWith<_ProductIngredient> get copyWith => __$ProductIngredientCopyWithImpl<_ProductIngredient>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProductIngredientToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProductIngredient&&(identical(other.id, id) || other.id == id)&&(identical(other.text, text) || other.text == text)&&(identical(other.percent, percent) || other.percent == percent)&&(identical(other.rank, rank) || other.rank == rank)&&(identical(other.vegan, vegan) || other.vegan == vegan)&&(identical(other.vegetarian, vegetarian) || other.vegetarian == vegetarian));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,text,percent,rank,vegan,vegetarian);

@override
String toString() {
  return 'ProductIngredient(id: $id, text: $text, percent: $percent, rank: $rank, vegan: $vegan, vegetarian: $vegetarian)';
}


}

/// @nodoc
abstract mixin class _$ProductIngredientCopyWith<$Res> implements $ProductIngredientCopyWith<$Res> {
  factory _$ProductIngredientCopyWith(_ProductIngredient value, $Res Function(_ProductIngredient) _then) = __$ProductIngredientCopyWithImpl;
@override @useResult
$Res call({
 String id, String text, String percent, int rank, String vegan, String vegetarian
});




}
/// @nodoc
class __$ProductIngredientCopyWithImpl<$Res>
    implements _$ProductIngredientCopyWith<$Res> {
  __$ProductIngredientCopyWithImpl(this._self, this._then);

  final _ProductIngredient _self;
  final $Res Function(_ProductIngredient) _then;

/// Create a copy of ProductIngredient
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? text = null,Object? percent = null,Object? rank = null,Object? vegan = null,Object? vegetarian = null,}) {
  return _then(_ProductIngredient(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,text: null == text ? _self.text : text // ignore: cast_nullable_to_non_nullable
as String,percent: null == percent ? _self.percent : percent // ignore: cast_nullable_to_non_nullable
as String,rank: null == rank ? _self.rank : rank // ignore: cast_nullable_to_non_nullable
as int,vegan: null == vegan ? _self.vegan : vegan // ignore: cast_nullable_to_non_nullable
as String,vegetarian: null == vegetarian ? _self.vegetarian : vegetarian // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$ProductAnalysis {

 String get overallDanger; List<IngredientMatch> get matches;
/// Create a copy of ProductAnalysis
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProductAnalysisCopyWith<ProductAnalysis> get copyWith => _$ProductAnalysisCopyWithImpl<ProductAnalysis>(this as ProductAnalysis, _$identity);

  /// Serializes this ProductAnalysis to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ProductAnalysis&&(identical(other.overallDanger, overallDanger) || other.overallDanger == overallDanger)&&const DeepCollectionEquality().equals(other.matches, matches));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,overallDanger,const DeepCollectionEquality().hash(matches));

@override
String toString() {
  return 'ProductAnalysis(overallDanger: $overallDanger, matches: $matches)';
}


}

/// @nodoc
abstract mixin class $ProductAnalysisCopyWith<$Res>  {
  factory $ProductAnalysisCopyWith(ProductAnalysis value, $Res Function(ProductAnalysis) _then) = _$ProductAnalysisCopyWithImpl;
@useResult
$Res call({
 String overallDanger, List<IngredientMatch> matches
});




}
/// @nodoc
class _$ProductAnalysisCopyWithImpl<$Res>
    implements $ProductAnalysisCopyWith<$Res> {
  _$ProductAnalysisCopyWithImpl(this._self, this._then);

  final ProductAnalysis _self;
  final $Res Function(ProductAnalysis) _then;

/// Create a copy of ProductAnalysis
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? overallDanger = null,Object? matches = null,}) {
  return _then(_self.copyWith(
overallDanger: null == overallDanger ? _self.overallDanger : overallDanger // ignore: cast_nullable_to_non_nullable
as String,matches: null == matches ? _self.matches : matches // ignore: cast_nullable_to_non_nullable
as List<IngredientMatch>,
  ));
}

}


/// Adds pattern-matching-related methods to [ProductAnalysis].
extension ProductAnalysisPatterns on ProductAnalysis {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ProductAnalysis value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ProductAnalysis() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ProductAnalysis value)  $default,){
final _that = this;
switch (_that) {
case _ProductAnalysis():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ProductAnalysis value)?  $default,){
final _that = this;
switch (_that) {
case _ProductAnalysis() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String overallDanger,  List<IngredientMatch> matches)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ProductAnalysis() when $default != null:
return $default(_that.overallDanger,_that.matches);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String overallDanger,  List<IngredientMatch> matches)  $default,) {final _that = this;
switch (_that) {
case _ProductAnalysis():
return $default(_that.overallDanger,_that.matches);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String overallDanger,  List<IngredientMatch> matches)?  $default,) {final _that = this;
switch (_that) {
case _ProductAnalysis() when $default != null:
return $default(_that.overallDanger,_that.matches);case _:
  return null;

}
}

}

/// @nodoc

@JsonSerializable(explicitToJson: true)
class _ProductAnalysis implements ProductAnalysis {
  const _ProductAnalysis({this.overallDanger = 'safe', final  List<IngredientMatch> matches = const <IngredientMatch>[]}): _matches = matches;
  factory _ProductAnalysis.fromJson(Map<String, dynamic> json) => _$ProductAnalysisFromJson(json);

@override@JsonKey() final  String overallDanger;
 final  List<IngredientMatch> _matches;
@override@JsonKey() List<IngredientMatch> get matches {
  if (_matches is EqualUnmodifiableListView) return _matches;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_matches);
}


/// Create a copy of ProductAnalysis
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProductAnalysisCopyWith<_ProductAnalysis> get copyWith => __$ProductAnalysisCopyWithImpl<_ProductAnalysis>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProductAnalysisToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ProductAnalysis&&(identical(other.overallDanger, overallDanger) || other.overallDanger == overallDanger)&&const DeepCollectionEquality().equals(other._matches, _matches));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,overallDanger,const DeepCollectionEquality().hash(_matches));

@override
String toString() {
  return 'ProductAnalysis(overallDanger: $overallDanger, matches: $matches)';
}


}

/// @nodoc
abstract mixin class _$ProductAnalysisCopyWith<$Res> implements $ProductAnalysisCopyWith<$Res> {
  factory _$ProductAnalysisCopyWith(_ProductAnalysis value, $Res Function(_ProductAnalysis) _then) = __$ProductAnalysisCopyWithImpl;
@override @useResult
$Res call({
 String overallDanger, List<IngredientMatch> matches
});




}
/// @nodoc
class __$ProductAnalysisCopyWithImpl<$Res>
    implements _$ProductAnalysisCopyWith<$Res> {
  __$ProductAnalysisCopyWithImpl(this._self, this._then);

  final _ProductAnalysis _self;
  final $Res Function(_ProductAnalysis) _then;

/// Create a copy of ProductAnalysis
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? overallDanger = null,Object? matches = null,}) {
  return _then(_ProductAnalysis(
overallDanger: null == overallDanger ? _self.overallDanger : overallDanger // ignore: cast_nullable_to_non_nullable
as String,matches: null == matches ? _self._matches : matches // ignore: cast_nullable_to_non_nullable
as List<IngredientMatch>,
  ));
}


}


/// @nodoc
mixin _$IngredientMatch {

 String get ingredientText; List<MatchedSubstance> get substances;
/// Create a copy of IngredientMatch
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$IngredientMatchCopyWith<IngredientMatch> get copyWith => _$IngredientMatchCopyWithImpl<IngredientMatch>(this as IngredientMatch, _$identity);

  /// Serializes this IngredientMatch to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is IngredientMatch&&(identical(other.ingredientText, ingredientText) || other.ingredientText == ingredientText)&&const DeepCollectionEquality().equals(other.substances, substances));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,ingredientText,const DeepCollectionEquality().hash(substances));

@override
String toString() {
  return 'IngredientMatch(ingredientText: $ingredientText, substances: $substances)';
}


}

/// @nodoc
abstract mixin class $IngredientMatchCopyWith<$Res>  {
  factory $IngredientMatchCopyWith(IngredientMatch value, $Res Function(IngredientMatch) _then) = _$IngredientMatchCopyWithImpl;
@useResult
$Res call({
 String ingredientText, List<MatchedSubstance> substances
});




}
/// @nodoc
class _$IngredientMatchCopyWithImpl<$Res>
    implements $IngredientMatchCopyWith<$Res> {
  _$IngredientMatchCopyWithImpl(this._self, this._then);

  final IngredientMatch _self;
  final $Res Function(IngredientMatch) _then;

/// Create a copy of IngredientMatch
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? ingredientText = null,Object? substances = null,}) {
  return _then(_self.copyWith(
ingredientText: null == ingredientText ? _self.ingredientText : ingredientText // ignore: cast_nullable_to_non_nullable
as String,substances: null == substances ? _self.substances : substances // ignore: cast_nullable_to_non_nullable
as List<MatchedSubstance>,
  ));
}

}


/// Adds pattern-matching-related methods to [IngredientMatch].
extension IngredientMatchPatterns on IngredientMatch {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _IngredientMatch value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _IngredientMatch() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _IngredientMatch value)  $default,){
final _that = this;
switch (_that) {
case _IngredientMatch():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _IngredientMatch value)?  $default,){
final _that = this;
switch (_that) {
case _IngredientMatch() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String ingredientText,  List<MatchedSubstance> substances)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _IngredientMatch() when $default != null:
return $default(_that.ingredientText,_that.substances);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String ingredientText,  List<MatchedSubstance> substances)  $default,) {final _that = this;
switch (_that) {
case _IngredientMatch():
return $default(_that.ingredientText,_that.substances);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String ingredientText,  List<MatchedSubstance> substances)?  $default,) {final _that = this;
switch (_that) {
case _IngredientMatch() when $default != null:
return $default(_that.ingredientText,_that.substances);case _:
  return null;

}
}

}

/// @nodoc

@JsonSerializable(explicitToJson: true)
class _IngredientMatch implements IngredientMatch {
  const _IngredientMatch({required this.ingredientText, final  List<MatchedSubstance> substances = const <MatchedSubstance>[]}): _substances = substances;
  factory _IngredientMatch.fromJson(Map<String, dynamic> json) => _$IngredientMatchFromJson(json);

@override final  String ingredientText;
 final  List<MatchedSubstance> _substances;
@override@JsonKey() List<MatchedSubstance> get substances {
  if (_substances is EqualUnmodifiableListView) return _substances;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_substances);
}


/// Create a copy of IngredientMatch
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$IngredientMatchCopyWith<_IngredientMatch> get copyWith => __$IngredientMatchCopyWithImpl<_IngredientMatch>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$IngredientMatchToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _IngredientMatch&&(identical(other.ingredientText, ingredientText) || other.ingredientText == ingredientText)&&const DeepCollectionEquality().equals(other._substances, _substances));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,ingredientText,const DeepCollectionEquality().hash(_substances));

@override
String toString() {
  return 'IngredientMatch(ingredientText: $ingredientText, substances: $substances)';
}


}

/// @nodoc
abstract mixin class _$IngredientMatchCopyWith<$Res> implements $IngredientMatchCopyWith<$Res> {
  factory _$IngredientMatchCopyWith(_IngredientMatch value, $Res Function(_IngredientMatch) _then) = __$IngredientMatchCopyWithImpl;
@override @useResult
$Res call({
 String ingredientText, List<MatchedSubstance> substances
});




}
/// @nodoc
class __$IngredientMatchCopyWithImpl<$Res>
    implements _$IngredientMatchCopyWith<$Res> {
  __$IngredientMatchCopyWithImpl(this._self, this._then);

  final _IngredientMatch _self;
  final $Res Function(_IngredientMatch) _then;

/// Create a copy of IngredientMatch
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? ingredientText = null,Object? substances = null,}) {
  return _then(_IngredientMatch(
ingredientText: null == ingredientText ? _self.ingredientText : ingredientText // ignore: cast_nullable_to_non_nullable
as String,substances: null == substances ? _self._substances : substances // ignore: cast_nullable_to_non_nullable
as List<MatchedSubstance>,
  ));
}


}


/// @nodoc
mixin _$MatchedSubstance {

 String get id; String get code; String get name; String get dangerLevel; String get description; List<String> get sources;
/// Create a copy of MatchedSubstance
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MatchedSubstanceCopyWith<MatchedSubstance> get copyWith => _$MatchedSubstanceCopyWithImpl<MatchedSubstance>(this as MatchedSubstance, _$identity);

  /// Serializes this MatchedSubstance to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MatchedSubstance&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&(identical(other.dangerLevel, dangerLevel) || other.dangerLevel == dangerLevel)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other.sources, sources));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,code,name,dangerLevel,description,const DeepCollectionEquality().hash(sources));

@override
String toString() {
  return 'MatchedSubstance(id: $id, code: $code, name: $name, dangerLevel: $dangerLevel, description: $description, sources: $sources)';
}


}

/// @nodoc
abstract mixin class $MatchedSubstanceCopyWith<$Res>  {
  factory $MatchedSubstanceCopyWith(MatchedSubstance value, $Res Function(MatchedSubstance) _then) = _$MatchedSubstanceCopyWithImpl;
@useResult
$Res call({
 String id, String code, String name, String dangerLevel, String description, List<String> sources
});




}
/// @nodoc
class _$MatchedSubstanceCopyWithImpl<$Res>
    implements $MatchedSubstanceCopyWith<$Res> {
  _$MatchedSubstanceCopyWithImpl(this._self, this._then);

  final MatchedSubstance _self;
  final $Res Function(MatchedSubstance) _then;

/// Create a copy of MatchedSubstance
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? name = null,Object? dangerLevel = null,Object? description = null,Object? sources = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,dangerLevel: null == dangerLevel ? _self.dangerLevel : dangerLevel // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,sources: null == sources ? _self.sources : sources // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [MatchedSubstance].
extension MatchedSubstancePatterns on MatchedSubstance {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MatchedSubstance value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MatchedSubstance() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MatchedSubstance value)  $default,){
final _that = this;
switch (_that) {
case _MatchedSubstance():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MatchedSubstance value)?  $default,){
final _that = this;
switch (_that) {
case _MatchedSubstance() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code,  String name,  String dangerLevel,  String description,  List<String> sources)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MatchedSubstance() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.dangerLevel,_that.description,_that.sources);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code,  String name,  String dangerLevel,  String description,  List<String> sources)  $default,) {final _that = this;
switch (_that) {
case _MatchedSubstance():
return $default(_that.id,_that.code,_that.name,_that.dangerLevel,_that.description,_that.sources);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code,  String name,  String dangerLevel,  String description,  List<String> sources)?  $default,) {final _that = this;
switch (_that) {
case _MatchedSubstance() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.dangerLevel,_that.description,_that.sources);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MatchedSubstance implements MatchedSubstance {
  const _MatchedSubstance({required this.id, this.code = '', required this.name, required this.dangerLevel, this.description = '', final  List<String> sources = const <String>[]}): _sources = sources;
  factory _MatchedSubstance.fromJson(Map<String, dynamic> json) => _$MatchedSubstanceFromJson(json);

@override final  String id;
@override@JsonKey() final  String code;
@override final  String name;
@override final  String dangerLevel;
@override@JsonKey() final  String description;
 final  List<String> _sources;
@override@JsonKey() List<String> get sources {
  if (_sources is EqualUnmodifiableListView) return _sources;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_sources);
}


/// Create a copy of MatchedSubstance
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MatchedSubstanceCopyWith<_MatchedSubstance> get copyWith => __$MatchedSubstanceCopyWithImpl<_MatchedSubstance>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MatchedSubstanceToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MatchedSubstance&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&(identical(other.dangerLevel, dangerLevel) || other.dangerLevel == dangerLevel)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other._sources, _sources));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,code,name,dangerLevel,description,const DeepCollectionEquality().hash(_sources));

@override
String toString() {
  return 'MatchedSubstance(id: $id, code: $code, name: $name, dangerLevel: $dangerLevel, description: $description, sources: $sources)';
}


}

/// @nodoc
abstract mixin class _$MatchedSubstanceCopyWith<$Res> implements $MatchedSubstanceCopyWith<$Res> {
  factory _$MatchedSubstanceCopyWith(_MatchedSubstance value, $Res Function(_MatchedSubstance) _then) = __$MatchedSubstanceCopyWithImpl;
@override @useResult
$Res call({
 String id, String code, String name, String dangerLevel, String description, List<String> sources
});




}
/// @nodoc
class __$MatchedSubstanceCopyWithImpl<$Res>
    implements _$MatchedSubstanceCopyWith<$Res> {
  __$MatchedSubstanceCopyWithImpl(this._self, this._then);

  final _MatchedSubstance _self;
  final $Res Function(_MatchedSubstance) _then;

/// Create a copy of MatchedSubstance
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? name = null,Object? dangerLevel = null,Object? description = null,Object? sources = null,}) {
  return _then(_MatchedSubstance(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,dangerLevel: null == dangerLevel ? _self.dangerLevel : dangerLevel // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,sources: null == sources ? _self._sources : sources // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}

// dart format on
