export interface AssessmentQuestion {
  q: string;
  reverse?: boolean;
}
export interface ScoreBand {
  min: number;
  max: number;
  label: string;
  body: string;
}
export interface Assessment {
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  intro: string;
  heroIdx: number;
  questions: AssessmentQuestion[];
  scale: { min: number; max: number; labels: [string, string] };
  bands: ScoreBand[];
}

// Likert 1-5 by default, 1 = Strongly Disagree, 5 = Strongly Agree
const L: [string, string] = ["Strongly disagree", "Strongly agree"];

export const ASSESSMENTS: Assessment[] = [
  {
    slug: "anger-suppression",
    number: 1,
    title: "The Anger Suppression Index",
    subtitle: "How much anger are you swallowing?",
    intro:
      "A short inventory for how often and how completely you swallow your anger rather than speaking it. No right answer — just an honest reading.",
    heroIdx: 1,
    questions: [
      { q: "When I'm angry, I tell myself to 'be the bigger person' before I let myself feel it." },
      { q: "I often realize hours later that I was angry during a conversation." },
      { q: "I worry that my anger will drive people away." },
      { q: "I apologize for my anger even when it was a reasonable response." },
      { q: "I use humor or deflection to cover anger in real time." },
      { q: "I rarely say the sentence 'I am angry' out loud." },
      { q: "I often say 'I'm fine' when I'm not fine." },
      { q: "I criticize myself for feeling angry." },
      { q: "I minimize the thing that upset me almost immediately." },
      { q: "I feel guilty when I finally let anger out." },
    ],
    scale: { min: 1, max: 5, labels: L },
    bands: [
      { min: 10, max: 20, label: "Low suppression", body: "You're relatively in touch with your anger. Keep building the practice of naming it in the moment." },
      { min: 21, max: 35, label: "Moderate suppression", body: "You swallow a workable share of your anger. The pattern is learnable: start with naming it silently, then out loud in safe contexts." },
      { min: 36, max: 50, label: "High suppression", body: "You're carrying significant unexpressed anger. This shows up in the body long before it shows up in words. Begin with the somatic practices and consider working with a somatic therapist." },
    ],
  },
  {
    slug: "rage-somatic-map",
    number: 2,
    title: "The Rage Somatic Map",
    subtitle: "Where does your anger live?",
    intro:
      "For each location, note how often you feel anger there. This is a mapping exercise, not a judgment.",
    heroIdx: 3,
    questions: [
      { q: "A clenched jaw when I'm irritated." },
      { q: "Tightness across the chest or between my shoulder blades." },
      { q: "A hot, churning stomach." },
      { q: "Fists or hands curling without me noticing." },
      { q: "A tight throat or 'lump' when I try to speak up." },
      { q: "Heat rising in my face or neck." },
      { q: "Tension that lands in my lower back or hips." },
      { q: "Headaches that build across an afternoon of frustration." },
      { q: "A specific muscle that stays tight for days after a conflict." },
      { q: "Restlessness in my legs when I am biting my tongue." },
    ],
    scale: { min: 1, max: 5, labels: ["Never", "Always"] },
    bands: [
      { min: 10, max: 20, label: "Low somatic load", body: "Anger is not visibly parked in your body most days. Track anyway." },
      { min: 21, max: 35, label: "Moderate somatic load", body: "Your body is doing a lot of the anger-holding. Somatic release practices are where you'll get the biggest returns." },
      { min: 36, max: 50, label: "High somatic load", body: "Your body is in near-constant protest. Please pair this with a somatic practitioner or qualified bodyworker." },
    ],
  },
  {
    slug: "boundary-erosion",
    number: 3,
    title: "The Boundary Erosion Scale",
    subtitle: "Where are you bleeding out?",
    intro:
      "Anger often signals a boundary that's been crossed again and again. This scale helps you see where you've been leaking consent.",
    heroIdx: 37,
    questions: [
      { q: "I say yes when I want to say no to avoid conflict." },
      { q: "I finish tasks that weren't actually my responsibility." },
      { q: "I give time or energy I don't have because someone might be disappointed." },
      { q: "I rarely ask for what I need." },
      { q: "I feel resentful of people I'm still saying yes to." },
      { q: "I preempt others' needs before I notice my own." },
      { q: "I feel responsible for managing others' emotions." },
      { q: "I apologize for taking up space." },
      { q: "I keep re-explaining myself to people who aren't listening." },
      { q: "I'm exhausted in a way that doesn't track with my actual workload." },
    ],
    scale: { min: 1, max: 5, labels: L },
    bands: [
      { min: 10, max: 20, label: "Intact", body: "Your boundaries hold. Keep practicing the small everyday 'no's." },
      { min: 21, max: 35, label: "Porous", body: "You're leaking in specific relationships. Name one and rehearse a single clear sentence for it this week." },
      { min: 36, max: 50, label: "Severely eroded", body: "You've been consenting to what you don't want for a long time. Start with one boundary held to completion and build slowly." },
    ],
  },
  {
    slug: "passive-aggression",
    number: 4,
    title: "The Passive-Aggression Inventory",
    subtitle: "Where is your anger sneaking out sideways?",
    intro:
      "Unspoken anger doesn't disappear. It finds side doors. This is a non-punitive look at which doors you're using.",
    heroIdx: 21,
    questions: [
      { q: "I go quiet and wait for the other person to notice I'm upset." },
      { q: "I 'forget' tasks that belong to someone I'm angry with." },
      { q: "I use sarcasm when I'm actually furious." },
      { q: "I procrastinate on things other people are waiting on." },
      { q: "I cc: people to make a point." },
      { q: "I give subtly barbed compliments." },
      { q: "I use long pauses and sighs instead of words." },
      { q: "I bring up old grievances during new arguments." },
      { q: "I say 'it's fine' in a tone that says it isn't." },
      { q: "I withdraw affection quietly rather than name the issue." },
    ],
    scale: { min: 1, max: 5, labels: ["Never", "Often"] },
    bands: [
      { min: 10, max: 20, label: "Direct", body: "You tend toward direct expression. Stay that course." },
      { min: 21, max: 35, label: "Mixed", body: "You have a few sideways channels. Notice the patterns without shame and rehearse direct alternatives." },
      { min: 36, max: 50, label: "Heavily indirect", body: "Your anger is routing around the front door. This typically softens quickly once the underlying fear of direct speech is met with practice." },
    ],
  },
  {
    slug: "liver-fire-tcm",
    number: 5,
    title: "The Liver Fire Screening",
    subtitle: "A TCM-informed reading",
    intro:
      "In Traditional Chinese Medicine, anger lives in the Liver channel. Chronic, un-moved anger shows up as 'rising liver fire.' This is a simple self-screening — not a diagnosis.",
    heroIdx: 13,
    questions: [
      { q: "I wake between 1 and 3 a.m. feeling wired or irritated." },
      { q: "I get red-faced easily when frustrated." },
      { q: "I have a bitter taste in my mouth, especially in the morning." },
      { q: "My eyes feel tired, red, or dry." },
      { q: "I get tension headaches at the temples or behind the eyes." },
      { q: "I feel 'stuck' or distended under my right ribs." },
      { q: "I crave alcohol or very cold drinks to 'cool off.'" },
      { q: "I have PMS with sharp irritability and breast tenderness." },
      { q: "I grind my teeth or clench my jaw at night." },
      { q: "I get lightheaded or dizzy when I stand up fast." },
    ],
    scale: { min: 1, max: 5, labels: ["Never", "Often"] },
    bands: [
      { min: 10, max: 20, label: "Cool liver", body: "No significant liver-fire pattern. Keep moving your body daily." },
      { min: 21, max: 35, label: "Stagnation with some heat", body: "Classic Xiao Yao San territory — liver qi stagnation with mild rising heat. See the herbs page and consider a TCM practitioner." },
      { min: 36, max: 50, label: "Rising liver fire", body: "This pattern benefits from clinical TCM support. Long Dan Xie Gan Wan-family formulas are typical. Please consult a licensed practitioner." },
    ],
  },
  {
    slug: "pitta-ayurveda",
    number: 6,
    title: "The Pitta Overload Check",
    subtitle: "An Ayurveda-informed reading",
    intro:
      "Ayurveda links anger with aggravated pitta (the fire element). This screening looks for that pattern — not to pathologize fire, which we want some of, but to see whether yours is unbalanced.",
    heroIdx: 11,
    questions: [
      { q: "I run hot and sweat easily." },
      { q: "I get sharp, precise, 'surgical' irritation at inefficiency." },
      { q: "I have acid reflux or heartburn." },
      { q: "I skip meals and become dangerous to be around." },
      { q: "I sunburn easily or have acne/inflammation on my skin." },
      { q: "I think in bullet points and lose patience with people who don't." },
      { q: "I wake between 2 and 4 a.m. with my mind racing." },
      { q: "My anger is fast, hot, and specific — rarely a slow burn." },
      { q: "I push myself past depletion and then snap." },
      { q: "Loose stools when I'm stressed." },
    ],
    scale: { min: 1, max: 5, labels: ["Never", "Often"] },
    bands: [
      { min: 10, max: 20, label: "Balanced fire", body: "Your pitta is serving you." },
      { min: 21, max: 35, label: "Elevated pitta", body: "Cooling foods (cucumber, coconut, cilantro), Brahmi, and avoidance of midday sun help. See the herbs page." },
      { min: 36, max: 50, label: "Pitta overload", body: "Work with an Ayurvedic practitioner. A proper pitta-pacifying protocol is life-changing when this chronic." },
    ],
  },
  {
    slug: "anger-grief-loop",
    number: 7,
    title: "The Anger–Grief Loop",
    subtitle: "Is your rage actually sorrow?",
    intro:
      "Anger and grief live next door. Sometimes they borrow each other's costumes. This check helps you see which one is actually knocking.",
    heroIdx: 40,
    questions: [
      { q: "My anger spikes around anniversaries of losses." },
      { q: "After I express anger, I sometimes cry unexpectedly." },
      { q: "I'm angry at someone who is dead or unreachable." },
      { q: "I'm angry about something that ended." },
      { q: "I feel 'stuck' in a loop of blame that never resolves." },
      { q: "Soft things make me angry in ways I don't understand." },
      { q: "I avoid the grief by staying in the anger." },
      { q: "I dream about the person or loss often." },
      { q: "My body feels heavy and hot at the same time." },
      { q: "I've been in this feeling longer than I expected." },
    ],
    scale: { min: 1, max: 5, labels: L },
    bands: [
      { min: 10, max: 20, label: "Distinct", body: "Your anger and grief are living in separate rooms. Good." },
      { min: 21, max: 35, label: "Tangled", body: "There's braid to sort. Journaling and somatic work can both help untangle." },
      { min: 36, max: 50, label: "Anger as a grief-shield", body: "Your anger may be shielding grief that wants to move. Consider a grief-literate therapist or practitioner alongside any somatic work." },
    ],
  },
  {
    slug: "childhood-anger-rules",
    number: 8,
    title: "The Childhood Anger Rules Audit",
    subtitle: "What were you taught?",
    intro:
      "Every family taught rules about anger, spoken or not. This audit lets you see what yours taught you, so you can decide what to keep and what to put down.",
    heroIdx: 25,
    questions: [
      { q: "Anger was not safe to express in my house growing up." },
      { q: "One parent's anger dominated the emotional climate." },
      { q: "I was told anger was 'ugly' or 'unladylike' or 'unchristian.'" },
      { q: "I learned to read the room before I learned to read my own mood." },
      { q: "I was punished for being angry as a child." },
      { q: "My anger scared someone I loved, and I never forgot." },
      { q: "I became the family peacemaker early." },
      { q: "No one ever modeled repair after conflict for me." },
      { q: "My caregivers went silent for long periods when upset." },
      { q: "I still feel like a child when I get angry." },
    ],
    scale: { min: 1, max: 5, labels: L },
    bands: [
      { min: 10, max: 20, label: "Relatively permitted", body: "You received some permission to feel and express anger. Build on it." },
      { min: 21, max: 35, label: "Mixed conditioning", body: "You have work to do on rewriting your inherited rules. Start with naming one rule and practicing its opposite this week." },
      { min: 36, max: 50, label: "Heavy conditioning", body: "Your nervous system was trained to fear anger itself. This is rewritable with consistent, safe practice — often with a therapist." },
    ],
  },
  {
    slug: "rage-readiness",
    number: 9,
    title: "The Rage-Readiness Profile",
    subtitle: "Are you ready to feel your fire?",
    intro:
      "A final snapshot: how ready are you to welcome your anger back into the room as a teacher? This one tells you where to start.",
    heroIdx: 37,
    questions: [
      { q: "I'm willing to feel anger in my body, not just describe it." },
      { q: "I have at least one safe context in which to express anger aloud." },
      { q: "I can name the last five things I was angry about this week." },
      { q: "I'm willing to let anger change a relationship." },
      { q: "I don't require anger to be 'productive' or 'constructive' to feel it." },
      { q: "I can let myself be angry without immediately forgiving." },
      { q: "I can move physically — walk, chop, push, howl — when anger rises." },
      { q: "I can tell the difference between my anger and someone else's." },
      { q: "I know that feeling anger will not destroy me." },
      { q: "I want my fire back." },
    ],
    scale: { min: 1, max: 5, labels: L },
    bands: [
      { min: 10, max: 25, label: "Early practice", body: "Start with the Somatic Map and a single body-based practice. The rest can wait." },
      { min: 26, max: 40, label: "Active practice", body: "Begin layering in relational practice: naming anger aloud in a safe relationship this month." },
      { min: 41, max: 50, label: "Deep practice", body: "You're ready for the harder edges: using anger to set a structural boundary, change a dynamic, or redirect a life." },
    ],
  },
];
