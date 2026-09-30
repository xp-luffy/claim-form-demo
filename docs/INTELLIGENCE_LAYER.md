# Intelligence Layer

## Messy Input
Staff type free-text claim titles and descriptions with no standard categories:
- "beli alat tulis untuk meeting" → Stationery
- "makan staff meeting hari jumaat" → Meals & Entertainment
- "teksi pergi KL untuk client visit" → Travel — Taxi

## Auto-Structure Schema (AI output)
```json
{
  "suggested_category": "Stationery",
  "confidence": 0.86,
  "is_petty_cash": true,
  "flags": ["round_amount"],
  "source": "claude-classify-v1"
}
```
- Fields nullable — model returns `null` when unsure, never fabricates.
- If `confidence < 0.7` → `review_status` stays `unreviewed`.

## Events to Track
| Event | Trigger |
|------|---------|
| claim.submitted | New claim created |
| claim.classified | Category set by finance or AI |
| claim.approved | Approval decision made |
| claim.rejected | Rejection decision made |
| payment.released | Payment marked released |

## Scoring Rules (rule-based v1)
| Rule | Score | Action |
|------|-------|--------|
| Amount > RM 500 and petty_cash | +2 risk | Flag for second approval |
| Amount is exact round number | +1 | Flag "round_amount" |
| Duplicate title within 7 days | +3 | Flag "possible_duplicate" |
| AI confidence < 0.7 | review | Queue for manual review |

## What Gets Ranked
Claims list can be sorted by: amount (high→low), submission date, risk score (high→low). Default: status priority (submitted first, then classified, then approved).

## v1 vs Later
- **v1:** Manual classification by finance. No AI.
- **Later:** AI auto-classify on submit, risk scoring, duplicate detection, dashboard ranking.