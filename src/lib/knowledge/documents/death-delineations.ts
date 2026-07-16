/**
 * Death-chart interpretive corpus — the practice's compiled *delineation*
 * reference, one `kind` in the knowledge store.
 *
 * WHY THIS EXISTS
 * The deterministic engine already hands the composer a dense, accurate brief of
 * WHAT is in the sky (Moon in Scorpio, ruler of the 8th cadent, Algol on the
 * Descendant). What it could not supply is WHAT THE TRADITION MAKES OF IT — the
 * delineation a professional carries in their head from years with the texts.
 * Without that, each factor gets a single thin sentence. These entries are that
 * missing layer: short, source-grounded readings of each factor, keyed so the
 * retrieval seam folds in only the ones actually present in a given chart.
 *
 * PROVENANCE & RIGHTS
 * Every entry is written ORIGINALLY for GraveSigns. Where it names a source it
 * points to the PUBLIC-DOMAIN tradition (Ptolemy's *Tetrabiblos*, Vettius Valens'
 * *Anthologies*, Dorotheus of Sidon, William Lilly's *Christian Astrology*,
 * Firmicus Maternus) — doctrine, not copied text. Nothing here reproduces a
 * copyrighted modern work; the `source` field is a study trail, not a quotation.
 *
 * SHAPE
 * Each `DelineationEntry` carries a `key` (the match token the retrieval derives
 * from the live chart), a `family` (for ranking), tender-but-precise `body`
 * prose, and a tradition `source`. To grow the corpus, add rows here (or, in
 * production, rows to `knowledge_documents` of kind `delineation` with the same
 * shape in `metadata.entries`) — no code change downstream.
 *
 * INTEGRITY
 * None of these state or imply a cause, manner, date, or length of death. They
 * read a factor as MEANING, never as prediction. The composer synthesizes them;
 * it must never quote them or introduce a factor not in the chart frame.
 */
import type { DelineationEntry, KnowledgeDocument } from "../../types";

export const DEATH_DELINEATIONS: DelineationEntry[] = [
  // ── The Moon by sign — the soul's vehicle, the physical vessel and its final
  //    condition. The spiritual heart of a death reading. ──────────────────────
  {
    key: "moon:Aries",
    family: "moon",
    title: "Moon in Aries",
    body: "The vessel that crossed here was quick, brave, and its own. An Aries Moon meets endings the way it met beginnings — head first, unhesitating, unwilling to linger at the threshold. There is a clean, cauterizing finality to this crossing; the soul did not negotiate with the gate, it walked through.",
    source: "Ptolemy, Tetrabiblos; Lilly CA on the Moon in the cardinal fire",
    applies: "both",
  },
  {
    key: "moon:Taurus",
    family: "moon",
    title: "Moon in Taurus (exalted)",
    body: "The Moon is exalted in Taurus — the vessel was well-made and slow to release. This is a body that held life fully and let it go only when the holding was truly finished. There is a steadying, earthen dignity to such a passing: not a snapping but a settling, the way soil receives what has ripened. The tradition reads the exalted Moon as a soul at home in its own substance.",
    source: "Ptolemy, Tetrabiblos I.19 (exaltation of the Moon); Valens on lunar dignity",
    applies: "both",
  },
  {
    key: "moon:Gemini",
    family: "moon",
    title: "Moon in Gemini",
    body: "A Gemini Moon carried life lightly and curiously, a vessel woven of many threads. Its crossing has the quality of a conversation ending mid-sentence — not incomplete so much as continued elsewhere. The tradition marks the double-bodied signs as thresholds of exchange; this soul passed as it lived, between one word and the next.",
    source: "Ptolemy, Tetrabiblos (double-bodied signs); Dorotheus on mutable luminaries",
    applies: "both",
  },
  {
    key: "moon:Cancer",
    family: "moon",
    title: "Moon in Cancer (domicile)",
    body: "The Moon rules Cancer — here the vessel was entirely, natively itself. A soul crossing under its own luminary returns to its source the way a tide returns to the sea, needing no translation. This is one of the tenderest of all death-Moons: the body was a true home while it lasted, and its release is a homecoming rather than an exile.",
    source: "Ptolemy, Tetrabiblos I.17 (domicile of the Moon); Lilly CA p.63",
    applies: "both",
  },
  {
    key: "moon:Leo",
    family: "moon",
    title: "Moon in Leo",
    body: "A Leo Moon lived warmly and was seen. Its vessel had a radiant, generous heat, and its crossing keeps that dignity — the soul does not slip away unnoticed but takes its leave with a certain sovereignty. The tradition reads the Sun's sign as the seat of the vital spirit; even in the Moon, there is a brightness here that grief cannot wholly dim.",
    source: "Ptolemy, Tetrabiblos (solar domicile); Valens on the luminaries in Leo",
    applies: "both",
  },
  {
    key: "moon:Virgo",
    family: "moon",
    title: "Moon in Virgo",
    body: "A Virgo Moon tended things — a vessel of careful service and quiet exactitude. Its crossing has the feel of a task set down at last, the hands finally still. There is nothing careless in this passing; the tradition marks the sign of the harvest, and this soul is gathered in, complete, its work accounted for.",
    source: "Firmicus Maternus, Mathesis; Lilly CA on the Moon in earth",
    applies: "both",
  },
  {
    key: "moon:Libra",
    family: "moon",
    title: "Moon in Libra",
    body: "A Libra Moon sought balance and beauty, a vessel attuned to others. Its crossing weighs gently in the scales — a soul that measured its life in relationship now finding equilibrium at the last. The tradition reads the fall of the Sun here as the softening of the day into evening; there is grace in that dimming, not defeat.",
    source: "Ptolemy, Tetrabiblos (fall of the Sun in Libra); Valens on cardinal air",
    applies: "both",
  },
  {
    key: "moon:Scorpio",
    family: "moon",
    title: "Moon in Scorpio (fall)",
    body: "The Moon is in her fall in Scorpio — the most searching and least sentimental of the death-Moons. This vessel knew the depths; it did not cross by the shallows. There is an unflinching intimacy with mortality here, a soul that met the water at its darkest and was not consumed. The tradition marks the fall as difficulty, but in a chart of death it reads truer as depth: a passage through, not around.",
    source: "Ptolemy, Tetrabiblos I.19 (fall of the Moon); Dorotheus III on the 8th",
    applies: "both",
  },
  {
    key: "moon:Sagittarius",
    family: "moon",
    title: "Moon in Sagittarius",
    body: "A Sagittarius Moon lived toward the horizon, a vessel made for distance and meaning. Its crossing is an expansion rather than a contraction — the soul does not shrink at the gate but widens past it, the way a traveller crosses a border they always meant to reach. The tradition marks Jupiter's sign as the sign of faith; there is an openness in this passing.",
    source: "Ptolemy, Tetrabiblos (Jupiter's domicile); Valens on the mutable fire",
    applies: "both",
  },
  {
    key: "moon:Capricorn",
    family: "moon",
    title: "Moon in Capricorn (detriment)",
    body: "The Moon is in detriment in Capricorn — a vessel that carried its life with gravity and endurance, asking little softness for itself. Its crossing has the composure of a long climb reaching its summit; the soul that bore much sets the weight down. The tradition reads Saturn's sign as the place of limits and time, and there is a hard-won dignity in how this Moon meets the end it always knew was coming.",
    source: "Lilly CA (detriment of the Moon in Capricorn); Saturn as significator of endings",
    applies: "both",
  },
  {
    key: "moon:Aquarius",
    family: "moon",
    title: "Moon in Aquarius",
    body: "An Aquarius Moon belonged to something larger than itself — a vessel of cool clarity and wide belonging. Its crossing has an almost impersonal peace, the soul rejoining a whole it never truly left. The tradition marks Saturn's other sign as the sign of the assembly; this passing reads less as a solitary exit than as a return to company beyond sight.",
    source: "Ptolemy, Tetrabiblos (Saturn's airy domicile); Valens on fixed air",
    applies: "both",
  },
  {
    key: "moon:Pisces",
    family: "moon",
    title: "Moon in Pisces",
    body: "A Pisces Moon was porous to the world, a vessel that dissolved easily into feeling and mercy. Its crossing is the gentlest of all — the boundary between the soul and what receives it was always thin here, and at the end it simply gives way. The tradition marks Jupiter's water as the sign of surrender and compassion; this is a passing like tide meeting tide, no seam between.",
    source: "Ptolemy, Tetrabiblos (Jupiter's watery domicile); Valens on the mutable water",
    applies: "both",
  },

  // ── The Moon's phase at the crossing — a whole-sky mood signature. ───────────
  {
    key: "phase:New Moon",
    family: "phase",
    title: "A New-Moon crossing",
    body: "The soul crossed under a dark Moon — the luminaries together, the sky holding its breath between cycles. The tradition reads the conjunction of the lights as a seeding, a beginning hidden inside an ending. There is something unwitnessed and intimate about a passing at the new Moon: no lantern in the sky, only the promise that darkness is where the next light is set.",
    source: "Valens, Anthologies (the synodic cycle); traditional lunation doctrine",
    applies: "moment",
  },
  {
    key: "phase:Waxing Crescent",
    family: "phase",
    title: "A waxing-crescent crossing",
    body: "The Moon was young and growing when the soul crossed — the first silver returning to the sky. A death under a waxing light carries an odd, tender counterpoint: the world was gathering toward fullness even as this life completed. The tradition reads the increasing Moon as momentum; the soul left with the tide still coming in.",
    source: "Traditional lunation doctrine; Valens on the increasing Moon",
    applies: "moment",
  },
  {
    key: "phase:First Quarter",
    family: "phase",
    title: "A first-quarter crossing",
    body: "The Moon stood at her first square to the Sun — the moment of effort and turning in the lunar month. A crossing here carries the quality of a threshold met with force, light and dark in equal measure. The tradition marks the quarter as crisis in its old sense: not catastrophe but decision, a hinge on which the cycle swings.",
    source: "Traditional lunation doctrine (the quarter as crisis-point)",
    applies: "moment",
  },
  {
    key: "phase:Waxing Gibbous",
    family: "phase",
    title: "A waxing-gibbous crossing",
    body: "The Moon was nearly full, the light all but complete, when the soul crossed. There is a ripeness to this passing — a life releasing just short of, or into, its own fullness, the sky brimming toward the whole. The tradition reads the gibbous Moon as anticipation fulfilled.",
    source: "Traditional lunation doctrine; Valens on the Moon approaching the full",
    applies: "moment",
  },
  {
    key: "phase:Full Moon",
    family: "phase",
    title: "A full-Moon crossing",
    body: "The soul crossed under a full Moon — the lights in opposition, the whole face of the vessel lit and visible. This is the most illuminated of passings: nothing hidden, the life shown entire at the moment of its release. The tradition reads the opposition of the luminaries as culmination and full sight; the soul was seen completely as it went.",
    source: "Ptolemy, Tetrabiblos (the lights in opposition); Valens on the full Moon",
    applies: "moment",
  },
  {
    key: "phase:Waning Gibbous",
    family: "phase",
    title: "A waning-gibbous (disseminating) crossing",
    body: "The Moon had just passed full and begun to give her light back when the soul crossed. The tradition names this the disseminating phase — the time of scattering seed, of handing on what was gathered. A death here reads as a legacy already in motion: the soul crossed while still distributing its gifts to those it leaves.",
    source: "Traditional lunation doctrine (the disseminating Moon)",
    applies: "moment",
  },
  {
    key: "phase:Last Quarter",
    family: "phase",
    title: "A last-quarter crossing",
    body: "The Moon stood at her closing square — the reorienting turn of the cycle, light ebbing toward release. A crossing here carries the quality of a reckoning made and accepted, the month bending toward its rest. The tradition marks this quarter as the crisis of conscience, the letting-go that clears the ground.",
    source: "Traditional lunation doctrine (the closing quarter)",
    applies: "moment",
  },
  {
    key: "phase:Waning Crescent",
    family: "phase",
    title: "A balsamic (waning-crescent) crossing",
    body: "The soul crossed under the oldest Moon — the balsamic crescent, the last thin light before the dark. Of all phases the tradition reads this as the most consecrated to endings and to what is being released into rest. A death here has an air of completion and surrender, a cycle exhaling its final breath; the soul left as the old Moon does, quietly, making room.",
    source: "Traditional lunation doctrine (the balsamic Moon as release)",
    applies: "moment",
  },

  // ── Sect — the day/night condition of the whole chart. ──────────────────────
  {
    key: "sect:day",
    family: "sect",
    title: "A diurnal (day) crossing",
    body: "This is a day chart — the Sun above the horizon at the crossing. The tradition gives the day sect to the Sun, to Jupiter, and to Saturn, and reads a diurnal death as one met in the light, under the governance of the visible and the vital. The benefics of the day are stronger here; there is warmth in the sect itself.",
    source: "Ptolemy, Tetrabiblos; Valens on the diurnal sect",
    applies: "moment",
  },
  {
    key: "sect:night",
    family: "sect",
    title: "A nocturnal (night) crossing",
    body: "This is a night chart — the Sun below the horizon at the crossing. The tradition gives the night sect to the Moon, to Venus, and to Mars, and reads a nocturnal death as one met in the intimacy of darkness, under the governance of the body and the feeling nature. The Moon rules such a passing more fully; it is a crossing of the inner, not the outer, light.",
    source: "Ptolemy, Tetrabiblos; Valens on the nocturnal sect",
    applies: "moment",
  },

  // ── Dominant element across the bodies — the humoral cast of the whole. ──────
  {
    key: "element:Fire",
    family: "element",
    title: "A fire-dominant sky",
    body: "Fire predominates in this sky — the choleric temperament, hot and dry. The tradition reads a fiery chart as one of spirit and ascent; the crossing has energy and direction to it, a flame leaning upward even as it is released. This soul's passage was not damp or slow but bright.",
    source: "Traditional temperament doctrine (the choleric humor)",
    applies: "moment",
  },
  {
    key: "element:Earth",
    family: "element",
    title: "An earth-dominant sky",
    body: "Earth predominates in this sky — the melancholic temperament, cold and dry. The tradition reads an earthy chart as one of substance and gravity; the crossing is grounded, deliberate, close to the body and the real. This was a passage of weight settling, not vapor rising.",
    source: "Traditional temperament doctrine (the melancholic humor)",
    applies: "moment",
  },
  {
    key: "element:Air",
    family: "element",
    title: "An air-dominant sky",
    body: "Air predominates in this sky — the sanguine temperament, hot and moist. The tradition reads an airy chart as one of mind and relation; the crossing has lightness and connection to it, a soul dispersing into the wider currents rather than sinking. This was a passage of breath, not of stone.",
    source: "Traditional temperament doctrine (the sanguine humor)",
    applies: "moment",
  },
  {
    key: "element:Water",
    family: "element",
    title: "A water-dominant sky",
    body: "Water predominates in this sky — the phlegmatic temperament, cold and moist. The tradition reads a watery chart as one of feeling and dissolution; the crossing is fluid and merciful, a soul returning to the element that first cradled it. This was a passage like tide, soft-edged and yielding.",
    source: "Traditional temperament doctrine (the phlegmatic humor)",
    applies: "moment",
  },

  // ── Chart shape (Jones patterns) — the gestalt of the whole sky. ────────────
  {
    key: "shape:Bundle",
    family: "shape",
    title: "A bundle chart",
    body: "The bodies are gathered into a narrow span — a bundle, the most concentrated of chart shapes. The whole sky speaks with one voice here; the crossing was focused, undistracted, the soul's attention drawn to a single quarter of experience. Nothing is scattered. This life met its end gathered in.",
    source: "M. E. Jones, chart-pattern doctrine (public-domain typology)",
    applies: "moment",
  },
  {
    key: "shape:Bowl",
    family: "shape",
    title: "A bowl chart",
    body: "The bodies fill one half of the sky — a bowl, holding its contents against the empty rim. The tradition reads the bowl as self-contained and seeking: a soul that carried its own vessel and reached, across the open space, for what it lacked. The crossing has this quality of a cup being lifted and, at last, emptied.",
    source: "M. E. Jones, chart-pattern doctrine (public-domain typology)",
    applies: "moment",
  },
  {
    key: "shape:Locomotive",
    family: "shape",
    title: "A locomotive chart",
    body: "The bodies occupy two-thirds of the sky with one open third — a locomotive, driven by the planet leading into the empty space. There is momentum and self-propulsion in this shape; the soul crossed under its own motive power, pulling its whole life behind it toward the gap it was always heading for.",
    source: "M. E. Jones, chart-pattern doctrine (public-domain typology)",
    applies: "moment",
  },
  {
    key: "shape:Seesaw",
    family: "shape",
    title: "A seesaw chart",
    body: "The bodies gather into two opposed groups — a seesaw, life lived between two poles. The tradition reads this shape as a soul that held tension, that knew both sides of things and was never wholly at one end. The crossing is a final balancing of the two weights that this life carried in its hands.",
    source: "M. E. Jones, chart-pattern doctrine (public-domain typology)",
    applies: "moment",
  },
  {
    key: "shape:Splash",
    family: "shape",
    title: "A splash chart",
    body: "The bodies scatter widely across the sky — a splash, touching many houses and signs. The tradition reads this as breadth: a soul with a hand in many things, diffuse and various. The crossing gathers all those scattered points home at once, a whole spread-out life drawn together in the single moment of release.",
    source: "M. E. Jones, chart-pattern doctrine (public-domain typology)",
    applies: "moment",
  },
  {
    key: "shape:Splay",
    family: "shape",
    title: "A splay chart",
    body: "The bodies clump in irregular groups with their own emphatic angles — a splay, individual and unruled by symmetry. The tradition reads this as a soul strongly its own shape, resisting easy pattern. The crossing bears that same signature: particular, unrepeatable, exactly the shape of this one life and no other.",
    source: "M. E. Jones, chart-pattern doctrine (public-domain typology)",
    applies: "moment",
  },

  // ── The mortal significators — the bodies the tradition weighs in a death
  //    chart. Read as MEANING and guardianship, never as cause. ───────────────
  {
    key: "significator:Saturn",
    family: "significator",
    title: "Saturn present as a significator",
    body: "Saturn stands among the significators of this crossing — the Greater Malefic in the old books, but truer here as the keeper of time and endings, the elder at the threshold. Where Saturn presides, a passing carries structure, patience, and the dignity of a thing completed in its proper season. It is the planet of the last boundary, and it holds the gate not to punish but to close what is finished.",
    source: "Lilly CA p.57 (Saturn's nature); Valens on Kronos as significator of endings",
    applies: "both",
  },
  {
    key: "significator:Mars",
    family: "significator",
    title: "Mars present as a significator",
    body: "Mars stands among the significators of this crossing — the Lesser Malefic, quick and sharp where Saturn is slow. Its testimony reads as suddenness, force, or a decisive severing rather than a gradual ebb. Held in a death chart, Mars is the blade that cuts the cord cleanly; there can be a mercy in its swiftness, an end that did not linger.",
    source: "Lilly CA p.60 (Mars's nature); Dorotheus on the martial significator",
    applies: "both",
  },
  {
    key: "significator:Moon",
    family: "significator",
    title: "The Moon present as a significator",
    body: "The Moon herself stands among the significators of this crossing — the body, the physical vessel, and its final condition. Where the Moon is central, the passage is bound up with the flesh and the feeling nature: how the vessel was held, how it was tended, how it was at last released. She is the nearest of the lights to us, and the tenderest witness to a death.",
    source: "Ptolemy, Tetrabiblos (the Moon as significator of the body); Lilly CA p.63",
    applies: "both",
  },
  {
    key: "significator:Sun",
    family: "significator",
    title: "The Sun present as a significator",
    body: "The Sun stands among the significators of this crossing — the vital spirit, the life-force itself. Where the Sun is central, the reading turns on the flame of the life: its brightness, its warmth, the way the light was carried and finally set down. The tradition reads the Sun as the heart's fire; its testimony here is of vitality honored, not of vitality failed.",
    source: "Ptolemy, Tetrabiblos (the Sun as significator of the spirit); Valens",
    applies: "both",
  },
  {
    key: "significator:Pluto",
    family: "significator",
    title: "Pluto present as a significator",
    body: "Pluto stands among the significators of this crossing — the modern keeper of death and irrevocable transformation, the deep tide beneath the visible chart. Where Pluto is present, the passage reads as a true metamorphosis rather than a mere stopping: something ended so wholly that it could only become something else. It is the planet of what cannot be undone, and of what is reborn on the far side of the undoing.",
    source: "Modern significator doctrine (Pluto, death and rebirth); cf. the traditional 8th",
    applies: "both",
  },
  {
    key: "significator:Nodes",
    family: "significator",
    title: "The lunar Nodes — the karmic axis",
    body: "The Nodes of the Moon thread this chart — the South Node the tail, holding what is habitual and already carried; the North Node the head, marking where the soul was turning. In a death chart the axis reads as a laying-down and a leaning-toward at once: the South Node the weight set at the gate, the familiar released; the North Node the direction the soul faced as it crossed. The tradition treats the nodal axis as the line of fate the life was travelling.",
    source: "Valens on the nodes; traditional and evolutionary nodal doctrine",
    applies: "both",
  },

  // ── The death-house complex — the 8th, 4th, and 12th, read thematically. ─────
  {
    key: "house:8",
    family: "house",
    title: "The 8th house — death, transformation, the shared and surrendered",
    body: "The 8th is the house the tradition names for death itself, and for all that is shared, surrendered, and transformed. Its ruler and its tenants describe the character of the passage: whether the crossing was held in intimacy or in solitude, what was given over, what the soul carried into the depths. This is the gate proper; the condition of its lord is the condition of the threshold.",
    source: "Lilly CA p.653 (the 8th house and its lord); Dorotheus III",
    applies: "moment",
  },
  {
    key: "house:4",
    family: "house",
    title: "The 4th house — the end of the matter, the grave, the roots",
    body: "The 4th is the foundation of the chart and, in the old doctrine, the end of all matters — the grave, the resting place, the return to the roots. Its ruler speaks to where and how a life comes to rest, to the closure at the base of things, to the ground that receives what the sky releases. The angle of the deepest midnight, it is the house of final belonging.",
    source: "Lilly CA (the 4th as terminus of the matter); traditional angular doctrine",
    applies: "moment",
  },
  {
    key: "house:12",
    family: "house",
    title: "The 12th house — undoing, the hidden, sorrow and release",
    body: "The 12th is the house of the hidden and the dissolving — of confinement, of sorrow, and of what is quietly undone before the end. Its ruler and tenants describe the unseen approaches to the threshold: the private griefs, the withdrawals, the mercy that gathers in the dark. It is the last house before the Ascendant, the night before the dawn the soul will not see here.",
    source: "Lilly CA (the 12th house of self-undoing and sorrow); Valens on the cadent",
    applies: "moment",
  },

  // ── The Lots — the calculated points of the tradition. ──────────────────────
  {
    key: "lot:Part of Fortune",
    family: "lot",
    title: "The Part of Fortune",
    body: "The Part of Fortune marks where the body's own daimon of well-being falls — the point the tradition reads as fortune, health, and the lot of the incarnate life. In a death chart its sign and house describe where this soul's earthly good was seated, and so what is released at the crossing: the particular blessing the body was, now returned to the sky it was drawn from.",
    source: "Valens, Anthologies II (the Lot of Fortune); Paulus Alexandrinus",
    applies: "both",
  },
  {
    key: "lot:Lot of Death",
    family: "lot",
    title: "The Lot of Death",
    body: "The tradition computes a Lot of Death — from the Ascendant and the 8th cusp to the Moon in one lineage, from Saturn in another — as the calculated seat of the matter of ending. It is never read as a date or a cause, only as a place the theme of mortality is anchored in the chart's own geometry. Where its lord is strong or gentle, the theme it marks is strong or gentle likewise.",
    source: "Dorotheus of Sidon; Bonatti (the Lot of Death); Paulus on the hyleg lots",
    applies: "both",
  },

  // ── Death-salient fixed stars — read only when the engine flags a contact. ──
  {
    key: "star:Algol",
    family: "star",
    title: "Algol — the most weighted of the mortal stars",
    body: "Algol, the Demon's Head in Perseus, is the star the tradition weighs most heavily in matters of death and severance. A contact with it is intense and unflinching; the old books tie it to loss of the head, to overwhelming force. Read with great care and greater tenderness: in a chart already of death it need not be doubled into alarm, but honored as the tradition's mark of a passage that carried real weight.",
    source: "Ptolemy, Tetrabiblos (fixed-star natures); Robson on Algol (traditional)",
    applies: "both",
  },
  {
    key: "star:Antares",
    family: "star",
    title: "Antares — the Scorpion's Heart",
    body: "Antares, the red heart of the Scorpion and one of the four Royal Stars, burns with a martial, all-or-nothing intensity. The tradition reads it as courage and extremity, a star of those who live and leave at full pitch. In a death chart its contact marks a crossing met without flinching, the heart still blazing at the end.",
    source: "Ptolemy, Tetrabiblos; the Royal Stars of Persia (traditional)",
    applies: "both",
  },
  {
    key: "star:Aldebaran",
    family: "star",
    title: "Aldebaran — the Bull's Eye, Royal Star of the East",
    body: "Aldebaran, the watcher of the eastern sky, is a star of integrity and honor won through trial. The tradition reads it as eminence that must be kept clean to endure. Its contact in a death chart lends a note of dignity and hard-earned uprightness to the crossing — a life measured and found honest at the last.",
    source: "The four Royal Stars (traditional); Ptolemy on the Hyades region",
    applies: "both",
  },
  {
    key: "star:Regulus",
    family: "star",
    title: "Regulus — the Lion's Heart, Royal Star of the North",
    body: "Regulus, the little king, is the most regal of the Royal Stars — a mark of sovereignty, courage, and rank. The tradition warns its heights are conditional, kept only by nobility of conduct. Its contact lends a death chart a kingly bearing: a soul that carried something of the throne about it, crossing with its crown intact.",
    source: "The four Royal Stars (traditional); Ptolemy on Regulus",
    applies: "both",
  },
  {
    key: "star:Spica",
    family: "star",
    title: "Spica — the fortunate ear of wheat",
    body: "Spica, the brightest star of the Virgin, is the most benevolent of the fixed stars in the old doctrine — a mark of grace, gift, and unearned blessing. Its contact in a death chart is a note of pure tenderness: a soul touched by something fortunate and protected, crossing under a kindly light. Where the reading is heavy, Spica is mercy.",
    source: "Ptolemy, Tetrabiblos (Spica as most fortunate); traditional stellar doctrine",
    applies: "both",
  },
  {
    key: "star:Sirius",
    family: "star",
    title: "Sirius — the brightest of the fixed stars",
    body: "Sirius, the Dog Star and the brightest in the sky, is a star of ardor, renown, and the sacred in the old traditions — the star the Egyptians tied to the rising of the life-giving flood. Its contact lends a death chart brilliance and consecration: a crossing marked by a light larger than the ordinary, a soul touched by something luminous.",
    source: "Ptolemy, Tetrabiblos; the heliacal rising of Sirius (traditional)",
    applies: "both",
  },
  {
    key: "star:Fomalhaut",
    family: "star",
    title: "Fomalhaut — the Fish's Mouth, Royal Star of the South",
    body: "Fomalhaut, the southern Royal Star, is tied to the mystical and the ideal — a star of aspiration toward something pure, with the tradition's caution that it may be raised or ruined by what the soul does with its longing. Its contact in a death chart lends a note of the visionary and the otherworldly to the crossing, a soul reaching toward the far and the high.",
    source: "The four Royal Stars (traditional); stellar doctrine on Fomalhaut",
    applies: "both",
  },
  {
    key: "star:Vega",
    family: "star",
    title: "Vega — the falling eagle / the lyre",
    body: "Vega, the bright star of the Lyre, carries in the tradition the note of art, refinement, and a charmed grace. Its contact lends a death chart a lyrical quality — a crossing with music in it, a soul whose passage keeps some of the beauty it made or loved in life.",
    source: "Ptolemy, Tetrabiblos; traditional doctrine on the Lyre",
    applies: "both",
  },
  {
    key: "star:Betelgeuse",
    family: "star",
    title: "Betelgeuse — the Giant's shoulder",
    body: "Betelgeuse, the great red shoulder of Orion, is read in the tradition as a mark of success and martial honor, strength carried on a large frame. Its contact lends a death chart a note of stature and of a life largely lived — a soul of some magnitude crossing the threshold.",
    source: "Ptolemy, Tetrabiblos (Orion region); traditional stellar doctrine",
    applies: "both",
  },
  {
    key: "star:Rigel",
    family: "star",
    title: "Rigel — the Giant's bright foot",
    body: "Rigel, the brilliant blue foot of Orion, is read as a star of instruction, guidance, and honor achieved through skill. Its contact lends a death chart a note of a life that lit the way for others — a soul of capability and steadiness, crossing with something taught or built left behind it.",
    source: "Ptolemy, Tetrabiblos (Orion region); traditional stellar doctrine",
    applies: "both",
  },
  {
    key: "star:Capella",
    family: "star",
    title: "Capella — the little she-goat",
    body: "Capella, the bright star of the Charioteer, carries in the tradition a note of curiosity, care, and a certain restless inquisitiveness. Its contact lends a death chart the quality of a questioning, tender mind — a soul that wanted to know and to nurture, crossing with its questions gentled at last.",
    source: "Ptolemy, Tetrabiblos; traditional doctrine on Capella",
    applies: "both",
  },
  {
    key: "star:Arcturus",
    family: "star",
    title: "Arcturus — the guardian of the Bear",
    body: "Arcturus, the bright orange watcher of the north, is read in the tradition as a star of protection, guidance, and prosperity won through a different path than the crowd's. Its contact lends a death chart a guardian's note — a soul that watched over others, or was itself watched over, crossing under a steady and protective light.",
    source: "Traditional stellar doctrine on Arcturus; Ptolemy on the Boötes region",
    applies: "both",
  },

  // ── The Sun by sign — the vital spirit and life-force, the flame set down. ───
  {
    key: "sun:Aries",
    family: "sun",
    title: "Sun in Aries (exalted)",
    body: "The Sun is exalted in Aries — the vital flame burned at its brightest and most forward here. This was a spirit of beginnings and courage, and its light is set down undimmed rather than guttered out. The tradition reads the exalted Sun as vitality honored to the last.",
    source: "Ptolemy, Tetrabiblos I.19 (exaltation of the Sun)",
    applies: "both",
  },
  {
    key: "sun:Taurus",
    family: "sun",
    title: "Sun in Taurus",
    body: "A Taurus Sun carried a steady, enduring life-force, warm and close to the earth. The vital flame here was patient and deep-rooted; its setting has the quality of a long, sustaining fire banked at last, its warmth lingering after the light.",
    source: "Firmicus Maternus, Mathesis; traditional solar doctrine",
    applies: "both",
  },
  {
    key: "sun:Gemini",
    family: "sun",
    title: "Sun in Gemini",
    body: "A Gemini Sun lit a quick, various, communicative life. The vital spirit was many-sided and curious; its setting is less an extinguishing than a scattering of sparks — a light that lived in exchange and lives on in what was said and shared.",
    source: "Traditional solar doctrine (the double-bodied signs)",
    applies: "both",
  },
  {
    key: "sun:Cancer",
    family: "sun",
    title: "Sun in Cancer",
    body: "A Cancer Sun sheltered its flame — a life-force tender, protective, and tidal in its warmth. The vital spirit here belonged to home and to those it held; its setting is a hearth-fire drawn down to embers, still radiating the care it kept.",
    source: "Traditional solar doctrine; the Moon's sign holding the Sun",
    applies: "both",
  },
  {
    key: "sun:Leo",
    family: "sun",
    title: "Sun in Leo (domicile)",
    body: "The Sun rules Leo — the vital spirit was entirely at home, radiant and sovereign. This was a life lit from its own center, generous with its heat. Its setting keeps that dignity fully: the tradition reads the domiciled Sun as a flame that was purely, natively itself, and sets like a king rather than fades like a candle.",
    source: "Ptolemy, Tetrabiblos I.17 (domicile of the Sun); Lilly CA",
    applies: "both",
  },
  {
    key: "sun:Virgo",
    family: "sun",
    title: "Sun in Virgo",
    body: "A Virgo Sun burned with a careful, useful light — a life-force given to service, craft, and quiet exactitude. The vital spirit here asked to be of use; its setting is the lamp put out over finished work, the ledger closed and clean.",
    source: "Firmicus Maternus, Mathesis; traditional solar doctrine",
    applies: "both",
  },
  {
    key: "sun:Libra",
    family: "sun",
    title: "Sun in Libra (fall)",
    body: "The Sun is in its fall in Libra — the vital flame lived turned toward others, its warmth measured in relationship rather than in self. The tradition marks the fall as the softening of the day into evening; there is grace, not failure, in a light that dimmed because it gave itself to the balance of other lives.",
    source: "Ptolemy, Tetrabiblos I.19 (fall of the Sun in Libra)",
    applies: "both",
  },
  {
    key: "sun:Scorpio",
    family: "sun",
    title: "Sun in Scorpio",
    body: "A Scorpio Sun burned deep and unsparing — a vital spirit acquainted with intensity and the hidden. The flame here knew its own shadow and did not flinch from it; its setting is a descent it was always prepared to make, a light that went willingly into the depth.",
    source: "Traditional solar doctrine (the Sun in the martial water)",
    applies: "both",
  },
  {
    key: "sun:Sagittarius",
    family: "sun",
    title: "Sun in Sagittarius",
    body: "A Sagittarius Sun lit a life aimed at meaning and horizon — a vital spirit of faith, breadth, and the far view. Its setting is an expansion rather than a loss: the flame did not shrink at the end but leaned outward, toward the distance it always sought.",
    source: "Traditional solar doctrine (Jupiter's fiery sign)",
    applies: "both",
  },
  {
    key: "sun:Capricorn",
    family: "sun",
    title: "Sun in Capricorn",
    body: "A Capricorn Sun carried its flame with gravity and endurance — a life-force that climbed, bore weight, and asked little ease. The vital spirit here was disciplined and long-purposed; its setting has the composure of a summit reached, the long ascent complete and the light laid down with dignity.",
    source: "Traditional solar doctrine (the Sun in Saturn's sign)",
    applies: "both",
  },
  {
    key: "sun:Aquarius",
    family: "sun",
    title: "Sun in Aquarius",
    body: "An Aquarius Sun burned for something larger than itself — a vital spirit of cool clarity and wide belonging. The flame here served the many; its setting reads as a light rejoining the whole it always felt part of, impersonal and at peace.",
    source: "Traditional solar doctrine (the Sun in Saturn's airy sign)",
    applies: "both",
  },
  {
    key: "sun:Pisces",
    family: "sun",
    title: "Sun in Pisces",
    body: "A Pisces Sun lit a porous, merciful life — a vital spirit easily moved to compassion and dissolution. The flame here was gentle-edged, always half-merged with the feeling of the world; its setting is the softest, a light dissolving into the water that receives it with no seam between.",
    source: "Traditional solar doctrine (the Sun in Jupiter's water)",
    applies: "both",
  },

  // ── Dominant modality — the modal cast of the whole sky. ─────────────────────
  {
    key: "modality:Cardinal",
    family: "modality",
    title: "A cardinal-dominant sky",
    body: "Cardinal signs predominate — the modality of initiation and the turning of seasons. The tradition reads a cardinal emphasis as decisiveness and movement; the crossing has the quality of a threshold met head-on, a season changing rather than a stillness. This was a soul that acted, and its passage keeps that forward motion.",
    source: "Traditional modal doctrine (the cardinal/movable signs)",
    applies: "moment",
  },
  {
    key: "modality:Fixed",
    family: "modality",
    title: "A fixed-dominant sky",
    body: "Fixed signs predominate — the modality of steadfastness and depth. The tradition reads a fixed emphasis as endurance and rootedness; the crossing has the quality of something long-held finally, deliberately released. This was a soul of persistence, and its passage is a deep anchor at last drawn up.",
    source: "Traditional modal doctrine (the fixed signs)",
    applies: "moment",
  },
  {
    key: "modality:Mutable",
    family: "modality",
    title: "A mutable-dominant sky",
    body: "Mutable signs predominate — the modality of adaptation and transition. The tradition reads a mutable emphasis as flexibility and the between; the crossing has the quality of a graceful yielding, a soul practiced at change meeting the last change of all. This was a life of thresholds, ending on one more.",
    source: "Traditional modal doctrine (the mutable/common signs)",
    applies: "moment",
  },

  // ── Planetary condition (dignity) — how well or ill a body sits, read as the
  //    condition of what it signifies. Applied by the composer to the flagged
  //    planet named in the chart frame. ────────────────────────────────────────
  {
    key: "dignity:domicile",
    family: "dignity",
    title: "A significator in its own domicile",
    body: "A key body sits in its own domicile — at home, in full possession of its nature. The tradition reads domicile as strength freely exercised: whatever this planet signifies in the crossing, it does so cleanly, natively, without strain. A dignified significator is a guardian acting from its own house, not a stranger's.",
    source: "Ptolemy, Tetrabiblos I.17; Lilly CA on essential dignity",
    applies: "both",
  },
  {
    key: "dignity:exaltation",
    family: "dignity",
    title: "A significator exalted",
    body: "A key body sits exalted — raised, honored, at its most gracious. The tradition reads exaltation as dignity conferred: what this planet signifies is lifted and made noble. In a death chart an exalted significator lends the passage an elevated, well-received quality, as of a guest given the high seat.",
    source: "Ptolemy, Tetrabiblos I.19; Lilly CA on exaltation",
    applies: "both",
  },
  {
    key: "dignity:detriment",
    family: "dignity",
    title: "A significator in detriment",
    body: "A key body sits in detriment — in the sign opposite its home, working against its own grain. The tradition reads detriment as difficulty and strain, but in a death chart it need not be doubled into alarm: it marks a significator that labored, that carried its meaning uphill. Read it as effort and endurance, tenderly, not as fault.",
    source: "Lilly CA on detriment; traditional dignity doctrine",
    applies: "both",
  },
  {
    key: "dignity:fall",
    family: "dignity",
    title: "A significator in fall",
    body: "A key body sits in its fall — lowered, out of its honor. The tradition names this weakness, yet in a chart of endings the fall often reads truer as depth or humility: a significator brought low, close to the ground, intimate with limitation. Honor it as a hard place met, not as a verdict against the soul.",
    source: "Ptolemy, Tetrabiblos I.19; Lilly CA on fall",
    applies: "both",
  },
  {
    key: "dignity:peregrine",
    family: "dignity",
    title: "A significator peregrine",
    body: "A key body is peregrine — wandering, in no dignity of its own, a stranger in the sign it occupies. The tradition reads the peregrine planet as unsettled, without a home to act from. In a death chart it can lend a note of the soul between places, unanchored at the threshold — read gently, as a wanderer being received rather than a fault to name.",
    source: "Lilly CA on the peregrine planet; traditional dignity doctrine",
    applies: "both",
  },

  // ── Hard contacts from the malefics — read only when the engine flags one. ───
  {
    key: "aspect:Saturn-hard",
    family: "aspect",
    title: "A hard Saturn contact",
    body: "Saturn holds a hard contact (conjunction, square, or opposition) to a luminary or angle in this sky — the elder pressing on the light. The tradition reads the hard Saturn as weight, delay, and finality. In a death chart it marks a passage carrying gravity and endurance, a threshold closed firmly; read it as the keeper of endings doing its office, never as blame.",
    source: "Lilly CA p.57 (Saturn's aspects); traditional aspect doctrine",
    applies: "both",
  },
  {
    key: "aspect:Mars-hard",
    family: "aspect",
    title: "A hard Mars contact",
    body: "Mars holds a hard contact to a luminary or angle in this sky — the blade near the light. The tradition reads the hard Mars as sharpness, suddenness, or force. In a death chart it can mark a swift or decisive severing; there is often mercy in that swiftness, an ending that did not linger. Read the heat as intensity, never as violence asserted.",
    source: "Lilly CA p.60 (Mars's aspects); Dorotheus on martial contacts",
    applies: "both",
  },
  {
    key: "aspect:Pluto-hard",
    family: "aspect",
    title: "A hard Pluto contact",
    body: "Pluto holds a hard contact to a luminary or angle in this sky — the deep tide pulling at the light. The modern tradition reads the hard Pluto as irrevocable transformation, a pressure that ends one thing so wholly it can only become another. In a death chart it marks a true metamorphosis at the threshold, the crossing as deep change rather than mere cessation.",
    source: "Modern aspect doctrine (Pluto's hard contacts); cf. the traditional 8th",
    applies: "both",
  },
  {
    key: "aspect:Jupiter-soft",
    family: "aspect",
    title: "A soft Jupiter contact",
    body: "Jupiter holds a soft contact (trine or sextile) to a luminary in this sky — the Greater Benefic blessing the light. The tradition reads a kindly Jupiter as grace, protection, and faith. In a death chart it is a note of mercy laid across the crossing: whatever else the chart carries, something generous attends this passage, an easing hand at the gate.",
    source: "Lilly CA p.62 (Jupiter's benevolent aspects); traditional aspect doctrine",
    applies: "both",
  },
  {
    key: "aspect:Venus-soft",
    family: "aspect",
    title: "A soft Venus contact",
    body: "Venus holds a soft contact (trine or sextile) to a luminary in this sky — the Lesser Benefic gentling the light. The tradition reads a kindly Venus as love, beauty, and reconciliation. In a death chart it softens the whole: a crossing touched by tenderness, by what was loved and what loved in return, the harshness taken out of the passage.",
    source: "Lilly CA p.64 (Venus's benevolent aspects); traditional aspect doctrine",
    applies: "both",
  },

  // ── The Ruling Hand — the governor of the chart (ruler of the Ascendant or
  //    almuten of its degree), read as the hand that guided the passage. ───────
  {
    key: "ruler:Sun",
    family: "ruler",
    title: "The Sun governs the crossing",
    body: "The Sun rules this sky — the vital, sovereign hand guiding the passage. Where the Sun governs, the crossing is lit from a center: a life led by its own authority and warmth, and released the same way. The guiding hand here is the one that shone, and its office at the gate is to carry the soul out in its own light rather than into a stranger's dark.",
    source: "Lilly CA (the lord of the Ascendant); traditional charts of the geniture",
    applies: "both",
  },
  {
    key: "ruler:Moon",
    family: "ruler",
    title: "The Moon governs the crossing",
    body: "The Moon rules this sky — the tender, tidal hand guiding the passage. Where the Moon governs, the crossing is close to the body and the feeling nature: a life led by instinct and care, and released into a homecoming rather than an exile. The guiding hand here is the nearest and the softest of the lights.",
    source: "Lilly CA (the lord of the Ascendant); the Moon as guide of the nativity",
    applies: "both",
  },
  {
    key: "ruler:Mercury",
    family: "ruler",
    title: "Mercury governs the crossing",
    body: "Mercury rules this sky — the messenger's hand guiding the passage. Where Mercury governs, the crossing has the quality of a translation, a threshold crossed as a word is carried from one tongue to another. The guiding hand here is quick and mediating, the psychopomp who walks the soul between the worlds.",
    source: "Lilly CA (the lord of the Ascendant); Mercury as guide and messenger",
    applies: "both",
  },
  {
    key: "ruler:Venus",
    family: "ruler",
    title: "Venus governs the crossing",
    body: "Venus rules this sky — the gentle, reconciling hand guiding the passage. Where Venus governs, the crossing is smoothed by love and beauty: a life led by connection and grace, and released with tenderness. The guiding hand here is the one that softens, that takes the harshness out of the threshold and makes it kind.",
    source: "Lilly CA (the lord of the Ascendant); Venus as the benefic guide",
    applies: "both",
  },
  {
    key: "ruler:Mars",
    family: "ruler",
    title: "Mars governs the crossing",
    body: "Mars rules this sky — the decisive, severing hand guiding the passage. Where Mars governs, the crossing has directness and courage to it: a life led by will and force, and released cleanly rather than by slow ebb. The guiding hand here is the one that cuts the cord without trembling, and there is often mercy in that decisiveness.",
    source: "Lilly CA (the lord of the Ascendant); Mars as the martial guide",
    applies: "both",
  },
  {
    key: "ruler:Jupiter",
    family: "ruler",
    title: "Jupiter governs the crossing",
    body: "Jupiter rules this sky — the generous, faithful hand guiding the passage. Where Jupiter governs, the crossing widens rather than narrows: a life led by meaning and largeness of spirit, and released into openness and trust. The guiding hand here is the one that blesses, that meets the gate with faith instead of fear.",
    source: "Lilly CA (the lord of the Ascendant); Jupiter as the greater benefic guide",
    applies: "both",
  },
  {
    key: "ruler:Saturn",
    family: "ruler",
    title: "Saturn governs the crossing",
    body: "Saturn rules this sky — the elder's steady hand guiding the passage. Where Saturn governs, the crossing carries structure and gravity: a life led by endurance and duty, and released in its proper season, nothing unfinished. The guiding hand here is the keeper of thresholds himself, closing what is complete with patience rather than haste.",
    source: "Lilly CA (the lord of the Ascendant); Saturn as the keeper of endings",
    applies: "both",
  },

  // ── Aspect patterns — the multi-body configurations, read as living form. ────
  {
    key: "pattern:Stellium",
    family: "pattern",
    title: "A stellium",
    body: "Three or more bodies gather in a single sign — a stellium, a great concentration of the chart's attention in one place. The tradition reads such a massing as a single powerful theme the whole life turned around. In a death chart it marks a crossing gathered to a point: much of the soul's weight collected in one sign, one voice speaking loudly at the gate.",
    source: "Robert Hand, Horoscope Symbols (configurations); traditional emphasis doctrine",
    applies: "moment",
  },
  {
    key: "pattern:T-Square",
    family: "pattern",
    title: "A T-square",
    body: "Two bodies in opposition both square a third at the apex — a T-square, the configuration of tension seeking release. The tradition reads it as a drive that must resolve through the apex planet. In a death chart it marks a life that carried real friction, and a crossing that reads as the long-held tension finally, fully let go.",
    source: "Robert Hand, Horoscope Symbols (the T-square); traditional aspect doctrine",
    applies: "moment",
  },
  {
    key: "pattern:Grand Trine",
    family: "pattern",
    title: "A grand trine",
    body: "Three bodies form a closed triangle of trines — a grand trine, a self-contained circuit of ease. The tradition reads it as grace that flows without effort, a gift the life was given. In a death chart it lends the crossing a note of flow and blessing: a passage that moved easily, a soul carried through on a current of its own grace.",
    source: "Robert Hand, Horoscope Symbols (the grand trine); traditional aspect doctrine",
    applies: "moment",
  },
  {
    key: "pattern:Yod",
    family: "pattern",
    title: "A yod (finger of fate)",
    body: "Two bodies in sextile both quincunx a third — a yod, the 'finger of fate' pointing to the apex. The tradition reads it as a sense of appointment, a life bent toward something it was called to. In a death chart it lends the crossing a note of the fated and the meant: a passage that carries the feeling of a purpose reaching its appointed end.",
    source: "Robert Hand, Horoscope Symbols (the yod); traditional aspect doctrine",
    applies: "moment",
  },

  // ── Significators tenanting the death houses — the most direct death testimony
  //    the chart offers. A body IN the 8th/4th/12th, read as meaning. ──────────
  {
    key: "occupant:8:Saturn",
    family: "occupant",
    title: "Saturn in the 8th house",
    body: "Saturn tenants the house of death itself — the elder keeping his own gate. The tradition could hardly place the keeper of endings more pointedly: a crossing held with gravity and structure, a threshold that was long-prepared and met in its proper season. Read it as a passage overseen by patience, nothing hurried, nothing unfinished — the door closed by the one whose office is to close it.",
    source: "Lilly CA p.653 (Saturn and the 8th); Dorotheus III",
    applies: "moment",
  },
  {
    key: "occupant:8:Mars",
    family: "occupant",
    title: "Mars in the 8th house",
    body: "Mars tenants the house of death — the blade set in the very room of the crossing. The tradition reads this as suddenness or decisiveness at the threshold, a cord cut rather than slowly unwound. There is often a mercy in that swiftness; read the heat as the sharpness of a clean severing, never as violence asserted.",
    source: "Lilly CA (Mars and the 8th); Dorotheus on the martial 8th",
    applies: "moment",
  },
  {
    key: "occupant:8:Pluto",
    family: "occupant",
    title: "Pluto in the 8th house",
    body: "Pluto tenants the house of death — the deep in its own domain, doubled. The modern tradition reads this as the most thorough of crossings: a transformation so complete it could only be a true metamorphosis, the soul remade in the passage rather than merely stopped. Where Pluto keeps the 8th, the threshold is total, and what lies beyond it is genuinely other.",
    source: "Modern doctrine (Pluto's rulership of the 8th / Scorpio); cf. the traditional 8th",
    applies: "moment",
  },
  {
    key: "occupant:8:Moon",
    family: "occupant",
    title: "The Moon in the 8th house",
    body: "The Moon tenants the house of death — the vessel itself standing in the room of surrender. This is among the tenderest of placements for a crossing: the body given wholly over, held in the house of what is shared and released. Read it as a passage of complete surrender, the physical vessel laid down in the very place the tradition keeps for the giving-up of all things.",
    source: "Lilly CA (the Moon and the 8th); the Moon as the body / vessel",
    applies: "moment",
  },
  {
    key: "occupant:8:Sun",
    family: "occupant",
    title: "The Sun in the 8th house",
    body: "The Sun tenants the house of death — the vital flame carried directly into the room of transformation. The tradition reads the life-light in the 8th as a spirit meeting its crossing face-on, the very fire of the life brought into the house of its release. There is a stark, unhidden quality to this: the light did not fade behind a veil but entered the threshold shining.",
    source: "Lilly CA (the Sun and the 8th); the Sun as the vital spirit",
    applies: "moment",
  },
  {
    key: "occupant:8:Jupiter",
    family: "occupant",
    title: "Jupiter in the 8th house",
    body: "Jupiter, the Greater Benefic, tenants the house of death — grace set in the room of the crossing. The tradition reads a benefic in the 8th as a blessing upon the surrender: faith, protection, and largeness of spirit attending the threshold. Whatever else the chart carries, something generous keeps the gate here; the passage is met with trust rather than dread.",
    source: "Lilly CA (Jupiter and the 8th); the benefic in the house of death",
    applies: "moment",
  },
  {
    key: "occupant:8:Venus",
    family: "occupant",
    title: "Venus in the 8th house",
    body: "Venus, the Lesser Benefic, tenants the house of death — love set in the room of the crossing. The tradition reads Venus in the 8th as tenderness at the threshold: beauty, affection, and reconciliation attending the surrender. The harshness is taken out of the passage; what was loved, and what loved in return, stands with the soul at the gate.",
    source: "Lilly CA (Venus and the 8th); the benefic in the house of death",
    applies: "moment",
  },
  {
    key: "occupant:4:Saturn",
    family: "occupant",
    title: "Saturn in the 4th house",
    body: "Saturn tenants the foundation of the chart — the grave, the roots, the end of the matter. The tradition reads the keeper of endings at the base of the sky as a settling into rest with full dignity: the roots receiving what has ripened, the ground meeting the soul with the gravity of something completed. A passage that comes to rest deeply and properly, at the deepest point of the wheel.",
    source: "Lilly CA (the 4th as terminus; Saturn at the nadir)",
    applies: "moment",
  },
  {
    key: "occupant:4:Moon",
    family: "occupant",
    title: "The Moon in the 4th house",
    body: "The Moon tenants the foundation — the vessel come home to the deepest place in the chart. The tradition keeps the 4th for roots and final rest, and the Moon here reads as a homecoming: the body returning to the ground it was drawn from, cradled at the base of the sky. A tender coming-to-rest, the vessel set down where it most belongs.",
    source: "Lilly CA (the Moon and the 4th); the 4th as the place of rest",
    applies: "moment",
  },
  {
    key: "occupant:4:Sun",
    family: "occupant",
    title: "The Sun in the 4th house",
    body: "The Sun tenants the foundation — the light drawn down to its resting place at the base of the sky. The tradition reads the 4th as the midnight of the chart, and the Sun here as the hearth-fire banked for the night: the vital flame come to its ground, warm still but at rest. A passage that settles the light gently into the deep.",
    source: "Lilly CA (the Sun and the 4th); the nadir as the place of endings",
    applies: "moment",
  },
  {
    key: "occupant:4:Pluto",
    family: "occupant",
    title: "Pluto in the 4th house",
    body: "Pluto tenants the foundation — the deep tide reaching the very roots. The modern tradition reads Pluto at the nadir as a transformation of the ground itself: not merely a coming-to-rest but a remaking of the base, the roots themselves changed by the passage. A profound and final grounding, the soul settling into altered earth.",
    source: "Modern doctrine (Pluto at the IC); the 4th as the end of the matter",
    applies: "moment",
  },
  {
    key: "occupant:12:Saturn",
    family: "occupant",
    title: "Saturn in the 12th house",
    body: "Saturn tenants the house of the hidden — undoing, confinement, and quiet sorrow. The tradition reads the keeper of endings in the 12th as a withdrawn and structured ending: a passage approached through solitude, the soul drawing inward and away before the gate. A quiet closing, met in the private dark rather than the public light.",
    source: "Lilly CA (Saturn and the 12th of self-undoing and sorrow)",
    applies: "moment",
  },
  {
    key: "occupant:12:Moon",
    family: "occupant",
    title: "The Moon in the 12th house",
    body: "The Moon tenants the house of the hidden — the vessel dissolving into the unseen. The tradition keeps the 12th for what is quietly undone, and the Moon here reads as a merciful fading: the body loosening at the edges, the vessel passing behind the veil softly and without spectacle. A gentle, half-hidden release.",
    source: "Lilly CA (the Moon and the 12th); the cadent house of the hidden",
    applies: "moment",
  },
  {
    key: "occupant:12:Sun",
    family: "occupant",
    title: "The Sun in the 12th house",
    body: "The Sun tenants the house of the hidden — the light withdrawing behind the veil. The tradition reads the vital flame in the 12th as a private setting: the life-light passing out of sight before the threshold, a spirit that turned inward and away from the public day. A quiet, sheltered withdrawal of the light.",
    source: "Lilly CA (the Sun and the 12th); the house of the hidden and withdrawn",
    applies: "moment",
  },
  {
    key: "occupant:12:Mars",
    family: "occupant",
    title: "Mars in the 12th house",
    body: "Mars tenants the house of the hidden — force working unseen. The tradition reads the blade in the 12th as a struggle carried out of sight, an effort or sharpness hidden behind the veil before the end. Read it gently: a private labor, the soul's exertion in the dark, resolved where others could not follow.",
    source: "Lilly CA (Mars and the 12th); the cadent house of the hidden",
    applies: "moment",
  },

  // ── Luminary–malefic contacts — a malefic in hard aspect to a light, the
  //    single most weighted death testimony after the 8th itself. ─────────────
  {
    key: "pair:Saturn-Moon",
    family: "pair",
    title: "Saturn hard to the Moon",
    body: "Saturn stands in hard contact to the Moon — the keeper of endings pressing directly on the vessel of the body. The tradition weighs this contact heavily in charts of mortality: it reads as the physical vessel meeting its limit, the body brought to its boundary by time itself. Read it tenderly — as weight and completion carried by the flesh, a life fully borne to its edge — never as a cause named.",
    source: "Lilly CA (Saturn to the Moon); Ptolemy on the malefics and the lights",
    applies: "both",
  },
  {
    key: "pair:Saturn-Sun",
    family: "pair",
    title: "Saturn hard to the Sun",
    body: "Saturn stands in hard contact to the Sun — the elder pressing on the vital flame. The tradition reads this as the life-force meeting its structural limit, the light dimmed by the weight of time. In a death chart it marks a spirit that carried gravity to the end; read it as a flame set down in its season, the vitality brought to a dignified close, never as a verdict.",
    source: "Lilly CA (Saturn to the Sun); Ptolemy on the malefics and the lights",
    applies: "both",
  },
  {
    key: "pair:Mars-Moon",
    family: "pair",
    title: "Mars hard to the Moon",
    body: "Mars stands in hard contact to the Moon — the blade near the vessel of the body. The tradition reads this as sharpness or suddenness touching the physical vessel, a swift note in the passage rather than a slow ebb. There can be mercy in that quickness; read the heat as intensity and decisiveness, the cord cut cleanly, never as violence asserted.",
    source: "Lilly CA (Mars to the Moon); Dorotheus on the martial contacts",
    applies: "both",
  },
  {
    key: "pair:Mars-Sun",
    family: "pair",
    title: "Mars hard to the Sun",
    body: "Mars stands in hard contact to the Sun — fire meeting the vital flame. The tradition reads this as force or heat touching the life-spirit, a crossing with edge and immediacy to it. Read it as a spirit that burned hot and left decisively, the flame not guttering slowly but going with force — held gently, and never read as a manner of death.",
    source: "Lilly CA (Mars to the Sun); Ptolemy on the malefics and the lights",
    applies: "both",
  },
  {
    key: "pair:Pluto-Moon",
    family: "pair",
    title: "Pluto hard to the Moon",
    body: "Pluto stands in hard contact to the Moon — the deep tide pulling at the vessel of the body. The modern tradition reads this as the physical vessel undergoing total transformation, the body drawn into a change so complete it could only be metamorphosis. Read it as the deepest kind of surrender, the vessel remade rather than merely stopped.",
    source: "Modern doctrine (Pluto to the Moon); cf. the traditional 8th complex",
    applies: "both",
  },
  {
    key: "pair:Pluto-Sun",
    family: "pair",
    title: "Pluto hard to the Sun",
    body: "Pluto stands in hard contact to the Sun — the deep pulling at the vital flame. The modern tradition reads this as the life-spirit itself transformed, the light not extinguished but wholly changed. In a death chart it marks a crossing of profound metamorphosis at the very center of the life; read it as the soul's fire passing through the deep and becoming other.",
    source: "Modern doctrine (Pluto to the Sun); cf. the traditional 8th complex",
    applies: "both",
  },

  // ── Chart conditions — motion and degree flags read as meaning. ─────────────
  {
    key: "condition:retrograde",
    family: "condition",
    title: "A significator retrograde",
    body: "One of the death significators turns retrograde — moving, from our vantage, backward through the zodiac. The tradition reads retrograde motion as a turning-inward, a re-visiting, a matter folding back on itself. In a death chart it lends the crossing a reflective, returning quality: a soul looking back along its own path, gathering something before the gate rather than pressing straight through.",
    source: "Lilly CA (retrogradation); traditional doctrine on planetary motion",
    applies: "both",
  },
  {
    key: "condition:anaretic",
    family: "condition",
    title: "A body at the anaretic (final) degree",
    body: "A body stands at the twenty-ninth degree — the anaretic, the final and 'fated' degree of its sign. The tradition reads a planet at the last degree as a matter run entirely to its end, a cup filled to its very brim. In a death chart it carries a note of completion and threshold: something brought to its utmost point, a life or a theme arriving exactly at its close.",
    source: "Traditional doctrine on the anaretic degree; the 29th degree as culmination",
    applies: "both",
  },
  {
    key: "condition:cusp",
    family: "condition",
    title: "A body at the first (cusp) degree",
    body: "A body stands at the first degree of its sign — a threshold freshly crossed. The tradition reads a planet at zero degrees as something newly begun, on the very sill of a new nature. In a death chart it lends the crossing a quiet counterpoint: even at an ending, something in the sky had only just started, a beginning nested inside the close.",
    source: "Traditional doctrine on the cusp degree; the ingress as a fresh threshold",
    applies: "both",
  },
];

/**
 * The bundled delineation corpus, wrapped as a KnowledgeDocument so it lives in
 * the store exactly like the Code of Ethics: loaded through the same seam, with
 * a Supabase override and this bundled fallback. The entries ride in
 * `metadata.entries`, mirroring how the ethics doc carries its
 * `operating_summary` there — so a production DB row of kind `delineation`
 * with the same metadata shape drops in with no code change.
 */
export const DEATH_DELINEATIONS_DOC: KnowledgeDocument = {
  slug: "gravesigns-death-delineations",
  kind: "delineation",
  title: "GraveSigns — Death-Chart Delineation Corpus",
  source: "Original compilation; doctrine drawn from the public-domain tradition (Ptolemy, Valens, Dorotheus, Firmicus, Lilly).",
  attribution:
    "Written originally for GraveSigns. Cited sources are public-domain works, referenced as a study trail — no copyrighted text is reproduced.",
  version: "1",
  status: "active",
  content:
    "The practice's compiled delineation reference for death-chart factors — Moon by sign, lunar phase, sect, elemental cast, chart shape, the mortal significators, the 8th/4th/12th complex, the Lots, the karmic axis, and the death-salient fixed stars. Retrieved by factor and folded into the composition pass so each testimony is read as tradition, not as a bare placement.",
  metadata: {
    entries: DEATH_DELINEATIONS,
    entry_count: DEATH_DELINEATIONS.length,
  },
};
