export type QuestionType = 'yesno' | 'scale';
export const QUESTION_TYPES: QuestionType[] = ['yesno', 'scale'];

// Removes floating-point noise (e.g. 3.9999999999999996) so equal scores compare as equal; 1e-12 keeps averages
// of many rounded scores within 1e-12 of the exact value
export const roundScore = (value: number) => Math.round(value * 1e12) / 1e12;

// One criterion's result from 0 to 1: a "yes" counts 1, a scale answer v counts v / scaleMax.
// When the criterion mixes both types, yes/no questions carry yesNoWeight of it and scale questions the rest.
export function criterionFraction(answers: number[], types: QuestionType[], scaleMax: number, yesNoWeight: number) {
  let yes = 0;
  let yesNoCount = 0;
  let scaleSum = 0;
  let scaleCount = 0;
  answers.forEach((value, i) => {
    if (types[i] === 'scale') {
      scaleSum += value;
      scaleCount++;
    } else {
      yes += value;
      yesNoCount++;
    }
  });
  if (!scaleCount) return yesNoCount ? yes / yesNoCount : 0;
  if (!yesNoCount) return scaleSum / (scaleCount * scaleMax);
  return yesNoWeight * (yes / yesNoCount) + (1 - yesNoWeight) * (scaleSum / (scaleCount * scaleMax));
}
