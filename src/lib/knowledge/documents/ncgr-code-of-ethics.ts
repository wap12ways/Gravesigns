/**
 * NCGR Code of Ethics — compiled reference document.
 *
 * This is the bundled, canonical copy: it ships with the app so the reading
 * engine always has the ethics text available, even in demo mode or before the
 * Supabase knowledge corpus is seeded. The same object is what seeds the
 * `knowledge_documents` table (see supabase/seed/knowledge_documents.sql).
 *
 * Source: https://ncgrastrology.org/code-of-ethics/  (Revised October 1998)
 * © NCGR, All Rights Reserved. Reproduced here verbatim for the practice's own
 * ethical alignment of its readings; not a claim of authorship or endorsement.
 *
 * To revise the code the app aligns against, edit the row in
 * `knowledge_documents` (preferred, no deploy) or this file (the bundled
 * fallback). No pipeline code needs to change — the text is loaded as data.
 */
import type { KnowledgeDocument } from "../../types";

/**
 * A short, editable distillation of the tenets that bear most directly on
 * composing a death-chart reading for the grieving. Injected into the
 * composition pass so drafts are born aligned; the full `content` below is what
 * the dedicated ethical-alignment pass audits against. Tighten or expand freely
 * — it is data, and changing it does not touch pipeline code.
 */
const OPERATING_SUMMARY = `Operating principles distilled from the NCGR Code of Ethics for a death-chart reading offered to the grieving:
- Avoid harm. Never say anything that could cause fear, confusion, or dread (A.2, D.1). This reader is bereaved.
- Speak within competence. This is symbolic, contemplative astrology — not medicine, psychology, law, or fact about the death (A.3).
- Qualify, don't pronounce. Offer interpretations as invitations to reflection, "this symbolizes / invites," never as final or unequivocal verdicts (A.4).
- Do not manipulate or intimidate. Never steer the reader's feelings or press an interpretation on them (A.5).
- Respect human difference. Make no assumptions about the person's or family's religion, culture, gender, or beliefs; honour the frame they hold (A.6, F.2).
- No sensationalism. Never exaggerate or dramatize a placement for effect (C.4, D.1).
- Be honest about sources and limits. Cite the tradition a reading rests on; name what the chart cannot show (C.3, E.3).
- Serve the reader's best interest, and where grief needs more than a reading, gently point toward real human support (D.2, D.3).`;

/**
 * The six chapters, addressable individually. Bodies are verbatim; sub-clauses
 * are preserved with their numbering.
 */
const SECTIONS = [
  {
    ref: "A",
    heading: "A. GENERAL STANDARDS",
    body: `A.1 Applicability of this Code
This code applies to the activities of astrologers in their professional work, as well as in their representations and use of astrology at large.

A.2 Avoiding Harm
Astrologers avoid making statements that could cause harm through confusion, misunderstanding or fear.

A.3 Boundaries of Competence
Astrologers provide services to the public— whether in astrology or in other disciplines— only within the boundaries of their competence based on their education, training and appropriate experience.

A.4 Interpretations and Forecasts
1. Consulting astrologers are careful to present their astrological interpretations and opinions with objectivity and appropriate qualifying statements, rather than as final or unequivocal pronouncements.
2. Astrologers make predictions only when they are derived from a conscientious application of technique.

A.5 Responsibilities to Others
1. Astrologers respect the rights of others, including clients, students and colleagues, to hold values, attitudes and opinions different from their own.
2. Astrologers make every effort to refrain from any behavior that may reasonably be considered offensive, harassing or demeaning to others.
3. Consulting astrologers are careful to avoid manipulation of their client's feelings and emotions.
4. Astrologers do not present their interpretations or opinions to their clients in a way that could intimidate them.

A.6 Human Differences
1. Astrologers respect human differences, including those due to astrological configurations, age, gender, race, ethnicity, religion, national origin, disability, sexual gender preference, and socioeconomic status.
2. Should such human differences impair or compromise an astrologer in serving a particular individual or a group, the astrologer makes a conscious effort to ensure fairness and objectivity. Such efforts might include obtaining appropriate training, experience or advice. Otherwise the astrologer should make an appropriate referral.

A.7 Personal Problems and Conflicts
1. Astrologers refrain from counseling individuals or clients with whom they have personal problems or conflicts which may interfere with their effectiveness or cause harm.
2. Astrologers remain alert to personal problems or conflicts arising during an astrology relationship and take appropriate measures to correct the situation or to limit, suspend or terminate the undertaking.

A.8 Sexual Conduct
1. Astrologers do not engage in sexual behavior with clients or students unless such behavior is clearly separate from and outside of the astrological sessions or work.
2. Astrologers do not engage in sexual harassment. Sexual harassment consists of sexual solicitation, physical advances, or any other verbal or nonverbal sexual conduct that is offensive or that the astrologer should realize might be unwelcome. Sexual harassment can take the form of persistent or pervasive acts, or of a single act that is intense or severe.

A.9 Third-Party Services
1. When an astrologer agrees to provide consulting services for someone at the request of another, the astrologer clarifies the role of the astrologer and the extent of and limits to confidentiality with each party.
2. Astrologers do not attempt to manipulate a person's behavior on behalf of a third party.`,
  },
  {
    ref: "B",
    heading: "B. CONFIDENTIALITY",
    body: `B.1 Maintaining Confidentiality
1. Astrologers respect the confidentiality and rights to privacy of their clients, students and others who they deal with in astrological contexts. Confidentiality applies to the identity of and personal information about clients and other individuals.
2. Astrologers do not disclose personal information that is unattainable from public sources without the consent of the person involved as long as that person is living.

B.2 Consultations with Colleagues
When consulting with colleagues, astrologers do not share the identity of the person or persons involved without prior consent. If unavoidable, they share only that information which is necessary to achieve the purposes of the consultation.

B.3 Confidential Information in Data Collections
Astrologers seek permission from living subjects (such as clients, students and friends) before including confidential information in named data collections. Alternatively, astrologers use coding or other techniques to protect the identity of the subjects.`,
  },
  {
    ref: "C",
    heading: "C. ADVERTISING AND PUBLIC STATEMENTS",
    body: `C.1 Definitions
Advertising, whether paid or unpaid, includes all media, such as magazines, newspaper ads, brochures, business cards, fliers and other printed matter, direct mail promotions, directory listings, resumes, etc. Public statements include advertising as well as statements made in classes, lectures, workshops and other oral presentations, published materials, interviews and comments for use in all electronic media.

C.2 False or Deceptive Statements
1. Astrologers do not make advertising claims or public statements that are false, deceptive, misleading or fraudulent, either because of what they state or suggest, or because of what they omit. This includes claims and statements regarding their training, experience, competence, credentials, organizational affiliations, and services.
2. Astrologers take responsibility for the content of promotional advertising statements made on their behalf.

C.3 Unfounded Statements
Astrologers willingly and openly reveal their sources of information, whether they be scientific, academic, experiential or mystical. Astrologers do not misrepresent their sources of information and make every effort to verify their accuracy.

C.4 Misuse of Astrology
1. Misuse includes gross misrepresentation of astrological factors used to make sensational and exaggerated claims in public statements.
2. Astrologers are alert to and guard against personal, financial, social, religious, or political factors that might cause them to misuse their influence.
3. Astrologers do not participate in activities in which it appears likely that their expertise or data will be misused by others.
4. If astrologers learn of the misuse of their work, they take reasonable steps to correct or minimize the misuse or misrepresentation.

C.5 Organizational Misrepresentation
1. NCGR members who represent themselves as such are careful to clarify whether they are acting as a spokesperson or as an individual.
2. NCGR members do not act as spokespersons or imply that they are spokespersons for NCGR without the authorization to do so.`,
  },
  {
    ref: "D",
    heading: "D. BUSINESS PRACTICES",
    body: `D.1 Solicitation of Clients
Astrologers do not make astrological statements, predictions or forecasts in the course of the solicitation of clients or students that are misleading either in their optimism or their negativity, or that are frightening or intimidating.

D.2 Boundaries
Astrologers maintain reasonable boundaries with their clients, with the best interests of their clients in mind.

D.3 Referrals
1. Astrologers make referrals based on the best interests of the client or potential client. Astrologers only recommend other professionals who are to the best of their knowledge qualified, competent and ethically responsible.
2. Astrologers do not accept referral fees.

D.4 Fees
Astrologers do not exploit recipients of their services with respect to fees, nor do they misrepresent their fees.

D.5 General Practices
1. Astrologers take responsibility for informing their clients of their business practices, such as length and frequency of sessions and kind of work performed.
2. Astrologers make every effort to honor all commitments they have made.`,
  },
  {
    ref: "E",
    heading: "E. TEACHING AND RESEARCH",
    body: `E.1 Accuracy and Objectivity
When engaged in teaching or writing, astrologers present astrological information accurately and with appropriate objectivity.

E.2 Active Participation of Subjects
In research projects that involve interviews with research subjects, astrologers are careful to consider the negative impact their questions may have on the well-being of those subjects.

E.3 Crediting and Citing Sources
Astrologers realize the importance of intellectual integrity. They are aware that the improper use of copyrighted material is illegal, and that plagiarism (the presentation of another's work as one's own) is dishonest.`,
  },
  {
    ref: "F",
    heading: "F. RESOLVING ETHICAL ISSUES",
    body: `F.1 Confronting Ethical Issues
Should an astrologer be uncertain how this Ethics Code may apply in a given situation, the astrologer makes a good faith effort to consult with knowledgeable colleagues, organizational representatives, or with other appropriate authorities in order to choose a proper course of action.

F.2 Personal and Religious Views
1. Astrologers whose personal convictions or religious ethics come into conflict with those of a client or student are alert to the possible compromise of objectivity that may arise. In such cases, astrologers clearly separate their views from their astrological interpretations.
2. Astrologers whose personal convictions or religious ethics come into conflict with this code clarify their differences where appropriate.

F.3 Cooperating with Ethics Investigations
1. Astrologers cooperate in ethics investigations, proceedings and requirements of any organization to which they belong. In doing so, they make reasonable efforts to resolve any issues involving potential breaches of confidentiality.
2. Astrologers are honest in their dealings with ethics bodies. Astrologers do not deceive or withhold appropriate information from ethics bodies.

F.4 Improper Complaints
Astrologers do not file or encourage the filing of ethics complaints that are frivolous and are intended to harm the respondent rather than protect the public.`,
  },
];

const CONTENT = `# The NCGR Code of Ethics

${SECTIONS.map((s) => `## ${s.heading}\n\n${s.body}`).join("\n\n")}

*—Revised October 1998*`;

export const NCGR_CODE_OF_ETHICS: KnowledgeDocument = {
  slug: "ncgr-code-of-ethics",
  kind: "code_of_ethics",
  title: "The NCGR Code of Ethics",
  source: "https://ncgrastrology.org/code-of-ethics/",
  attribution: "© NCGR, All Rights Reserved. Revised October 1998.",
  version: "Revised October 1998",
  status: "active",
  content: CONTENT,
  sections: SECTIONS,
  metadata: {
    organization: "National Council for Geocosmic Research (NCGR)",
    code_label: "NCGR",
    operating_summary: OPERATING_SUMMARY,
  },
};
