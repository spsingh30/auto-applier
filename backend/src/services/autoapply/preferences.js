// Common application questions that most companies ask.
// The user fills these once → in the fill phase these authoritative answers are used
// instead of an AI guess (fixes wrong data + faster, since fewer AI questions).

// type: 'select' (one of the options) | 'text' (free)
const QUESTIONS = [
  { key: 'workAuthorized', label: 'Are you legally authorized to work in the job’s country?', type: 'select', options: ['Yes', 'No'] },
  { key: 'requireSponsorship', label: 'Will you now or in the future require visa sponsorship?', type: 'select', options: ['No', 'Yes'] },
  { key: 'willingToRelocate', label: 'Are you willing to relocate?', type: 'select', options: ['Yes', 'No'] },
  { key: 'workPreference', label: 'Preferred work setting', type: 'select', options: ['Remote', 'Hybrid', 'On-site', 'No preference'] },
  { key: 'noticePeriod', label: 'Notice period / earliest start date', type: 'text', placeholder: 'e.g. Immediately, 2 weeks, 1 month' },
  { key: 'expectedSalary', label: 'Expected salary / compensation', type: 'text', placeholder: 'e.g. Negotiable, 12 LPA, $120k' },
  { key: 'yearsExperience', label: 'Total years of professional experience', type: 'text', placeholder: 'e.g. 0, 2, 5' },
  { key: 'pronouns', label: 'Pronouns', type: 'select', options: ['He/him', 'She/her', 'They/them', 'Prefer not to say'] },
  { key: 'gender', label: 'Gender identity', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
  { key: 'raceEthnicity', label: 'Race / ethnicity', type: 'select', options: ['Asian', 'Black or African American', 'Hispanic or Latino', 'White', 'Two or more races', 'Prefer not to say'] },
  { key: 'veteranStatus', label: 'Veteran status', type: 'select', options: ['I am not a protected veteran', 'I am a protected veteran', 'Prefer not to say'] },
  { key: 'disabilityStatus', label: 'Do you have a disability?', type: 'select', options: ['No', 'Yes', 'Prefer not to say'] },
  { key: 'hearAboutUs', label: 'How did you hear about us?', type: 'text', placeholder: 'e.g. LinkedIn, Company website' },
  { key: 'over18', label: 'Are you at least 18 years old?', type: 'select', options: ['Yes', 'No'] },
  { key: 'gitHubOrPortfolio', label: 'Years coding / projects note (optional free text)', type: 'text', placeholder: 'optional' },
];

// Form-question label -> preference key (keyword match). Returns null if no match.
const MATCHERS = [
  [/authori[sz]ed to work|work authori|right to work|eligible to work|legally able to work/i, 'workAuthorized'],
  [/sponsor/i, 'requireSponsorship'],
  [/relocat/i, 'willingToRelocate'],
  [/\bremote\b|\bhybrid\b|on-?site|work (setting|preference|arrangement|location|model)/i, 'workPreference'],
  [/notice period|earliest start|when can you (start|join)|availab(le|ility) to start|start date/i, 'noticePeriod'],
  [/salary|compensation|\bctc\b|\bpay\b expectation|expected (annual )?(comp|pay|salary)|desired (salary|pay)/i, 'expectedSalary'],
  [/years? of (professional |relevant |total )?experience|how many years|total experience|yrs? exp/i, 'yearsExperience'],
  [/pronoun/i, 'pronouns'],
  [/gender/i, 'gender'],
  [/race|ethnicit/i, 'raceEthnicity'],
  [/veteran/i, 'veteranStatus'],
  [/disab/i, 'disabilityStatus'],
  [/how did you (hear|learn|find|come to know)|where did you (hear|find)|source of|referr/i, 'hearAboutUs'],
  [/(18 (years|or older|\+))|over 18|at least 18|are you.*18|minimum age/i, 'over18'],
];

// Find the stored answer for a form-question label (if any). Otherwise null.
function matchPreference(label, prefs) {
  if (!prefs || !label) return null;
  for (const [re, key] of MATCHERS) {
    if (re.test(label)) {
      const val = prefs[key];
      if (val != null && String(val).trim() !== '') return String(val);
      return null; // question matched but the user didn't provide an answer
    }
  }
  return null;
}

module.exports = { QUESTIONS, matchPreference };
