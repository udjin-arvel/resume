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

## Project rules
- The app is a thin client: all legal reasoning/LLM calls live in the user's external FastAPI backend; the client only POSTs to `${VITE_API_URL}/search` and renders NDJSON events (contract documented in `src/lib/uk-search.ts`). Why: user owns the backend.
- Without `VITE_API_URL` the client runs a built-in demo answer so the preview still works.
