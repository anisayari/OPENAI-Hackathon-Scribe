export interface ScriptAnalysis {
  idea_details: {
    main_concept: string;
    key_points: string[];
    unique_angle: string;
    value_proposition: string;
  };
  things_to_explore: Array<{
    topic: string;
    why_interesting: string;
    potential_content: string;
  }>;
  keywords: {
    primary: string[];
    secondary: string[];
    youtube_tags: string[];
    search_phrases: string[];
  };
}

export const mockScriptAnalyses: Record<string, ScriptAnalysis> = {
  default: {
    idea_details: {
      main_concept: "Histoire inspirante de persévérance et d'innovation dans l'industrie spatiale",
      key_points: [
        "La création audacieuse de SpaceX par Elon Musk en 2002",
        "Les échecs initiaux et la quasi-faillite de l'entreprise",
        "Le développement révolutionnaire des fusées réutilisables",
        "La domination actuelle du marché des lancements spatiaux",
        "La vision future de la colonisation de Mars"
      ],
      unique_angle: "L'histoire est racontée comme un récit de transformation de l'impossible au possible",
      value_proposition: "Inspire les spectateurs en montrant comment la persévérance peut transformer des rêves fous en réalité"
    },
    things_to_explore: [
      {
        topic: "Les détails techniques des fusées réutilisables",
        why_interesting: "Les spectateurs sont fascinés par la technologie derrière les atterrissages de fusées",
        potential_content: "Créer une vidéo explicative sur le fonctionnement des systèmes de propulsion et d'atterrissage"
      },
      {
        topic: "La compétition avec Blue Origin et autres entreprises spatiales",
        why_interesting: "La rivalité entre milliardaires dans l'espace captive l'attention du public",
        potential_content: "Comparer les approches et technologies de SpaceX, Blue Origin, et Virgin Galactic"
      },
      {
        topic: "Le projet Starship et la colonisation de Mars",
        why_interesting: "L'idée de vivre sur Mars fascine et intrigue",
        potential_content: "Explorer les défis techniques et humains de l'établissement d'une colonie martienne"
      }
    ],
    keywords: {
      primary: ["SpaceX", "Elon Musk", "fusées réutilisables", "innovation spatiale", "Mars"],
      secondary: [
        "Falcon 9", "Starship", "NASA", "industrie spatiale", "technologie",
        "entrepreneuriat", "persévérance", "exploration spatiale", "fusée", "satellite"
      ],
      youtube_tags: [
        "SpaceX histoire", "Elon Musk success story", "fusées réutilisables explication",
        "colonisation Mars", "innovation technologique", "startup spatiale", "Falcon Heavy",
        "ISS mission privée", "révolution spatiale", "entrepreneur visionnaire"
      ],
      search_phrases: [
        "comment SpaceX a révolutionné l'espace",
        "histoire de SpaceX en français",
        "pourquoi les fusées SpaceX reviennent sur Terre",
        "Elon Musk et la conquête de Mars"
      ]
    }
  },
  biography: {
    idea_details: {
      main_concept: "Portrait d'une personnalité influente qui a changé le monde",
      key_points: [
        "Enfance et origines modestes",
        "Moment décisif qui a changé sa trajectoire",
        "Obstacles majeurs surmontés",
        "Accomplissements révolutionnaires",
        "Impact durable sur la société"
      ],
      unique_angle: "Focus sur les moments de doute et de transformation personnelle",
      value_proposition: "Montre comment une personne ordinaire peut accomplir l'extraordinaire"
    },
    things_to_explore: [
      {
        topic: "Les influences cachées et mentors méconnus",
        why_interesting: "Révèle les coulisses du succès",
        potential_content: "Interview ou recherche sur les personnes qui ont influencé le parcours"
      },
      {
        topic: "Les échecs non documentés",
        why_interesting: "Humanise la personnalité et inspire",
        potential_content: "Compilation des tentatives ratées avant le succès"
      }
    ],
    keywords: {
      primary: ["biographie", "success story", "inspiration", "leadership", "innovation"],
      secondary: ["parcours", "défis", "réussite", "impact", "héritage"],
      youtube_tags: ["biographie inspirante", "histoire vraie", "success story française"],
      search_phrases: ["qui est vraiment", "histoire complète de", "parcours inspirant"]
    }
  },
  tutorial: {
    idea_details: {
      main_concept: "Guide pratique étape par étape pour maîtriser une compétence",
      key_points: [
        "Prérequis et matériel nécessaire",
        "Étapes détaillées avec démonstrations visuelles",
        "Erreurs courantes à éviter",
        "Astuces de professionnels",
        "Exercices pratiques progressifs"
      ],
      unique_angle: "Approche orientée résultats avec exemples concrets",
      value_proposition: "Permet d'acquérir rapidement une compétence pratique"
    },
    things_to_explore: [
      {
        topic: "Cas d'usage avancés",
        why_interesting: "Les apprenants veulent aller plus loin",
        potential_content: "Série de tutoriels niveau expert"
      },
      {
        topic: "Troubleshooting et FAQ",
        why_interesting: "Anticipe les problèmes des débutants",
        potential_content: "Guide de résolution des problèmes courants"
      }
    ],
    keywords: {
      primary: ["tutoriel", "comment faire", "guide", "apprendre", "formation"],
      secondary: ["débutant", "facile", "étape par étape", "cours", "pratique"],
      youtube_tags: ["tuto français", "apprendre facilement", "guide complet", "formation gratuite"],
      search_phrases: ["comment faire pour", "tutoriel débutant", "apprendre rapidement"]
    }
  }
};

export function getMockAnalysis(scriptType?: string): Promise<ScriptAnalysis> {
  // Simulate some processing delay
  const delay = Math.random() * 1000 + 500; // 0.5-1.5 seconds
  
  return new Promise<ScriptAnalysis>((resolve) => {
    setTimeout(() => {
      const analysis = mockScriptAnalyses[scriptType || 'default'] || mockScriptAnalyses.default;
      // Add some randomization to make it feel more dynamic
      const randomizedAnalysis = {
        ...analysis,
        idea_details: {
          ...analysis.idea_details,
          key_points: [...analysis.idea_details.key_points].sort(() => Math.random() - 0.5).slice(0, 4)
        }
      };
      resolve(randomizedAnalysis);
    }, delay);
  });
}

export const mockScripts = {
  humanoid: `# The Evolution of Humanoid Robots: From Mechanical Dreams to Economic Revolution

## Introduction (Hook - 20 seconds)
What if I told you that in less than a decade, humanoid robots will be as common as smartphones? That they'll transform our economy more profoundly than the internet did? This isn't science fiction anymore. This is happening right now.

## Act 1: The Ancient Dream (The Origins)
Our fascination with creating artificial humans dates back millennia. From ancient Greek myths of Talos, the bronze automaton, to Leonardo da Vinci's mechanical knight in 1495. The 18th century brought us intricate clockwork figures, and the 20th century saw the birth of the word "robot" itself in 1920.

## Act 2: The Technological Breakthrough (Modern Era)
The real revolution began with ASIMO in 2000 - Honda's breakthrough that proved bipedal walking was possible. Boston Dynamics changed the game with Atlas, showing robots could do backflips. But 2023-2024 marks the inflection point: Tesla's Optimus, NVIDIA's Project GR00T, Figure AI's partnerships with OpenAI, and China's rapid humanoid development.

## Act 3: The Economic Tsunami (Impact & Future)
McKinsey predicts humanoid robots will be a $6 trillion market by 2035. They'll transform manufacturing, healthcare, elderly care, and domestic work. But what about jobs? History shows technology creates more jobs than it destroys - but this transition will be unprecedented. We're not just automating tasks; we're creating artificial workers.

## Conclusion (Call to Action)
The humanoid revolution isn't coming - it's here. The question isn't whether they'll change our world, but how we'll adapt. Will you be ready for the economy of tomorrow?`,
  
  spacex: `# L'histoire de SpaceX : De l'impossible au possible

## Introduction (Hook - 15 secondes)
Imaginez qu'on vous dise que dans 20 ans, des fusées privées enverraient des astronautes dans l'espace et reviendraient se poser toutes seules sur Terre. Vous auriez ri, n'est-ce pas ? Pourtant, c'est exactement ce qu'a réalisé SpaceX.

## Acte 1 : Les débuts difficiles
En 2002, Elon Musk crée SpaceX avec une vision folle : réduire le coût de l'accès à l'espace et coloniser Mars. Les trois premiers lancements de leur fusée Falcon 1 sont des échecs cuisants. L'entreprise est au bord de la faillite.

## Acte 2 : La percée
En 2008, le quatrième lancement est un succès. SpaceX devient la première entreprise privée à mettre un satellite en orbite. Mais le vrai tournant arrive avec le développement des fusées réutilisables.

## Acte 3 : La révolution
Aujourd'hui, SpaceX domine le marché des lancements spatiaux. Les fusées Falcon 9 atterrissent comme dans les films de science-fiction. La société a envoyé des astronautes vers l'ISS et prépare activement la colonisation de Mars avec Starship.

## Conclusion
L'histoire de SpaceX nous enseigne qu'avec de la persévérance et une vision audacieuse, même l'impossible peut devenir réalité.`,

  mariecurie: `# Marie Curie : La pionnière qui a brisé toutes les barrières

## Hook (20 secondes)
Dans un laboratoire glacial de Paris, une femme travaille 16 heures par jour, manipulant des substances mortellement radioactives. Elle deviendra la seule personne de l'histoire à recevoir deux Prix Nobel dans deux sciences différentes.

## Acte 1 : L'étudiante déterminée
Maria Sklodowska quitte la Pologne occupée pour étudier à Paris. Vivant dans la pauvreté, elle s'évanouit parfois de faim pendant les cours. Mais rien ne peut arrêter sa soif de connaissance.

## Acte 2 : La découverte révolutionnaire
Avec son mari Pierre, elle découvre le polonium et le radium. Leur laboratoire ? Un hangar délabré. Leur équipement ? Rudimentaire. Leur détermination ? Inébranlable.

## Acte 3 : Le triomphe et la tragédie
Premier Nobel en 1903. Veuve en 1906. Scandales et discrimination. Deuxième Nobel en 1911. Elle transforme la science tout en combattant le sexisme de son époque.

## Outro
Marie Curie n'a pas seulement découvert la radioactivité. Elle a prouvé qu'aucune barrière ne peut arrêter le génie humain.`,

  cooking: `# Maîtriser les Pâtes Carbonara : La Vraie Recette Italienne

## Introduction (15 secondes)
90% des gens font les carbonara de la mauvaise façon. Aujourd'hui, je vais vous montrer la technique authentique qui transformera ce plat simple en chef-d'œuvre culinaire.

## Étape 1 : Les ingrédients essentiels
- Guanciale (pas de lardons !)
- Pecorino Romano
- Œufs frais
- Poivre noir
- Pâtes (rigatoni ou spaghetti)

## Étape 2 : La technique du guanciale
Coupez en bâtonnets. Cuisez à feu doux. Le secret ? La graisse doit devenir translucide et croustillante.

## Étape 3 : L'émulsion parfaite
Mélangez œufs et pecorino. La température est cruciale : trop chaud, vous faites des œufs brouillés. Trop froid, la sauce ne prend pas.

## Étape 4 : L'assemblage magique
Hors du feu ! Mélangez rapidement. L'eau de cuisson est votre alliée. Créez cette texture crémeuse parfaite.

## Conclusion
Maintenant vous savez. Plus d'excuses pour les carbonara à la crème !`
};