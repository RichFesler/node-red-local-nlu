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
