# AI claim suggestions

Category suggestions use Anthropic's Messages API from the server. The app sends only the claim title, description, and line item descriptions. It never sends a claimant email or an API key to the browser.

Set these server environment variables to enable suggestions:

```text
ANTHROPIC_API_KEY=your-server-side-key
CLAUDE_CLASSIFY_MODEL=claude-sonnet-5
```

If `ANTHROPIC_API_KEY` is missing or the provider fails twice, claim submission continues and Finance classifies the claim manually. A suggestion is displayed with its confidence and source. Finance must review and confirm or replace it; the AI never changes claim status or releases payment.

For local development, put the values in `.env.local`. For Vercel, add them to the project's server environment settings and redeploy. Keep the provider key server-side and never prefix it with `NEXT_PUBLIC_`.
