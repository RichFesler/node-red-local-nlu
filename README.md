# 🧠 node-red-nlu-fuzzy

Natural Language Understanding (NLU) processor for Node-RED using fuzzy matching with [`fuse.js`](https://fusejs.io/).\
Converts speech-to-text strings into actionable commands using a structured phrase list and optional correction layer.

---

## ⚙️ What It Does

This Node-RED function:

- Takes a string input like `"what time is it"` (typically from an STT engine)
- Optionally applies corrections using a `corrections.json` file
- Fuzzy-matches against structured phrases using `fuse.js`
- Outputs a clean intent `msg.payload` and adds:
  - `msg.intentType` – top-level subject (e.g., `"TIME"`)
  - `msg.item` – specific item (e.g., `"NOW"`)
  - `msg.confidence` – match score (0–100)

---

## 📥 Input

A string in `msg.payload`, e.g.:

```js
"what time is it"
"whats the time"
"what's the dime"
"tell me the tiem"
```

---

## 📤 Output

```js
msg.payload     // "NOW"
msg.intentType  // "TIME"
msg.item        // "NOW"
msg.confidence  // 100
```

---

## 🧠 Phrases List

Stored as `TTSphrases.json`, loaded into Node-RED flow context (`flow.TTSphrases`). Each phrase has:

```json
{
  "key": "NOW",
  "text": "what time is it",
  "subject": "TIME",
  "item": "NOW"
}
```

You can expand the list as needed. All fields are required.

---

## ⚠️ Corrections Layer (Optional)

`corrections.json` is loaded into flow context as `flow.TTScorrections`. Used to patch frequent transcription errors before matching.

```json
{
  "watt": "what",
  "dime": "time",
  "teim": "time"
}
```

Applied as a basic word substitution.

---

## 🔍 Matching Engine

Uses `fuse.js` for fuzzy search. Best match is chosen based on score and included if match > 50.

- Top match is stored in `msg.payload`
- Match metadata is attached as `msg.intentType`, `msg.item`, and `msg.confidence`

---

## ⚙️ Setup

1. Place your phrase list in `TTSphrases.json`
2. Optionally create `corrections.json`
3. Load both into `flow.TTSphrases` and `flow.TTScorrections` via Inject or Setup flow
4. Paste the function node into your flow and wire it to your STT output

---

## 🔧 Function Node Code

```js
// Name: nlu_fuzzy.js
//
// Description: Node-RED function to perform fuzzy NLU matching
//              against a structured phrase list using Fuse.js.
//              Applies optional corrections before matching.
//              Outputs msg.payload = key, and adds intentType, item, and confidence.
//
// Input:
//   msg.payload - string: raw input string from STT
//
// Output:
//   msg.payload     - string: matching phrase key
//   msg.intentType  - string: phrase subject (e.g., TIME)
//   msg.item        - string: specific item (e.g., NOW)
//   msg.confidence  - number: match score (0–100)
//
// REVISIONS:
// 04JUL2025 - Initial version, rfesler@gmail.com

// Load Fuse.js from global context (assumes you configured it in settings.js)
const Fuse = global.get("Fuse");

// Load phrases and corrections from flow context
const phrases = flow.get("TTSphrases") || [];
const corrections = flow.get("TTScorrections") || {};

let input = msg.payload;

// Apply corrections (e.g., "dime" -> "time")
Object.entries(corrections).forEach(([wrong, right]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    input = input.replace(regex, right);
});

node.warn("Corrected Input: " + input);

// Configure fuzzy search
const fuse = new Fuse(phrases, {
    keys: ["text"],         // Only match against the "text" field
    threshold: 0.4,         // Lower = stricter matching
    includeScore: true      // Include match score for ranking
});

// Perform search
const result = fuse.search(input);

if (result.length > 0) {
    const top = result[0];
    msg.payload = top.item.key;                 // e.g., "NOW"
    msg.intentType = top.item.subject;          // e.g., "TIME"
    msg.item = top.item.item;                   // e.g., "NOW"
    msg.confidence = Math.round((1 - top.score) * 100);  // e.g., 97
    node.warn(`Top Match: ${msg.payload} [${msg.confidence}]`);
    return msg;
} else {
    node.warn("No match");
    return null;
}

```

## 🖊️ License

MIT

