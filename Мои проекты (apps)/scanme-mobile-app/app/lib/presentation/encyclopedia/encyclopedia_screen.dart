import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/substance.dart';
import '../../data/repositories/substance_repository.dart';

/// Локальная «энциклопедия» веществ после синхронизации дельты с API (этап 11).
class EncyclopediaScreen extends ConsumerStatefulWidget {
  const EncyclopediaScreen({super.key});

  static const routePath = '/encyclopedia';

  @override
  ConsumerState<EncyclopediaScreen> createState() => _EncyclopediaScreenState();
}

class _EncyclopediaScreenState extends ConsumerState<EncyclopediaScreen> {
  final TextEditingController _query = TextEditingController();
  List<Substance> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _query.addListener(() => setState(() {}));
    Future.microtask(_load);
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(substanceRepositoryProvider);
      await repo.syncDelta();
      final list = await repo.getLocalSubstances();
      list.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
      setState(() {
        _items = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final q = _query.text.trim().toLowerCase();
    final filtered = q.isEmpty
        ? _items
        : _items
              .where(
                (s) =>
                    s.name.toLowerCase().contains(q) ||
                    s.code.toLowerCase().contains(q) ||
                    s.aliases.any((a) => a.toLowerCase().contains(q)),
              )
              .toList(growable: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Энциклопедия'),
        actions: [
          IconButton(
            tooltip: 'Обновить с сервера',
            onPressed: _loading ? null : _load,
            icon: _loading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.sync),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _query,
              decoration: const InputDecoration(
                hintText: 'Поиск по названию, коду или синониму',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          Expanded(
            child: _loading && _items.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 24),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final s = filtered[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: _dangerColor(context, s.dangerLevel).withValues(alpha: 0.2),
                          foregroundColor: _dangerColor(context, s.dangerLevel),
                          child: Text(
                            s.name.isNotEmpty ? s.name.substring(0, 1).toUpperCase() : '?',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                        title: Text(s.name),
                        subtitle: Text(
                          [
                            if (s.code.isNotEmpty) s.code,
                            s.category,
                            _dangerLabel(s.dangerLevel),
                          ].join(' · '),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        onTap: () => _showDetail(context, s),
                      );
                    },
                  ),
          ),
          if (!_loading && _items.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: Text(
                'В справочнике: ${_items.length} веществ${q.isNotEmpty ? ', найдено: ${filtered.length}' : ''}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).hintColor),
              ),
            ),
        ],
      ),
    );
  }

  Color _dangerColor(BuildContext context, DangerLevel level) {
    final scheme = Theme.of(context).colorScheme;
    return switch (level) {
      DangerLevel.safe => scheme.primary,
      DangerLevel.controversial => scheme.tertiary,
      DangerLevel.dangerous => scheme.error,
    };
  }

  String _dangerLabel(DangerLevel level) => switch (level) {
        DangerLevel.safe => 'безопасно',
        DangerLevel.controversial => 'спорно',
        DangerLevel.dangerous => 'опасно',
      };

  void _showDetail(BuildContext context, Substance s) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 8,
          bottom: MediaQuery.paddingOf(ctx).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(s.name, style: Theme.of(ctx).textTheme.headlineSmall),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Chip(label: Text(_dangerLabel(s.dangerLevel))),
                  if (s.code.isNotEmpty) Chip(label: Text('Код: ${s.code}')),
                  Chip(label: Text('v${s.version}')),
                ],
              ),
              if (s.description.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Описание', style: Theme.of(ctx).textTheme.titleSmall),
                const SizedBox(height: 6),
                Text(s.description),
              ],
              if (s.aliases.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Синонимы', style: Theme.of(ctx).textTheme.titleSmall),
                const SizedBox(height: 6),
                Text(s.aliases.join(', ')),
              ],
              if (s.sources.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('Источники', style: Theme.of(ctx).textTheme.titleSmall),
                const SizedBox(height: 6),
                Text(s.sources.join('\n')),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
