import type { Response, ArchetypeScore, ArchetypeName, ParsedQuestion, AssessmentResult } from '../types';
import { ARCHETYPE_DATA } from '../data/archetypes';
import { ARCHETYPES } from '../types';

interface SectionScores {
  broad: Record<string, number>;
  clarifier: Record<string, number>;
  validator: Record<string, number>;
}

export function calculateArchetypeScores(
  responses: Response[], 
  questions: ParsedQuestion[]
): AssessmentResult {
  const archetypeScores: Record<string, number> = {};
  const sectionScores: SectionScores = {
    broad: {},
    clarifier: {},
    validator: {}
  };
  
  // Initialize all archetypes with 0 score
  ARCHETYPES.forEach(archetype => {
    archetypeScores[archetype] = 0;
    sectionScores.broad[archetype] = 0;
    sectionScores.clarifier[archetype] = 0;
    sectionScores.validator[archetype] = 0;
  });

  // Calculate raw scores
  responses.forEach(response => {
    const question = questions.find(q => q.id === response.questionId);
    if (!question) return;

    const sectionKey = question.category.toLowerCase() as keyof SectionScores;
    
    // Handle different question formats
    switch (question.format) {
      case 'Slider':
        handleSliderScoring(response, question, archetypeScores, sectionScores[sectionKey]);
        break;
        
      case 'Forced Choice':
      case 'Scenario Decision':
      case 'Word Choice':
      case 'Image Choice':
      case 'Story Completion':
        handleSingleChoiceScoring(response, question, archetypeScores, sectionScores[sectionKey]);
        break;
        
      case 'Word Choice (Multi)':
        handleMultiChoiceScoring(response, question, archetypeScores, sectionScores[sectionKey]);
        break;
        
      case 'Ranking':
        handleRankingScoring(response, question, archetypeScores, sectionScores[sectionKey]);
        break;
    }
  });

  // Calculate total score for normalization
  const totalScore = Object.values(archetypeScores).reduce((sum, score) => sum + Math.max(0, score), 0);
  
  // Convert to percentage-based scores
  const allScores: ArchetypeScore[] = ARCHETYPES.map(archetype => {
    const normalizedScore = Math.max(0, archetypeScores[archetype]);
    const percentage = totalScore > 0 ? (normalizedScore / totalScore) * 100 : 0;
    
    return {
      name: archetype,
      score: normalizedScore,
      percentage: Math.round(percentage * 10) / 10,
      description: ARCHETYPE_DATA[archetype].description,
      traits: ARCHETYPE_DATA[archetype].traits,
      color: ARCHETYPE_DATA[archetype].color
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Apply tie-breaking logic
  const { primary, secondary } = resolveTies(allScores, sectionScores, responses, questions);
  
  return {
    primaryArchetype: primary,
    secondaryArchetype: secondary,
    allScores: allScores,
    confidence: calculateConfidenceScore(responses, questions),
    completedAt: new Date(),
    sectionScores
  };
}

function handleSliderScoring(
  response: Response, 
  question: ParsedQuestion, 
  archetypeScores: Record<string, number>,
  sectionScores: Record<string, number>
) {
  const value = response.value as number;
  
  // For slider questions, apply the value to all mapped archetypes
  Object.entries(question.parsedMapping).forEach(([_, weights]) => {
    weights.forEach(({ archetype, weight }) => {
      const points = value * weight;
      archetypeScores[archetype] += points;
      sectionScores[archetype] += points;
    });
  });
}

function handleSingleChoiceScoring(
  response: Response, 
  question: ParsedQuestion, 
  archetypeScores: Record<string, number>,
  sectionScores: Record<string, number>
) {
  const selectedOption = response.value as string;
  const weights = question.parsedMapping[selectedOption];
  
  if (weights) {
    weights.forEach(({ archetype, weight }) => {
      const points = weight * 3; // Base multiplier for single choices
      archetypeScores[archetype] += points;
      sectionScores[archetype] += points;
    });
  }
}

function handleMultiChoiceScoring(
  response: Response, 
  question: ParsedQuestion, 
  archetypeScores: Record<string, number>,
  sectionScores: Record<string, number>
) {
  const selectedOptions = response.value as string[];
  
  selectedOptions.forEach(option => {
    const weights = question.parsedMapping[option];
    if (weights) {
      weights.forEach(({ archetype, weight }) => {
        const points = weight * 2; // Reduced multiplier for multi-select
        archetypeScores[archetype] += points;
        sectionScores[archetype] += points;
      });
    }
  });
}

function handleRankingScoring(
  response: Response, 
  question: ParsedQuestion, 
  archetypeScores: Record<string, number>,
  sectionScores: Record<string, number>
) {
  const rankedOptions = response.value as string[];
  const rankWeights = [3, 2, 1, 0]; // Top gets +3, 2nd gets +2, etc.
  
  rankedOptions.forEach((option, index) => {
    const weights = question.parsedMapping[option];
    const rankWeight = rankWeights[index] || 0;
    
    if (weights && rankWeight > 0) {
      weights.forEach(({ archetype, weight }) => {
        const points = weight * rankWeight;
        archetypeScores[archetype] += points;
        sectionScores[archetype] += points;
      });
    }
  });
}

function resolveTies(
  allScores: ArchetypeScore[], 
  sectionScores: SectionScores,
  responses: Response[],
  questions: ParsedQuestion[]
): { primary: ArchetypeScore; secondary: ArchetypeScore } {
  let primary = allScores[0];
  let secondary = allScores[1];
  
  // Check if there's a tie for primary
  const tiedForFirst = allScores.filter(score => 
    Math.abs(score.percentage - primary.percentage) < 0.1
  );
  
  if (tiedForFirst.length > 1) {
    // Apply tie-breaking rules
    primary = breakTie(tiedForFirst, sectionScores, responses, questions);
    secondary = allScores.find(score => score.name !== primary.name) || allScores[1];
  }
  
  // Check if there's a tie for secondary
  const tiedForSecond = allScores.filter(score => 
    score.name !== primary.name && 
    Math.abs(score.percentage - secondary.percentage) < 0.1
  );
  
  if (tiedForSecond.length > 1) {
    secondary = breakTie(tiedForSecond, sectionScores, responses, questions);
  }
  
  return { primary, secondary };
}

function breakTie(
  tiedScores: ArchetypeScore[], 
  sectionScores: SectionScores,
  responses: Response[],
  questions: ParsedQuestion[]
): ArchetypeScore {
  // Rule 1: Highest count of top-weight selections
  const topWeightCounts = countTopWeightSelections(tiedScores, responses, questions);
  const maxTopWeights = Math.max(...Object.values(topWeightCounts));
  const topWeightWinners = tiedScores.filter(score => topWeightCounts[score.name] === maxTopWeights);
  
  if (topWeightWinners.length === 1) {
    return topWeightWinners[0];
  }
  
  // Rule 2: Highest Validator subtotal
  const validatorWinners = topWeightWinners.sort((a, b) => 
    sectionScores.validator[b.name] - sectionScores.validator[a.name]
  );
  
  if (sectionScores.validator[validatorWinners[0].name] > sectionScores.validator[validatorWinners[1]?.name || '']) {
    return validatorWinners[0];
  }
  
  // Rule 3: Deterministic fallback (alphabetical)
  return validatorWinners.sort((a, b) => a.name.localeCompare(b.name))[0];
}

function countTopWeightSelections(
  tiedScores: ArchetypeScore[], 
  responses: Response[],
  questions: ParsedQuestion[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  tiedScores.forEach(score => {
    counts[score.name] = 0;
  });
  
  responses.forEach(response => {
    const question = questions.find(q => q.id === response.questionId);
    if (!question) return;
    
    // Count selections where this archetype got the highest weight for this question
    Object.entries(question.parsedMapping).forEach(([option, weights]) => {
      if (isSelectedOption(response, option, question.format)) {
        const maxWeight = Math.max(...weights.map(w => w.weight));
        weights.forEach(({ archetype, weight }) => {
          if (weight === maxWeight && counts.hasOwnProperty(archetype)) {
            counts[archetype]++;
          }
        });
      }
    });
  });
  
  return counts;
}

function isSelectedOption(response: Response, option: string, format: string): boolean {
  switch (format) {
    case 'Forced Choice':
    case 'Scenario Decision':
    case 'Word Choice':
    case 'Image Choice':
    case 'Story Completion':
      return response.value === option;
    case 'Word Choice (Multi)':
      return (response.value as string[]).includes(option);
    case 'Ranking':
      return (response.value as string[]).indexOf(option) === 0; // Only count top rank
    default:
      return false;
  }
}

export function calculateConfidenceScore(responses: Response[], questions: ParsedQuestion[]): number {
  if (responses.length === 0) return 0;
  
  const completionRate = responses.length / questions.length;
  
  // Calculate response strength based on question types
  let totalStrength = 0;
  let strengthCount = 0;
  
  responses.forEach(response => {
    const question = questions.find(q => q.id === response.questionId);
    if (!question) return;
    
    switch (question.format) {
      case 'Slider':
        const sliderValue = response.value as number;
        totalStrength += Math.abs(sliderValue - 4); // Distance from neutral (4)
        strengthCount++;
        break;
      case 'Ranking':
        totalStrength += 2; // Ranking shows strong preference
        strengthCount++;
        break;
      case 'Word Choice (Multi)':
        const selections = response.value as string[];
        totalStrength += selections.length; // More selections = more engagement
        strengthCount++;
        break;
      default:
        totalStrength += 1; // Default strength for other types
        strengthCount++;
    }
  });
  
  const avgResponseStrength = strengthCount > 0 ? totalStrength / strengthCount : 0;
  const normalizedStrength = Math.min(avgResponseStrength / 3, 1); // Normalize to 0-1
  
  // Confidence score from 0-100
  const confidence = (completionRate * 0.7 + normalizedStrength * 0.3) * 100;
  return Math.round(confidence);
}