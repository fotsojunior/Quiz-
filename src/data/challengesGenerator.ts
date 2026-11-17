import { COUNTRIES } from './countries';
import {
  CURATED_ENIGMAS,
  FRENCH_WORD_FORGE_BANK,
  REBUS_PAIRS,
  WORLD_CULTURE_BANK,
} from './challengeBanks';
import {
  Challenge,
  ChallengeCategory,
  Difficulty,
  LogicArrangeChallenge,
  McqChallenge,
  MemoryGridChallenge,
  OrderTapChallenge,
  PipeConnectChallenge,
  SimonSeqChallenge,
  SpotDiffChallenge,
  StroopChallenge,
  SymmetryDrawChallenge,
  WordScrambleChallenge,
} from '../types/game';

export const TOTAL_CHALLENGES = 12500;

export interface CategoryInfo {
  id: ChallengeCategory;
  label: string;
  shortLabel: string;
  description: string;
  rangeStart: number;
  rangeEnd: number;
  count: number;
}

export const CHALLENGE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'enigma',
    label: 'Énigmes & Mystères',
    shortLabel: 'Énigme',
    description: 'Énigmes classiques, codes secrets, boussoles et déductions chronologiques.',
    rangeStart: 1,
    rangeEnd: 2100,
    count: 2100,
  },
  {
    id: 'logic',
    label: 'Réflexion & Logique',
    shortLabel: 'Réflexion',
    description: 'Suites numériques, matrices géométriques, balances et énigmes de vérité.',
    rangeStart: 2101,
    rangeEnd: 4300,
    count: 2200,
  },
  {
    id: 'focus',
    label: 'Concentration & Mémoire',
    shortLabel: 'Concentration',
    description: 'Grilles flash, chasse à l’intrus, séquences lumineuses et pièges visuels.',
    rangeStart: 4301,
    rangeEnd: 6400,
    count: 2100,
  },
  {
    id: 'speed',
    label: 'Rapidité & Réflexes',
    shortLabel: 'Rapidité',
    description: 'Tri éclair sous pression, calcul mental instantané et frappes chronométrées.',
    rangeStart: 6401,
    rangeEnd: 8500,
    count: 2100,
  },
  {
    id: 'creation',
    label: 'Création & Ingéniosité',
    shortLabel: 'Création',
    description: 'Mosaïques symétriques, circuits à connecter, forge de mots et placements logiques.',
    rangeStart: 8501,
    rangeEnd: 10500,
    count: 2000,
  },
  {
    id: 'riddle',
    label: 'Devinettes & Monde',
    shortLabel: 'Devinette',
    description: 'Drapeaux des 195 pays, capitales, rébus visuels et culture universelle.',
    rangeStart: 10501,
    rangeEnd: 12500,
    count: 2000,
  },
];

// Deterministic seeded PRNG (Mulberry32)
function createRng(seed: number) {
  let a = (seed ^ 0x9e3779b9) >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function shuffleWithRng<T>(rng: () => number, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickUniqueOptions(
  rng: () => number,
  correct: string,
  distractors: string[]
): { options: string[]; correctIndex: number } {
  const uniqueWrong: string[] = [];
  for (const d of distractors) {
    if (d !== correct && !uniqueWrong.includes(d)) {
      uniqueWrong.push(d);
    }
    if (uniqueWrong.length === 3) break;
  }
  let fallbackCounter = 1;
  while (uniqueWrong.length < 3) {
    const candidate = `${correct} (${fallbackCounter++})`;
    if (!uniqueWrong.includes(candidate)) uniqueWrong.push(candidate);
  }
  const combined = shuffleWithRng(rng, [correct, ...uniqueWrong]);
  return {
    options: combined,
    correctIndex: combined.indexOf(correct),
  };
}

export function getTimeLimitForProgress(answeredCount: number): number {
  const safeCount = Math.max(0, Math.floor(answeredCount));
  const steps = Math.floor(safeCount / 20);
  return Math.max(30, 60 - steps * 2);
}

export function getDifficultyTierForProgress(answeredCount: number): Difficulty {
  if (answeredCount < 10) return 'facile';
  if (answeredCount < 25) return 'moyen';
  if (answeredCount < 50) return 'difficile';
  return 'maitre';
}

function difficultyFromSeed(id: number, offset = 0): Difficulty {
  const bucket = (id + offset) % 10;
  if (bucket <= 2) return 'facile';
  if (bucket <= 6) return 'moyen';
  if (bucket <= 8) return 'difficile';
  return 'maitre';
}

function metaFor(
  id: number,
  category: ChallengeCategory,
  title: string,
  difficulty: Difficulty,
  baseTime: number
) {
  const diffMult =
    difficulty === 'facile'
      ? 1
      : difficulty === 'moyen'
      ? 1.2
      : difficulty === 'difficile'
      ? 1.45
      : 1.7;
  return {
    id,
    category,
    difficulty,
    title,
    timeLimitSec: Math.max(30, Math.min(60, baseTime)),
    basePoints: Math.round(15 * diffMult),
    penaltyPoints: Math.round(12 * diffMult),
  };
}

// ==========================================
// 1. ENIGMA GENERATOR (IDs 1..2100)
// ==========================================
function generateEnigma(id: number): McqChallenge {
  const rng = createRng(id * 1013 + 7);
  const diff = difficultyFromSeed(id);
  const subType = (id - 1) % 5;

  // Subtype 0: Curated riddles or variations
  if (subType === 0 && id <= CURATED_ENIGMAS.length * 5) {
    const item = CURATED_ENIGMAS[Math.floor((id - 1) / 5) % CURATED_ENIGMAS.length];
    const { options, correctIndex } = pickUniqueOptions(rng, item.a, item.wrong);
    return {
      ...metaFor(id, 'enigma', 'Énigme Classique', diff, 24),
      kind: 'mcq',
      prompt: item.q,
      hint: item.hint,
      options,
      correctIndex,
      explanation: item.exp,
    };
  }

  // Subtype 1: Caesar Cipher Mystery
  if (subType === 1) {
    const words = [
      'SOLEIL', 'NATION', 'VICTOIRE', 'MYSTERE', 'DRAPEAU', 'PLANETE',
      'COURAGE', 'HORIZON', 'LUMIERE', 'CHRONO', 'ENIGME', 'TROPHEE',
      'ATLAS', 'GENIE', 'SAVOIR', 'OCEAN', 'BOUSSOLE', 'ETOILE',
    ];
    const word = words[(id + randInt(rng, 0, words.length - 1)) % words.length];
    const shift =
      diff === 'facile'
        ? randInt(rng, 1, 2)
        : diff === 'moyen'
        ? randInt(rng, 3, 4)
        : diff === 'difficile'
        ? randInt(rng, 5, 7)
        : randInt(rng, 8, 12);
    const encode = (w: string, s: number) =>
      w
        .split('')
        .map((ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + s) % 26) + 65))
        .join('');
    const encoded = encode(word, shift);
    const distractors = shuffleWithRng(
      rng,
      words.filter((w) => w !== word && w.length === word.length)
    );
    while (distractors.length < 3) {
      const candidate = words[randInt(rng, 0, words.length - 1)];
      if (candidate !== word && !distractors.includes(candidate)) {
        distractors.push(candidate);
      }
    }
    const { options, correctIndex } = pickUniqueOptions(rng, word, distractors);
    return {
      ...metaFor(id, 'enigma', 'Code Secret de César', diff, 28),
      kind: 'mcq',
      prompt: `Un message secret a été intercepté. Chaque lettre a été décalée de +${shift} dans l'alphabet (A→${String.fromCharCode(65 + shift)}). Quel est le mot d'origine ?`,
      visual: {
        type: 'cipher',
        encoded,
        ruleHint: `Décalage secret : -${shift} lettres`,
      },
      options,
      correctIndex,
      explanation: `En reculant chaque lettre de ${encoded} de ${shift} positions, on retrouve ${word}.`,
    };
  }

  // Subtype 2: Age & Family Logic Riddle
  if (subType === 2) {
    const namesA = ['Lina', 'Yanis', 'Maya', 'Nolan', 'Chloé', 'Sami', 'Inès', 'Théo'];
    const namesB = ['Lucas', 'Amira', 'Hugo', 'Zara', 'Léo', 'Aïcha', 'Tom', 'Eva'];
    const a = namesA[randInt(rng, 0, namesA.length - 1)];
    const b = namesB[randInt(rng, 0, namesB.length - 1)];
    const youngAge = randInt(rng, 4, 14);
    const mult = randInt(rng, 2, 4);
    const olderNow = youngAge * mult;
    const yearsLater = randInt(rng, 5, 16);
    const diffAge = olderNow - youngAge;
    const answerAge = youngAge + yearsLater;
    const olderLater = answerAge + diffAge;

    const { options, correctIndex } = pickUniqueOptions(
      rng,
      `${olderLater} ans`,
      [
        `${olderLater + diffAge} ans`,
        `${answerAge * mult} ans`,
        `${olderLater - 2} ans`,
      ]
    );

    return {
      ...metaFor(id, 'enigma', "L'Énigme des Âges", diff, 26),
      kind: 'mcq',
      prompt: `Lorsque ${a} avait ${youngAge} ans, ${b} était ${mult} fois plus âgé(e). Aujourd'hui, ${a} a ${answerAge} ans. Quel âge a ${b} aujourd'hui ?`,
      hint: "La différence d'âge entre deux personnes ne change jamais !",
      options,
      correctIndex,
      explanation: `Quand ${a} avait ${youngAge} ans, ${b} avait ${olderNow} ans (écart de ${diffAge} ans). Aujourd'hui ${b} a donc ${answerAge} + ${diffAge} = ${olderLater} ans.`,
    };
  }

  // Subtype 3: Compass / Position / Journey Riddle
  if (subType === 3) {
    const north1 = randInt(rng, 3, 12);
    const east1 = randInt(rng, 2, 10);
    const south1 = randInt(rng, 1, north1 + 6);
    const west1 = east1; // Aligns cleanly on North-South axis or East-West
    const netY = north1 - south1;
    const absDist = Math.abs(netY);
    const dir = netY > 0 ? 'au Nord' : netY < 0 ? 'au Sud' : 'au point de départ exact';
    const correct = netY === 0 ? 'À 0 km (point de départ)' : `${absDist} km ${dir}`;
    const { options, correctIndex } = pickUniqueOptions(rng, correct, [
      `${absDist + 2} km ${netY >= 0 ? 'au Nord' : 'au Sud'}`,
      `${north1 + south1} km à l'Est`,
      `${absDist === 0 ? 4 : absDist} km à l'Ouest`,
    ]);
    return {
      ...metaFor(id, 'enigma', 'Cap sur la Boussole', diff, 25),
      kind: 'mcq',
      prompt: `Un explorateur part de son camp. Il marche ${north1} km vers le Nord, puis ${east1} km vers l'Est, puis ${south1} km vers le Sud, et enfin ${west1} km vers l'Ouest. Où se trouve-t-il par rapport à son camp ?`,
      options,
      correctIndex,
      explanation: `Les ${east1} km à l'Est et ${west1} km à l'Ouest s'annulent. Sur l'axe Nord-Sud : ${north1} - ${south1} = ${netY} km.`,
    };
  }

  // Subtype 4: Clock / Calendar / Paradox Riddle
  const curatedFallback = CURATED_ENIGMAS[id % CURATED_ENIGMAS.length];
  if (id % 2 === 0) {
    const startH = randInt(rng, 8, 20);
    const addH = randInt(rng, 15, 75);
    const finalH = (startH + addH) % 24;
    const fmt = (h: number) => `${String(h).padStart(2, '0')}h00`;
    const { options, correctIndex } = pickUniqueOptions(rng, fmt(finalH), [
      fmt((finalH + 2) % 24),
      fmt((finalH + 23) % 24),
      fmt((finalH + 12) % 24),
    ]);
    return {
      ...metaFor(id, 'enigma', 'Énigme du Cadran', diff, 22),
      kind: 'mcq',
      prompt: `Il est exactement ${fmt(startH)}. Quelle heure sera-t-il dans précisément ${addH} heures ?`,
      options,
      correctIndex,
      explanation: `Toutes les 24 heures on revient à la même heure. (${startH} + ${addH}) modulo 24 = ${finalH}h00.`,
    };
  }

  const { options, correctIndex } = pickUniqueOptions(rng, curatedFallback.a, curatedFallback.wrong);
  return {
    ...metaFor(id, 'enigma', 'Énigme de l’Esprit', diff, 24),
    kind: 'mcq',
    prompt: curatedFallback.q,
    hint: curatedFallback.hint,
    options,
    correctIndex,
    explanation: curatedFallback.exp,
  };
}

// ==========================================
// 2. LOGIC / REFLEXION GENERATOR (IDs 2101..4300)
// ==========================================
function generateLogic(id: number): McqChallenge {
  const rng = createRng(id * 2027 + 19);
  const diff = difficultyFromSeed(id, 3);
  const subType = (id - 2101) % 4;

  // Subtype 0: Number sequences (arithmetic, increasing step, alternating, Fibonacci)
  if (subType === 0) {
    const mode = id % 4;
    let seq: number[] = [];
    let nextVal = 0;
    let exp = '';

    if (mode === 0) {
      const start = randInt(rng, 2, 18);
      const stepStart = randInt(rng, 2, 6);
      const stepDelta = randInt(rng, 2, 5);
      seq = [start];
      let curStep = stepStart;
      for (let i = 0; i < 4; i++) {
        seq.push(seq[seq.length - 1] + curStep);
        curStep += stepDelta;
      }
      nextVal = seq[seq.length - 1] + curStep;
      exp = `L'écart augmente de +${stepDelta} à chaque terme (+${stepStart}, +${stepStart + stepDelta}...). Dernier saut : +${curStep}.`;
    } else if (mode === 1) {
      const a = randInt(rng, 2, 9);
      const b = randInt(rng, 3, 12);
      seq = [a, b, a + b, b + (a + b), a + b + (b + a + b)];
      nextVal = seq[3] + seq[4];
      exp = `Chaque nombre est la somme des deux précédents : ${seq[3]} + ${seq[4]} = ${nextVal}.`;
    } else if (mode === 2) {
      const base = randInt(rng, 2, 5);
      const mult = randInt(rng, 2, 3);
      const add = randInt(rng, 1, 4);
      seq = [base];
      for (let i = 0; i < 4; i++) {
        seq.push(seq[seq.length - 1] * mult + add);
      }
      nextVal = seq[seq.length - 1] * mult + add;
      exp = `Règle : ×${mult} puis +${add} à chaque étape.`;
    } else {
      const a0 = randInt(rng, 5, 25);
      const b0 = randInt(rng, 40, 80);
      const dA = randInt(rng, 4, 9);
      const dB = randInt(rng, 3, 8);
      seq = [a0, b0, a0 + dA, b0 - dB, a0 + 2 * dA];
      nextVal = b0 - 2 * dB;
      exp = `Deux suites alternées : les positions impaires montent de +${dA}, les paires descendent de -${dB}.`;
    }

    const { options, correctIndex } = pickUniqueOptions(rng, String(nextVal), [
      String(nextVal + randInt(rng, 1, 5)),
      String(Math.max(1, nextVal - randInt(rng, 1, 5))),
      String(nextVal + randInt(rng, 6, 12)),
    ]);

    return {
      ...metaFor(id, 'logic', 'Suite Logique', diff, 25),
      kind: 'mcq',
      prompt: 'Observez la progression numérique ci-dessous. Quel nombre remplace le point d’interrogation ?',
      visual: {
        type: 'sequence',
        items: [...seq.map(String), '?'],
      },
      options,
      correctIndex,
      explanation: exp,
    };
  }

  // Subtype 1: Visual 3x3 SVG Geometric Matrix Reasoning
  if (subType === 1) {
    const shapes = ['circle', 'square', 'triangle'];
    const colors = ['#3B82F6', '#F59E0B', '#10B981'];
    const colorNames: Record<string, string> = {
      '#3B82F6': 'Bleu',
      '#F59E0B': 'Or',
      '#10B981': 'Émeraude',
    };
    const shapeNames: Record<string, string> = {
      circle: 'Cercle',
      square: 'Carré',
      triangle: 'Triangle',
    };

    const rowShapes = shuffleWithRng(rng, shapes);
    const colColors = shuffleWithRng(rng, colors);
    const cells: Array<{ shape: string; color: string; count: number; rotation: number } | null> = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 2 && c === 2) {
          cells.push(null);
        } else {
          cells.push({
            shape: rowShapes[(r + c) % 3],
            color: colColors[c],
            count: r + 1,
            rotation: 0,
          });
        }
      }
    }
    const targetShape = rowShapes[(2 + 2) % 3];
    const targetColor = colColors[2];
    const targetCount = 3;
    const correctLabel = `${targetCount}× ${shapeNames[targetShape]} (${colorNames[targetColor]})`;

    const wrongCandidates = [
      `${targetCount}× ${shapeNames[rowShapes[0]]} (${colorNames[targetColor]})`,
      `2× ${shapeNames[targetShape]} (${colorNames[targetColor]})`,
      `${targetCount}× ${shapeNames[targetShape]} (${colorNames[colColors[0]]})`,
      `1× ${shapeNames[rowShapes[1]]} (${colorNames[colColors[1]]})`,
    ];
    const { options, correctIndex } = pickUniqueOptions(rng, correctLabel, wrongCandidates);

    return {
      ...metaFor(id, 'logic', 'Matrice Visuelle', diff, 28),
      kind: 'mcq',
      prompt: 'Analysez les formes, les couleurs et les quantités dans la matrice 3×3. Quel élément complète la case manquante ?',
      visual: { type: 'matrix', cells },
      options,
      correctIndex,
      explanation: `Chaque ligne augmente le nombre d'éléments (1, 2, 3), chaque colonne fixe la couleur (${colorNames[targetColor]}), et les formes décalent en diagonale.`,
    };
  }

  // Subtype 2: Symbol Balance Equations
  if (subType === 2) {
    const a = randInt(rng, 3, 15);
    const b = randInt(rng, 2, 12);
    const c = randInt(rng, 1, 9);
    const sumAB = a + b;
    const sumAA = a + a;
    const ans = a * c + b;
    const { options, correctIndex } = pickUniqueOptions(rng, String(ans), [
      String(ans + a),
      String(ans + c),
      String(Math.max(1, ans - b)),
    ]);

    return {
      ...metaFor(id, 'logic', 'Équation Mystère', diff, 26),
      kind: 'mcq',
      prompt: 'Déduisez la valeur de chaque symbole puis calculez la dernière ligne :',
      visual: {
        type: 'equation',
        rows: [
          `◆ + ◆ = ${sumAA}`,
          `◆ + ● = ${sumAB}`,
          `● − ▲ = ${b - c}`,
          `◆ × ▲ + ● = ?`,
        ],
      },
      options,
      correctIndex,
      explanation: `◆ = ${a}, ● = ${b}, ▲ = ${c}. Donc ${a} × ${c} + ${b} = ${ans}.`,
    };
  }

  // Subtype 3: Truth / Liar Deduction
  const trio = shuffleWithRng(rng, ['Camille', 'Sofiane', 'Kenza', 'Bastien', 'Nadia']).slice(0, 3);
  const winnerIdx = randInt(rng, 0, 2);
  const statements = trio.map((person, idx) => {
    if (idx === winnerIdx) {
      return `${person} dit : « Ce n'est pas ${trio[(idx + 1) % 3]} qui a le trophée. »`;
    }
    return `${person} dit : « C'est moi qui ai le trophée ! »`;
  });
  // Only ONE person tells the truth -> if winnerIdx is X, X says it's not X+1 (TRUE), the other two claim they have it (FALSE)!
  const winner = trio[winnerIdx];
  const { options, correctIndex } = pickUniqueOptions(rng, winner, trio);

  return {
    ...metaFor(id, 'logic', 'Vérité ou Mensonge', diff, 28),
    kind: 'mcq',
    prompt: `Une seule de ces trois personnes dit la vérité. Qui détient le trophée ?\n• ${statements[0]}\n• ${statements[1]}\n• ${statements[2]}`,
    options,
    correctIndex,
    explanation: `Si ${winner} détient le trophée, sa phrase est vraie et les deux autres qui s'attribuent le trophée mentent. Une seule vérité !`,
  };
}

// ==========================================
// 3. FOCUS / CONCENTRATION GENERATOR (IDs 4301..6400)
// ==========================================
function generateFocus(id: number): Challenge {
  const rng = createRng(id * 3037 + 31);
  const diff = difficultyFromSeed(id, 5);
  const subType = (id - 4301) % 4;

  // Subtype 0: Memory Grid Flash
  if (subType === 0) {
    const gridSize = diff === 'facile' ? 3 : diff === 'maitre' ? 5 : 4;
    const totalCells = gridSize * gridSize;
    const targetCount = diff === 'facile' ? 4 : diff === 'moyen' ? 5 : diff === 'difficile' ? 6 : 7;
    const allIndices = Array.from({ length: totalCells }, (_, i) => i);
    const targets = shuffleWithRng(rng, allIndices).slice(0, targetCount).sort((a, b) => a - b);
    const previewMs = diff === 'facile' ? 2500 : diff === 'moyen' ? 2200 : 1900;

    return {
      ...metaFor(id, 'focus', 'Mémoire Flash', diff, 22),
      kind: 'memory-grid',
      prompt: `Mémorisez les ${targetCount} cases illuminées avant qu'elles ne disparaissent, puis cliquez exactement dessus !`,
      gridSize,
      targets,
      previewMs,
      explanation: `Il fallait retrouver les ${targetCount} positions exactes sur la grille ${gridSize}×${gridSize}.`,
    } satisfies MemoryGridChallenge;
  }

  // Subtype 1: Spot the Intruder
  if (subType === 1) {
    const gridSize = diff === 'facile' ? 4 : diff === 'moyen' ? 5 : 6;
    const shapes: Array<'circle' | 'square' | 'triangle' | 'diamond' | 'hex'> = [
      'circle', 'square', 'triangle', 'diamond', 'hex',
    ];
    const palette = ['#38BDF8', '#F59E0B', '#10B981', '#F43F5E', '#A78BFA'];
    const baseShape = shapes[randInt(rng, 0, shapes.length - 1)];
    const baseColor = palette[randInt(rng, 0, palette.length - 1)];
    const baseRotation = [0, 45, 90, 180][randInt(rng, 0, 3)];
    const letters = ['M', 'W', 'E', 'F', 'P', 'R', 'Q', 'O', '8', 'B', '6', '9'];
    const pairIdx = randInt(rng, 0, 5) * 2;
    const baseLabel = letters[pairIdx];
    const oddLabelCandidate = letters[pairIdx + 1];

    const diffKind = randInt(rng, 0, 2);
    let oddShape = baseShape;
    let oddColor = baseColor;
    let oddRotation = baseRotation;
    let oddLabel = baseLabel;
    let detail = '';

    if (diffKind === 0) {
      oddLabel = oddLabelCandidate;
      detail = `Un seul symbole affiche « ${oddLabel} » au lieu de « ${baseLabel} ».`;
    } else if (diffKind === 1) {
      const otherShapes = shapes.filter((s) => s !== baseShape);
      oddShape = otherShapes[randInt(rng, 0, otherShapes.length - 1)];
      detail = `Une seule case a une forme géométrique différente.`;
    } else {
      const otherColors = palette.filter((c) => c !== baseColor);
      oddColor = otherColors[randInt(rng, 0, otherColors.length - 1)];
      detail = `Une seule case possède une teinte différente.`;
    }

    const oddIndex = randInt(rng, 0, gridSize * gridSize - 1);

    return {
      ...metaFor(id, 'focus', "Chasse à l'Intrus", diff, 16),
      kind: 'spot-diff',
      prompt: `Trouvez et cliquez sur l'unique intrus caché dans cette grille ${gridSize}×${gridSize} !`,
      gridSize,
      baseShape,
      baseColor,
      baseRotation,
      baseLabel,
      oddIndex,
      oddShape,
      oddColor,
      oddRotation,
      oddLabel,
      explanation: detail,
    } satisfies SpotDiffChallenge;
  }

  // Subtype 2: Simon Sequence (forward or reverse)
  if (subType === 2) {
    const seqLen = diff === 'facile' ? 4 : diff === 'moyen' ? 5 : diff === 'difficile' ? 6 : 7;
    const reverse = diff === 'difficile' || diff === 'maitre' ? id % 2 === 0 : false;
    const padColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
    const padLabels = ['1', '2', '3', '4', '5', '6'];
    const sequence: number[] = [];
    for (let i = 0; i < seqLen; i++) {
      sequence.push(randInt(rng, 0, 5));
    }

    return {
      ...metaFor(id, 'focus', reverse ? 'Séquence Inversée' : 'Séquence Lumineuse', diff, 24),
      kind: 'simon-seq',
      prompt: reverse
        ? `Observez la séquence de ${seqLen} signaux, puis rejouez-la À L'ENVERS (du dernier au premier) !`
        : `Observez attentivement la séquence de ${seqLen} signaux, puis reproduisez-la dans l'ordre exact !`,
      reverse,
      sequence,
      padColors,
      padLabels,
      explanation: reverse
        ? `La séquence inversée attendue était : ${[...sequence].reverse().map((n) => n + 1).join(' → ')}.`
        : `La séquence exacte était : ${sequence.map((n) => n + 1).join(' → ')}.`,
    } satisfies SimonSeqChallenge;
  }

  // Subtype 3: Stroop Trap
  const colorSet = [
    { label: 'ROUGE', hex: '#EF4444' },
    { label: 'BLEU', hex: '#3B82F6' },
    { label: 'VERT', hex: '#10B981' },
    { label: 'JAUNE', hex: '#FACC15' },
  ];
  const wordItem = colorSet[randInt(rng, 0, colorSet.length - 1)];
  const otherColors = colorSet.filter((c) => c.label !== wordItem.label);
  const inkItem = otherColors[randInt(rng, 0, otherColors.length - 1)];
  const askFor: 'ink' | 'word' = id % 2 === 0 ? 'ink' : 'word';
  const shuffledOpts = shuffleWithRng(rng, colorSet);
  const targetLabel = askFor === 'ink' ? inkItem.label : wordItem.label;
  const correctIndex = shuffledOpts.findIndex((o) => o.label === targetLabel);

  return {
    ...metaFor(id, 'focus', 'Piège de Stroop', diff, 12),
    kind: 'stroop',
    prompt:
      askFor === 'ink'
        ? "Attention au piège ! Sélectionnez la COULEUR DE L'ENCRE affichée (ignorez le mot écrit) :"
        : 'Attention au piège ! Sélectionnez le MOT ÉCRIT (ignorez la couleur de l’encre) :',
    askFor,
    wordText: wordItem.label,
    inkColorName: inkItem.label,
    inkHex: inkItem.hex,
    options: shuffledOpts,
    correctIndex,
    explanation:
      askFor === 'ink'
        ? `Le mot écrit était « ${wordItem.label} », mais son encre était bien ${inkItem.label}.`
        : `L'encre était ${inkItem.label}, mais le mot écrit était bien « ${wordItem.label} ».`,
  } satisfies StroopChallenge;
}

// ==========================================
// 4. SPEED / RAPIDITÉ GENERATOR (IDs 6401..8500)
// ==========================================
function generateSpeed(id: number): Challenge {
  const rng = createRng(id * 4049 + 43);
  const diff = difficultyFromSeed(id, 2);
  const subType = (id - 6401) % 3;

  // Subtype 0: Ascending / Descending Order Tap
  if (subType === 0) {
    const count = diff === 'facile' ? 6 : diff === 'maitre' ? 8 : 7;
    const descending = id % 3 === 0;
    const values = new Set<number>();
    while (values.size < count) {
      values.add(randInt(rng, -12, 85));
    }
    const rawArr = Array.from(values);
    const tiles = shuffleWithRng(
      rng,
      rawArr.map((v, idx) => {
        // Occasionally format as quick arithmetic expression on harder levels
        if (diff !== 'facile' && idx % 3 === 0) {
          const split = randInt(rng, 2, 9);
          return { id: idx, label: `${v - split}+${split}`, value: v };
        }
        return { id: idx, label: String(v), value: v };
      })
    );

    return {
      ...metaFor(id, 'speed', descending ? 'Tri Éclair Décroissant' : 'Tri Éclair Croissant', diff, 15),
      kind: 'order-tap',
      prompt: descending
        ? `Cliquez sur les ${count} tuiles du PLUS GRAND au PLUS PETIT le plus vite possible !`
        : `Cliquez sur les ${count} tuiles du PLUS PETIT au PLUS GRAND le plus vite possible !`,
      descending,
      tiles,
      explanation: `L'ordre exact était : ${[...rawArr]
        .sort((a, b) => (descending ? b - a : a - b))
        .join(' → ')}.`,
    } satisfies OrderTapChallenge;
  }

  // Subtype 1: Lightning Mental Math
  if (subType === 1) {
    const op = id % 3;
    let q = '';
    let ans = 0;
    if (op === 0) {
      const a = randInt(rng, 24, 148);
      const b = randInt(rng, 17, 99);
      const c = randInt(rng, 5, 35);
      ans = a + b - c;
      q = `${a} + ${b} − ${c} = ?`;
    } else if (op === 1) {
      const a = randInt(rng, 6, 18);
      const b = randInt(rng, 4, 14);
      const c = randInt(rng, 3, 25);
      ans = a * b + c;
      q = `${a} × ${b} + ${c} = ?`;
    } else {
      const pct = [10, 20, 25, 50][randInt(rng, 0, 3)];
      const base = randInt(rng, 4, 30) * 20;
      ans = (base * pct) / 100;
      q = `Combien font ${pct}% de ${base} ?`;
    }
    const { options, correctIndex } = pickUniqueOptions(rng, String(ans), [
      String(ans + 10),
      String(Math.max(1, ans - 4)),
      String(ans + 2),
    ]);
    return {
      ...metaFor(id, 'speed', 'Calcul Éclair', diff, 12),
      kind: 'mcq',
      prompt: `Répondez avant la fin du chrono !\n${q}`,
      options,
      correctIndex,
      explanation: `La réponse exacte est ${ans}.`,
    };
  }

  // Subtype 2: Rapid Word Scramble
  const entry = FRENCH_WORD_FORGE_BANK[(id + randInt(rng, 0, 10)) % FRENCH_WORD_FORGE_BANK.length];
  let scrambled = shuffleWithRng(rng, entry.word.split(''));
  if (scrambled.join('') === entry.word) {
    scrambled = [...entry.word.slice(1).split(''), entry.word[0]];
  }
  return {
    ...metaFor(id, 'speed', 'Anagrame Express', diff, 18),
    kind: 'word-scramble',
    prompt: 'Reconstituez ce mot français lettre par lettre avant la fin du temps !',
    clue: entry.clue,
    targetWord: entry.word,
    scrambledLetters: scrambled,
    explanation: `${entry.word} : ${entry.exp}`,
  } satisfies WordScrambleChallenge;
}

// ==========================================
// 5. CREATION & INGENUITY GENERATOR (IDs 8501..10500)
// ==========================================
export function rotatePipeMask(mask: number, steps: number): number {
  let m = mask & 15;
  const s = ((steps % 4) + 4) % 4;
  for (let i = 0; i < s; i++) {
    m = ((m << 1) | (m >> 3)) & 15;
  }
  return m;
}

export function getPipeBaseMask(type: 'straight' | 'corner' | 'tee'): number {
  if (type === 'straight') return 1 | 4; // N + S
  if (type === 'corner') return 1 | 2; // N + E
  return 1 | 2 | 4; // N + E + S
}

export function isPipeCircuitSolved(
  tiles: Array<{ type: 'straight' | 'corner' | 'tee' }>,
  rotations: number[],
  startIndex: number,
  endIndex: number
): boolean {
  const N = 1;
  const E = 2;
  const S = 4;
  const W = 8;

  const masks = tiles.map((t, idx) => rotatePipeMask(getPipeBaseMask(t.type), rotations[idx]));
  // Start must accept entry from West
  if ((masks[startIndex] & W) === 0) return false;

  const visited = new Set<number>([startIndex]);
  const queue = [startIndex];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === endIndex && (masks[curr] & E) !== 0) {
      return true;
    }
    const r = Math.floor(curr / 4);
    const c = curr % 4;
    const m = masks[curr];

    // North
    if ((m & N) && r > 0) {
      const nxt = (r - 1) * 4 + c;
      if (!visited.has(nxt) && (masks[nxt] & S)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
    // East
    if ((m & E) && c < 3) {
      const nxt = r * 4 + (c + 1);
      if (!visited.has(nxt) && (masks[nxt] & W)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
    // South
    if ((m & S) && r < 3) {
      const nxt = (r + 1) * 4 + c;
      if (!visited.has(nxt) && (masks[nxt] & N)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
    // West
    if ((m & W) && c > 0) {
      const nxt = r * 4 + (c - 1);
      if (!visited.has(nxt) && (masks[nxt] & E)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
  }
  return false;
}

function generateCreation(id: number): Challenge {
  const rng = createRng(id * 5051 + 61);
  const diff = difficultyFromSeed(id, 1);
  const subType = (id - 8501) % 4;

  // Subtype 0: Symmetry Pixel Mosaic Builder
  if (subType === 0) {
    const gridSize = diff === 'facile' || diff === 'moyen' ? 5 : 6;
    const axis: 'vertical' | 'horizontal' = id % 2 === 0 ? 'vertical' : 'horizontal';
    const givenCells: number[] = [];
    const targetMissingCells: number[] = [];
    const half = Math.floor(gridSize / 2);

    if (axis === 'vertical') {
      const targetActiveCount = diff === 'facile' ? 4 : 5;
      const leftCoords: Array<[number, number]> = [];
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < half; c++) {
          leftCoords.push([r, c]);
        }
      }
      const chosen = shuffleWithRng(rng, leftCoords).slice(0, targetActiveCount);
      for (const [r, c] of chosen) {
        givenCells.push(r * gridSize + c);
        const mirrorC = gridSize - 1 - c;
        targetMissingCells.push(r * gridSize + mirrorC);
      }
    } else {
      const targetActiveCount = diff === 'facile' ? 4 : 5;
      const topCoords: Array<[number, number]> = [];
      for (let r = 0; r < half; r++) {
        for (let c = 0; c < gridSize; c++) {
          topCoords.push([r, c]);
        }
      }
      const chosen = shuffleWithRng(rng, topCoords).slice(0, targetActiveCount);
      for (const [r, c] of chosen) {
        givenCells.push(r * gridSize + c);
        const mirrorR = gridSize - 1 - r;
        targetMissingCells.push(mirrorR * gridSize + c);
      }
    }

    targetMissingCells.sort((a, b) => a - b);

    return {
      ...metaFor(id, 'creation', 'Mosaïque Symétrique', diff, 26),
      kind: 'symmetry-draw',
      prompt:
        axis === 'vertical'
          ? 'Complétez le côté droit du motif par symétrie miroir verticale exacte !'
          : 'Complétez la moitié inférieure du motif par symétrie miroir horizontale exacte !',
      gridSize,
      axis,
      givenCells,
      targetMissingCells,
      explanation: `Chaque bloc coloré devait être reproduit exactement à l'opposé de l'axe central.`,
    } satisfies SymmetryDrawChallenge;
  }

  // Subtype 1: 4x4 Pipe Circuit Builder
  if (subType === 1) {
    const startRow = randInt(rng, 0, 3);
    const endRow = randInt(rng, 0, 3);
    // Build a deterministic simple path from (startRow, 0) to (endRow, 3)
    const path: number[] = [];
    let r = startRow;
    let c = 0;
    path.push(r * 4 + c);
    const midCol = randInt(rng, 1, 2);
    while (c < midCol) {
      c++;
      path.push(r * 4 + c);
    }
    while (r !== endRow) {
      r += r < endRow ? 1 : -1;
      path.push(r * 4 + c);
    }
    while (c < 3) {
      c++;
      path.push(r * 4 + c);
    }

    const startIndex = path[0];
    const endIndex = path[path.length - 1];

    const N = 1;
    const E = 2;
    const S = 4;
    const W = 8;

    const requiredMask = new Array<number>(16).fill(0);
    for (let i = 0; i < path.length; i++) {
      const curr = path[i];
      let mask = 0;
      if (i === 0) mask |= W;
      if (i === path.length - 1) mask |= E;
      if (i > 0) {
        const prev = path[i - 1];
        if (prev === curr - 4) mask |= N;
        else if (prev === curr + 4) mask |= S;
        else if (prev === curr - 1) mask |= W;
        else if (prev === curr + 1) mask |= E;
      }
      if (i < path.length - 1) {
        const nxt = path[i + 1];
        if (nxt === curr - 4) mask |= N;
        else if (nxt === curr + 4) mask |= S;
        else if (nxt === curr - 1) mask |= W;
        else if (nxt === curr + 1) mask |= E;
      }
      requiredMask[curr] = mask;
    }

    const tiles: PipeConnectChallenge['tiles'] = [];
    for (let idx = 0; idx < 16; idx++) {
      const req = requiredMask[idx];
      let type: 'straight' | 'corner' | 'tee' = 'corner';
      let solvedRot = 0;

      if (req !== 0) {
        if (req === (N | S) || req === (E | W)) {
          type = 'straight';
          solvedRot = req === (N | S) ? 0 : 1;
        } else {
          type = 'corner';
          for (let rot = 0; rot < 4; rot++) {
            if (rotatePipeMask(getPipeBaseMask('corner'), rot) === req) {
              solvedRot = rot;
              break;
            }
          }
        }
        const initialRot = (solvedRot + randInt(rng, 1, 3)) % 4;
        tiles.push({ type, initialRot, solvedRot });
      } else {
        const fillerTypes: Array<'straight' | 'corner' | 'tee'> = ['straight', 'corner', 'tee'];
        const fType = fillerTypes[randInt(rng, 0, 2)];
        const rot = randInt(rng, 0, 3);
        tiles.push({ type: fType, initialRot: rot, solvedRot: rot });
      }
    }

    return {
      ...metaFor(id, 'creation', 'Circuit Énergétique', diff, 34),
      kind: 'pipe-connect',
      prompt: 'Cliquez sur les tuiles pour les pivoter et relier l’entrée (gauche) à la sortie (droite) !',
      gridSize: 4,
      tiles,
      startIndex,
      endIndex,
      explanation: 'Le courant devait traverser en continu du port d’entrée jusqu’au port de sortie.',
    } satisfies PipeConnectChallenge;
  }

  // Subtype 2: Spatial Logic Arrangement (4 ordered slots)
  if (subType === 2) {
    const tokens = shuffleWithRng(rng, [
      { id: 'bleu', label: 'Azur', color: '#3B82F6' },
      { id: 'or', label: 'Or', color: '#F59E0B' },
      { id: 'emeraude', label: 'Émeraude', color: '#10B981' },
      { id: 'rubis', label: 'Rubis', color: '#EF4444' },
    ]);
    // tokens order IS the target solution [0, 1, 2, 3]
    const [t0, t1, t2, t3] = tokens;
    const clues = [
      `${t0.label} est à la 1re place ou juste avant ${t1.label} — en fait ${t0.label} est tout à gauche (position 1).`,
      `${t2.label} se trouve quelque part à droite de ${t1.label}.`,
      `${t3.label} est placé juste après ${t2.label} (tout à droite).`,
      `${t1.label} n'est pas voisin de ${t3.label}.`,
    ];
    const items = shuffleWithRng(rng, tokens);

    return {
      ...metaFor(id, 'creation', 'Architecture Logique', diff, 28),
      kind: 'logic-arrange',
      prompt: 'Placez les 4 modules dans les 4 emplacements en respectant tous les indices :',
      items,
      clues,
      solutionIds: tokens.map((t) => t.id),
      explanation: `L'ordre exact de gauche à droite était : ${tokens.map((t) => t.label).join(' → ')}.`,
    } satisfies LogicArrangeChallenge;
  }

  // Subtype 3: Word Forge Creation
  const entry = FRENCH_WORD_FORGE_BANK[(id * 3 + randInt(rng, 0, 15)) % FRENCH_WORD_FORGE_BANK.length];
  let scrambled = shuffleWithRng(rng, entry.word.split(''));
  if (scrambled.join('') === entry.word) {
    scrambled = [...entry.word.slice(1).split(''), entry.word[0]];
  }
  return {
    ...metaFor(id, 'creation', 'Forge de Mots', diff, 24),
    kind: 'word-scramble',
    prompt: 'Assemblez les lettres disponibles pour forger le mot correspondant à la définition :',
    clue: entry.clue,
    targetWord: entry.word,
    scrambledLetters: scrambled,
    explanation: `${entry.word} : ${entry.exp}`,
  } satisfies WordScrambleChallenge;
}

// ==========================================
// 6. RIDDLE / WORLD CULTURE GENERATOR (IDs 10501..12500)
// ==========================================
function generateWorldRiddle(id: number): McqChallenge {
  const rng = createRng(id * 6067 + 79);
  const diff = difficultyFromSeed(id, 4);
  const subType = (id - 10501) % 5;

  // Country pool widens as difficulty rises
  const poolLimit =
    diff === 'facile'
      ? 40
      : diff === 'moyen'
      ? 95
      : diff === 'difficile'
      ? 150
      : COUNTRIES.length;
  const countryPool = COUNTRIES.slice(0, poolLimit);

  // Subtype 0: Visual Flag -> Country Quiz
  if (subType === 0) {
    const target = countryPool[(id + randInt(rng, 0, countryPool.length - 1)) % countryPool.length];
    const sameContinent = COUNTRIES.filter(
      (c) => c.continent === target.continent && c.code !== target.code
    );
    const distractors = shuffleWithRng(rng, sameContinent)
      .slice(0, 3)
      .map((c) => c.name);
    const { options, correctIndex } = pickUniqueOptions(rng, target.name, distractors);

    return {
      ...metaFor(id, 'riddle', 'Drapeau du Monde', diff, 60),
      kind: 'mcq',
      prompt: `À quel pays (continent : ${target.continent}) appartient ce drapeau ?`,
      visual: { type: 'flag', countryCode: target.code, flag: target.flag },
      options,
      correctIndex,
      explanation: `Ce drapeau est celui de : ${target.name} (capitale : ${target.capital}).`,
    };
  }

  // Subtype 1: World Capital Quiz
  if (subType === 1) {
    const target = countryPool[(id * 7 + randInt(rng, 0, 50)) % countryPool.length];
    const others = COUNTRIES.filter((c) => c.code !== target.code && c.capital !== target.capital);
    const distractors = shuffleWithRng(rng, others)
      .slice(0, 3)
      .map((c) => c.capital);
    const { options, correctIndex } = pickUniqueOptions(rng, target.capital, distractors);

    return {
      ...metaFor(id, 'riddle', 'Capitale du Monde', diff, 60),
      kind: 'mcq',
      prompt: `Quelle est la capitale de ce pays : ${target.flag} ${target.name} ?`,
      options,
      correctIndex,
      explanation: `La capitale de ${target.name} est ${target.capital}.`,
    };
  }

  // Subtype 2 & 3: World, Animals, Oceans, Mountains, Countries & Infrastructure Quiz
  if (subType === 2 || subType === 3) {
    const matchingTier = WORLD_CULTURE_BANK.filter((q) => q.difficulty === diff);
    const pool = matchingTier.length > 0 ? matchingTier : WORLD_CULTURE_BANK;
    const item = pool[(id + randInt(rng, 0, pool.length - 1)) % pool.length];
    const { options, correctIndex } = pickUniqueOptions(rng, item.a, item.wrong);
    return {
      ...metaFor(id, 'riddle', `${item.theme} · Monde`, diff, 60),
      kind: 'mcq',
      prompt: item.q,
      options,
      correctIndex,
      explanation: item.exp,
    };
  }

  // Subtype 4: Visual Rebus Icon Pair
  const rebus = REBUS_PAIRS[id % REBUS_PAIRS.length];
  const { options, correctIndex } = pickUniqueOptions(rng, rebus.a, rebus.wrong);
  return {
    ...metaFor(id, 'riddle', 'Rébus Visuel', diff, 60),
    kind: 'mcq',
    prompt: 'Observez l’association d’icônes ci-dessous et devinez le mot ou la notion correspondante :',
    visual: { type: 'icons', tokens: rebus.icons },
    options,
    correctIndex,
    explanation: `${rebus.a} — ${rebus.exp}`,
  };
}

export function getChallengeById(rawId: number, answeredCount = 0): Challenge {
  const id = Math.max(1, Math.min(TOTAL_CHALLENGES, Math.floor(rawId)));
  let challenge: Challenge;
  if (id <= 2100) challenge = generateEnigma(id);
  else if (id <= 4300) challenge = generateLogic(id);
  else if (id <= 6400) challenge = generateFocus(id);
  else if (id <= 8500) challenge = generateSpeed(id);
  else if (id <= 10500) challenge = generateCreation(id);
  else challenge = generateWorldRiddle(id);

  return {
    ...challenge,
    timeLimitSec: getTimeLimitForProgress(answeredCount),
  };
}

export function pickRandomChallengeId(
  category: ChallengeCategory | 'all' = 'all',
  excludeIds: Set<number> = new Set(),
  answeredCount = 0
): number {
  let min = 1;
  let max = TOTAL_CHALLENGES;
  if (category !== 'all') {
    const info = CHALLENGE_CATEGORIES.find((c) => c.id === category);
    if (info) {
      min = info.rangeStart;
      max = info.rangeEnd;
    }
  }

  const targetDiff = getDifficultyTierForProgress(answeredCount);

  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
    if (excludeIds.has(candidate)) continue;
    const ch = getChallengeById(candidate, answeredCount);
    if (ch.difficulty === targetDiff) {
      return candidate;
    }
  }

  // Fallback preserving difficulty even if excludeIds is large
  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
    const ch = getChallengeById(candidate, answeredCount);
    if (ch.difficulty === targetDiff) return candidate;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}
