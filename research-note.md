# Corrections belong in the harness, judgement stays with the human

I argue that good agentic software-development practice is not prompting until the output passes. It is turning each correction into the harness: a written rule the agent reads every session, or a check that comes back pass or fail. The human keeps the part neither can encode, which is deciding what the product should be. I scope it to developers building with a coding agent on a project they own.

The case starts with what goes wrong when corrections live only in the conversation. Osmani (2024) describes a "two steps back" pattern in which a fix breaks something else and each repair spawns new problems, leaving the developer "playing whack-a-mole with code you don't fully understand." Beck (2025) names the stance behind it: in vibe coding "you don't care about the code, just the behavior of the system." Both describe a correction treated as disposable. Anthropic's Claude Code guidance (n.d.) draws the practical conclusion: CLAUDE.md should hold "anything you've had to correct twice already," and a conversation that has absorbed two failed corrections should be cleared and restarted with one prompt that folds in what was learned. A correction written into a file outlives the session; one made in chat does not.

Rules alone are not enough. The same guidance separates instructions the model reads, which it "usually" follows, from ones the harness applies "every time," and warns that without something to run, "that makes you the test suite." Beck's practice supplies both halves: a system prompt that fixes his test-first rhythm, and the tests themselves. Yet Beck lists the agent deleting or disabling tests among his warning signs: a check is only as good as someone watching that it still checks. Anthropic's earlier "Building effective agents" (2024) reaches the same place from the other side: automated testing verifies functionality, but "human review remains crucial" for whether a solution fits the wider system. The harness narrows what the human must watch. It does not remove the watcher.

What remains for the human is product judgement. Beck says he now makes "more consequential programming decisions per hour, fewer boring vanilla decisions." Osmani's claim that the tools help experienced developers more than beginners fits: the expert knows which output to reject, and that knowledge is what a harness accumulates.

The strongest counter-case is METR's randomised trial (Becker et al., 2025). Sixteen experienced developers working in their own large repositories took 19% longer with AI tools, and afterwards still believed they had been 20% faster. If experts cannot tell, perhaps harness-building is just more overhead on a net loss. The study did not test harnesses, so this is inference, but I read it differently. The authors suggest AI does comparatively worse in settings "with many implicit requirements," and building a harness is the work of making implicit requirements explicit. The perception gap also favours executable checks over felt confidence: a developer who cannot feel whether she is faster cannot feel whether the output is right either. The authors now mark the results out of date and do not claim better ways of using AI could not help.

A second objection is staleness. Anthropic's guidance carries a table of advice to stop following, each item "good advice when it was written," such as putting instructions in capitals, made obsolete as models improved. I concede this, and it narrows my position. Rules that patch a model's weakness go stale and should be pruned; the guidance itself asks for a short CLAUDE.md and few hooks. Rules that record facts about the project, and checks about the product, do not go stale, because no model improvement tells an agent what a user meant.

My own project, a shared house for five friends, illustrates the distinction. Reading my illustration, the agent took boxes of KitKats for cats; the fix became a rule that details about my friends come from me. A CSS rule matched two elements and the deployed door stopped letting anyone in, though the spec, which posts forms directly, passed; the fix was a scoping rule plus a check that taps the real button. The first is a fact no model could know, and the second is a failure only a real tap reveals. Throughout, the agent proposed and I chose, rejecting a chat feature and picking tap-to-walk over a joystick I disliked.

Most of these sources are selling something: Anthropic sells the agent, and practitioners their workflows. Even so, they converge on a point the METR evidence does not contradict. The lasting product of agentic work is not the code from any one prompt but the accumulated rules and checks, kept short, with a human deciding what they say.

## References

Anthropic (2024). Building effective agents. Erik S. and Barry Zhang. https://www.anthropic.com/engineering/building-effective-agents

Anthropic (n.d.). Best practices for Claude Code. Claude Code documentation, accessed 9 November 2026. https://code.claude.com/docs/en/best-practices

Beck, K. (2025). Augmented coding: Beyond the vibes. Software Design: Tidy First? (newsletter), 25 June 2025. https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes

Becker, J., Rush, N., Barnes, B. and Rein, D. (2025). Measuring the impact of early-2025 AI on experienced open-source developer productivity. METR, 10 July 2025. https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/

Osmani, A. (2024). The 70% problem: Hard truths about AI-assisted coding. Elevate (newsletter), 4 December 2024. https://addyo.substack.com/p/the-70-problem-hard-truths-about
