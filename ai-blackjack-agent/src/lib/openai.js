import { RISK_PROFILES } from './constants.js';

const SYSTEM_PROMPT = `You are an expert Blackjack strategy advisor using Hi-Lo card counting. Respond with ONLY a valid JSON object — no preamble, no markdown. The JSON must have exactly these fields:
{
  "action": "hit" | "stand" | "double" | "split",
  "confidence": "high" | "medium" | "low",
  "reasoning": "One to three sentences explaining the recommendation.",
  "basic_strategy_note": "What pure basic strategy says, and whether the count changes it."
}

STRATEGY RULES — apply in order:

1. PAIRS (when canSplit is true):
   Always split: A-A, 8-8
   Never split: 10-10, 5-5, 4-4
   Split 9-9 vs 2-9 (not 7, 10, A)
   Split 7-7 vs 2-7; split 6-6 vs 2-6; split 3-3 and 2-2 vs 2-7

2. SOFT HANDS (Ace counted as 11):
   Soft 19+ → stand always
   Soft 18 → double vs 3-6; stand vs 2,7,8; hit vs 9,10,A
   Soft 17 → double vs 3-6; hit all others
   Soft 13-16 → double vs 4-6; hit all others

3. HARD HANDS:
   17+ → stand
   16 → stand vs 2-6; hit vs 7+  [count deviation: stand vs 10 if trueCount ≥ 0]
   15 → stand vs 2-6; hit vs 7+  [count deviation: stand vs 10 if trueCount ≥ +4]
   13-14 → stand vs 2-6; hit vs 7+
   12 → stand vs 4-6; hit vs 2-3 and 7+  [count: stand vs 2 if trueCount ≥ +3; stand vs 3 if trueCount ≥ +2]
   11 → double vs all except A (hit vs A)
   10 → double vs 2-9  [count: double vs 10 if trueCount ≥ +4; double vs A if trueCount ≥ +3]
   9 → double vs 3-6   [count: double vs 2 if trueCount ≥ +1; double vs 7 if trueCount ≥ +3]
   8 or less → hit

4. INSURANCE: never take insurance unless trueCount ≥ +3 (then it is break-even or +EV)

COUNT-BASED SIZING NOTE: High positive true count means the remaining deck is rich in 10s and Aces — this favours the player. You should mention when the count is significantly influencing your recommendation.`;


function buildUserMessage(gameState, riskProfile) {
  const profile = RISK_PROFILES[riskProfile] || RISK_PROFILES.standard;
  const playerCardsStr = gameState.playerCards.map(c => `${c.rank}${c.suit}`).join(', ');
  const tc = gameState.trueCount ?? 0;
  const countEdge = tc >= 2 ? 'player edge' : tc <= -1 ? 'house edge' : 'neutral';

  return `Game state:
- Player hand: ${playerCardsStr} (total: ${gameState.playerTotal}${gameState.isSoft ? ', soft' : ''})
- Dealer up card: ${gameState.dealerUpCard.rank}${gameState.dealerUpCard.suit}
- Can double down: ${gameState.canDouble}
- Can split: ${gameState.canSplit}
- Current bet: $${gameState.bet} | Balance: $${gameState.balance}
- Hi-Lo running count: ${gameState.runningCount ?? 0} | True count: ${tc.toFixed(1)} | Decks remaining: ~${(gameState.decksRemaining ?? 1).toFixed(1)}
- Count edge: ${countEdge}
- Risk profile: ${profile.label} — ${profile.description}

Apply the strategy rules in the system prompt. Note any count-based deviations from basic strategy.`;
}

export async function getAIRecommendation(gameState, riskProfile, apiKey, model = 'gpt-4o-mini') {
  console.log('[Game] State sent to agent:', gameState);
  console.log(`[API] POST /v1/chat/completions — model: ${model}`);

  const t0 = Date.now();
  let responseText = '';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: 'json_object' },
        max_tokens: 512,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(gameState, riskProfile) },
        ],
      }),
    });

    const data = await response.json();
    const elapsed = Date.now() - t0;
    console.log(`[API] Response received in ${elapsed}ms:`, data);

    if (!response.ok) {
      const errMsg = data.error?.message || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    responseText = data.choices[0].message.content;
    console.log('[AI Agent] Extracted text:', responseText);

    const parsed = JSON.parse(responseText);
    console.log(`[Agent] Parsed action: "${parsed.action}", confidence: "${parsed.confidence}"`);

    const validActions = ['hit', 'stand', 'double', 'split'];
    if (!validActions.includes(parsed.action)) {
      throw new Error(`Invalid action: ${parsed.action}`);
    }

    return { ok: true, recommendation: parsed };

  } catch (err) {
    console.error('[Agent] JSON parse failed — raw text:', responseText, '— error:', err.message);
    return {
      ok: false,
      error: err.message,
      recommendation: {
        action: 'stand',
        confidence: 'low',
        reasoning: 'Could not parse AI response. Defaulting to stand.',
        basic_strategy_note: 'N/A',
      },
    };
  }
}
