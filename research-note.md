# Corrections go in the harness, the judgement stays with me

My project is a house for five friends in Canberra, New Jersey, Tamil Nadu and Bangalore who are almost never online at the same time. I didn't want another chat app. The one principle I gave the agent was that connection must not require being online at the same time. Good agentic practice is not prompting until the output looks right. It is writing each correction into the harness, as a rule the agent reads every session or a check that passes or fails, while the human keeps deciding what the product should be.

Osmani (2024) describes a "two steps back" pattern, where each fix breaks something else and the developer ends up "playing whack-a-mole with code you don't fully understand." Beck (2025) calls this vibe coding, where "you don't care about the code." In both, a correction is lost once the chat moves on. Anthropic's Claude Code guidance (n.d.) says CLAUDE.md should hold "anything you've had to correct twice already." I found the same. My house is very personal, and it was very difficult to tell the agent about my friends. The funniest mistake was when I asked it to put a box of KitKats in a friend's room and it added cats, a box of cats. Telling it in the chat would only have fixed that one room. Writing into CLAUDE.md that details about my friends come only from me fixed it for every session after.

Rules alone were not enough. The same guidance says the model "usually" follows what it reads, and only what the harness runs happens "every time." Without a check, "that makes you the test suite." Beck even lists the agent deleting tests as a warning sign. Anthropic (2024) adds that "human review remains crucial." In my project a CSS rule matched two elements and the deployed door stopped letting anyone in, while the spec still passed because it posts forms directly. The fix was a scoping rule plus a check that taps the real button. The toggle on the phone was the hardest thing to get right. I found its problems on my own phone, not in tests, and replaced it with tapping where to go, which a real-browser check now taps, drags and swipes.

What stays with the human is product judgement. Beck says he now makes "more consequential programming decisions per hour, fewer boring vanilla decisions." The agent makes the small calls and names every product decision in its reply, so I can redirect it. Big decisions are ADRs, and changing one means writing a new record. When I asked for a walkable avatar, which an earlier ADR had turned down, the agent wrote a new record instead of editing the old one. I also said no to a chat feature.

The product frameworks from our Week 12 guest lecture, PRFAQs, personas and RICE, were where the house became most human. They gave me a bunch of ideas, and most of them surprisingly made sense. RICE told me the app could be forgotten because there are no notifications, so it now sits as a widget on our home screens and shows small updates without ever disturbing anyone. RICE also pointed out that Amirdhavarshini's full name made a very big button on the phone, so the buttons call her Amirdha, as we do. The agent scored the ideas, but I picked the ones that would make us feel loved. The personal touches came from me too: Rithanya's face masks and KitKats, Neha's board games, kettle Maggi and UNO in Amirdha's room like in our hostel, and Aswathy's yoga mat where she got me into meditating. No model knows these.

The strongest counter-case is METR's randomised trial (Becker et al., 2025). Experienced developers took 19% longer with AI tools, yet believed they had been 20% faster. Maybe a harness is just more overhead. The study did not test harnesses, but the authors suggest AI does worse in settings "with many implicit requirements," and a harness is where implicit requirements get written down. If developers can't feel whether they are faster, they can't feel whether the output is right either, which is an argument for checks. The authors now mark the results out of date.

A second objection is that rules go stale. Anthropic's guidance lists advice that was "good advice when it was written" and is now obsolete. I accept that rules patching a model's weakness should be pruned. But a rule that the boxes are KitKats never goes stale, because no better model will know my friends.

Most of these sources are selling something. Still, they agree with what I saw. What lasts from working with an agent is not the code from one prompt but the rules and checks it builds up, with a human deciding what they say.

## References

Anthropic (2024). Building effective agents. Erik S. and Barry Zhang. https://www.anthropic.com/engineering/building-effective-agents

Anthropic (n.d.). Best practices for Claude Code. Claude Code documentation, accessed 9 November 2026. https://code.claude.com/docs/en/best-practices

Beck, K. (2025). Augmented coding: Beyond the vibes. Software Design: Tidy First? (newsletter), 25 June 2025. https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes

Becker, J., Rush, N., Barnes, B. and Rein, D. (2025). Measuring the impact of early-2025 AI on experienced open-source developer productivity. METR, 10 July 2025. https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/

Osmani, A. (2024). The 70% problem: Hard truths about AI-assisted coding. Elevate (newsletter), 4 December 2024. https://addyo.substack.com/p/the-70-problem-hard-truths-about
