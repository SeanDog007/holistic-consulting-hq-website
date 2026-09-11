export type DemoCue = {
  startMs: number;
  endMs?: number;
  text: string;
};

export type DemoVideo = {
  youtubeId: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSec: number;
  speakers: string[];
  programs: string[];
  topics: string[];
  cues: DemoCue[];
};

function cue(startSec: number, endSec: number, text: string): DemoCue {
  return { startMs: startSec * 1000, endMs: endSec * 1000, text };
}

export const DEMO_VIDEOS: DemoVideo[] = [
  {
    youtubeId: "JU8zEO73Lus",
    title: "Herbal Safety for Nutrition Practice — Betsy Miller, Registered Herbalist",
    description:
      "Betsy Miller, RH(AHG), walks nutrition professionals through herbal safety: contraindications, herb–drug interactions, pregnancy considerations, and how to stay inside a nutrition scope while still using botanicals with confidence.",
    publishedAt: "2026-07-11T17:00:00.000Z",
    durationSec: 3120,
    speakers: ["Betsy Miller"],
    programs: ["Herbalism", "Mentorship"],
    topics: ["herbal safety", "scope of practice", "women's health"],
    cues: [
      cue(12, 28, "Welcome back. I am Betsy Miller, registered herbalist, and today we are talking about herbal safety for nutrition practice."),
      cue(42, 61, "Safety is not about being afraid of plants. It is about knowing when a beautiful herb is the wrong herb for this person, at this time."),
      cue(88, 110, "If you are working as a nutrition professional, herbal safety starts with scope. We recommend food-like botanicals. We do not diagnose, and we do not prescribe drugs."),
      cue(140, 168, "Three questions I want you to ask every time: What else is this client taking? Could they be pregnant or trying? And what is the quality of the product in front of you?"),
      cue(210, 236, "Herb–drug interactions are where most practitioners get nervous, and they should. St. John's wort is the classic example because it induces CYP3A4 and can lower drug levels."),
      cue(260, 288, "Licorice is another one I see missed. Deglycyrrhizinated licorice is a different conversation than high-dose whole-root licorice in someone with hypertension."),
      cue(320, 348, "For pregnancy, I teach a conservative stance. Ginger and peppermint in culinary amounts are generally reasonable. Uterine stimulants and high-dose essential oils are not."),
      cue(400, 428, "Quality matters as much as the plant name. A poorly extracted tincture or a contaminated powder is a safety issue even if the herb itself was well chosen."),
      cue(480, 508, "When a client is on anticoagulants, I slow down with high-dose garlic, ginkgo, and concentrated turmeric before I wave it through as 'just a supplement.'"),
      cue(560, 590, "Document the conversation. Write down the product, the dose, the rationale, and what you asked them to watch for. That is how you practice herbal safety like a clinician."),
      cue(720, 748, "If you want a simple framework: food first, then gentle teas, then standardized extracts only when you can name the reason and the risk."),
      cue(900, 928, "We will take questions from the mentorship circle next, including a case on postpartum iron and nettle, and another on SSRI plus St. John's wort — do not combine those."),
    ],
  },
  {
    youtubeId: "L7EJ-CDkR9o",
    title: "Career Roundtable 10 15 2025",
    description:
      "Community career roundtable with Sean Emery and Dr. David Feuz. Practitioners talk through job searches, first-client offers, BCHN timing, and how to describe the value of supervised mentorship in an interview.",
    publishedAt: "2025-10-15T16:00:00.000Z",
    durationSec: 5340,
    speakers: ["Sean Emery", "Dr. David Feuz"],
    programs: ["Community", "Business"],
    topics: ["career", "practice building", "BCHN"],
    cues: [
      cue(20, 42, "Welcome to the October career roundtable. I am Sean, David is here, and we want this hour to be useful if you are job hunting or building a practice."),
      cue(90, 118, "The first question we always get: when do I sit the BCHN exam? My answer is after you have reps with real cases, not after you have highlighted every page of a textbook."),
      cue(180, 210, "David, you have a way of talking about systems-based reasoning in interviews that makes people lean in. Walk us through that."),
      cue(240, 270, "I tell candidates to bring one case. Not twenty. One case where you can show how you thought, what you would have done differently, and what you learned in mentorship."),
      cue(360, 392, "If you are still looking for your first client, stop waiting for a perfect niche. Offer a three-month package to someone you already know, and get a supervised case on the books."),
      cue(480, 510, "We had three members this month accept roles because they could talk about Grand Rounds, not just their degree. That is the difference a community makes."),
      cue(720, 750, "On compensation: do not underprice a first package just to feel busy. Underpricing trains the market and burns you out before you have a system."),
      cue(960, 990, "If a hiring manager asks why mentorship instead of another certificate, say this: school taught me what to know. Mentorship taught me how to practice."),
      cue(1200, 1232, "Last question from the chat: remote versus in-person roles. Both can work. What matters is whether you will have a senior clinician to review your thinking."),
    ],
  },
  {
    youtubeId: "SDZKmjD_h7I",
    title: "Non-Compliant Clients and the Entrepreneurial Mindset",
    description:
      "A practice-building conversation about so-called non-compliant clients, expectations, and the entrepreneurial mindset required to keep a nutrition practice both ethical and financially alive.",
    publishedAt: "2025-12-04T17:00:00.000Z",
    durationSec: 4800,
    speakers: ["Sean Emery"],
    programs: ["Business", "Mentorship"],
    topics: ["mindset", "practice building", "client work"],
    cues: [
      cue(15, 36, "Tonight is about non-compliant clients, and I want to retire that phrase by the end of the call."),
      cue(70, 98, "When a client does not follow the plan, it is usually a design problem. The plan was too big, the why was too thin, or we never agreed on what success looked like."),
      cue(150, 180, "Entrepreneurial mindset does not mean hustle harder. It means you own the offer, the follow-up, and the way you hold the relationship."),
      cue(240, 272, "I want you to stop taking it personally when someone ghosts after session two. Follow up twice, document it, and leave the door open without chasing."),
      cue(360, 392, "A better question than 'why won't they comply' is 'what friction did I leave in the plan?' Shopping lists, time, family, money — name the friction out loud."),
      cue(540, 572, "If you need the client to be perfect for your protocol to work, the protocol is not ready for private practice."),
      cue(780, 812, "Package the work in ninety-day arcs. Non-compliance often appears when the container is vague and the next appointment is 'sometime next month.'"),
      cue(1080, 1112, "You can be compassionate and still have a cancellation policy. Boundaries are part of clinical quality, not a betrayal of holistic values."),
    ],
  },
  {
    youtubeId: "2j1ArauC_H8",
    title: "0 to 1: Finding Traction for your Practice",
    description:
      "Sean Emery on moving a nutrition practice from idea to first paid clients: offers, outreach, referrals, and the simple weekly rhythm that creates traction.",
    publishedAt: "2025-10-20T16:00:00.000Z",
    durationSec: 4440,
    speakers: ["Sean Emery"],
    programs: ["Business"],
    topics: ["practice building", "career", "first client"],
    cues: [
      cue(18, 40, "Zero to one is the hardest part of a practice. Not the website. Not the logo. The first three paying clients."),
      cue(96, 126, "Traction is a weekly rhythm: ten conversations, two discovery calls, one paid start. If those numbers are empty, we do not need a new brand. We need outreach."),
      cue(180, 210, "Your first offer should be boringly clear. Twelve weeks, a defined outcome, a start date, and a price you can say out loud without apologizing."),
      cue(300, 332, "People ask me about niches too early. You find a niche by doing work, not by journaling about your personal brand for another quarter."),
      cue(480, 512, "Ask graduates, mentors, and your own practitioner friends for introductions. A warm referral beats a cold post every time."),
      cue(720, 752, "If you sold your first three-month nutrition package this month, write down exactly what you said. That script is an asset."),
      cue(960, 990, "Track the pipeline on one page. Leads, conversations, calls, clients. Traction is visible. Hope is not a dashboard."),
    ],
  },
  {
    youtubeId: "PFte4d52RZA",
    title: "Scope of Practice with Laura Waldo",
    description:
      "Laura Waldo joins the Institute to unpack scope of practice for nutrition professionals: what you can say, what you should document, and how to collaborate without crossing into diagnosis or prescribing.",
    publishedAt: "2025-08-14T16:00:00.000Z",
    durationSec: 3240,
    speakers: ["Laura Waldo"],
    programs: ["Mentorship"],
    topics: ["scope of practice", "career"],
    cues: [
      cue(22, 48, "I am Laura Waldo, and we are going to talk about scope of practice without making it a fear lecture."),
      cue(80, 110, "Scope is the fence that lets you run. If you do not know where the fence is, you either freeze or you wander into someone else's yard."),
      cue(160, 190, "Nutrition professionals assess dietary patterns and lifestyle. We do not diagnose disease, and we do not tell someone to stop a prescribed medication."),
      cue(250, 282, "A useful phrase: 'This is outside my scope. Here is the question I want you to take to your physician, and here is what I can support nutritionally in the meantime.'"),
      cue(360, 392, "Labs are a gray area. Interpreting a pattern educationally is different from telling a client they have a disease based on one marker."),
      cue(480, 512, "Document referrals. If you sent them back to their doctor about a supplement interaction, write it down the same day."),
      cue(720, 750, "Scope also protects the client. They deserve a practitioner who knows when to collaborate instead of improvising a medical plan."),
    ],
  },
  {
    youtubeId: "YGpH2PIRGIU",
    title: "Pediatric Microbiome and Eczema",
    description:
      "A clinical lecture on the pediatric microbiome, the gut–skin axis, and practical nutrition support for children with eczema — including what the evidence actually supports.",
    publishedAt: "2025-06-18T16:00:00.000Z",
    durationSec: 3600,
    speakers: ["Dr. David Feuz"],
    programs: ["Mentorship"],
    topics: ["microbiome", "eczema", "pediatrics"],
    cues: [
      cue(16, 40, "Today we are looking at the pediatric microbiome and eczema, and I want us to stay close to what we can actually support in practice."),
      cue(70, 100, "The gut–skin axis is not a slogan. Early microbial exposures, barrier integrity, and immune education all show up on the skin."),
      cue(150, 182, "When a child presents with eczema, I start with diet quality, sleep, and irritants before I reach for a long supplement list."),
      cue(240, 272, "There is interesting data on specific probiotic strains and atopic dermatitis, but strain and dose matter. 'A probiotic' is not a protocol."),
      cue(360, 392, "Food first still wins: fiber diversity for older children, and a very careful conversation about elimination diets so we do not create fear."),
      cue(480, 512, "I want you to watch for the allergic march — eczema, then food allergy, then airway symptoms — and know when this is a referral, not a smoothie."),
      cue(720, 752, "If the family is already drowning in rules, your job is to subtract. One or two high-leverage changes beat a twelve-item pediatric protocol."),
      cue(960, 990, "Questions from Grand Rounds next, including a toddler case with recurrent flares after antibiotics and a very restricted diet."),
    ],
  },
  {
    youtubeId: "Rbqqe6-XjoM",
    title: "Functional Testing — Dr. Oscar Coetzee",
    description:
      "Dr. Oscar Coetzee on when functional testing helps a nutrition case, when it confuses the client, and how to choose tests you can actually act on.",
    publishedAt: "2025-05-22T16:00:00.000Z",
    durationSec: 2760,
    speakers: ["Dr. Oscar Coetzee"],
    programs: ["Mentorship"],
    topics: ["functional testing", "clinical reasoning"],
    cues: [
      cue(18, 42, "Functional testing is a tool, not a personality. I am Oscar Coetzee, and I want you to order fewer tests you cannot interpret."),
      cue(90, 120, "If the history already tells you the story, a stool panel might only give you more printouts and a scared client."),
      cue(180, 212, "A good test changes the plan. If you would give the same nutrition advice with or without the result, do not run it yet."),
      cue(300, 332, "Walk the client through cost, what a result can and cannot prove, and what you will do with each possible outcome. That is informed consent."),
      cue(480, 512, "I like starting with foundational bloodwork the primary care team already understands, then adding specialty testing only for a defined question."),
      cue(720, 750, "Do not treat the lab. Treat the person, using the lab to refine the hypothesis you already wrote down before the kit shipped."),
    ],
  },
  {
    youtubeId: "ZRZx41j9jDM",
    title: "Herbalism with Dr Rachel Knowles",
    description:
      "Dr. Rachel Knowles on bringing herbalism into nutrition practice: formulation basics, bitter tonics, and how to teach clients to use teas and tinctures without overwhelming them.",
    publishedAt: "2025-04-09T16:00:00.000Z",
    durationSec: 4440,
    speakers: ["Dr. Rachel Knowles"],
    programs: ["Herbalism"],
    topics: ["herbalism", "digestive health"],
    cues: [
      cue(20, 44, "I am Rachel Knowles, and I want to talk about herbalism as a daily practice, not as a cabinet of rare bottles."),
      cue(80, 110, "Bitters before meals are one of the most useful, underused tools for digestive complaints we see in nutrition practice."),
      cue(180, 210, "Teach one preparation well. A simple tea the client will actually steep is better than a seven-herb tincture they never open."),
      cue(300, 332, "When we formulate, we think direction, tissue, and the person in front of us — not a Pinterest blend with twelve stimulating herbs."),
      cue(480, 512, "Safety still applies. If you cannot explain why this plant is in the cup, it should not be in the cup."),
      cue(840, 870, "I will close with a case on sluggish digestion and how we used bitters, food timing, and a very small nervine, not a purge."),
    ],
  },
  {
    youtubeId: "fBDUxQs8624",
    title: "Dr Kim Ross Amino Acid Therapy Lecture",
    description:
      "Dr. Kim Ross lectures on amino acid therapy in clinical nutrition: indications, caution, and how to think about mood, sleep, and protein status without reducing people to a single neurotransmitter story.",
    publishedAt: "2025-03-12T16:00:00.000Z",
    durationSec: 3660,
    speakers: ["Dr. Kim Ross"],
    programs: ["Mentorship"],
    topics: ["amino acids", "supplements", "clinical reasoning"],
    cues: [
      cue(14, 38, "Amino acid therapy is having a moment, and I want us to slow down. I am Kim Ross."),
      cue(80, 112, "Before you reach for isolated amino acids, look at total protein intake, digestion, and whether the client is actually eating enough."),
      cue(200, 232, "5-HTP and tryptophan conversations have to include medication lists. Serotonergic stacking is not a wellness experiment."),
      cue(360, 392, "Tyrosine can be useful in some low-motivation presentations, and it can be a terrible idea with anxiety or certain blood pressure medications."),
      cue(540, 572, "I treat amino acids like targeted tools after food is in place, not as a personality makeover in a capsule."),
      cue(780, 812, "Document the rationale and the stop date. If you cannot say when you will reassess, you are not doing therapy. You are collecting supplements."),
    ],
  },
  {
    youtubeId: "IhK7A3AHo9A",
    title: "Liz Lipski",
    description:
      "A conversation with Liz Lipski on digestive health, clinical nutrition, and how experienced practitioners keep cases simple when the GI story is loud.",
    publishedAt: "2025-02-19T16:00:00.000Z",
    durationSec: 5460,
    speakers: ["Liz Lipski"],
    programs: ["Mentorship"],
    topics: ["digestive health", "clinical reasoning"],
    cues: [
      cue(24, 50, "It is a pleasure to have Liz Lipski with us. We are going to talk about digestive health the way you actually practice it, not the way a slide deck practices it."),
      cue(120, 152, "Liz, you have always been good at reminding people that the gut is a system. Where do you still see clinicians overcomplicating a first visit?"),
      cue(210, 242, "They collect twenty symptoms and then they try to fix all twenty in week one. I want the biggest lever: food, fiber, fluid, and whether they feel safe enough to rest."),
      cue(400, 432, "Elimination diets are tools. They are not identities. If a client has been in a three-food prison for a year, that is part of the clinical picture."),
      cue(720, 752, "Testing can wait if the history is rich and the basics are not in place. I would rather see a week of real meals than another uninterpreted stool report."),
      cue(1080, 1112, "For students preparing for board exams, know the physiology. For practice, know the person. You need both, in that order."),
    ],
  },
  {
    youtubeId: "_rBuoYPACNU",
    title: "Dietary Supplements with Dr Jose Vega",
    description:
      "Dr. Jose Vega on evaluating dietary supplements: quality, claims, interactions, and how to choose products you can stand behind in a professional practice.",
    publishedAt: "2025-01-16T16:00:00.000Z",
    durationSec: 4080,
    speakers: ["Dr. Jose Vega"],
    programs: ["Mentorship"],
    topics: ["supplements", "quality", "safety"],
    cues: [
      cue(20, 46, "Dietary supplements are a crowded marketplace. I am Jose Vega, and I want you to have a quality filter you can explain to a client."),
      cue(100, 132, "If the label cannot tell you the form, the dose, and who made it, I do not care how beautiful the brand story is."),
      cue(240, 272, "Third-party testing is not a guarantee of efficacy. It is a start on identity and contaminants."),
      cue(420, 452, "Watch for proprietary blends that hide the dose of the one ingredient you actually wanted."),
      cue(660, 692, "A supplement plan should have an exit. What will we measure, and when do we stop?"),
    ],
  },
  {
    youtubeId: "l5U_cnzZWdo",
    title: "MACA and Inositol",
    description:
      "A clinical discussion of maca and inositol — evidence, typical use cases, and how to counsel clients who arrive with social-media protocols.",
    publishedAt: "2025-01-08T16:00:00.000Z",
    durationSec: 3960,
    speakers: ["Dr. David Feuz"],
    programs: ["Mentorship"],
    topics: ["supplements", "women's health"],
    cues: [
      cue(18, 40, "Maca and inositol keep showing up in intakes, so we are going to separate tradition, marketing, and what I will actually recommend."),
      cue(120, 150, "Inositol has a more defined evidence story in some metabolic and ovulatory presentations. Maca is more traditional and more variable by product."),
      cue(300, 332, "Ask what they mean by maca. Different phenotypes, different extracts, very different expectations."),
      cue(540, 572, "If a client is already on medication for blood sugar or thyroid, we slow down and we collaborate. This is not a cart-add situation."),
    ],
  },
  {
    youtubeId: "cbqJ6IbwL-M",
    title: "Tell a Better Story",
    description:
      "A short practice session on how nutrition professionals can tell a clearer story about the work they do — on a website, in a discovery call, and in the room with a client.",
    publishedAt: "2025-03-28T16:00:00.000Z",
    durationSec: 667,
    speakers: ["Sean Emery"],
    programs: ["Business"],
    topics: ["storytelling", "practice building"],
    cues: [
      cue(8, 28, "If you cannot tell a better story, the market will tell a cheaper one for you."),
      cue(60, 88, "Your story is not your credentials list. It is the transformation you help a specific person walk through."),
      cue(160, 190, "In a discovery call, lead with the problem they already feel, then the path, then the proof. Do not open with your philosophy of wellness."),
      cue(300, 330, "Write one paragraph you can say in under a minute. Then say it until it stops sounding like a performance."),
    ],
  },
  {
    youtubeId: "1LlqfWM5iEM",
    title: "Importance of Niche",
    description:
      "A brief note on why a niche helps clients find you — and why you can choose one without boxing yourself in forever.",
    publishedAt: "2025-04-02T16:00:00.000Z",
    durationSec: 26,
    speakers: ["Sean Emery"],
    programs: ["Business"],
    topics: ["storytelling", "practice building"],
    cues: [
      cue(0, 12, "A niche is not a cage. It is a doorway so the right client knows the door is for them."),
      cue(12, 26, "You can still work broadly. You just need one sentence that makes someone say, that is me."),
    ],
  },
  {
    youtubeId: "zM0gQ3h5EsM",
    title: "3 Big \"First Client\" Wins",
    description:
      "Three short first-client wins from the community — what they offered, what they said, and why it worked.",
    publishedAt: "2025-05-02T16:00:00.000Z",
    durationSec: 72,
    speakers: ["Sean Emery"],
    programs: ["Business", "Community"],
    topics: ["first client", "practice building"],
    cues: [
      cue(0, 20, "Three first-client wins this month, and they all started with a clear three-month package instead of a vague 'let us see how it goes.'"),
      cue(20, 48, "One member sold her first nutrition package after we practiced the conversation out loud. The words were already there. The courage needed a rehearsal."),
      cue(48, 72, "Write your win down. First clients become the story you tell the second client."),
    ],
  },
  {
    youtubeId: "nIwltgfl29M",
    title: "Joe Testimonial (BCHN Feb '23 Cohort Member)",
    description:
      "Joe, a BCHN February 2023 cohort member, on what board-prep and mentorship changed in his practice.",
    publishedAt: "2023-06-12T16:00:00.000Z",
    durationSec: 63,
    speakers: ["Joe"],
    programs: ["BCHN", "Community"],
    topics: ["BCHN", "career"],
    cues: [
      cue(0, 20, "I came in thinking I needed more content. What I needed was a way to think through cases and a plan for the BCHN exam."),
      cue(20, 45, "The board prep was structured, but the mentorship is what made the exam feel like something I had already been doing."),
      cue(45, 63, "If you are on the fence about sitting the exam this year, get in a cohort that will not let you study alone."),
    ],
  },
  {
    youtubeId: "4MZgIXD-TSg",
    title: "Alicia Getting Started Story",
    description:
      "Alicia shares how she got started with clients after joining the Holistic Consulting community.",
    publishedAt: "2025-02-02T16:00:00.000Z",
    durationSec: 201,
    speakers: ["Alicia"],
    programs: ["Community", "Business"],
    topics: ["first client", "career"],
    cues: [
      cue(8, 32, "I kept waiting to feel ready. The program made me start before I felt ready, and that is how I got my first client."),
      cue(80, 110, "Sean had us practice the offer until it was simple. I stopped explaining my entire philosophy in the first five minutes."),
      cue(150, 190, "The community mattered as much as the curriculum. I was not doing this in my kitchen alone."),
    ],
  },
  {
    youtubeId: "9a5xYn2onXY",
    title: "Corinne Getting Started",
    description:
      "Corinne on getting started, finding her first client, and using the mentorship to build a practice she could stand on.",
    publishedAt: "2025-01-22T16:00:00.000Z",
    durationSec: 90,
    speakers: ["Corinne"],
    programs: ["Community", "Business"],
    topics: ["first client", "career"],
    cues: [
      cue(0, 24, "This program helped me find my first client and gave me the confidence to start working with people right away."),
      cue(24, 60, "I built a system that brought in enough clients and revenue to leave my day job. That still surprises me when I say it out loud."),
      cue(60, 90, "If you want the short version: I would do it again. Ten out of ten."),
    ],
  },
  {
    youtubeId: "Xy72-voQh5I",
    title: "Morgan Getting Started",
    description:
      "Morgan's getting-started story — first conversations, first package, and what she would tell a practitioner still watching from the sidelines.",
    publishedAt: "2025-02-08T16:00:00.000Z",
    durationSec: 196,
    speakers: ["Morgan"],
    programs: ["Community", "Business"],
    topics: ["first client", "career"],
    cues: [
      cue(10, 36, "I thought I needed another course. I needed someone to sit with me while I did the uncomfortable outreach."),
      cue(80, 120, "My first package was not elegant. It was clear. Clarity is what people buy."),
      cue(150, 190, "If you are still on the sidelines, pick one person to call this week. That is the whole assignment."),
    ],
  },
  {
    youtubeId: "IbK8aUzj5hQ",
    title: "Alicia Celebrates a BIG win!",
    description:
      "Alicia celebrates a big practice win with the community — a reminder that the reps add up.",
    publishedAt: "2025-06-01T16:00:00.000Z",
    durationSec: 74,
    speakers: ["Alicia"],
    programs: ["Community", "Business"],
    topics: ["practice building"],
    cues: [
      cue(0, 24, "I have to share this win because six months ago I would not have believed it."),
      cue(24, 50, "The client said yes to a longer package, and I did not talk myself out of the price."),
      cue(50, 74, "Tell the community your wins. We practice better when we can see that it works."),
    ],
  },
  {
    youtubeId: "fbSWTnhpDfo",
    title: "Paige Testimonial — David Nutrition Advice",
    description:
      "Paige on working with Dr. David Feuz and how supervised nutrition advice changed the way she shows up with clients.",
    publishedAt: "2025-03-03T16:00:00.000Z",
    durationSec: 185,
    speakers: ["Paige", "Dr. David Feuz"],
    programs: ["Mentorship", "Community"],
    topics: ["mentorship", "clinical reasoning"],
    cues: [
      cue(8, 36, "Working through cases with David changed how I listen. I stopped rushing to a protocol."),
      cue(70, 110, "He would ask what I thought was driving the pattern, and I had to say it out loud. That is how you build clinical judgment."),
      cue(140, 180, "I still hear his questions when I sit down with a new intake. That is what mentorship is supposed to leave you with."),
    ],
  },
];
