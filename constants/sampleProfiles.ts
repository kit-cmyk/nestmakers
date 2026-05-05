export type ProfileRole = 'egg' | 'sperm' | 'womb' | 'embryo';
export type PromptTone = 'lavender' | 'peach' | 'butter' | 'sage';

export interface SamplePrompt {
  kicker: string;
  text: string;
  tone: PromptTone;
}

export interface SampleProfile {
  id: string;
  firstName: string;
  age: number;
  location: string;
  role: ProfileRole;
  roleLabel: string;
  inseminationPreference: string;
  insemBadgeTone: 'sky' | 'peach' | 'sage';
  involvementLevel: string;
  involvementBadgeTone: 'lavender' | 'butter' | 'sage' | 'peach';
  portraitSeed: number;
  verified: boolean;
  anonymous: boolean;
  badges: string[];
  bio: string;
  prompts: SamplePrompt[];
  vibes: string[];
  ethnicity: string;
  education: string;
  hairColor: string;
  eyeColor: string;
  bloodType: string;
  ratings?: {
    communication: number;
    honesty: number;
    reliability: number;
    emotionalSupport: number;
  };
  journeysCompleted?: number;
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  // 1. Egg donor · AI only insem · Limited contact · Verified · Has ratings
  {
    id: 'rowan',
    firstName: 'Rowan',
    age: 28,
    location: 'Brooklyn, NY',
    role: 'egg',
    roleLabel: 'Egg donor',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'Limited contact',
    involvementBadgeTone: 'butter',
    portraitSeed: 3,
    verified: true,
    anonymous: false,
    badges: ['Verified', 'Nurturer'],
    bio: 'Passionate about giving families the chance they deserve. Runner, journaller, and firm believer in the power of a really good breakfast.',
    prompts: [
      {
        kicker: 'My reason for doing this is…',
        text: 'My cousin tried for six years. Watching them finally hold their son — I knew I wanted to give someone that feeling.',
        tone: 'lavender',
      },
      {
        kicker: 'The kind of family I hope to help build…',
        text: "One where kindness is loud and expectations are written down. I'd love to know the child is loved, nothing more.",
        tone: 'peach',
      },
    ],
    vibes: ['Bookworm', 'Morning runner', 'Cat parent', 'Sourdough era'],
    ethnicity: 'East Asian · White',
    education: "Bachelor's",
    hairColor: 'Dark brown',
    eyeColor: 'Brown',
    bloodType: 'O+',
    ratings: { communication: 4.9, honesty: 5.0, reliability: 4.8, emotionalSupport: 4.7 },
    journeysCompleted: 2,
  },

  // 2. Sperm donor · Either insem · Known donor · Verified · Many journeys
  {
    id: 'marcus',
    firstName: 'Marcus',
    age: 33,
    location: 'Austin, TX',
    role: 'sperm',
    roleLabel: 'Sperm donor',
    inseminationPreference: 'Either',
    insemBadgeTone: 'sage',
    involvementLevel: 'Known donor',
    involvementBadgeTone: 'sage',
    portraitSeed: 1,
    verified: true,
    anonymous: false,
    badges: ['Verified', 'Pioneer'],
    bio: "Software engineer, weekend cyclist, occasional cook. Four journeys in and I'm still humbled by how much trust families place in me.",
    prompts: [
      {
        kicker: 'Something I want you to know…',
        text: "I keep a letter for each family. Not to intrude — just so they know someone thought about them on the day it started.",
        tone: 'butter',
      },
      {
        kicker: 'A value I live by…',
        text: 'Transparency makes everything easier. I share my full health panel upfront and expect honest conversations in return.',
        tone: 'sage',
      },
      {
        kicker: "On a free afternoon you'll find me…",
        text: 'Either on a trail with elevation or deep in a video essay about something I have no business knowing this much about.',
        tone: 'peach',
      },
    ],
    vibes: ['Cyclist', 'Tech nerd', 'Homecook', 'Hiker', 'Dog dad'],
    ethnicity: 'Black / African American',
    education: "Master's",
    hairColor: 'Black',
    eyeColor: 'Dark brown',
    bloodType: 'A+',
    ratings: { communication: 4.8, honesty: 4.9, reliability: 5.0, emotionalSupport: 4.6 },
    journeysCompleted: 4,
  },

  // 3. Surrogate · Natural insem · Co-parenting · Unverified (new) · No ratings
  {
    id: 'destiny',
    firstName: 'Destiny',
    age: 26,
    location: 'Atlanta, GA',
    role: 'womb',
    roleLabel: 'Surrogate',
    inseminationPreference: 'Natural insemination',
    insemBadgeTone: 'peach',
    involvementLevel: 'Co-parenting',
    involvementBadgeTone: 'peach',
    portraitSeed: 6,
    verified: false,
    anonymous: false,
    badges: [],
    bio: "Mom of two, open heart, no illusions. I've carried life and I know what it means. Looking for a family who wants a real partner in this.",
    prompts: [
      {
        kicker: 'My hope for this journey…',
        text: "That years from now the child knows they were wanted so deeply that a village formed just to bring them here.",
        tone: 'sage',
      },
    ],
    vibes: ['Mom energy', 'Gospel music', 'Garden grower', 'Community first'],
    ethnicity: 'Black / African American',
    education: "Associate's",
    hairColor: 'Black',
    eyeColor: 'Brown',
    bloodType: 'B+',
    ratings: undefined,
    journeysCompleted: 0,
  },

  // 4. Egg donor · AI only · Co-parenting · Verified · Anonymous mode
  {
    id: 'mei',
    firstName: 'M.',
    age: 30,
    location: 'San Francisco, CA',
    role: 'egg',
    roleLabel: 'Egg donor',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'Co-parenting',
    involvementBadgeTone: 'peach',
    portraitSeed: 4,
    verified: true,
    anonymous: true,
    badges: ['Verified'],
    bio: "I've chosen to keep my name private for now. My values aren't private: I believe every child deserves structure, warmth, and someone in their corner.",
    prompts: [
      {
        kicker: 'The kind of family I hope to help build…',
        text: "Intentional. Whoever they are — one parent, two, a whole chosen family — I want to know they made this decision with their whole chest.",
        tone: 'lavender',
      },
      {
        kicker: 'A non-negotiable for me…',
        text: "A clear co-parenting agreement before anything starts. Clarity is kindness — for everyone, including the child.",
        tone: 'butter',
      },
    ],
    vibes: ['Privacy-first', 'Planner', 'Yoga weekends', 'City walker'],
    ethnicity: 'East Asian',
    education: "Master's",
    hairColor: 'Black',
    eyeColor: 'Dark brown',
    bloodType: 'AB-',
    ratings: { communication: 4.7, honesty: 4.8, reliability: 4.9, emotionalSupport: 4.5 },
    journeysCompleted: 1,
  },

  // 5. Sperm donor · AI only insem · AI only involvement · Verified · Minimal (1 prompt)
  {
    id: 'jordan',
    firstName: 'Jordan',
    age: 38,
    location: 'Chicago, IL',
    role: 'sperm',
    roleLabel: 'Sperm donor',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'AI only',
    involvementBadgeTone: 'lavender',
    portraitSeed: 0,
    verified: true,
    anonymous: false,
    badges: ['Verified'],
    bio: "Private person, very intentional. I donate through a clinic only — no direct contact. Full medical history available on request.",
    prompts: [
      {
        kicker: "Something I'm proud of…",
        text: 'I got tested, cleared my health history, and made a decision I can live with. That felt like enough.',
        tone: 'sage',
      },
    ],
    vibes: ['Introvert', 'Architecture buff', 'Slow travel', 'Film photography'],
    ethnicity: 'White',
    education: "Bachelor's",
    hairColor: 'Brown',
    eyeColor: 'Green',
    bloodType: 'O-',
    ratings: { communication: 4.6, honesty: 5.0, reliability: 4.9, emotionalSupport: 4.3 },
    journeysCompleted: 3,
  },

  // 6. Surrogate · Either · Limited contact · Verified · First journey (no ratings yet)
  {
    id: 'sofia',
    firstName: 'Sofia',
    age: 25,
    location: 'Miami, FL',
    role: 'womb',
    roleLabel: 'Surrogate',
    inseminationPreference: 'Either',
    insemBadgeTone: 'sage',
    involvementLevel: 'Limited contact',
    involvementBadgeTone: 'butter',
    portraitSeed: 2,
    verified: true,
    anonymous: false,
    badges: ['Verified'],
    bio: "Healthy, active, and ready. I've done a lot of research, talked to my family, and I feel certain about this. First journey — I'm here for it.",
    prompts: [
      {
        kicker: 'My reason for doing this is…',
        text: "My best friend did IVF for three years. Being this close to that pain — and being physically able to help — felt like a responsibility I couldn't ignore.",
        tone: 'lavender',
      },
      {
        kicker: "On a free afternoon you'll find me…",
        text: "At the beach or dancing in my kitchen. Usually both if it's a really good day.",
        tone: 'peach',
      },
    ],
    vibes: ['Beach life', 'Dancer', 'Pilates', 'Social butterfly', 'Family-oriented'],
    ethnicity: 'Latina / Hispanic',
    education: "Bachelor's",
    hairColor: 'Dark brown',
    eyeColor: 'Hazel',
    bloodType: 'A-',
    ratings: undefined,
    journeysCompleted: 0,
  },

  // 7. Embryo donor · AI only · Limited contact · Verified · Unique role
  {
    id: 'theo',
    firstName: 'Theo',
    age: 44,
    location: 'Portland, OR',
    role: 'embryo',
    roleLabel: 'Embryo donor',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'Limited contact',
    involvementBadgeTone: 'butter',
    portraitSeed: 7,
    verified: true,
    anonymous: false,
    badges: ['Verified'],
    bio: "My partner and I completed our family and have two frozen embryos we can't carry ourselves. Donating feels like the most meaningful thing we can do with them.",
    prompts: [
      {
        kicker: 'Something I want you to know…',
        text: "These embryos were made with love, during a chapter we're deeply proud of. Whoever receives them — they matter to us.",
        tone: 'butter',
      },
      {
        kicker: 'A value I live by…',
        text: "Openness without obligation. We'd welcome a photo once in a while, but we'll never ask for one.",
        tone: 'sage',
      },
      {
        kicker: 'My hope for this journey…',
        text: "That a family who has been waiting gets to stop waiting. That's all.",
        tone: 'lavender',
      },
    ],
    vibes: ['Dad of two', 'Woodworker', 'Rainy day reader', 'Neighbourhood walks'],
    ethnicity: 'White',
    education: "Bachelor's",
    hairColor: 'Salt & pepper',
    eyeColor: 'Blue',
    bloodType: 'B-',
    ratings: { communication: 5.0, honesty: 5.0, reliability: 5.0, emotionalSupport: 4.9 },
    journeysCompleted: 1,
  },

  // 8. Egg donor · Natural insem · Known donor · Unverified (new) · No ratings · No prompts
  {
    id: 'amara',
    firstName: 'Amara',
    age: 24,
    location: 'Houston, TX',
    role: 'egg',
    roleLabel: 'Egg donor',
    inseminationPreference: 'Natural insemination',
    insemBadgeTone: 'peach',
    involvementLevel: 'Known donor',
    involvementBadgeTone: 'sage',
    portraitSeed: 5,
    verified: false,
    anonymous: false,
    badges: [],
    bio: "Just starting out — profile still being completed. Open to known donation and building a relationship with the right family over time.",
    prompts: [],
    vibes: ['Nursing student', 'Gym regular', 'Afrobeats', 'Close family'],
    ethnicity: 'Nigerian American',
    education: "Some college",
    hairColor: 'Black',
    eyeColor: 'Dark brown',
    bloodType: 'AS',
    ratings: undefined,
    journeysCompleted: 0,
  },

  // 9. Egg donor · AI only · Identity release · Verified · 1 journey
  {
    id: 'priya',
    firstName: 'Priya',
    age: 29,
    location: 'Seattle, WA',
    role: 'egg',
    roleLabel: 'Egg donor',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'Identity release',
    involvementBadgeTone: 'lavender',
    portraitSeed: 2,
    verified: true,
    anonymous: false,
    badges: ['Verified'],
    bio: "Biochemist by day, trail runner by weekend. I've thought about this carefully and I'm at peace with my decision. I'm happy for any child to know who I am when they're ready.",
    prompts: [
      {
        kicker: 'My reason for doing this is…',
        text: "Science gave me clarity about my own genetics — I want to pass that gift on to a family who can't get there on their own.",
        tone: 'lavender',
      },
      {
        kicker: 'A value I live by…',
        text: "Curiosity over certainty. I don't have all the answers about what this journey means, and I think that's okay.",
        tone: 'sage',
      },
    ],
    vibes: ['Trail runner', 'Scientist', 'Book club', 'Plant mom', 'Chai obsessed'],
    ethnicity: 'South Asian',
    education: "Master's",
    hairColor: 'Black',
    eyeColor: 'Dark brown',
    bloodType: 'B+',
    ratings: { communication: 4.8, honesty: 4.9, reliability: 4.7, emotionalSupport: 4.6 },
    journeysCompleted: 1,
  },

  // 10. Sperm donor · Either · Limited contact · Verified · 2 journeys
  {
    id: 'caleb',
    firstName: 'Caleb',
    age: 31,
    location: 'Denver, CO',
    role: 'sperm',
    roleLabel: 'Sperm donor',
    inseminationPreference: 'Either',
    insemBadgeTone: 'sage',
    involvementLevel: 'Limited contact',
    involvementBadgeTone: 'butter',
    portraitSeed: 0,
    verified: true,
    anonymous: false,
    badges: ['Verified', 'Nurturer'],
    bio: "High school teacher, mountain climber, and embarrassingly competitive board game player. I donate with intention and stay available for check-ins if the family wants.",
    prompts: [
      {
        kicker: 'Something I want you to know…',
        text: "I wrote letters for each of my donations. I've never sent them — they're just for me. A way to mark that it mattered.",
        tone: 'butter',
      },
      {
        kicker: "On a free afternoon you'll find me…",
        text: "Halfway up a 14er trying to talk myself out of turning back. I almost never do.",
        tone: 'peach',
      },
      {
        kicker: 'A value I live by…',
        text: "Show up or don't — but don't half-show up. Every family I've worked with deserved my full honesty.",
        tone: 'sage',
      },
    ],
    vibes: ['Teacher', 'Climber', 'Board games', 'Outdoorsy', 'Dog dad'],
    ethnicity: 'White',
    education: "Bachelor's",
    hairColor: 'Auburn',
    eyeColor: 'Blue',
    bloodType: 'O+',
    ratings: { communication: 4.9, honesty: 5.0, reliability: 4.8, emotionalSupport: 4.7 },
    journeysCompleted: 2,
  },

  // 11. Surrogate · AI only · Known donor · Verified · 2 journeys · High ratings
  {
    id: 'nadia',
    firstName: 'Nadia',
    age: 34,
    location: 'Phoenix, AZ',
    role: 'womb',
    roleLabel: 'Surrogate',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'Known donor',
    involvementBadgeTone: 'sage',
    portraitSeed: 6,
    verified: true,
    anonymous: false,
    badges: ['Verified', 'Pioneer'],
    bio: "Two successful gestational surrogacies behind me — both IVF, both clinic-managed. I know my body, I know this process, and I know exactly what a family needs from a surrogate.",
    prompts: [
      {
        kicker: 'My hope for this journey…',
        text: "That the intended parents feel supported every single step. I send weekly updates unprompted. It's just who I am.",
        tone: 'lavender',
      },
      {
        kicker: 'Something I want you to know…',
        text: "I've carried two babies I wasn't attached to, and I've never once felt confused about whose they were. That part is genuinely easy for me.",
        tone: 'peach',
      },
    ],
    vibes: ['Nurse', 'Mom of one', 'Meal prepper', 'Sunrise walks', 'Community volunteer'],
    ethnicity: 'Middle Eastern',
    education: "Bachelor's",
    hairColor: 'Dark brown',
    eyeColor: 'Brown',
    bloodType: 'A+',
    ratings: { communication: 5.0, honesty: 4.9, reliability: 5.0, emotionalSupport: 5.0 },
    journeysCompleted: 2,
  },

  // 12. Embryo donor · AI only · Anonymous · Verified · Couple donation
  {
    id: 'lin',
    firstName: 'Lin',
    age: 41,
    location: 'Boston, MA',
    role: 'embryo',
    roleLabel: 'Embryo donor',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'Anonymous',
    involvementBadgeTone: 'lavender',
    portraitSeed: 4,
    verified: true,
    anonymous: false,
    badges: ['Verified'],
    bio: "My wife and I finished building our family after years of IVF. We have three remaining embryos and we've decided open donation feels right. We don't need updates — we just need to know they have a chance.",
    prompts: [
      {
        kicker: 'My reason for doing this is…',
        text: "We spent four years doing this ourselves. Discarding embryos that could become children felt impossible. This was the only answer that made sense.",
        tone: 'butter',
      },
      {
        kicker: 'A non-negotiable for me…',
        text: "A family who has genuinely considered the implications of embryo adoption for their child. We're not looking for perfection — just thoughtfulness.",
        tone: 'lavender',
      },
    ],
    vibes: ['Academic', 'Parent of two', 'Amateur cellist', 'Long-distance walker', 'Quiet weekends'],
    ethnicity: 'East Asian',
    education: 'PhD',
    hairColor: 'Black',
    eyeColor: 'Dark brown',
    bloodType: 'O-',
    ratings: { communication: 4.7, honesty: 5.0, reliability: 4.9, emotionalSupport: 4.8 },
    journeysCompleted: 0,
  },

  // 13. Sperm donor · Either · Co-parenting · Unverified · New · No ratings
  {
    id: 'kenji',
    firstName: 'Kenji',
    age: 27,
    location: 'Los Angeles, CA',
    role: 'sperm',
    roleLabel: 'Sperm donor',
    inseminationPreference: 'Either',
    insemBadgeTone: 'sage',
    involvementLevel: 'Co-parenting',
    involvementBadgeTone: 'peach',
    portraitSeed: 1,
    verified: false,
    anonymous: false,
    badges: [],
    bio: "I've always known I wanted to be a father — just not through a traditional route. Co-parenting feels right. I want to be present, consistent, and real. Still working through my verification docs.",
    prompts: [
      {
        kicker: 'The kind of family I hope to help build…',
        text: "One where I'm the fun uncle who also shows up for school plays. Involved, but not overstepping — whatever the co-parenting agreement says.",
        tone: 'peach',
      },
      {
        kicker: "On a free afternoon you'll find me…",
        text: "Editing short films I'll probably never finish or playing basketball at the park until my knees remind me I'm almost 30.",
        tone: 'butter',
      },
    ],
    vibes: ['Filmmaker', 'Basketball', 'Sneaker collector', 'Family man', 'Creative'],
    ethnicity: 'Japanese American',
    education: "Bachelor's",
    hairColor: 'Black',
    eyeColor: 'Brown',
    bloodType: 'B+',
    ratings: undefined,
    journeysCompleted: 0,
  },

  // 14. Egg donor · AI only · Identity release · Verified · 3 journeys
  {
    id: 'celeste',
    firstName: 'Celeste',
    age: 32,
    location: 'Nashville, TN',
    role: 'egg',
    roleLabel: 'Egg donor',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'Identity release',
    involvementBadgeTone: 'lavender',
    portraitSeed: 3,
    verified: true,
    anonymous: false,
    badges: ['Verified', 'Pioneer'],
    bio: "Music teacher, dog foster, and firmly in my 'do something meaningful' era. Three donations in and I care more about this than ever. I'm open to being known — when and if the child wants that.",
    prompts: [
      {
        kicker: 'My reason for doing this is…',
        text: "I teach kids every day and I see what a stable, loving start does for a person. I want to be part of that start for someone who might not have had it otherwise.",
        tone: 'lavender',
      },
      {
        kicker: 'Something I want you to know…',
        text: "I get a card every year from one of the families. I didn't ask for it — they just started sending one. It's the best thing in my inbox every time.",
        tone: 'peach',
      },
      {
        kicker: 'A value I live by…',
        text: "Music taught me that timing matters more than perfection. I bring that to everything — including this.",
        tone: 'butter',
      },
    ],
    vibes: ['Music teacher', 'Dog foster', 'Live music', 'Hiking', 'Big sister energy'],
    ethnicity: 'Black / White',
    education: "Master's",
    hairColor: 'Natural curls',
    eyeColor: 'Hazel',
    bloodType: 'A-',
    ratings: { communication: 4.9, honesty: 4.8, reliability: 5.0, emotionalSupport: 4.9 },
    journeysCompleted: 3,
  },

  // 15. Sperm donor · AI only · Anonymous · Verified · 5 journeys · Most experienced
  {
    id: 'tobias',
    firstName: 'Tobias',
    age: 36,
    location: 'Minneapolis, MN',
    role: 'sperm',
    roleLabel: 'Sperm donor',
    inseminationPreference: 'AI only',
    insemBadgeTone: 'sky',
    involvementLevel: 'Anonymous',
    involvementBadgeTone: 'lavender',
    portraitSeed: 7,
    verified: true,
    anonymous: false,
    badges: ['Verified', 'Pioneer'],
    bio: "Clinic-only, anonymous donor. Five journeys, zero regrets. I provide a full genetic panel, updated annually. I don't need to be in the picture — I just need the picture to be possible.",
    prompts: [
      {
        kicker: "Something I'm proud of…",
        text: "I've kept every annual health panel without being asked. It's a small thing. It feels like the least I can do.",
        tone: 'sage',
      },
      {
        kicker: 'A value I live by…',
        text: "Consistency is a form of care. I show up for my own health so that the families I donate to can count on the data being real.",
        tone: 'butter',
      },
    ],
    vibes: ['Physician', 'Cross-country skier', 'Quiet achiever', 'Jazz listener', 'Early riser'],
    ethnicity: 'Scandinavian',
    education: 'MD',
    hairColor: 'Blond',
    eyeColor: 'Blue',
    bloodType: 'O+',
    ratings: { communication: 4.6, honesty: 5.0, reliability: 5.0, emotionalSupport: 4.4 },
    journeysCompleted: 5,
  },
];
