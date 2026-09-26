-- +goose Up
INSERT INTO substances (code, name, aliases, category, danger_level, description, sources)
VALUES
    ('E102', 'Tartrazine', ARRAY['тартразин', 'tartrazine', 'yellow 5'], 'colorant', 'controversial', 'Synthetic yellow food colorant that may cause sensitivity reactions in some people.', ARRAY['https://world.openfoodfacts.org/additive/e102-tartrazine']),
    ('E110', 'Sunset yellow FCF', ARRAY['солнечный закат', 'sunset yellow', 'yellow 6'], 'colorant', 'controversial', 'Synthetic orange-yellow colorant with possible sensitivity concerns.', ARRAY['https://world.openfoodfacts.org/additive/e110-sunset-yellow-fcf']),
    ('E211', 'Sodium benzoate', ARRAY['бензоат натрия', 'sodium benzoate'], 'preservative', 'controversial', 'Preservative commonly used in acidic foods and drinks.', ARRAY['https://world.openfoodfacts.org/additive/e211-sodium-benzoate']),
    ('E250', 'Sodium nitrite', ARRAY['нитрит натрия', 'sodium nitrite'], 'preservative', 'dangerous', 'Curing preservative associated with nitrosamine formation risks when misused.', ARRAY['https://world.openfoodfacts.org/additive/e250-sodium-nitrite']),
    ('E320', 'Butylated hydroxyanisole', ARRAY['bha', 'бутилгидроксианизол'], 'antioxidant', 'controversial', 'Synthetic antioxidant with disputed safety profile.', ARRAY['https://world.openfoodfacts.org/additive/e320-butylated-hydroxyanisole']),
    ('E621', 'Monosodium glutamate', ARRAY['msg', 'глутамат натрия', 'monosodium glutamate'], 'flavour_enhancer', 'controversial', 'Flavour enhancer that some users prefer to limit.', ARRAY['https://world.openfoodfacts.org/additive/e621-monosodium-glutamate']),
    ('E951', 'Aspartame', ARRAY['аспартам', 'aspartame'], 'sweetener', 'controversial', 'Low-calorie sweetener contraindicated for people with phenylketonuria.', ARRAY['https://world.openfoodfacts.org/additive/e951-aspartame']),
    ('E954', 'Saccharin', ARRAY['сахарин', 'saccharin'], 'sweetener', 'controversial', 'Artificial sweetener with historical safety debate.', ARRAY['https://world.openfoodfacts.org/additive/e954-saccharin']),
    ('TRANS_FAT', 'Trans fats', ARRAY['трансжиры', 'partially hydrogenated oil', 'hydrogenated fat'], 'fat', 'dangerous', 'Industrial trans fats are associated with increased cardiovascular risk.', ARRAY['https://www.who.int/news-room/fact-sheets/detail/healthy-diet']),
    ('PALM_OIL', 'Palm oil', ARRAY['пальмовое масло', 'palm oil'], 'fat', 'controversial', 'Ingredient often tracked for nutritional and environmental reasons.', ARRAY['https://world.openfoodfacts.org/ingredient/palm-oil'])
ON CONFLICT (code) DO NOTHING;

-- +goose Down
DELETE FROM substances
WHERE code IN ('E102', 'E110', 'E211', 'E250', 'E320', 'E621', 'E951', 'E954', 'TRANS_FAT', 'PALM_OIL');
