# Beyer

Beyer is the app's built-in assistant: it can run a diagnostic scan,
explain what a fault code means and whether it needs attention, back up
or restore coding, list/toggle coding options, start live data, and point
you to the tuning workflow.

## How Beyer actually works

`LocalRuleBasedAgent` (the only implementation shipped in this build) is
plain keyword/pattern matching over the app's own real data - the same
`describeDtc`/`adviseOnDtc` tables the Diagnostics tab uses, and the same
action hooks (`useVehicle`, `useModules`, `useBackups`, `useFlash`,
`useDiagnostics`) the other screens call. There is no network call, no API
key, and no language model involved. It's closer to a command palette with
a chat UI and a repair-advice lookup than a general-purpose conversational
AI - it understands direct requests ("scan for faults", "explain P0301",
"back up my coding") rather than open-ended conversation.

This is a deliberate choice, not a placeholder: embedding a real LLM API
key in a mobile client is insecure (anyone can extract it from the app
bundle and run up your bill), and doing it properly needs a backend proxy
that's out of scope for this build.

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
