import Papa from 'papaparse';
import type { ParsedQuestion, ArchetypeName } from '../types';
import { ARCHETYPES } from '../types';

// Raw CSV data embedded directly
const QUESTIONS_CSV = `QID,Question,Format,Options,Archetype Mapping,Category,Overlap Group,Asset Keys (optional),Notes
B01,Which word resonates most with your ideal future brand?,Word Choice,"Freedom, Belonging, Achievement, Transformation",Freedom=Explorer/Rebel; Belonging=Everyman/Caregiver; Achievement=Hero/Ruler; Transformation=Magician/Creator,Broad,,,Directional signal
B02,You're remembered for…,Story Completion,"Leading with power, Discovering truth, Loving deeply, Breaking boundaries",Power=Ruler; Truth=Sage; Love=Lover/Caregiver; Boundaries=Rebel/Hero,Broad,,,
B03,"When you imagine your brand at its best, what matters most?",Forced Choice,"Changing lives, Building community, Achieving excellence, Celebrating beauty",Changing lives=Magician; Building community=Everyman/Caregiver; Achieving excellence=Hero/Ruler; Celebrating beauty=Lover/Creator,Broad,,,
B04,Pick the symbol that inspires your future brand most.,Image Choice,"key, crown, compass, flame, heart",key=Sage/Magician; crown=Ruler; compass=Explorer; flame=Rebel/Hero; heart=Lover/Caregiver,Broad,,"img:key,crown,compass,flame,heart",Asset keys match your image library
B05,Rank these future priorities.,Ranking,Belonging|Freedom|Achievement|Transformation,"Top=+3, 2nd=+2, 3rd=+1, 4th=0 (map via same pairing as B01)",Broad,,,Use pipe '|' to separate options for ranking
B06,I feel energised by pursuing new horizons.,Slider,1..7,Explorer=+value; Rebel=+ceil(value/2),Broad,,,7-point agreement scale
B07,"Given a platform to influence, I want to…",Scenario Decision,"Challenge limits, Inspire courage, Reveal deeper truths, Bring people together",Challenge limits=Rebel; Inspire courage=Hero; Reveal deeper truths=Sage/Magician; Bring people together=Everyman/Caregiver,Broad,,,
B08,Which style of success feels most aspirational?,Forced Choice,"Order and stability, Mastery and victory, Vision and transformation, Joy and play",Order=Ruler; Mastery=Hero; Vision=Magician; Joy=Jester,Broad,,,
B09,Your ideal brand voice leans toward…,Word Choice,"Wise, Bold, Compassionate, Sensual, Inventive",Wise=Sage; Bold=Rebel/Hero; Compassionate=Caregiver/Everyman; Sensual=Lover; Inventive=Creator/Magician,Broad,,,
B10,Which house would you most like to call home?,Image Choice,"minimalist_mansion, rustic_cabin, grand_estate, vibrant_loft",minimalist_mansion=Magician/Ruler; rustic_cabin=Everyman/Explorer; grand_estate=Ruler/Lover; vibrant_loft=Creator/Jester,Broad,,"img:minimalist_mansion,rustic_cabin,grand_estate,vibrant_loft",
B11,"When obstacles appear, your brand will…",Story Completion,"Re-write the rules, Rally people to overcome, Seek expert understanding, Care for those affected",Re-write rules=Rebel; Rally=Hero; Seek understanding=Sage; Care=Caregiver,Broad,,,
B12,Choose two words that best fit your future brand.,Word Choice (Multi),"Transformative, Inclusive, Daring, Playful, Beautiful",Transformative=Magician; Inclusive=Everyman; Daring=Rebel/Hero; Playful=Jester; Beautiful=Lover/Creator,Broad,,,Allow multi-select (max 2)
B13,Your preferred path to impact is…,Forced Choice,"Crafting original work, Guiding with wisdom, Leading with authority, Exploring new markets",Original work=Creator; Wisdom=Sage; Authority=Ruler; Exploring=Explorer,Broad,,,
B14,Your North Star metric is closest to…,Forced Choice,"Lives transformed, People protected, Communities connected, Barriers broken",Lives transformed=Magician; People protected=Caregiver/Hero; Communities connected=Everyman; Barriers broken=Rebel,Broad,,,
B15,I want my brand to be known for…,Forced Choice,"Truth, Freedom, Love, Power",Truth=Sage; Freedom=Explorer/Rebel; Love=Lover/Caregiver; Power=Ruler/Hero,Broad,,,
C01,You're inspired by Tesla because…,Forced Choice,"It's innovative, It's luxurious, It's sustainable",Innovative=Magician; Luxurious=Lover; Sustainable=Caregiver/Sage,Clarifier,Magician vs Lover vs Caregiver/Sage,,
C02,"When leading a team, you focus first on…",Forced Choice,"Structure & control, Inspiring achievement, Sharing wisdom",Structure=Ruler; Achievement=Hero; Wisdom=Sage,Clarifier,Ruler vs Hero vs Sage,,
C03,Pick the symbol that best represents your brand future.,Image Choice,"crown, key, spark",crown=Ruler; key=Sage; spark=Magician,Clarifier,Ruler vs Sage vs Magician,"img:crown,key,spark",
C04,Your friends would expect your brand to…,Forced Choice,"Keep things fun, Try new experiences, Challenge the rules",Fun=Jester; New experiences=Explorer; Challenge rules=Rebel,Clarifier,Jester vs Explorer vs Rebel,,
C05,"With people you serve, what matters most?",Forced Choice,"Protecting and helping, Affection and closeness, Belonging and equality",Protecting=Caregiver; Affection=Lover; Belonging=Everyman,Clarifier,Caregiver vs Lover vs Everyman,,
C06,The world you want to help build is…,Forced Choice,"Safe and good, Wise and discerning, Welcoming and fair",Safe and good=Innocent; Wise and discerning=Sage; Welcoming and fair=Everyman,Clarifier,Innocent vs Sage vs Everyman,,
C07,A breakthrough product wows you because…,Forced Choice,"It changes what's possible, It looks and feels exquisite, It's brilliantly original",Changes what's possible=Magician; Exquisite=Lover; Original=Creator,Clarifier,Magician vs Lover vs Creator,,
C08,Your default move under pressure is to…,Forced Choice,"Take charge, Take a stand, Seek understanding",Take charge=Ruler; Take a stand=Hero; Seek understanding=Sage,Clarifier,Ruler vs Hero vs Sage,,
C09,"If your brand were a journey, you'd prioritise…",Forced Choice,"Discovery, Mastery, Harmony",Discovery=Explorer; Mastery=Hero; Harmony=Everyman/Caregiver,Clarifier,Explorer vs Hero vs Everyman,,
C10,Choose the creative brief that excites you.,Forced Choice,"Invent something new, Make beauty people desire, Disrupt a stale category",Invent=Creator; Beauty=Lover; Disrupt=Rebel,Clarifier,Creator vs Lover vs Rebel,,
V01,Be admired for…,Forced Choice,"Breaking boundaries, Inspiring courage",Breaking=Rebel; Inspiring=Hero,Validator,Rebel vs Hero,,
V02,"At your best, you…",Forced Choice,"Heal others, Transform others",Heal=Caregiver; Transform=Magician,Validator,Caregiver vs Magician,,
V03,Which resonates more?,Forced Choice,"Power with order, Wisdom with clarity",Power with order=Ruler; Wisdom with clarity=Sage,Validator,Ruler vs Sage,,
V04,Which outcome matters more?,Forced Choice,"Belonging for all, Freedom to roam",Belonging=Everyman; Freedom=Explorer,Validator,Everyman vs Explorer,,
V05,Creative priority?,Forced Choice,"Originality, Desire",Originality=Creator; Desire=Lover,Validator,Creator vs Lover,,
V06,Your brand's vibe?,Forced Choice,"Joyfully playful, Calmly pure",Joyfully playful=Jester; Calmly pure=Innocent,Validator,Jester vs Innocent,,`;

function parseArchetypeMapping(mappingString: string): Record<string, Array<{ archetype: ArchetypeName; weight: number }>> {
  const mapping: Record<string, Array<{ archetype: ArchetypeName; weight: number }>> = {};
  
  if (!mappingString) return mapping;
  
  // Split by semicolon to get individual mappings
  const mappings = mappingString.split(';').map(m => m.trim());
  
  for (const map of mappings) {
    const [option, archetypes] = map.split('=').map(s => s.trim());
    if (!option || !archetypes) continue;
    
    // Handle special cases for ranking and slider questions
    if (option.includes('Top=') || option.includes('value')) {
      // This is a special scoring instruction, skip for now
      continue;
    }
    
    const archetypeList = archetypes.split('/').map(a => a.trim());
    mapping[option] = archetypeList
      .filter(archetype => ARCHETYPES.includes(archetype as ArchetypeName))
      .map(archetype => ({
        archetype: archetype as ArchetypeName,
        weight: 1
      }));
  }
  
  return mapping;
}

function parseOptions(optionsString: string, format: string): string[] {
  if (!optionsString) return [];
  
  if (format === 'Slider') {
    return ['1', '2', '3', '4', '5', '6', '7'];
  }
  
  if (format === 'Ranking') {
    return optionsString.split('|').map(o => o.trim());
  }
  
  // For other formats, split by comma and clean up
  return optionsString.split(',').map(o => o.trim().replace(/^"|"$/g, ''));
}

export function loadQuestionsFromCSV(): ParsedQuestion[] {
  const parsed = Papa.parse(QUESTIONS_CSV, {
    header: true,
    skipEmptyLines: true
  });
  
  const questions: ParsedQuestion[] = [];
  
  for (const row of parsed.data as any[]) {
    if (!row.QID || !row.Question) continue;
    
    const parsedOptions = parseOptions(row.Options || '', row.Format);
    const parsedMapping = parseArchetypeMapping(row['Archetype Mapping'] || '');
    
    const question: ParsedQuestion = {
      id: row.QID,
      question: row.Question,
      format: row.Format as any,
      parsedOptions,
      parsedMapping,
      category: row.Category as 'Broad' | 'Clarifier' | 'Validator',
      overlapGroup: row['Overlap Group'] || undefined,
      assetKeys: row['Asset Keys (optional)'] || undefined,
      notes: row.Notes || undefined,
      required: true,
      maxSelections: row.Format === 'Word Choice (Multi)' ? 2 : undefined,
      status: 'active',
      usedInSessions: false
    };
    
    questions.push(question);
  }
  
  return questions;
}