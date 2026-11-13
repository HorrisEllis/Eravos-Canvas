/* P184 — options shown in title case (his words, 2026-11-13: "why lowercase all the time also? like porffesssional anbd production grade"),
 * values kept as stored. Chord progressions in numerals keep their case (lowercase = minor: i-VI-III-VII, i-iv-v-i) — found on Bassline's
 * Own chords after 3.184; acronyms come from the domain (SVF, DnB); small joining words stay small mid-phrase. */
window.__phase = 'P184';
describe('P184 option text — title case for words, numerals and acronyms as they mean', () => {
  it('shown as a title; progressions, acronyms and symbols as they mean', () => {
    const T = UIKit.optionText, cases = { 'tine': 'Tine', 'up-down': 'Up-Down', 'sample and hold': 'Sample and Hold', 'svf 24': 'SVF 24', 'dnb roll': 'DnB Roll',
      'juno I': 'Juno I', 'I+II': 'I+II', 'i-VI-III-VII': 'i-VI-III-VII', 'i-iv-v-i': 'i-iv-v-i', 'vi-IV-I-V': 'vi-IV-I-V', 'ii-V-I-I': 'ii-V-I-I', '1/16t': '1/16t', 'off': 'Off' };
    Object.entries(cases).forEach(([v, want]) => assert.equal(T(v), want, JSON.stringify(v)));
  });
  it('a setting keeps its stored value: Bassline’s Own chords shows i-VI-III-VII and stores i-VI-III-VII', () => {
    const d = OrganismFactory.def('eravos.bass-gen'), c = d.config.find(x => x.key === 'progression'); assert.ok(c.options.includes('i-VI-III-VII'));
    assert.equal(UIKit.optionText('i-VI-III-VII'), 'i-VI-III-VII');
  });
});
