<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep the studio presentation on the index route with section anchors because it is a single continuous landing page.
- Define all visual styles and semantic colors in src/styles.css and use the shared Button variants for calls to action to maintain consistent styling.
- Use bundled media for the visual identity and a matching public SVG favicon so brand assets render without external dependencies.
