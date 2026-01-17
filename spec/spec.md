# FlowMD v0 Parser Contract

This document defines the **minimum, stable contract** a parser can rely on when consuming FlowMD files. It intentionally balances **human-first writing** with **machine-usable anchors**.

---

## 1. Design Principles

FlowMD parsers MUST follow these principles:

1. **Never break Markdown rendering**
2. **Graceful degradation** — unrecognized lines are plain text
3. **Optional structure** — structure enhances, never blocks
4. **Loose by default, typed when present**

A FlowMD file is always valid Markdown, even if the parser understands nothing.

---

## 2. Document Structure (High-Level)

A FlowMD document MAY contain the following sections, in order:

1. Title (Markdown `#` heading)
2. Metadata Block (optional, fenced by `~`)
3. Steps (numbered list)
4. Conditional Lines (inline or grouped)
5. Ingredients Section (optional anchor section)
6. Freeform Markdown (notes, images, tags, etc.)

Only the **Metadata Block** has special fencing. Everything else is plain Markdown.

---

## 3. Metadata Block (v0)

### Syntax

```md
~
Prep Time: 15 min
Cook Time: 30 min
Servings: 2
Cost: $5
~
```

### Rules

* The block MUST start and end with a line containing only `~`
* Lines inside the block MUST be `Key: Value`
* Order does NOT matter
* Keys are case-insensitive
* Unknown keys MUST be preserved, not discarded

### Canonical Keys (v0)

| Key        | Normalized Field | Notes             |
| ---------- | ---------------- | ----------------- |
| Prep Time  | prepTime         | Duration string   |
| Cook Time  | cookTime         | Duration string   |
| Total Time | totalTime        | Optional          |
| Servings   | servings         | Integer or string |
| Cost       | cost             | Freeform          |

Parsers MAY normalize durations (e.g. `15min` → 15 minutes) but MUST retain the raw string.

---

## 4. Steps

### Syntax

Standard Markdown numbered list:

```md
1. Boil pasta in salted water until al dente.
2. Heat olive oil and add garlic.
```

### Rules

* Step numbers imply execution order
* Step text is opaque to the parser by default
* Parsers MAY attach IDs based on order (e.g. `step-2`)

---

## 5. Conditional Lines (First-Class Feature)

### Syntax

```md
? Condition -> Action
```

### Optional Typed Conditions

```md
? [ingredient] No parsley -> use basil or skip
? [step] Want protein -> add shrimp in step 2
? [diet] Vegan -> replace butter with olive oil
```

### Rules

* Lines MUST start with `?`
* Type tag in brackets is OPTIONAL
* Condition and action are freeform text
* Parsers MUST NOT enforce vocabularies

### Normalized Shape

```ts
{
  type: 'ingredient' | 'step' | 'diet' | 'unknown',
  condition: string,
  action: string
}
```

Unknown or missing types MUST normalize to `unknown`.

---

## 6. Ingredients Section (Anchors)

### Syntax

```md
## Ingredients

- pasta: 8 oz (spaghetti or linguine)
- olive oil: 1/3 cup
- garlic: 4 cloves, sliced
```

### Rules

* Section header MUST be exactly `## Ingredients`
* Bullet items define ingredient anchors
* Format is `name: quantity (optional notes)`
* Quantity and notes are OPTIONAL

### Normalized Shape

```ts
{
  name: 'pasta',
  quantity: '8 oz',
  notes: 'spaghetti or linguine'
}
```

Parsers SHOULD NOT attempt aggressive NLP beyond this split.

---

## 7. Relationship Between Ingredients & Steps

* No explicit linking is required
* Parsers MAY heuristically associate ingredient names found in steps
* Conditional lines MAY reference ingredient names or step numbers

FlowMD intentionally avoids inline annotations.

---

## 8. Error Handling & Degradation

Parsers MUST:

* Ignore malformed metadata lines
* Treat unknown sections as plain Markdown
* Preserve original text when re-serializing

A parser failure MUST NOT invalidate the document.

---

## 9. Non-Goals (Explicit)

FlowMD v0 does NOT attempt to:

* Enforce strict schemas
* Guarantee perfect scaling
* Replace Cooklang-style precision
* Prevent ambiguity

Ambiguity is considered a **feature**, not a bug.

---

## 10. Minimal Valid FlowMD File

```md
# Example Recipe

1. Cook the thing.
```

This MUST parse without errors.

---

## 11. Forward Compatibility

Future versions MAY add:

* Additional typed condition tags
* Optional `## Equipment` anchors
* Metadata value normalization hints

v0 parsers MUST ignore unsupported extensions.

---

**FlowMD v0 promise:** If it looks readable to a human, it is valid FlowMD.

---

## 12. Canonical JSON Schema (v0)

The following JSON Schema defines the canonical output shape for a FlowMD v0 parser.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://flowmd.dev/schema/flowmd-v0.json",
  "title": "FlowMD v0 Parsed Output",
  "type": "object",
  "required": ["type", "version", "metadata", "ingredients", "steps", "conditionals"],
  "properties": {
    "type": {
      "const": "flowmd"
    },
    "version": {
      "type": "string"
    },
    "title": {
      "type": ["string", "null"]
    },
    "metadata": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["raw"],
        "properties": {
          "raw": { "type": "string" },
          "minutes": { "type": "number" },
          "value": { "type": ["number", "string"] }
        },
        "additionalProperties": true
      }
    },
    "ingredients": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "quantity", "notes"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "quantity": { "type": ["string", "null"] },
          "notes": { "type": ["string", "null"] }
        }
      }
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "order", "text"],
        "properties": {
          "id": { "type": "string" },
          "order": { "type": "number" },
          "text": { "type": "string" }
        }
      }
    },
    "conditionals": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "condition", "action", "raw"],
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string" },
          "condition": { "type": "string" },
          "action": { "type": "string" },
          "raw": { "type": "string" }
        }
      }
    },
    "raw": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "additionalProperties": false
}
```
