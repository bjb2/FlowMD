# FlowMD


**FlowMD is a human-first recipe format built on Markdown.**


It adds just enough structure to make recipes machine-readable, without sacrificing readability or forcing a DSL.


---


## Why FlowMD exists


Most recipe formats fall into one of two camps:


- **Too loose** → easy to write, hard to build tools for
- **Too strict** → powerful, but unpleasant to author


FlowMD sits in between.


It is designed so that:
- Every FlowMD file is valid Markdown
- Recipes read naturally without special tooling
- Parsers can extract metadata, ingredients, steps, and variations
- Mistakes never break rendering


---


## Key features


- Plain Markdown recipes
- Optional metadata block
- First-class conditional variations (`? if -> then`)
- Optional ingredient anchors
- Graceful degradation


FlowMD is intentionally **not** a programming language.


---


## Example


```md
# Pasta Aglio e Olio


~
Prep Time: 10 min
Cook Time: 15 min
Servings: 2
~


1. Boil pasta in salted water.
2. Heat olive oil and add garlic.


? Want protein -> add shrimp in step 2


## Ingredients
- pasta: 8 oz
- olive oil: 1/3 cup
- garlic: 4 cloves