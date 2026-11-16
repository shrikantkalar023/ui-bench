window.BENCH = {
  models: [
    { id: "fable-5-1", name: "Fable 5.1", vendor: "Anthropic", target: "claudeAgent / claude-fable-5-1, effort high" },
    { id: "fable-5-2", name: "Fable 5.2", vendor: "Anthropic", target: "claudeAgent / claude-fable-5-2, effort high" },
    { id: "opus-5-5", name: "Opus 5.5", vendor: "Anthropic", target: "claudeAgent / claude-opus-5-5, effort high" },
    { id: "astra", name: "Astra", vendor: "OpenAI", target: "codex / gpt-6-astra, reasoning high" },
    { id: "sol", name: "Sol", vendor: "OpenAI", target: "codex / gpt-6.1-sol, reasoning high" },
  ],
  tests: [
    {
      id: "t3skins-gallery",
      title: "T3 Code skins gallery",
      summary: "Redesign a working gallery of community T3 Code skins. Keep its content and features; improve design, UI, UX, and optionally functionality.",
      dir: "tests/t3skins-gallery",
      models: ["fable-5-1", "fable-5-2", "opus-5-5", "astra", "sol"],
    },
  ],
};
