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
# Garlic Butter Shrimp Pasta

~
Prep Time: 15 min
Cook Time: 20 min
Total Time: 35 min
Servings: 4
Cost: $12
Author: Test Kitchen
~

1. Bring a large pot of salted water to boil [10-12min] and cook pasta until al dente.
2. Meanwhile, heat butter and olive oil in a large skillet [2min] over medium heat.
3. Add garlic and red pepper flakes, cook [1-2min] until fragrant but not browned.
4. Add shrimp and cook [3-4min] until pink and opaque, flipping halfway through.
5. Remove shrimp and set aside [temporarily].
6. Add white wine to the pan and simmer [3-5min] until reduced by half.
7. Return shrimp to pan, add pasta with reserved pasta water [1min], toss to combine.
8. Remove from heat, stir in parmesan and fresh parsley.
9. Let rest [2-3min] before serving to allow flavors to meld.

? [ingredient] No white wine -> use chicken broth + lemon juice
? [ingredient] No shrimp -> use chicken breast cut into bite-sized pieces
? [diet] Dairy-free -> skip parmesan and use extra olive oil
? [step] Want spicier -> double the red pepper flakes in step 3
? [ingredient] No fresh parsley -> use 1 tsp dried parsley or skip

## Ingredients

- pasta: 1 lb (linguine or spaghetti)
- butter: 4 tbsp
- olive oil: 2 tbsp
- garlic: 6 cloves, minced
- red pepper flakes: 1/2 tsp
- shrimp: 1 lb (peeled and deveined, 16-20 count)
- white wine: 1/2 cup (dry white)
- pasta water: 1/2 cup (reserved from cooking)
- parmesan: 1/2 cup, grated
- fresh parsley: 1/4 cup, chopped
- salt: to taste
- black pepper: to taste
- lemon wedges: for serving

## Notes

This is a quick weeknight dinner that looks impressive. The key is not overcooking the shrimp - they should be just pink and barely opaque. If they curl into tight circles, you've gone too far.

The pasta water is crucial here - it helps emulsify the sauce and makes everything silky. Don't skip saving some before you drain!

**Wine pairing:** A crisp Pinot Grigio or Sauvignon Blanc works beautifully.

**Leftovers:** Best eaten fresh, but will keep refrigerated for 2 days. Reheat gently with a splash of water or broth.

## Kitchen Notes

- 2024-01-15: Tried with angel hair pasta - cooks faster but breaks easily, stick with linguine
- Added extra lemon zest at the end - amazing!
- Mom suggested adding cherry tomatoes in step 6, need to try this next time
- Can easily double for a dinner party, just use two skillets
