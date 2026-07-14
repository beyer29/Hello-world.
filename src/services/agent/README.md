# Beyer

Beyer is the app's built-in assistant: it can run a diagnostic scan,
explain what a fault code means, whether it's urgent, and whether clearing
it will likely fix things or just come back, back up or restore coding,
list/toggle coding options, start live data, and point you to the tuning
workflow - all through a normal chat conversation.

## How Beyer actually works

`LocalRuleBasedAgent` (the only implementation shipped in this build) is
plain keyword/pattern matching over the app's own real data - the same
`describeDtc`/`adviseOnDtc` tables the Diagnostics tab uses, and the same
action hooks (`useVehicle`, `useModules`, `useBackups`, `useFlash`,
`useDiagnostics`) the other screens call. There is no network call, no API
key, and no language model involved. It's closer to a command palette with
a chat UI and a repair-advice lookup than a general-purpose conversational
AI, but the matching is broad enough (synonyms, small talk, "tell me
more" follow-ups) that it holds up as an actual back-and-forth
conversation for what it covers, rather than requiring exact command
syntax.

This is a deliberate choice, not a placeholder: embedding a real LLM API
key in a mobile client is insecure (anyone can extract it from the app
bundle and run up your bill), and it's also the wrong shape for this
project's business model - a one-time purchase price doesn't cover
per-user, ongoing LLM inference costs the way a subscription would. Doing
a real LLM integration properly needs a backend proxy (which holds the
key and could meter usage), which is out of scope for this build.

## Repair vs. "just clear it"

Beyer distinguishes two different questions that are easy to conflate:
"how bad is this" (`urgency` in `src/data/repairAdvice.ts`) and "if I just
clear the code, will it stay gone" (`clearingLikelihood` /
`clearingNote`). Clearing a code never repairs anything by itself - it
only resets the light - so whether it returns depends on whether the
underlying cause was transient (e.g. a loose gas cap) or a real component
issue (e.g. a failed sensor). Ask "what can just be cleared" (or similar)
any time, or it's included automatically after a scan.

## Extension point

`AiAgent` (`src/types/agent.ts`) is a one-method interface:
`respond(input, tools) => Promise<AgentResponse>`. A real LLM-backed
implementation would send `input` plus a summary of `tools`'s current
state to your own backend (which holds the API key and calls, e.g., the
Claude API), and parse the response back into `AgentResponse` - including
mapping any model-proposed action back onto the same `tools` calls
`LocalRuleBasedAgent` uses, so it inherits the same safety boundary: it can
trigger the simulated flash/tuning workflow, but does not flip the
human-confirmation acknowledgement switch on that screen for you.
