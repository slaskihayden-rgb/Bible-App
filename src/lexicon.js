/**
 * Retrieval hints only. None of this text is ever shown.
 * Phrases are lowercase and already normalized the same way as verse text.
 * Each phrase is [text, weight]. Higher weight means a more distinctive line.
 */
export const LEXICON = [
  {
    id: "anxiety",
    triggers: ["anxious", "anxiety", "worried", "worry", "worrying", "worries", "panic", "panicked", "stressed", "stress", "overwhelmed", "nervous", "afraid", "scared", "uneasy", "troubled"],
    phrases: [
      ["be careful for nothing", 3],
      ["take no thought", 2.6],
      ["take therefore no thought", 2.6],
      ["let not your heart be troubled", 2.6],
      ["casting all your care upon him", 3],
      ["cast thy burden upon the lord", 2.8],
      ["peace of god which passeth", 2.2],
      ["thou wilt keep him in perfect peace", 2.4],
      ["i will never leave thee nor forsake thee", 1.5],
    ],
  },
  {
    id: "money",
    triggers: ["money", "bills", "bill", "debt", "debts", "rent", "mortgage", "finances", "financial", "broke", "poor", "poverty", "paycheck", "salary", "wages", "afford", "mammon", "riches", "treasure", "provision", "provide"],
    phrases: [
      ["ye cannot serve god and mammon", 3],
      ["the love of money is the root", 1.6],
      ["godliness with contentment is great gain", 2.6],
      ["my god shall supply all your need", 3],
      ["seek ye first the kingdom of god", 2.8],
      ["lay not up for yourselves treasures", 2.4],
      ["be content with such things as ye have", 2.6],
      ["i will never leave thee nor forsake thee", 2.2],
      ["knoweth that ye have need", 2.3],
      ["what ye shall eat", 2.2],
      ["what shall we eat", 2.2],
    ],
  },
  {
    id: "forgiveness",
    triggers: ["forgive", "forgiven", "forgiveness", "forgiving", "hurt", "hurt me", "trespass", "resent", "resentment", "bitter", "bitterness", "enemy", "enemies", "wronged", "betrayed"],
    phrases: [
      ["if ye forgive men their trespasses", 3],
      ["if ye forgive not men", 2.8],
      ["until seventy times seven", 3],
      ["forgiving one another", 3],
      ["even as christ forgave you", 2.6],
      ["forgive and ye shall be forgiven", 3],
      ["father forgive them", 2.4],
      ["love your enemies", 2.3],
      ["avenge not yourselves", 2.2],
      ["and when ye stand praying forgive", 2.6],
      ["seven times in a day", 2.2],
    ],
  },
  {
    id: "strength",
    triggers: ["strength", "strengthen", "strong", "weary", "tired", "exhausted", "weak", "weakness", "courage", "hard day", "hard time", "difficult", "struggle", "struggling", "burden", "burdens", "faint", "overwhelmed"],
    phrases: [
      ["they that wait upon the lord shall renew their strength", 3],
      ["i can do all things through christ which strengtheneth me", 3],
      ["god is our refuge and strength", 2.7],
      ["fear thou not for i am with thee", 2.6],
      ["i will strengthen thee", 2.8],
      ["be strong and of a good courage", 2.4],
      ["the joy of the lord is your strength", 2.8],
      ["my strength is made perfect in weakness", 2.8],
      ["as thy days so shall thy strength be", 2.6],
      ["come unto me all ye that labour", 2.5],
      ["sufficient unto the day is the evil thereof", 2.2],
      ["giveth power to the faint", 2.4],
      ["the lord is my strength and my shield", 2.3],
      ["the lord is my strength and song", 2.2],
      ["strength of my life", 2.2],
    ],
  },
  {
    id: "grief",
    triggers: ["grief", "grieving", "mourn", "mourning", "heartbroken", "heart broken", "bereaved", "funeral", "widow", "widower", "weeping", "tears", "sorrow", "passed away", "lost my", "who died", "has died", "had died", "death of", "after death", "dying"],
    phrases: [
      ["the lord is nigh unto them that are of a broken heart", 3],
      ["he healeth the broken in heart", 3],
      ["blessed are they that mourn", 3],
      ["god shall wipe away all tears", 3],
      ["the god of all comfort", 2.8],
      ["comforteth us in all our tribulation", 2.6],
      ["valley of the shadow of death", 2.4],
      ["i will not leave you comfortless", 2.8],
      ["sorrow not even as others which have no hope", 2.8],
      ["precious in the sight of the lord is the death of his saints", 2.4],
      ["weeping may endure for a night", 2.5],
      ["i am the resurrection and the life", 2.4],
      ["neither death nor life", 2],
      ["blessed are the dead which die in the lord", 2.2],
    ],
  },
  {
    id: "parent",
    triggers: ["parent", "parents", "father", "mother", "dad", "mom", "mama", "daddy"],
    phrases: [
      ["when my father and my mother forsake me", 3],
      ["as one whom his mother comforteth", 3],
    ],
  },
  {
    id: "alone",
    triggers: ["lonely", "alone", "loneliness", "abandoned", "forsaken", "isolated", "left me"],
    phrases: [
      ["i will never leave thee nor forsake thee", 2.8],
      ["i will not leave you comfortless", 2.8],
      ["lo i am with you alway", 2.6],
      ["when my father and my mother forsake me", 2.4],
      ["the lord is nigh unto them that are of a broken heart", 2.2],
      ["fear thou not for i am with thee", 2.2],
    ],
  },
  {
    id: "peace",
    triggers: ["peace", "peaceful", "calm", "restless", "unsettled"],
    phrases: [
      ["peace i leave with you", 3],
      ["my peace i give unto you", 2.6],
      ["peace of god which passeth", 2.8],
      ["thou wilt keep him in perfect peace", 2.8],
      ["let not your heart be troubled", 2.2],
    ],
  },
  {
    id: "hope",
    triggers: ["hope", "hopeless", "despair", "discouraged", "depression", "depressed", "downcast", "cast down"],
    phrases: [
      ["why art thou cast down o my soul", 3],
      ["thoughts of peace and not of evil", 2.6],
      ["weeping may endure for a night", 2.2],
      ["the god of hope", 2.4],
      ["rejoicing in hope", 2],
    ],
  },
  {
    id: "wisdom",
    triggers: ["wisdom", "wise", "guidance", "guide", "decision", "decide", "direction", "confused", "path", "choice"],
    phrases: [
      ["trust in the lord with all thine heart", 3],
      ["he shall direct thy paths", 2.6],
      ["if any of you lack wisdom", 3],
      ["thy word is a lamp unto my feet", 2.8],
      ["in all thy ways acknowledge him", 2.4],
    ],
  },
  {
    id: "guilt",
    triggers: ["guilt", "guilty", "shame", "ashamed", "condemned", "forgive me", "i sinned", "i have sinned", "my sin"],
    phrases: [
      ["if we confess our sins", 3],
      ["there is therefore now no condemnation", 3],
      ["as far as the east is from the west", 2.8],
      ["though your sins be as scarlet", 2.6],
      ["create in me a clean heart", 2.6],
      ["for god so loved the world", 1.6],
    ],
  },
  {
    id: "temptation",
    triggers: ["temptation", "tempted", "tempt", "lust", "addiction", "addicted"],
    phrases: [
      ["god is faithful who will not suffer you to be tempted", 3],
      ["resist the devil and he will flee", 2.8],
      ["lead us not into temptation", 2.4],
      ["watch and pray that ye enter not into temptation", 2.4],
    ],
  },
  {
    id: "healing",
    triggers: ["sick", "sickness", "illness", "ill", "disease", "pain", "hurting", "hospital", "healing", "heal", "health", "doctor"],
    phrases: [
      ["i am the lord that healeth thee", 3],
      ["with his stripes we are healed", 2.8],
      ["the prayer of faith shall save the sick", 3],
      ["heal the sick", 1.4],
    ],
  },
  {
    id: "anger",
    triggers: ["angry", "anger", "mad", "furious", "wrath", "rage", "hatred", "hate"],
    phrases: [
      ["be ye angry and sin not", 3],
      ["let not the sun go down upon your wrath", 2.8],
      ["avenge not yourselves", 2.2],
      ["love your enemies", 2],
      ["wrath of man worketh not the righteousness of god", 2.6],
    ],
  },
  {
    id: "thanks",
    triggers: ["thank", "thanks", "thankful", "grateful", "gratitude", "praise"],
    phrases: [
      ["in every thing give thanks", 3],
      ["o give thanks unto the lord", 2.2],
      ["bless the lord o my soul", 2.2],
    ],
  },
  {
    id: "prayer",
    triggers: ["pray", "prayer", "praying"],
    phrases: [
      ["ask and it shall be given you", 2.4],
      ["pray without ceasing", 2.6],
      ["men ought always to pray", 2.4],
      ["the effectual fervent prayer", 2.6],
    ],
  },
  {
    id: "salvation",
    triggers: ["heaven", "saved", "salvation", "eternal life", "born again", "gospel"],
    phrases: [
      ["for god so loved the world", 3],
      ["i am the way the truth and the life", 3],
      ["by grace are ye saved through faith", 2.8],
      ["believe on the lord jesus christ", 2.8],
    ],
  },
];

/** Words that are too common to expand from a phrase into keyword search. */
export const EXPANSION_STOP = new Set(
  `lord god christ jesus thee thou thy thine ye you your unto shall will not nor all are was his him her them they with from have hath this that into upon one man men nothing take things thing day days night father mother son also even every every thing every thing said saith let may yet our us me my we he she it a an the and or of to in on for be do so as if but at by than then there their them`.split(/\s+/),
);
