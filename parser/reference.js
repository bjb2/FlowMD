/**
 * FlowMD v0 Reference Parser with Conservative Normalization
 *
 * Input: Markdown string
 * Output: JSON object following FlowMD v0 contract
 */

export function parseFlowMD(markdown) {
  const lines = markdown.split(/\r?\n/)

  const result = {
    type: "flowmd",
    version: "0.1",
    title: null,
    metadata: {},
    ingredients: [],
    steps: [],
    conditionals: [],
    raw: {
      markdown
    }
  }

  let i = 0

  // -----------------------------
  // Helpers
  // -----------------------------

  const isMetadataFence = (line) => line.trim() === "~"
  const isTitle = (line) => /^#\s+/.test(line)
  const isStep = (line) => /^\d+\.\s+/.test(line)
  const isConditional = (line) => /^\?\s+/.test(line)
  const isIngredientsHeader = (line) => line.trim() === "## Ingredients"
  const isIngredientItem = (line) => /^\-\s+/.test(line)

  // -----------------------------
  // Title (first H1 only)
  // -----------------------------

  for (const line of lines) {
    if (isTitle(line)) {
      result.title = line.replace(/^#\s+/, "").trim()
      break
    }
  }

  // -----------------------------
  // Metadata Block (first only)
  // -----------------------------

  let metadataParsed = false

  while (i < lines.length) {
    if (isMetadataFence(lines[i]) && !metadataParsed) {
      i++
      while (i < lines.length && !isMetadataFence(lines[i])) {
        const line = lines[i]
        const match = line.match(/^([^:]+):\s*(.+)$/)

        if (match) {
          const keyRaw = match[1].trim()
          const valueRaw = match[2].trim()
          const key = normalizeMetadataKey(keyRaw)

          result.metadata[key] = {
            raw: valueRaw,
            ...normalizeMetadataValue(key, valueRaw)
          }
        }
        i++
      }
      metadataParsed = true
    }
    i++
  }

  // -----------------------------
  // Ingredients Section
  // -----------------------------

  i = 0
  let inIngredients = false

  while (i < lines.length) {
    const line = lines[i]

    if (isIngredientsHeader(line)) {
      inIngredients = true
      i++
      continue
    }

    if (inIngredients) {
      if (isIngredientItem(line)) {
        const item = parseIngredient(line)
        result.ingredients.push(item)
        i++
        continue
      } else if (line.trim() === "") {
        i++
        continue
      } else {
        inIngredients = false
      }
    }

    i++
  }

  // -----------------------------
  // Steps
  // -----------------------------

  let stepIndex = 1

  for (const line of lines) {
    if (isStep(line)) {
      const text = line.replace(/^\d+\.\s+/, "").trim()
      const timing = extractTiming(text)
      
      result.steps.push({
        id: `step-${stepIndex}`,
        order: stepIndex,
        text,
        ...(timing && { timing })
      })
      stepIndex++
    }
  }

  // -----------------------------
  // Conditionals
  // -----------------------------

  let conditionalIndex = 1

  for (const line of lines) {
    if (isConditional(line)) {
      const parsed = parseConditional(line)
      result.conditionals.push({
        id: `cond-${conditionalIndex++}`,
        ...parsed
      })
    }
  }

  return result
}

// -----------------------------
// Parsing helpers
// -----------------------------

function normalizeMetadataKey(key) {
  const k = key.toLowerCase()

  if (k.includes("prep")) return "prepTime"
  if (k.includes("cook")) return "cookTime"
  if (k.includes("total")) return "totalTime"
  if (k.includes("serv")) return "servings"
  if (k.includes("cost")) return "cost"
  if (k.includes("author")) return "author"

  return key.replace(/\s+/g, "")
}

function normalizeMetadataValue(key, value) {
  if (key === "prepTime" || key === "cookTime" || key === "totalTime") {
    return normalizeDuration(value)
  }
  
  if (key === "servings") {
    return normalizeServings(value)
  }
  
  return {}
}

function normalizeDuration(text) {
  const result = {
    confidence: 'none'
  }
  
  // Match patterns like "15 min", "1.5 hours", "30min", "1 hour 30 min"
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/i)
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)/i)
  
  if (hourMatch || minMatch) {
    let minutes = 0
    
    if (hourMatch) {
      minutes += parseFloat(hourMatch[1]) * 60
    }
    
    if (minMatch) {
      minutes += parseFloat(minMatch[1])
    }
    
    result.minutes = minutes
    result.confidence = 'high'
  }
  
  return result
}

function normalizeServings(text) {
  const result = {
    confidence: 'none'
  }
  
  // Try to extract a number
  const match = text.match(/(\d+)/)
  if (match) {
    result.count = parseInt(match[1], 10)
    result.confidence = 'high'
  }
  
  return result
}

function parseIngredient(line) {
  // "- pasta: 8 oz (spaghetti)"
  const content = line.replace(/^\-\s+/, "").trim()

  let name = content
  let quantity = null
  let notes = null

  if (content.includes(":")) {
    const [n, rest] = content.split(":", 2)
    name = n.trim()

    const noteMatch = rest.match(/(.+?)\s*\((.+)\)$/)
    if (noteMatch) {
      quantity = noteMatch[1].trim()
      notes = noteMatch[2].trim()
    } else {
      quantity = rest.trim()
    }
  }

  const normalized = normalizeQuantity(quantity)

  return {
    id: `ingredient-${Math.random().toString(36).slice(2)}`,
    name,
    quantity: quantity || null,
    notes: notes || null,
    normalized
  }
}

function normalizeQuantity(text) {
  if (!text) {
    return {
      confidence: 'none',
      scalable: false,
      reason: 'No quantity specified'
    }
  }
  
  const normalized = text.trim().toLowerCase()
  
  // Check for non-scalable freeform
  const freeformPatterns = [
    /^to taste$/,
    /^as needed$/,
    /^enough to/,
    /^a pinch/,
    /^a handful/,
    /^some$/,
    /^whatever/,
    /^optional/
  ]
  
  for (const pattern of freeformPatterns) {
    if (pattern.test(normalized)) {
      return {
        raw: text,
        confidence: 'none',
        scalable: false,
        reason: 'Freeform quantity'
      }
    }
  }
  
  // Try Tier 1: Simple NUMBER UNIT patterns
  const tier1Match = normalized.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(cup|cups|tsp|teaspoon|teaspoons|tbsp|tablespoon|tablespoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters)s?$/)
  
  if (tier1Match) {
    const amount = parseFraction(tier1Match[1])
    const unit = normalizeUnit(tier1Match[2])
    
    return {
      amount,
      unit,
      confidence: 'high',
      scalable: true,
      discrete: false
    }
  }
  
  // Try Tier 2: Discrete items (eggs, cloves, etc.)
  const tier2Match = normalized.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*(cloves?|eggs?|sticks?|cans?|packages?|bunches?|heads?|whole)?$/)
  
  if (tier2Match) {
    const amount = parseFraction(tier2Match[1])
    const unit = tier2Match[2] ? normalizeDiscreteUnit(tier2Match[2]) : 'whole'
    
    return {
      amount,
      unit,
      confidence: 'medium',
      scalable: true,
      discrete: true,
      warning: 'May require rounding when scaled'
    }
  }
  
  // Try to extract size qualifiers (1 large onion, 2 medium carrots)
  const sizeMatch = normalized.match(/^(\d+)\s*(small|medium|large|extra large)\s*(.*)$/)
  
  if (sizeMatch) {
    return {
      amount: parseInt(sizeMatch[1], 10),
      unit: 'whole',
      size: sizeMatch[2],
      item: sizeMatch[3] || null,
      confidence: 'medium',
      scalable: 'approximate',
      discrete: true,
      warning: 'Size-based quantity - scaling is approximate'
    }
  }
  
  // Tier 3: Can't parse reliably
  return {
    raw: text,
    confidence: 'none',
    scalable: false,
    reason: 'Unable to parse quantity format'
  }
}

function parseFraction(str) {
  if (str.includes('/')) {
    const [num, denom] = str.split('/').map(parseFloat)
    return num / denom
  }
  return parseFloat(str)
}

function normalizeUnit(unit) {
  const map = {
    'cup': 'cup',
    'cups': 'cup',
    'tsp': 'tsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'tbsp': 'tbsp',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'oz': 'oz',
    'ounce': 'oz',
    'ounces': 'oz',
    'lb': 'lb',
    'lbs': 'lb',
    'pound': 'lb',
    'pounds': 'lb',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'l': 'l',
    'liter': 'l',
    'liters': 'l'
  }
  
  return map[unit.toLowerCase()] || unit
}

function normalizeDiscreteUnit(unit) {
  const map = {
    'clove': 'cloves',
    'cloves': 'cloves',
    'egg': 'eggs',
    'eggs': 'eggs',
    'stick': 'sticks',
    'sticks': 'sticks',
    'can': 'cans',
    'cans': 'cans',
    'package': 'packages',
    'packages': 'packages',
    'bunch': 'bunches',
    'bunches': 'bunches',
    'head': 'heads',
    'heads': 'heads'
  }
  
  return map[unit.toLowerCase()] || unit
}

function extractTiming(text) {
  // Look for timing patterns in square brackets: [20min], [2-3 hours], [at least 10min]
  const bracketMatch = text.match(/\[([^\]]+)\]/)
  
  if (!bracketMatch) {
    return null
  }
  
  const raw = bracketMatch[1].trim()
  const normalized = raw.toLowerCase()
  
  // Pattern 1: Simple duration [20min], [2 hours]
  const simpleDuration = normalized.match(/^(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes|h|hr|hrs|hour|hours)s?$/)
  
  if (simpleDuration) {
    let minutes = parseFloat(simpleDuration[1])
    const unit = simpleDuration[2]
    
    if (unit.startsWith('h')) {
      minutes *= 60
    }
    
    return {
      raw,
      minutes,
      type: 'exact',
      confidence: 'high'
    }
  }
  
  // Pattern 2: Range [20-25min], [1-2 hours]
  const rangeMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes|h|hr|hrs|hour|hours)s?$/)
  
  if (rangeMatch) {
    let min = parseFloat(rangeMatch[1])
    let max = parseFloat(rangeMatch[2])
    const unit = rangeMatch[3]
    
    if (unit.startsWith('h')) {
      min *= 60
      max *= 60
    }
    
    return {
      raw,
      min,
      max,
      type: 'range',
      confidence: 'high'
    }
  }
  
  // Pattern 3: Minimum [at least 10min]
  const minMatch = normalized.match(/(?:at least|minimum)\s+(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes|h|hr|hrs|hour|hours)s?/)
  
  if (minMatch) {
    let min = parseFloat(minMatch[1])
    const unit = minMatch[2]
    
    if (unit.startsWith('h')) {
      min *= 60
    }
    
    return {
      raw,
      min,
      max: null,
      type: 'minimum',
      confidence: 'medium'
    }
  }
  
  // Pattern 4: Alternatives [2hrs or overnight]
  if (normalized.includes(' or ')) {
    return {
      raw,
      type: 'alternatives',
      confidence: 'low'
    }
  }
  
  // Pattern 5: Vague timing [??], [until done]
  return {
    raw,
    type: 'vague',
    confidence: 'none'
  }
}

function parseConditional(line) {
  // "? [type] condition -> action"
  const raw = line.trim()

  let type = "unknown"
  let body = raw.replace(/^\?\s+/, "")

  const typeMatch = body.match(/^\[(.+?)\]\s+(.*)$/)
  if (typeMatch) {
    type = typeMatch[1].toLowerCase()
    body = typeMatch[2]
  }

  const [condition, action] = body.split("->").map(s => s?.trim())

  return {
    type,
    condition: condition || "",
    action: action || "",
    raw
  }
}

// -----------------------------
// Scaling API
// -----------------------------

export function scaleRecipe(parsed, targetServings) {
  if (!parsed.metadata.servings?.count) {
    return {
      success: false,
      error: 'No base servings specified - cannot scale',
      original: parsed
    }
  }
  
  const baseServings = parsed.metadata.servings.count
  const factor = targetServings / baseServings
  
  const scaled = JSON.parse(JSON.stringify(parsed)) // Deep clone
  scaled.metadata.servings.count = targetServings
  
  const warnings = []
  
  scaled.ingredients = scaled.ingredients.map(ing => {
    const result = { ...ing }
    
    if (!ing.normalized?.scalable) {
      warnings.push({
        ingredient: ing.name,
        reason: ing.normalized?.reason || 'Cannot scale',
        original: ing.quantity
      })
      return result
    }
    
    const norm = ing.normalized
    const scaledAmount = norm.amount * factor
    
    // Handle discrete items
    if (norm.discrete) {
      const rounded = Math.round(scaledAmount)
      
      if (Math.abs(rounded - scaledAmount) > 0.1) {
        warnings.push({
          ingredient: ing.name,
          reason: `Rounded from ${scaledAmount.toFixed(1)} to ${rounded} (discrete ingredient)`,
          original: ing.quantity
        })
      }
      
      result.scaledQuantity = `${rounded} ${norm.unit}`
      result.scaledNormalized = {
        ...norm,
        amount: rounded
      }
    } else {
      // Format nicely
      const formatted = formatAmount(scaledAmount)
      result.scaledQuantity = `${formatted} ${norm.unit}`
      result.scaledNormalized = {
        ...norm,
        amount: scaledAmount
      }
    }
    
    return result
  })
  
  return {
    success: true,
    factor,
    baseServings,
    targetServings,
    warnings,
    scaled
  }
}

function formatAmount(num) {
  // Try to convert to common fractions for readability
  const fractions = {
    0.125: '1/8',
    0.25: '1/4',
    0.333: '1/3',
    0.5: '1/2',
    0.667: '2/3',
    0.75: '3/4'
  }
  
  const whole = Math.floor(num)
  const decimal = num - whole
  
  // Check if decimal part matches a common fraction
  for (const [dec, frac] of Object.entries(fractions)) {
    if (Math.abs(decimal - dec) < 0.01) {
      return whole > 0 ? `${whole} ${frac}` : frac
    }
  }
  
  // Otherwise format as decimal
  return num % 1 === 0 ? num.toString() : num.toFixed(2)
}