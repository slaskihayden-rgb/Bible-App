/**
 * Short notes shown beside a verse. They are not scripture.
 * Each note is tied to a King James line that is actually in the verse,
 * and it does not add a promise the line does not make.
 */
import { LEXICON } from "./lexicon.js";
import { normalizeForSearch } from "./text.js";

const NOTES = {
  "be careful for nothing": {
    why: "This verse says to be careful for nothing, and to let your requests be made known to God by prayer, with thanksgiving.",
    apply: "Tell God the worry you named, in prayer, and include thanks. That is the step this verse gives.",
  },
  "take no thought": {
    why: "This verse says to take no thought, and not to keep turning the worry over.",
    apply: "When the worry starts repeating itself, stop feeding it. Let the instruction stand: take no thought.",
  },
  "take therefore no thought": {
    why: "This verse says to take no thought for the morrow, because the morrow will have its own trouble, and today's trouble is enough.",
    apply: "Deal with today's trouble only. Leave tomorrow's worry until tomorrow.",
  },
  "let not your heart be troubled": {
    why: "This verse says not to let your heart be troubled.",
    apply: "When your heart starts to race over this, come back to that instruction and do not let the trouble take the heart over.",
  },
  "casting all your care upon him": {
    why: "This verse says to cast all your care upon God, because he cares for you.",
    apply: "Hand him the care you just named, instead of carrying all of it yourself.",
  },
  "cast thy burden upon the lord": {
    why: "This verse says to cast your burden upon the Lord, and he shall sustain you.",
    apply: "Put the weight you are carrying onto the Lord, and look to him to sustain you.",
  },
  "peace of god which passeth": {
    why: "This verse says the peace of God, which passes understanding, shall keep your hearts and minds through Christ Jesus.",
    apply: "Ask for that peace to guard your heart and mind while this is still unresolved.",
  },
  "thou wilt keep him in perfect peace": {
    why: "This verse says God will keep in perfect peace the one whose mind is stayed on him, because he trusts in God.",
    apply: "Turn your mind toward God and trust him with the thing that will not settle.",
  },
  "i will never leave thee nor forsake thee": {
    why: "This verse says to be content with what you have, because God has said he will never leave you nor forsake you.",
    apply: "When fear says you will be left without enough, remember this promise: he will not leave you.",
  },
  "ye cannot serve god and mammon": {
    why: "This verse says you cannot serve God and mammon, because money and God cannot both be master.",
    apply: "Notice which one you are serving when money presses on you, and choose God rather than money as the master.",
  },
  "the love of money is the root": {
    why: "This verse says the love of money is the root of all evil.",
    apply: "Watch the love of money in this situation, and do not let that love steer you.",
  },
  "godliness with contentment is great gain": {
    why: "This verse says that godliness with contentment is great gain.",
    apply: "Let contentment, together with a godly life, be the gain you look for, rather than more money.",
  },
  "my god shall supply all your need": {
    why: "This verse says your God shall supply all your need according to his riches in glory by Christ Jesus.",
    apply: "Name the need, and look to God to supply it, as this verse says he will.",
  },
  "seek ye first the kingdom of god": {
    why: "This verse says to seek first the kingdom of God and his righteousness, and these things shall be added unto you.",
    apply: "Put God's kingdom ahead of the provision you are worried about, and trust him to add what you need.",
  },
  "lay not up for yourselves treasures": {
    why: "This verse says not to lay up treasures for yourself on earth, where they fail, but to lay up treasure in heaven.",
    apply: "Loosen your grip on storing up money, and set your heart on what lasts.",
  },
  "be content with such things as ye have": {
    why: "This verse says to be content with what you have, because God has said he will never leave you nor forsake you.",
    apply: "Look at what you already have, and let his promise not to leave you quiet the fear of not having enough.",
  },
  "knoweth that ye have need": {
    why: "This verse says your heavenly Father knows that you have need of these things.",
    apply: "You do not have to persuade God that the need is real. This verse says he already knows it.",
  },
  "what ye shall eat": {
    why: "This verse speaks about what you will eat, and tells you not to be consumed by that question.",
    apply: "When you start asking what you will eat, set the question down instead of rehearsing it.",
  },
  "what shall we eat": {
    why: "This verse takes up the question of what you will eat.",
    apply: "Bring that question to God rather than letting it run on.",
  },
  "if ye forgive men their trespasses": {
    why: "This verse says that if you forgive people their trespasses, your heavenly Father will also forgive you.",
    apply: "Forgive the person who hurt you. This verse ties that forgiveness to the forgiveness you seek from the Father.",
  },
  "if ye forgive not men": {
    why: "This verse says that if you do not forgive others, your Father will not forgive you.",
    apply: "Do not leave the hurt unforgiven. This verse treats withheld forgiveness as serious.",
  },
  "until seventy times seven": {
    why: "This verse says to forgive not just a few times, but until seventy times seven.",
    apply: "If the hurt returns, forgive again. This verse does not set a small number and then stop.",
  },
  "forgiving one another": {
    why: "This verse says to forgive one another, in light of the forgiveness God has already given you.",
    apply: "Forgive the person who hurt you, using the forgiveness you have received as the pattern.",
  },
  "even as christ forgave you": {
    why: "This verse says to forgive one another, even as Christ forgave you.",
    apply: "Let the way Christ forgave you be the way you forgive the person who hurt you.",
  },
  "forgive and ye shall be forgiven": {
    why: "This verse says to forgive, and you shall be forgiven, and not to judge or condemn.",
    apply: "Lay down the judgment you are holding against the person who hurt you, and forgive them.",
  },
  "father forgive them": {
    why: "This verse records Jesus saying, Father, forgive them.",
    apply: "You can ask the Father to forgive the person who hurt you, even while the hurt is still real.",
  },
  "love your enemies": {
    why: "This verse says to love your enemies.",
    apply: "Toward the person who hurt you, take one step of love rather than of revenge.",
  },
  "avenge not yourselves": {
    why: "This verse says not to avenge yourself, and that vengeance belongs to the Lord.",
    apply: "Do not pay the hurt back. Leave the reckoning with the Lord.",
  },
  "and when ye stand praying forgive": {
    why: "This verse says that when you stand praying, forgive if you have anything against anyone.",
    apply: "The next time you pray, include the person who hurt you, and forgive them there.",
  },
  "seven times in a day": {
    why: "This verse says that if someone trespasses against you seven times in a day and turns back saying they repent, you shall forgive them.",
    apply: "If the same person hurts you again and turns back, forgive them again, even if it is the same day.",
  },
  "they that wait upon the lord shall renew their strength": {
    why: "This verse says that those who wait upon the Lord shall renew their strength, and shall walk and not faint.",
    apply: "Before you push through the hard day, wait on the Lord and let him renew your strength.",
  },
  "i can do all things through christ which strengtheneth me": {
    why: "This verse says you can do all things through Christ, who strengthens you.",
    apply: "Take the next hard step looking to Christ to strengthen you, not only to your own strength.",
  },
  "god is our refuge and strength": {
    why: "This verse says God is our refuge and strength, a very present help in trouble.",
    apply: "In this trouble, go to God as your refuge and your strength. The verse says he is a help right now.",
  },
  "fear thou not for i am with thee": {
    why: "This verse says not to fear, because God is with you, and he will strengthen you and help you.",
    apply: "When fear rises, answer it with his presence and his help, which this verse promises.",
  },
  "i will strengthen thee": {
    why: "This verse says God will strengthen you and help you.",
    apply: "Ask him for the strength this day needs, and receive the help he says he will give.",
  },
  "be strong and of a good courage": {
    why: "This verse says to be strong and of a good courage, and not to fear, because the Lord goes with you.",
    apply: "Take the next step with courage. This verse ties that courage to the Lord going with you.",
  },
  "the joy of the lord is your strength": {
    why: "This verse says the joy of the Lord is your strength.",
    apply: "Look to the Lord's joy for strength today, not only to how much energy you have left.",
  },
  "my strength is made perfect in weakness": {
    why: "This verse says God's grace is sufficient for you, and that his strength is made perfect in weakness.",
    apply: "You do not have to pretend this day is easy. Bring the weakness to him, and let his strength meet it.",
  },
  "as thy days so shall thy strength be": {
    why: "This verse says that as your days are, so shall your strength be.",
    apply: "Ask for strength that matches this day, not strength for every day at once.",
  },
  "come unto me all ye that labour": {
    why: "This verse says to come to Jesus if you labour and are heavy laden, and he will give you rest.",
    apply: "Come to him with the load of this day, and take the rest he offers.",
  },
  "sufficient unto the day is the evil thereof": {
    why: "This verse says today's trouble is enough for today, and tomorrow can look after itself.",
    apply: "Carry only today's hard part. Do not add tomorrow's trouble on top of it.",
  },
  "giveth power to the faint": {
    why: "This verse says God gives power to the faint, and increases strength where there is no might.",
    apply: "If you are faint, say so to him. This verse says power is given to people in that place.",
  },
  "the lord is my strength and my shield": {
    why: "This verse says the Lord is your strength and your shield.",
    apply: "Lean on him as strength, and as a shield, for the part of the day that feels exposed.",
  },
  "the lord is my strength and song": {
    why: "This verse says the Lord is your strength and song.",
    apply: "Let him be the strength you use today, and not only a thought you agree with.",
  },
  "strength of my life": {
    why: "This verse calls the Lord the strength of your life.",
    apply: "Ask him to be the strength of this day, since the verse calls him the strength of your life.",
  },
  "the lord is nigh unto them that are of a broken heart": {
    why: "This verse says the Lord is near to those of a broken heart, and saves those of a contrite spirit.",
    apply: "Come to him with the broken heart. This verse says he is near to people there.",
  },
  "he healeth the broken in heart": {
    why: "This verse says the Lord heals the broken in heart and binds up their wounds.",
    apply: "Bring him the break and the wound. You do not have to bind it up alone.",
  },
  "blessed are they that mourn": {
    why: "This verse says those who mourn are blessed, for they shall be comforted.",
    apply: "Let yourself mourn. Comfort is promised to people who mourn, not to people who hide it.",
  },
  "god shall wipe away all tears": {
    why: "This verse says God shall wipe away all tears, and that death, sorrow, crying, and pain shall be no more.",
    apply: "Grieve now, and hold this promise: God himself will wipe the tears away, and the pain will not last forever.",
  },
  "the god of all comfort": {
    why: "This verse calls God the God of all comfort, who comforts us in all our tribulation.",
    apply: "Take this grief to the God of all comfort, and let him comfort you in it.",
  },
  "comforteth us in all our tribulation": {
    why: "This verse says God comforts us in all our tribulation, so that we can comfort others with the comfort we receive.",
    apply: "Receive his comfort in this sorrow. You do not have to supply it yourself.",
  },
  "valley of the shadow of death": {
    why: "This verse says that even in the valley of the shadow of death, God is with you, and his rod and staff comfort you.",
    apply: "Walk through this valley with him beside you. The verse does not say the valley is gone; it says he is there.",
  },
  "i will not leave you comfortless": {
    why: "This verse says Jesus will not leave you comfortless.",
    apply: "When the loss feels like being left alone, hold his word that he will not leave you without comfort.",
  },
  "sorrow not even as others which have no hope": {
    why: "This verse says not to sorrow as others who have no hope, concerning those who have fallen asleep.",
    apply: "Grieve, but not as if there is no hope. If the one you lost died in the Lord, let this hope sit beside the grief.",
  },
  "precious in the sight of the lord is the death of his saints": {
    why: "This verse says the death of the Lord's saints is precious in his sight.",
    apply: "If the one you lost belonged to the Lord, you can remember that their death is precious to him, not overlooked.",
  },
  "weeping may endure for a night": {
    why: "This verse says weeping may endure for a night, but joy comes in the morning.",
    apply: "Let the weeping have its time. This verse does not rush you, and it does say joy comes.",
  },
  "i am the resurrection and the life": {
    why: "This verse says Jesus is the resurrection and the life, and that whoever believes in him shall live even though they die.",
    apply: "Set this grief beside his word that death is not the end for the one who believes in him.",
  },
  "neither death nor life": {
    why: "This verse says that neither death nor life can separate us from the love of God in Christ Jesus.",
    apply: "Death does not put the one you love, or you, outside the love of God. That is what this verse says.",
  },
  "blessed are the dead which die in the lord": {
    why: "This verse says the dead who die in the Lord are blessed, and that they rest from their labours.",
    apply: "If the one you lost died in the Lord, you can take this blessing and this rest as true of them.",
  },
  "when my father and my mother forsake me": {
    why: "This verse says that when father and mother forsake you, the Lord will take you up.",
    apply: "If a parent is gone or has let you go, you can come to the Lord. This verse says he takes up the one they forsake.",
  },
  "as one whom his mother comforteth": {
    why: "This verse says God will comfort you as a mother comforts her child.",
    apply: "Receive his comfort in the way a child receives a mother's comfort: close, and without having to earn it.",
  },
  "lo i am with you alway": {
    why: "This verse says Jesus is with you always, even unto the end of the world.",
    apply: "You are not left alone in this. Take his promise to be with you as applying here.",
  },
  "peace i leave with you": {
    why: "This verse says Jesus leaves his peace with you, and gives his peace to you, not as the world gives.",
    apply: "Receive the peace he gives, which does not depend on the trouble going away first.",
  },
  "my peace i give unto you": {
    why: "This verse says Jesus gives you his own peace.",
    apply: "Ask for his peace in the unrest you named, and receive it as his gift.",
  },
  "why art thou cast down o my soul": {
    why: "This verse asks the cast-down soul why it is disquieted, and tells it to hope in God.",
    apply: "You can speak to your own soul, as this verse does, and point it to hope in God.",
  },
  "thoughts of peace and not of evil": {
    why: "This verse says God's thoughts toward you are thoughts of peace, and not of evil.",
    apply: "When you fear his thoughts toward you are harsh, set this verse against that fear.",
  },
  "the god of hope": {
    why: "This verse calls God the God of hope, who can fill you with joy and peace in believing.",
    apply: "Ask the God of hope to fill you, instead of trying to manufacture hope yourself.",
  },
  "rejoicing in hope": {
    why: "This verse says to rejoice in hope, to be patient in tribulation, and to continue in prayer.",
    apply: "In this trouble, keep hope, patience, and prayer together, as the verse lists them.",
  },
  "trust in the lord with all thine heart": {
    why: "This verse says to trust in the Lord with all your heart, and not to lean on your own understanding.",
    apply: "Trust him with the decision, and do not rest the whole weight on what you can figure out.",
  },
  "he shall direct thy paths": {
    why: "This verse says that if you acknowledge the Lord in all your ways, he shall direct your paths.",
    apply: "Bring the choice to him, and look for him to direct the path.",
  },
  "if any of you lack wisdom": {
    why: "This verse says that if you lack wisdom, you should ask God, who gives generously.",
    apply: "Ask him for wisdom about this, plainly, as the verse says to ask.",
  },
  "thy word is a lamp unto my feet": {
    why: "This verse says God's word is a lamp to your feet and a light to your path.",
    apply: "Use the word in front of you as light for the next step, not as a map of the whole road.",
  },
  "in all thy ways acknowledge him": {
    why: "This verse says to acknowledge the Lord in all your ways, and he shall direct your paths.",
    apply: "Name him in this decision, and then take the path he directs.",
  },
  "if we confess our sins": {
    why: "This verse says that if we confess our sins, God is faithful and just to forgive us and to cleanse us.",
    apply: "Confess the sin plainly to him, and receive the forgiveness this verse promises.",
  },
  "there is therefore now no condemnation": {
    why: "This verse says there is now no condemnation to those who are in Christ Jesus.",
    apply: "If you are in Christ, do not live under a sentence he has already removed.",
  },
  "as far as the east is from the west": {
    why: "This verse says that as far as the east is from the west, so far has he removed our transgressions from us.",
    apply: "When the sin comes back to accuse you, remember he has removed it this far.",
  },
  "though your sins be as scarlet": {
    why: "This verse says that though your sins are as scarlet, they shall be as white as snow.",
    apply: "Bring the sin, however deep it looks, and take the cleansing this verse offers.",
  },
  "create in me a clean heart": {
    why: "This verse is a prayer for God to create a clean heart and renew a right spirit.",
    apply: "Pray that prayer as your own: ask him for a clean heart, rather than trying to repair it alone.",
  },
  "for god so loved the world": {
    why: "This verse says God so loved the world that he gave his only begotten Son, so that whoever believes in him should not perish but have everlasting life.",
    apply: "Believe in the Son he gave. That is the response this verse itself names.",
  },
  "god is faithful who will not suffer you to be tempted": {
    why: "This verse says God is faithful and will not let you be tempted above what you are able, and will make a way to escape.",
    apply: "Look for the way of escape he provides, and take it, instead of deciding the temptation is too strong.",
  },
  "resist the devil and he will flee": {
    why: "This verse says to submit to God, resist the devil, and he will flee from you.",
    apply: "Submit this desire to God, and resist it. The verse says the devil flees when you do.",
  },
  "lead us not into temptation": {
    why: "This verse is the prayer, lead us not into temptation, but deliver us from evil.",
    apply: "Pray that line over the temptation in front of you.",
  },
  "watch and pray that ye enter not into temptation": {
    why: "This verse says to watch and pray so that you do not enter into temptation, because the spirit is willing but the flesh is weak.",
    apply: "Stay awake to the temptation and pray. Do not trust a willing spirit by itself.",
  },
  "i am the lord that healeth thee": {
    why: "This verse says the Lord is the one who heals you.",
    apply: "Bring the sickness to him as the healer this verse names.",
  },
  "with his stripes we are healed": {
    why: "This verse says we are healed by his stripes.",
    apply: "Set this sickness beside his suffering, which the verse says is where healing is found.",
  },
  "the prayer of faith shall save the sick": {
    why: "This verse says the prayer of faith shall save the sick, and the Lord shall raise him up.",
    apply: "Pray in faith for the one who is sick, as this verse directs.",
  },
  "heal the sick": {
    why: "This verse tells the disciples to heal the sick.",
    apply: "Ask the Lord to heal, and do not treat the sickness as outside his care.",
  },
  "be ye angry and sin not": {
    why: "This verse says you may be angry and yet not sin, and not to let the sun go down upon your wrath.",
    apply: "Feel the anger, but do not let it become sin, and do not carry the wrath into the night.",
  },
  "let not the sun go down upon your wrath": {
    why: "This verse says not to let the sun go down upon your wrath.",
    apply: "Before the day ends, deal with the anger instead of sleeping on it.",
  },
  "wrath of man worketh not the righteousness of god": {
    why: "This verse says the wrath of man does not work the righteousness of God.",
    apply: "Do not expect your anger to produce what is right. Set it down.",
  },
  "in every thing give thanks": {
    why: "This verse says to give thanks in every thing, for this is the will of God in Christ Jesus concerning you.",
    apply: "Give thanks in this, not only when it feels easy. The verse says in every thing.",
  },
  "o give thanks unto the lord": {
    why: "This verse calls you to give thanks to the Lord, for he is good.",
    apply: "Thank him for his goodness, even while you name what is hard.",
  },
  "bless the lord o my soul": {
    why: "This verse tells the soul to bless the Lord, and not to forget all his benefits.",
    apply: "Speak thanks to him from your own soul, and remember the good he has already done.",
  },
  "ask and it shall be given you": {
    why: "This verse says to ask, and it shall be given you; to seek, and you shall find; to knock, and it shall be opened.",
    apply: "Ask him for what you need. This verse tells you to ask, not to manage it in silence.",
  },
  "pray without ceasing": {
    why: "This verse says to pray without ceasing.",
    apply: "Keep bringing this to God, not only once. The verse does not set a stopping point.",
  },
  "men ought always to pray": {
    why: "This verse says people ought always to pray, and not to faint.",
    apply: "Keep praying about this, and do not faint because the answer is slow.",
  },
  "the effectual fervent prayer": {
    why: "This verse says the effectual fervent prayer of a righteous person avails much.",
    apply: "Pray about this in earnest. The verse says that kind of prayer avails much.",
  },
  "i am the way the truth and the life": {
    why: "This verse says Jesus is the way, the truth, and the life, and that no one comes to the Father except through him.",
    apply: "Come to the Father through him, which is the way this verse gives.",
  },
  "by grace are ye saved through faith": {
    why: "This verse says you are saved by grace through faith, and that this is the gift of God, not of works.",
    apply: "Rest in grace, received by faith, and do not try to earn what the verse calls a gift.",
  },
  "believe on the lord jesus christ": {
    why: "This verse says to believe on the Lord Jesus Christ, and you shall be saved.",
    apply: "Believe on him. That is the response this verse names.",
  },
};

export function questionLead(query) {
  const q = String(query || "").trim().replace(/\s+/g, " ").replace(/[.?!]+$/g, "");
  if (!q) return "You asked for a word from scripture";
  if (/^(i'm|i am)\s+/i.test(q)) {
    return `You said you are ${q.replace(/^(i'm|i am)\s+/i, "")}`;
  }
  if (/^how (?:do|can) i\s+/i.test(q)) {
    return `You asked how to ${q.replace(/^how (?:do|can) i\s+/i, "")}`;
  }
  if (/^give me\s+/i.test(q)) {
    return `You asked for ${q.replace(/^give me\s+/i, "")}`;
  }
  if (/^anxious\b/i.test(q)) return `You said you are ${q}`;
  if (/^forgive\b/i.test(q)) {
    const rest = q.replace(/^forgive\s+/i, "").replace(/\bme\b/gi, "you");
    return `You asked about forgiving ${rest}`;
  }
  const lowerFirst = q.charAt(0).toLowerCase() + q.slice(1);
  return `You asked about ${lowerFirst}`;
}

function bestPhrase(normalizedVerse, activeIds) {
  let best = null;
  for (const concept of LEXICON) {
    const active = activeIds.has(concept.id);
    for (const [phrase, weight] of concept.phrases) {
      if (!NOTES[phrase]) continue;
      if (!normalizedVerse.includes(phrase)) continue;
      const score = (active ? 1000 : 0) + phrase.length * 10 + weight;
      if (!best || score > best.score) best = { phrase, score };
    }
  }
  return best ? best.phrase : null;
}

function activeIdsForQuery(query) {
  const normalized = normalizeForSearch(query);
  const padded = ` ${normalized} `;
  const ids = new Set();
  if (normalized.includes("fear of the lord") || normalized.includes("fear of god")) return ids;
  for (const concept of LEXICON) {
    const hit = concept.triggers.some((trigger) => (
      trigger.includes(" ") ? normalized.includes(trigger) : padded.includes(` ${trigger} `)
    ));
    if (hit) ids.add(concept.id);
  }
  return ids;
}

export function explainVerse(query, verseText) {
  const lead = questionLead(query);
  const normalized = normalizeForSearch(verseText);
  const phrase = bestPhrase(normalized, activeIdsForQuery(query));
  if (phrase) {
    const note = NOTES[phrase];
    return {
      why: `${lead}. ${note.why}`,
      apply: note.apply,
    };
  }
  return {
    why: `${lead}. These words were opened because they sit close to that need. They say only what you just read.`,
    apply: "Read the verse once more, slowly, and take only the comfort or the instruction that is written in it.",
  };
}

export function phrasesMissingNotes() {
  const missing = [];
  for (const concept of LEXICON) {
    for (const [phrase] of concept.phrases) {
      if (!NOTES[phrase]) missing.push(phrase);
    }
  }
  return missing;
}
