# Corrections belong in the harness, judgement stays with the human

I argue that good agentic software-development practice is not prompting until the output passes. It is turning each correction into the harness: a written rule the agent reads every session, or a check that comes back pass or fail. The human keeps the part neither can encode, which is deciding what the product should be. I scope it to developers building with a coding agent on a project they own.

Consider corrections that live only in the conversation. Osmani (2024) describes a "two steps back" pattern where each fix breaks something else, leaving the developer "playing whack-a-mole with code you don't fully understand." Beck (2025) calls this vibe coding, where "you don't care about the code." Both treat a correction as disposable. Anthropic's Claude Code guidance (n.d.) draws the practical conclusion: CLAUDE.md should hold "anything you've had to correct twice already," and a session with two failed corrections should be restarted with what was learned. A correction written into a file outlives the session; one made in chat does not.

Rules alone are not enough. The same guidance separates instructions the model reads, which it "usually" follows, from ones the harness applies "every time," and warns that without something to run, "that makes you the test suite." Beck has both, a system prompt fixing his test-first rhythm and the tests themselves, yet he lists the agent deleting or disabling tests among his warning signs: a check is only as good as someone watching that it still checks. Anthropic (2024) agrees: tests verify functionality, but "human review remains crucial" for whether a solution fits the wider system. The harness narrows what the human must watch. It does not remove the watcher.

What remains for the human is product judgement. Beck says he now makes "more consequential programming decisions per hour, fewer boring vanilla decisions." Osmani's claim that the tools help experienced developers more than beginners fits: the expert knows which output to reject, and that knowledge is what a harness accumulates.

The strongest counter-case is METR's randomised trial (Becker et al., 2025). Sixteen experienced developers in their own repositories took 19% longer with AI tools, and afterwards still believed they had been 20% faster. Perhaps harness-building is just more overhead on a net loss. The study did not test harnesses, but I read it differently. The authors suggest AI does comparatively worse in settings "with many implicit requirements," and building a harness is the work of making implicit requirements explicit. The perception gap also favours executable checks over felt confidence: a developer who cannot feel whether she is faster cannot feel whether the output is right either. The authors now mark the results out of date.

A second objection is staleness. Anthropic's guidance lists advice to stop following, each item "good advice when it was written," made obsolete as models improved. This narrows my position. Rules that patch a model's weakness go stale and should be pruned; the guidance itself asks for a short CLAUDE.md and few hooks. Rules that record facts about the project, and checks about the product, do not go stale, because no model improvement tells an agent what a user meant.

My own project, a shared house for five friends, illustrates the distinction. Reading my illustration, the agent took boxes of KitKats for cats; the fix became a rule that details about my friends come from me. A CSS rule matched two elements and the deployed door stopped letting anyone in, though the spec, which posts forms directly, passed; the fix was a scoping rule plus a check that taps the real button. One is a fact no model could know; the other, a failure only a real tap reveals. Throughout, the agent proposed and I chose, rejecting a chat feature and picking tap-to-walk over a joystick I disliked.

The product frameworks from our Week 12 guest lecture, PRFAQs, personas and RICE, are where the house became most human. A PRFAQ described the house as it was, gaps included, and made-up personas, such as one who is always asleep and a quiet one on a phone, walked the agent through it as people other than its builder. RICE ranked what they missed, and its suggestions were personal: a house without notifications could be forgotten, so it now sits as a widget on our home screens, and Amirdhavarshini's full name crowded a phone button, so the buttons call her Amirdha, as we do. The agent scored ideas; I kept those that would make us feel closer.

Most of these sources are selling something, yet they converge on a point the METR evidence does not contradict. The lasting product of agentic work is not the code from any one prompt but the accumulated rules and checks, kept short, with a human deciding what they say.

## References

Anthropic (2024). Building effective agents. Erik S. and Barry Zhang. https://www.anthropic.com/engineering/building-effective-agents

Anthropic (n.d.). Best practices for Claude Code. Claude Code documentation, accessed 9 November 2026. https://code.claude.com/docs/en/best-practices

Beck, K. (2025). Augmented coding: Beyond the vibes. Software Design: Tidy First? (newsletter), 25 June 2025. https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes

Becker, J., Rush, N., Barnes, B. and Rein, D. (2025). Measuring the impact of early-2025 AI on experienced open-source developer productivity. METR, 10 July 2025. https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/

Osmani, A. (2024). The 70% problem: Hard truths about AI-assisted coding. Elevate (newsletter), 4 December 2024. https://addyo.substack.com/p/the-70-problem-hard-truths-about
