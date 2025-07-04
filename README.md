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
// Require fuse from global context
const Fuse = global.get("Fuse");

const phrases = flow.get("TTSphrases") || [];
const corrections = flow.get("TTScorrections") || {};

let input = msg.payload;

// Apply corrections
Object.entries(corrections).forEach(([wrong, right]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    input = input.replace(regex, right);
});

node.warn("Corrected Input: " + input);

const fuse = new Fuse(phrases, {
    keys: ["text"],
    threshold: 0.4,  // tighter match
    includeScore: true
});

const result = fuse.search(input);

if (result.length > 0) {
    const top = result[0];
    msg.payload = top.item.key;
    msg.intentType = top.item.subject;
    msg.item = top.item.item;
    msg.confidence = Math.round((1 - top.score) * 100);
    node.warn(`Top Match: ${msg.payload} [${msg.confidence}]`);
    return msg;
} else {
    node.warn("No match");
    return null;
}
```

---

## 📚 Tags

- node-red
- nlu
- fuzzy-matching
- speech-to-text
- coqui
- fusejs
- natural-language

---

## 🖊️ License

MIT

