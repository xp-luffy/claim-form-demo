# Agentic Layer

## Risk Levels

### Low — Auto (no approval)
| Action | Trigger | Tool |
|------|---------|------|
| Suggest category for new claim | claim.submitted | `suggest_claim_category` |
| Flag round-amount | amount is round | `flag_claim_risk` |
| Compute total from line items | claim_items added | `compute_claim_total` |

### Medium — Light approval (one-click confirm)
| Action | Trigger | Tool |
|------|---------|------|
| Auto-classify and set category | AI confidence ≥ 0.8 | `auto_classify_claim` |
| Update claim status to classified | Finance confirms | `classify_claim` |

### High — Always approval (explicit action)
| Action | Trigger | Tool |
|------|---------|------|
| Approve claim | Approver clicks Approve | `approve_claim` |
| Reject claim | Approver clicks Reject | `reject_claim` |
| Release payment | Finance clicks Release | `release_payment` |

### Critical — Human-only
| Action | Tool |
|------|------|
| Delete a claim | `delete_claim` (manual only, no agent) |
| Void a released payment | `void_payment` (manual only) |
| Edit a paid claim | blocked by DB constraint |

## Named Tools (contract)
Each tool: narrow input schema, structured output, logged to audit_logs.
- `suggest_claim_category(claim_id)` → `{category, confidence, source}`
- `classify_claim(claim_id, category, is_petty_cash)` → updates claim
- `approve_claim(claim_id, note)` → updates claim status + writes approval
- `release_payment(claim_id, method, reference)` → writes payment + updates claim

## Audit Log Fields (per agent action)
`entity_type`, `entity_id`, `action`, `detail` (JSON: tool name, input, output, actor)

## v1 vs Later
- **v1:** All actions are manual user clicks (submit, classify, approve, release). Audit logging on every transition.
- **Later:** AI auto-classify on submit (low risk), risk flagging (low), auto-classify with confirm (medium).