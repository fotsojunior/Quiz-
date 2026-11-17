export interface CuratedRiddle {
  q: string;
  a: string;
  wrong: [string, string, string];
  hint: string;
  exp: string;
}

export const CURATED_ENIGMAS: CuratedRiddle[] = [
  {
    q: "Je commence la nuit et je finis le matin. Qui suis-je ?",
    a: "La lettre N",
    wrong: ["La Lune", "L'ombre", "L'étoile"],
    hint: "Observez l'orthographe des deux mots.",
    exp: "Le mot « nuit » commence par N et « matin » se termine par N."
  },
  {
    q: "Plus j'ai de gardiens, moins je suis en sécurité. Qui suis-je ?",
    a: "Un secret",
    wrong: ["Un château", "Un trésor", "Une prison"],
    hint: "Plus on le partage, plus il risque de fuir.",
    exp: "Plus un secret est connu par de personnes, moins il reste secret."
  },
  {
    q: "Qu'est-ce qui a des villes mais pas de maisons, des montagnes mais pas d'arbres, et de l'eau mais pas de poissons ?",
    a: "Une carte géographique",
    wrong: ["Un désert", "Un rêve", "Un tableau"],
    hint: "Elle tient dans la poche d'un voyageur.",
    exp: "Sur une carte, on représente les villes, les reliefs et les mers sans qu'ils soient réels."
  },
  {
    q: "Je parle toutes les langues sans jamais avoir appris à parler, et je réponds à tout le monde sans voix propre. Qui suis-je ?",
    a: "L'écho",
    wrong: ["Le vent", "Un perroquet", "Le miroir"],
    hint: "On l'entend surtout en montagne.",
    exp: "L'écho renvoie exactement les sons émis dans n'importe quelle langue."
  },
  {
    q: "Si vous me prononcez, je disparais aussitôt. Qui suis-je ?",
    a: "Le silence",
    wrong: ["Un souffle", "Un secret", "Un souhait"],
    hint: "Parler brise immédiatement son existence.",
    exp: "Dès qu'on prononce un mot à voix haute, le silence est rompu."
  },
  {
    q: "Je suis si fragile qu'un simple murmure suffit à me briser. Qui suis-je ?",
    a: "Le silence",
    wrong: ["Le verre", "La glace", "Une bulle"],
    hint: "Il n'est fait d'aucune matière.",
    exp: "Le moindre son ou murmure détruit le silence."
  },
  {
    q: "Qu'est-ce qui monte sans jamais redescendre ?",
    a: "L'âge",
    wrong: ["La marée", "Le soleil", "La fumée"],
    hint: "Il augmente chaque année à votre anniversaire.",
    exp: "Notre âge ne fait qu'augmenter tout au long de la vie."
  },
  {
    q: "J'ai un chapeau mais pas de tête, et un pied mais pas de chaussures. Qui suis-je ?",
    a: "Un champignon",
    wrong: ["Un lampadaire", "Un clou", "Un parapluie"],
    hint: "On le cueille en forêt après la pluie.",
    exp: "Un champignon possède un pied et un chapeau."
  },
  {
    q: "Qu'est-ce qui appartient à vous, mais que les autres utilisent bien plus que vous ?",
    a: "Votre prénom",
    wrong: ["Votre montre", "Votre téléphone", "Votre ombre"],
    hint: "On vous appelle grâce à lui.",
    exp: "Les autres prononcent votre prénom bien plus souvent que vous-même."
  },
  {
    q: "On me jette quand on a besoin de moi, et on me ramène quand on n'a plus besoin de moi. Qui suis-je ?",
    a: "Une ancre",
    wrong: ["Un filet", "Une balle", "Un boomerang"],
    hint: "Elle équipe tous les grands navires.",
    exp: "On jette l'ancre pour immobiliser le bateau, puis on la remonte pour repartir."
  },
  {
    q: "Plus on m'enlève de matière, plus je deviens grand. Qui suis-je ?",
    a: "Un trou",
    wrong: ["Un nuage", "Un ballon", "Un feu"],
    hint: "Pensez à une pelle dans la terre.",
    exp: "Plus on creuse et retire de la terre, plus le trou s'agrandit."
  },
  {
    q: "J'ai quatre doigts et un pouce, mais je ne suis pas vivant. Qui suis-je ?",
    a: "Un gant",
    wrong: ["Une statue", "Un robot", "Une ombre"],
    hint: "On l'enfile quand il fait froid.",
    exp: "Un gant épouse la forme de la main avec quatre doigts et un pouce."
  },
  {
    q: "Je voyage dans le monde entier tout en restant toujours dans mon coin. Qui suis-je ?",
    a: "Un timbre-poste",
    wrong: ["Une boussole", "Un passeport", "Une valise"],
    hint: "On le colle sur une enveloppe.",
    exp: "Le timbre reste dans le coin de l'enveloppe pendant tout le voyage."
  },
  {
    q: "Qu'est-ce qui peut remplir toute une pièce sans prendre aucune place ?",
    a: "La lumière",
    wrong: ["L'eau", "La poussière", "La fumée"],
    hint: "Il suffit d'actionner un interrupteur.",
    exp: "La lumière éclaire toute la pièce sans occuper de volume matériel."
  },
  {
    q: "Je suis devant vous et pourtant vous ne pouvez jamais me voir. Qui suis-je ?",
    a: "L'avenir",
    wrong: ["Le vent", "L'air", "Le nez"],
    hint: "Il appartient au temps qui vient.",
    exp: "L'avenir se trouve devant nous dans le temps, mais reste invisible."
  },
  {
    q: "Je tombe sans jamais me faire mal, et je fais pousser la vie sans avoir de mains. Qui suis-je ?",
    a: "La pluie",
    wrong: ["La feuille", "La neige", "La grêle"],
    hint: "Elle vient des nuages.",
    exp: "La pluie tombe du ciel et nourrit les plantes."
  },
  {
    q: "Qu'est-ce qui a des dents mais ne mord jamais ?",
    a: "Un peigne",
    wrong: ["Un crocodile", "Une fourchette", "Un requin"],
    hint: "On l'utilise devant le miroir le matin.",
    exp: "Un peigne (ou une scie, une fermeture éclair) possède des dents sans mordre."
  },
  {
    q: "Plus je travaille, plus je sèche. Qui suis-je ?",
    a: "Une serviette",
    wrong: ["Une éponge", "Un radiateur", "Un ventilateur"],
    hint: "On l'utilise en sortant de la douche.",
    exp: "Plus une serviette sèche quelqu'un, plus elle devient humide… autrement dit, plus elle essuie, plus elle travaille ! (Variante : elle vous sèche en se mouillant)."
  },
  {
    q: "Je cours sans avoir de jambes, je murmure sans avoir de bouche et j'ai un lit sans jamais dormir. Qui suis-je ?",
    a: "Une rivière",
    wrong: ["Le vent", "Un train", "Un serpent"],
    hint: "Elle rejoint la mer.",
    exp: "Une rivière a un lit, un cours, et le murmure de l'eau."
  },
  {
    q: "On m'achète pour manger, mais on ne me mange jamais. Qui suis-je ?",
    a: "Une assiette",
    wrong: ["Un menu", "Un tablier", "Un réfrigérateur"],
    hint: "Elle reste sur la table du repas.",
    exp: "On sert la nourriture dans une assiette, mais on ne mange pas l'assiette."
  },
  {
    q: "Qu'est-ce qui a 13 cœurs mais aucun autre organe ?",
    a: "Un jeu de 52 cartes",
    wrong: ["Une ruche", "Un orchestre", "Un château"],
    hint: "Pensez aux quatre couleurs ludiques.",
    exp: "Un jeu de cartes standard contient 13 cartes de la couleur Cœur."
  },
  {
    q: "Je suis plein de trous et pourtant je retiens l'eau. Qui suis-je ?",
    a: "Une éponge",
    wrong: ["Une passoire", "Un filet", "Un nuage"],
    hint: "Très utile pour faire la vaisselle.",
    exp: "Les pores d'une éponge absorbent et retiennent l'eau."
  },
  {
    q: "Qu'est-ce qui a des aiguilles mais ne pique jamais et ne sait pas coudre ?",
    a: "Une horloge",
    wrong: ["Un hérisson", "Un cactus", "Un sapin"],
    hint: "Elle indique l'heure.",
    exp: "Les aiguilles d'une horloge tournent sur le cadran."
  },
  {
    q: "Quand on me met à l'envers, je vaux soudainement moitié plus. Qui suis-je ?",
    a: "Le chiffre 6",
    wrong: ["Le chiffre 8", "Le chiffre 0", "Le chiffre 4"],
    hint: "6 + moitié de 6 = 9.",
    exp: "Le chiffre 6 retourné devient 9, soit 6 + 3 (+50%)."
  },
  {
    q: "Je possède une tête et une queue, mais aucun corps. Qui suis-je ?",
    a: "Une pièce de monnaie",
    wrong: ["Un têtard", "Une comète", "Une flèche"],
    hint: "Pile ou face…",
    exp: "En anglais comme dans les jeux anciens, une pièce a côté tête (face) et côté queue (pile)."
  },
  {
    q: "Quelle invention permet de regarder directement à travers un mur solide ?",
    a: "Une fenêtre",
    wrong: ["Un périscope", "Un radar", "Une loupe"],
    hint: "Toutes les maisons en ont.",
    exp: "Une fenêtre vitrée permet de voir à travers le mur."
  },
  {
    q: "Plus il y en a, moins on y voit. Qu'est-ce que c'est ?",
    a: "L'obscurité",
    wrong: ["La lumière", "Le brouillard", "Les lunettes"],
    hint: "Elle arrive quand on éteint toutes les lampes.",
    exp: "Plus l'obscurité est dense, moins on distingue ce qui nous entoure."
  },
  {
    q: "Si un coq pond un œuf exactement au sommet d'un toit pointu, de quel côté tombe l'œuf ?",
    a: "Un coq ne pond pas d'œufs",
    wrong: ["À gauche", "À droite", "Il reste en équilibre"],
    hint: "Lisez bien le premier mot de la question.",
    exp: "Seule la poule pond des œufs, jamais le coq !"
  },
  {
    q: "Quel mois de l'année compte 28 jours ?",
    a: "Tous les mois",
    wrong: ["Uniquement février", "Mars et avril", "Décembre"],
    hint: "Ne cherchez pas seulement celui qui s'arrête à 28.",
    exp: "Chaque mois de l'année possède au moins 28 jours !"
  },
  {
    q: "Je peux être cassée sans jamais être touchée ni tenue dans les mains. Qui suis-je ?",
    a: "Une promesse",
    wrong: ["Une vitre", "Une branche", "Une noix"],
    hint: "Elle repose sur la confiance.",
    exp: "On peut briser ou casser une promesse par un simple acte ou oubli."
  },
  {
    q: "Qu'est-ce qui a une colonne vertébrale mais pas d'os ?",
    a: "Un livre",
    wrong: ["Un ver de terre", "Une méduse", "Un pont"],
    hint: "Son dos relie toutes ses pages.",
    exp: "La reliure d'un livre s'appelle le dos ou l'épine, sans aucun os."
  },
  {
    q: "Vous entrez dans une pièce sombre avec une seule allumette. Il y a une bougie, une lampe à pétrole et une cheminée. Que devez-vous allumer en premier ?",
    a: "L'allumette",
    wrong: ["La bougie", "La lampe à pétrole", "La cheminée"],
    hint: "Comment obtenir la première flamme ?",
    exp: "Avant d'allumer quoi que ce soit d'autre, il faut d'abord allumer l'allumette !"
  },
  {
    q: "Un train électrique roule vers le nord à 120 km/h et le vent souffle vers l'ouest. Où va la fumée ?",
    a: "Il n'y a pas de fumée",
    wrong: ["Vers le sud", "Vers l'ouest", "Vers le nord-ouest"],
    hint: "Relisez le type de locomotive.",
    exp: "Un train électrique ne produit pas de fumée !"
  },
  {
    q: "Je suis léger comme une plume, mais même l'athlète le plus fort du monde ne peut me retenir plus de quelques minutes. Qui suis-je ?",
    a: "Le souffle",
    wrong: ["Un nuage", "Une bulle", "Un grain de sable"],
    hint: "Bloquer sa respiration a une limite.",
    exp: "Personne ne peut retenir son souffle très longtemps."
  },
  {
    q: "Qu'est-ce qui grandit quand on le nourrit, mais meurt dès qu'on lui donne à boire ?",
    a: "Le feu",
    wrong: ["Une plante", "Un cristal", "Un volcan"],
    hint: "L'eau est son ennemi.",
    exp: "Le bois nourrit le feu, tandis que l'eau l'éteint."
  },
  {
    q: "Un père et son fils ont un accident. À l'hôpital, le chirurgien regarde le garçon et dit : « Je ne peux pas l'opérer, c'est mon fils ! » Comment est-ce possible ?",
    a: "Le chirurgien est sa mère",
    wrong: ["C'est un cousin", "C'est un homonyme", "C'est son grand-père"],
    hint: "Pensez à tous les membres de la famille.",
    exp: "Le chirurgien est tout simplement la maman du garçon."
  },
  {
    q: "Qu'est-ce qui vous suit partout le jour mais disparaît dans le noir complet ?",
    a: "Votre ombre",
    wrong: ["Votre reflet", "Votre écho", "Votre chien"],
    hint: "Elle a besoin d'une source de lumière.",
    exp: "Sans lumière, aucune ombre n'est projetée."
  },
  {
    q: "Je commence par E, je finis par E, et je ne contiens qu'une seule lettre. Qui suis-je ?",
    a: "Une enveloppe",
    wrong: ["Une étoile", "Une école", "Une église"],
    hint: "On y glisse une lettre postale.",
    exp: "Le mot « enveloppe » commence et finit par E, et contient une lettre (de courrier)."
  },
  {
    q: "Combien de terre y a-t-il dans un trou parfaitement rectangulaire de 3 mètres sur 2 mètres sur 2 mètres ?",
    a: "Aucune",
    wrong: ["12 mètres cubes", "7 mètres cubes", "6 mètres cubes"],
    hint: "C'est un trou…",
    exp: "Un trou est vide par définition : il ne contient aucune terre !"
  },
  {
    q: "Quelle question ne reçoit honnêtement jamais la réponse « oui » ?",
    a: "« Dors-tu ? »",
    wrong: ["« As-tu faim ? »", "« Pleut-il ? »", "« Es-tu prêt ? »"],
    hint: "Si vous pouvez répondre, c'est que vous êtes réveillé.",
    exp: "Si quelqu'un répond « oui » à « Dors-tu ? », c'est qu'il ne dort pas."
  },
  {
    q: "Qu'est-ce qui a des clés mais ne peut ouvrir aucune serrure ?",
    a: "Un piano",
    wrong: ["Un coffre", "Un trousseau", "Un cadenas"],
    hint: "On joue de la musique dessus.",
    exp: "Un piano (ou un clavier d'ordinateur) possède des touches/clés sans serrure."
  },
  {
    q: "Avant la découverte du mont Everest, quelle était la plus haute montagne sur Terre ?",
    a: "Le mont Everest",
    wrong: ["Le K2", "Le Mont Blanc", "Le Kilimandjaro"],
    hint: "Elle existait avant d'être mesurée.",
    exp: "Le mont Everest était déjà le plus haut sommet avant même d'être découvert par l'homme."
  },
  {
    q: "Quel mot du dictionnaire s'écrit toujours « mal » ?",
    a: "Le mot « mal »",
    wrong: ["Le mot « faux »", "Le mot « erreur »", "Le mot « zéro »"],
    hint: "Prenez la phrase au pied de la lettre.",
    exp: "Le mot « mal » s'écrit littéralement m-a-l !"
  },
  {
    q: "J'ai des feuilles mais je ne suis pas un arbre, et je raconte des histoires sans savoir parler. Qui suis-je ?",
    a: "Un livre",
    wrong: ["Une radio", "Un journal télévisé", "Un moulin"],
    hint: "On le trouve en bibliothèque.",
    exp: "Les pages d'un livre s'appellent aussi des feuillets."
  },
  {
    q: "Je suis blanc quand je suis sale, et noir quand je suis propre. Qui suis-je ?",
    a: "Un tableau noir d'école",
    wrong: ["Un manteau", "Un cheminée", "Une neige"],
    hint: "On écrit dessus avec de la craie.",
    exp: "Couvert de craie blanche, le tableau est « sale » ; essuyé, il redevient noir et propre."
  },
  {
    q: "Lors d'une course, vous doublez le coureur en 2e position. À quelle place êtes-vous maintenant ?",
    a: "2e position",
    wrong: ["1re position", "3e position", "4e position"],
    hint: "Vous n'avez pas dépassé le premier !",
    exp: "En doublant le 2e, vous prenez exactement sa 2e place."
  },
  {
    q: "Qu'est-ce qui passe à travers les villes et les forêts sans jamais bouger d'un centimètre ?",
    a: "Une route",
    wrong: ["Un avion", "Un fleuve", "Un cerf"],
    hint: "Les voitures roulent dessus.",
    exp: "La route traverse villes et forêts tout en restant immobile."
  },
  {
    q: "J'ai un cou mais pas de tête, et deux bras mais pas de mains. Qui suis-je ?",
    a: "Une chemise",
    wrong: ["Une bouteille", "Un vase", "Une guitare"],
    hint: "On la porte sous une veste.",
    exp: "Une chemise a un col (cou) et deux manches (bras), sans tête ni mains."
  },
  {
    q: "Plus je suis chaud, plus je suis frais. Qui suis-je ?",
    a: "Le pain du boulanger",
    wrong: ["Le café", "Le désert", "Le glaçon"],
    hint: "Tout juste sorti du four le matin.",
    exp: "On appelle « pain frais » le pain tout juste cuit et encore chaud."
  },
  {
    q: "Qu'est-ce qui a un œil mais ne peut rien voir ?",
    a: "Une aiguille à coudre",
    wrong: ["Un cyclope", "Une caméra", "Une taupe"],
    hint: "On y passe un fil.",
    exp: "Le chas de l'aiguille est appelé son œil, tout comme l'œil d'un cyclone."
  }
];

export interface WordClue {
  word: string;
  clue: string;
  exp: string;
}

export const FRENCH_WORD_FORGE_BANK: WordClue[] = [
  { word: "ENIGME", clue: "Question mystérieuse à résoudre", exp: "Une énigme met l'esprit à l'épreuve." },
  { word: "NATION", clue: "Pays uni par une histoire et un peuple", exp: "Chaque joueur défend sa nation." },
  { word: "VICTOR", clue: "Prénom synonyme de vainqueur (6 lettres)", exp: "Du latin victor, le vainqueur." },
  { word: "VOYAGE", clue: "Déplacement lointain vers d'autres pays", exp: "Explorer le monde enrichit l'esprit." },
  { word: "PLANET", clue: "Astre en orbite autour d'une étoile (sans E final)", exp: "Racine de planète." },
  { word: "SOLEIL", clue: "Étoile qui éclaire notre planète", exp: "Le Soleil est au centre du système solaire." },
  { word: "BRAVO", clue: "Acclamation pour féliciter un champion", exp: "Un mot universel de félicitation." },
  { word: "ECLAIR", clue: "Lumière vive et très rapide dans le ciel", exp: "Symbole de rapidité absolue." },
  { word: "CHRONO", clue: "Appareil qui mesure le temps exact", exp: "Indispensable dans les duels de vitesse." },
  { word: "LOGIQUE", clue: "Art de raisonner avec rigueur", exp: "La logique guide les défis de réflexion." },
  { word: "MYSTERE", clue: "Chose cachée difficile à expliquer", exp: "Chaque défi cache un mystère à percer." },
  { word: "DRAPEAU", clue: "Emblème en tissu qui représente un pays", exp: "Tous les 195 pays possèdent leur drapeau." },
  { word: "CAPITALE", clue: "Ville principale où siège le gouvernement", exp: "Paris, Dakar, Tokyo ou Ottawa en sont des exemples." },
  { word: "TROPHEE", clue: "Récompense remise au grand gagnant", exp: "Le trophée couronne le champion." },
  { word: "BOUSSOLE", clue: "Instrument indiquant toujours le nord", exp: "Précieuse pour s'orienter sur Terre." },
  { word: "GENIE", clue: "Esprit brillant ou créativité exceptionnelle", exp: "Le génie naît de la curiosité." },
  { word: "ATLAS", clue: "Recueil de cartes du monde entier", exp: "Un atlas regroupe tous les continents." },
  { word: "OCEAN", clue: "Immense étendue d'eau salée", exp: "Il recouvre plus de 70 % du globe." },
  { word: "DUEL", clue: "Affrontement direct entre deux adversaires", exp: "Deux pays face à face pour la victoire." },
  { word: "ESPRIT", clue: "Intelligence, pensée et vivacité", exp: "Un esprit vif gagne des points précieux." },
  { word: "SCORE", clue: "Total de points obtenus dans un jeu", exp: "Chaque bonne réponse augmente le score." },
  { word: "RECORD", clue: "Meilleure performance jamais enregistrée", exp: "Chaque série de victoires bat un record." },
  { word: "SAVOIR", clue: "Ensemble des connaissances acquises", exp: "La culture générale fait gagner des duels." },
  { word: "TALENT", clue: "Aptitude naturelle ou maîtrise remarquable", exp: "Le talent brille sous pression." },
  { word: "COURAGE", clue: "Force morale face à un défi difficile", exp: "Il en faut pour défier le leader mondial." },
  { word: "EQUIPAGE", clue: "Groupe uni à bord d'un navire ou vaisseau", exp: "Tous les joueurs d'un même pays forment un équipage." },
  { word: "HORIZON", clue: "Ligne où le ciel semble toucher la terre", exp: "Symbole d'avenir et d'ouverture mondiale." },
  { word: "LUMIERE", clue: "Rayonnement qui dissipe l'obscurité", exp: "La connaissance est une lumière." },
  { word: "MEMOIRE", clue: "Faculté de retenir les informations", exp: "Essentielle pour les défis de concentration." },
  { word: "STRATEGE", clue: "Personne experte dans l'art de planifier", exp: "Choisir son rival demande de la stratégie." },
  { word: "SOMMET", clue: "Point le plus élevé d'une montagne ou d'un classement", exp: "Tout pays vise le sommet mondial." },
  { word: "PALMARES", clue: "Liste des victoires et distinctions", exp: "Le classement mondial reflète le palmarès." },
  { word: "MEDAILLE", clue: "Disque d'or, d'argent ou de bronze", exp: "Récompense olympique des champions." },
  { word: "CONTINENT", clue: "Grande masse de terre entourée d'océans", exp: "L'Afrique, l'Europe, l'Asie, l'Amérique, l'Océanie." },
  { word: "UNIVERS", clue: "Tout ce qui existe dans l'espace et le temps", exp: "L'infini au-delà de notre planète." },
  { word: "PUZZLE", clue: "Jeu d'assemblage et de patience", exp: "Chaque pièce s'emboîte avec logique." },
  { word: "SIGNAL", clue: "Signe convenu qui déclenche une action", exp: "Partez dès que le signal retentit !" },
  { word: "REFLEXE", clue: "Réaction quasi instantanée", exp: "Indispensable dans les défis de rapidité." },
  { word: "SYMBOLE", clue: "Signe ou image porteur d'un sens", exp: "Un emblème reconnaissable entre mille." },
  { word: "CREER", clue: "Donner vie à quelque chose d'inédit", exp: "Le verbe clé des défis de création." }
];

export interface CultureQuestion {
  q: string;
  a: string;
  wrong: [string, string, string];
  exp: string;
  difficulty: 'facile' | 'moyen' | 'difficile' | 'maitre';
  theme: 'Animaux' | 'Océans' | 'Montagnes' | 'Pays' | 'Infrastructures' | 'Monde & Sciences';
}

export const WORLD_CULTURE_BANK: CultureQuestion[] = [
  // ========================
  // FACILE
  // ========================
  {
    difficulty: 'facile',
    theme: 'Pays',
    q: "Quel est le plus long fleuve d'Afrique ?",
    a: "Le Nil",
    wrong: ["Le Congo", "Le Zambèze", "Le Niger"],
    exp: "Le Nil parcourt environ 6 650 km à travers l'Afrique de l'Est jusqu'à la Méditerranée."
  },
  {
    difficulty: 'facile',
    theme: 'Océans',
    q: "Quel océan est le plus vaste de la planète ?",
    a: "L'océan Pacifique",
    wrong: ["L'océan Atlantique", "L'océan Indien", "L'océan Arctique"],
    exp: "L'océan Pacifique couvre près d'un tiers de la surface totale de la Terre."
  },
  {
    difficulty: 'facile',
    theme: 'Montagnes',
    q: "Quelle est la plus haute montagne du monde au-dessus du niveau de la mer ?",
    a: "Le mont Everest",
    wrong: ["Le K2", "Le Kilimandjaro", "Le mont Blanc"],
    exp: "Le mont Everest culmine à 8 849 mètres dans la chaîne de l'Himalaya."
  },
  {
    difficulty: 'facile',
    theme: 'Animaux',
    q: "Quel est l'animal terrestre le plus rapide sur de courtes distances ?",
    a: "Le guépard",
    wrong: ["Le lion", "Le léopard", "L'antilope springbok"],
    exp: "Le guépard peut dépasser 100 km/h en quelques secondes lors d'une poursuite."
  },
  {
    difficulty: 'facile',
    theme: 'Animaux',
    q: "Quel est le plus grand mammifère vivant sur Terre ?",
    a: "La baleine bleue",
    wrong: ["L'éléphant d'Afrique", "Le cachalot", "Le requin-baleine"],
    exp: "La baleine bleue peut atteindre 30 mètres de long et peser plus de 150 tonnes."
  },
  {
    difficulty: 'facile',
    theme: 'Infrastructures',
    q: "Quel canal relie l'océan Atlantique à l'océan Pacifique en Amérique centrale ?",
    a: "Le canal de Panama",
    wrong: ["Le canal de Suez", "Le canal de Corinthe", "Le détroit de Béring"],
    exp: "Inauguré en 1914, le canal de Panama traverse l'isthme de Panama grâce à un système d'écluses."
  },
  {
    difficulty: 'facile',
    theme: 'Infrastructures',
    q: "Dans quelle ville se dresse le célèbre pont suspendu Golden Gate ?",
    a: "San Francisco",
    wrong: ["New York", "Seattle", "Los Angeles"],
    exp: "Le Golden Gate Bridge enjambe le détroit reliant la baie de San Francisco à l'océan Pacifique."
  },
  {
    difficulty: 'facile',
    theme: 'Montagnes',
    q: "Dans quel continent se trouve le mont Kilimandjaro ?",
    a: "En Afrique",
    wrong: ["En Asie", "En Amérique du Sud", "En Europe"],
    exp: "Le Kilimandjaro (5 895 m) est le plus haut sommet d'Afrique, en Tanzanie."
  },
  {
    difficulty: 'facile',
    theme: 'Pays',
    q: "Quel pays est surnommé « le pays du Soleil-Levant » ?",
    a: "Le Japon",
    wrong: ["La Corée du Sud", "La Thaïlande", "La Chine"],
    exp: "Nihon / Nippon signifie littéralement « origine du soleil »."
  },
  {
    difficulty: 'facile',
    theme: 'Animaux',
    q: "Combien de cœurs possède une pieuvre ?",
    a: "3",
    wrong: ["1", "2", "4"],
    exp: "La pieuvre possède deux cœurs branchiaux et un cœur systémique."
  },
  {
    difficulty: 'facile',
    theme: 'Pays',
    q: "Quel monument célèbre de marbre blanc se trouve à Agra, en Inde ?",
    a: "Le Taj Mahal",
    wrong: ["Pétra", "Angkor Vat", "Le Machu Picchu"],
    exp: "Le Taj Mahal est un mausolée construit au XVIIe siècle sur les rives de la Yamuna."
  },
  {
    difficulty: 'facile',
    theme: 'Océans',
    q: "Quel océan borde à la fois l'Afrique de l'Est, l'Asie du Sud et l'Australie ?",
    a: "L'océan Indien",
    wrong: ["L'océan Atlantique", "L'océan Pacifique", "L'océan Austral"],
    exp: "L'océan Indien est délimité à l'ouest par l'Afrique, au nord par l'Asie et à l'est par l'Australie."
  },
  {
    difficulty: 'facile',
    theme: 'Infrastructures',
    q: "Quel canal égyptien relie la mer Méditerranée à la mer Rouge ?",
    a: "Le canal de Suez",
    wrong: ["Le canal de Panama", "Le canal du Midi", "Le canal de Kiel"],
    exp: "Le canal de Suez permet aux navires de passer d'Europe en Asie sans contourner l'Afrique."
  },
  {
    difficulty: 'facile',
    theme: 'Monde & Sciences',
    q: "Quel gaz compose environ 78 % de l'atmosphère terrestre ?",
    a: "L'azote (diazote)",
    wrong: ["L'oxygène", "Le dioxyde de carbone", "L'hélium"],
    exp: "L'air est composé d'environ 78 % d'azote et 21 % d'oxygène."
  },
  {
    difficulty: 'facile',
    theme: 'Pays',
    q: "Dans quel pays se situe la cité inca du Machu Picchu ?",
    a: "Le Pérou",
    wrong: ["Le Chili", "La Bolivie", "Le Mexique"],
    exp: "Le Machu Picchu domine la vallée sacrée dans les Andes péruviennes."
  },
  {
    difficulty: 'facile',
    theme: 'Animaux',
    q: "Quel oiseau incapable de voler vit exclusivement dans l'hémisphère Sud, notamment en Antarctique ?",
    a: "Le manchot empereur",
    wrong: ["Le macareux moine", "Le flamant rose", "L'albatros"],
    exp: "Les manchots vivent dans l'hémisphère Sud, tandis que les pingouins et macareux vivent au Nord."
  },
  {
    difficulty: 'facile',
    theme: 'Montagnes',
    q: "Quelle chaîne de montagnes sépare naturellement l'Europe de l'Asie ?",
    a: "L'Oural",
    wrong: ["Les Alpes", "Les Andes", "Les Carpates"],
    exp: "Les monts Oural forment la frontière géographique classique entre l'Europe et l'Asie."
  },
  {
    difficulty: 'facile',
    theme: 'Monde & Sciences',
    q: "Quelle planète du système solaire possède le plus grand nombre de lunes connues ?",
    a: "Saturne",
    wrong: ["Jupiter", "Uranus", "Mars"],
    exp: "Saturne dépasse Jupiter avec plus de 140 lunes confirmées."
  },

  // ========================
  // MOYEN
  // ========================
  {
    difficulty: 'moyen',
    theme: 'Océans',
    q: "Comment s'appelle la fosse océanique la plus profonde connue sur Terre (environ 10 984 m) ?",
    a: "La fosse des Mariannes",
    wrong: ["La fosse des Tonga", "La fosse de Porto Rico", "La fosse des Kouriles"],
    exp: "Située dans le Pacifique nord-ouest, son point le plus bas est Challenger Deep."
  },
  {
    difficulty: 'moyen',
    theme: 'Infrastructures',
    q: "Quel tunnel ferroviaire long de 50,45 km passe sous la mer entre la France et le Royaume-Uni ?",
    a: "Le tunnel sous la Manche",
    wrong: ["Le tunnel du Seikan", "Le tunnel du Saint-Gothard", "Le tunnel de Fréjus"],
    exp: "Inauguré en 1994, il relie Coquelles (France) à Folkestone (Royaume-Uni)."
  },
  {
    difficulty: 'moyen',
    theme: 'Montagnes',
    q: "Quelle est la plus longue chaîne de montagnes continentale du monde (~7 000 km) ?",
    a: "La cordillère des Andes",
    wrong: ["Les montagnes Rocheuses", "L'Himalaya", "La cordillère australienne"],
    exp: "Les Andes longent toute la côte ouest de l'Amérique du Sud, du Venezuela à la Patagonie."
  },
  {
    difficulty: 'moyen',
    theme: 'Animaux',
    q: "Quel poisson possède une nageoire dorsale ressemblant à une voile et détient le record de vitesse en mer (> 100 km/h) ?",
    a: "L'espadon-voilier",
    wrong: ["Le thon rouge", "Le grand requin blanc", "Le barracuda"],
    exp: "L'espadon-voilier (Istiophorus platypterus) peut atteindre des pointes autour de 110 km/h."
  },
  {
    difficulty: 'moyen',
    theme: 'Pays',
    q: "Quel pays possède le plus grand nombre de fuseaux horaires (territoires d'outre-mer inclus) ?",
    a: "La France",
    wrong: ["La Russie", "Les États-Unis", "Le Canada"],
    exp: "Grâce à ses territoires d'outre-mer sur tous les océans, la France couvre 12 fuseaux horaires."
  },
  {
    difficulty: 'moyen',
    theme: 'Infrastructures',
    q: "Quel viaduc autoroutier français détient le record mondial de hauteur de pile (343 mètres) ?",
    a: "Le viaduc de Millau",
    wrong: ["Le pont de Normandie", "Le viaduc de Garabit", "Le pont d'Aquitaine"],
    exp: "Conçu par Michel Virlogeux et Norman Foster, le viaduc de Millau surplombe la vallée du Tarn."
  },
  {
    difficulty: 'moyen',
    theme: 'Animaux',
    q: "Quel oiseau effectue la plus longue migration annuelle connue (jusqu'à 70 000 km entre l'Arctique et l'Antarctique) ?",
    a: "La sterne arctique",
    wrong: ["L'albatros hurleur", "La cigogne blanche", "Le faucon pèlerin"],
    exp: "La sterne arctique vit deux étés par an en volant d'un pôle à l'autre."
  },
  {
    difficulty: 'moyen',
    theme: 'Océans',
    q: "Quel courant marin chaud de l'Atlantique Nord adoucit le climat de l'Europe occidentale ?",
    a: "Le Gulf Stream",
    wrong: ["Le courant de Humboldt", "Le courant du Labrador", "Le courant de Benguela"],
    exp: "Le Gulf Stream transporte des eaux chaudes du golfe du Mexique vers l'Atlantique Nord."
  },
  {
    difficulty: 'moyen',
    theme: 'Pays',
    q: "Quel pays africain a pour devise nationale « Paix – Travail – Patrie » ?",
    a: "Le Cameroun",
    wrong: ["Le Sénégal", "Le Gabon", "La Côte d'Ivoire"],
    exp: "La devise du Cameroun est inscrite sur ses armoiries : « Paix – Travail – Patrie »."
  },
  {
    difficulty: 'moyen',
    theme: 'Montagnes',
    q: "Quel est le plus haut sommet d'Amérique du Sud (6 961 m) ?",
    a: "L'Aconcagua",
    wrong: ["Le Huascarán", "Le Chimborazo", "Le Cotopaxi"],
    exp: "L'Aconcagua, situé en Argentine près du Chili, est le plus haut sommet hors d'Asie."
  },
  {
    difficulty: 'moyen',
    theme: 'Infrastructures',
    q: "Dans quel pays se trouve le barrage des Trois-Gorges, la plus grande centrale hydroélectrique du monde ?",
    a: "En Chine",
    wrong: ["Au Brésil", "En Russie", "Aux États-Unis"],
    exp: "Situé sur le fleuve Yangtsé en Chine, sa capacité installée atteint 22 500 MW."
  },
  {
    difficulty: 'moyen',
    theme: 'Pays',
    q: "Quel pays abrite les pyramides nubiennes de Méroé, encore plus nombreuses que celles d'Égypte ?",
    a: "Le Soudan",
    wrong: ["La Libye", "L'Éthiopie", "La Tunisie"],
    exp: "Le Soudan compte plus de 200 pyramides antiques dans la vallée du Nil nubienne."
  },
  {
    difficulty: 'moyen',
    theme: 'Animaux',
    q: "Quel mammifère est le seul capable d'un véritable vol battu soutenu ?",
    a: "La chauve-souris",
    wrong: ["L'écureuil volant", "Le phalanger volant", "Le colugo"],
    exp: "Les chiroptères (chauves-souris) sont les seuls mammifères dotés d'ailes actives."
  },
  {
    difficulty: 'moyen',
    theme: 'Océans',
    q: "Quelle mer intérieure très salée est enclavée entre Israël, la Cisjordanie et la Jordanie ?",
    a: "La mer Morte",
    wrong: ["La mer Caspienne", "La mer d'Aral", "La mer Rouge"],
    exp: "Avec près de 34 % de salinité, le corps humain flotte naturellement dans la mer Morte."
  },
  {
    difficulty: 'moyen',
    theme: 'Monde & Sciences',
    q: "Quel métal reste liquide à température ambiante ?",
    a: "Le mercure",
    wrong: ["Le plomb", "Le zinc", "Le gallium"],
    exp: "Le mercure fond dès -38,8 °C (le gallium fond vers 29,8 °C, juste au-dessus de la température ambiante)."
  },
  {
    difficulty: 'moyen',
    theme: 'Montagnes',
    q: "Dans quel pays se situe le mont Fuji, célèbre volcan conique culminant à 3 776 m ?",
    a: "Au Japon",
    wrong: ["En Corée du Sud", "En Indonésie", "Aux Philippines"],
    exp: "Le mont Fuji se dresse au sud-ouest de Tokyo sur l'île de Honshū."
  },
  {
    difficulty: 'moyen',
    theme: 'Infrastructures',
    q: "Quelle tour de Dubaï est actuellement le plus haut gratte-ciel du monde (828 mètres) ?",
    a: "Burj Khalifa",
    wrong: ["Shanghai Tower", "Merdeka 118", "Abraj Al Bait"],
    exp: "Inaugurée en 2010, la tour Burj Khalifa compte 163 étages habitables."
  },
  {
    difficulty: 'moyen',
    theme: 'Pays',
    q: "Dans quel pays se situe la cité antique de Pétra, taillée dans la roche rose ?",
    a: "En Jordanie",
    wrong: ["En Égypte", "En Syrie", "Au Liban"],
    exp: "Pétra fut la capitale florissante du royaume nabatéen dans le sud de la Jordanie."
  },

  // ========================
  // DIFFICILE
  // ========================
  {
    difficulty: 'difficile',
    theme: 'Infrastructures',
    q: "Quel est le plus long tunnel ferroviaire du monde (57,1 km), traversant les Alpes ?",
    a: "Le tunnel de base du Saint-Gothard",
    wrong: ["Le tunnel du Seikan", "Le tunnel sous la Manche", "Le tunnel du Lötschberg"],
    exp: "Mis en service en 2016 en Suisse, le tunnel de base du Saint-Gothard mesure 57,09 km."
  },
  {
    difficulty: 'difficile',
    theme: 'Océans',
    q: "Quelle est la seule mer du monde à ne posséder aucune côte terrestre, délimitée uniquement par des courants océaniques ?",
    a: "La mer des Sargasses",
    wrong: ["La mer de Béring", "La mer de Weddell", "La mer de Corail"],
    exp: "Située dans l'Atlantique Nord, la mer des Sargasses est cernée par quatre courants marins."
  },
  {
    difficulty: 'difficile',
    theme: 'Montagnes',
    q: "Quel sommet, deuxième plus haut du monde (8 611 m), est situé à la frontière entre le Pakistan et la Chine ?",
    a: "Le K2",
    wrong: ["Le Kangchenjunga", "Le Lhotse", "Le Makalu"],
    exp: "Le K2 (Chogori) dans le massif du Karakoram est réputé pour sa difficulté technique extrême."
  },
  {
    difficulty: 'difficile',
    theme: 'Animaux',
    q: "Quelle espèce de requin détient le record de longévité parmi les vertébrés (jusqu'à 400 ans) ?",
    a: "Le requin du Groenland",
    wrong: ["Le requin-baleine", "Le requin-marteau", "Le cœlacanthe"],
    exp: "Son métabolisme très lent en eaux glaciales lui permet de vivre plusieurs siècles."
  },
  {
    difficulty: 'difficile',
    theme: 'Pays',
    q: "Quel pays est entièrement enclavé à l'intérieur d'un seul autre pays, l'Afrique du Sud ?",
    a: "Le Lesotho",
    wrong: ["L'Eswatini", "Le Botswana", "Le Malawi"],
    exp: "Le Lesotho est l'un des trois États au monde totalement enclavés dans un unique pays (avec Saint-Marin et le Vatican)."
  },
  {
    difficulty: 'difficile',
    theme: 'Infrastructures',
    q: "Quel pont du Japon détient l'une des plus grandes portées centrales suspendues au monde (1 991 m) près de Kobe ?",
    a: "Le pont Akashi Kaikyō",
    wrong: ["Le pont de Seto", "Le pont du 1915 Çanakkale", "Le pont de Tsing Ma"],
    exp: "Inauguré en 1998, le pont Akashi Kaikyō relie Kobe à l'île d'Awaji."
  },
  {
    difficulty: 'difficile',
    theme: 'Animaux',
    q: "Quel animal marin produit un claquement de pince créant une bulle de cavitation atteignant brièvement 4 700 °C ?",
    a: "La crevette-pistolet",
    wrong: ["La crevette-mante", "Le homard européen", "Le crabe-violoniste"],
    exp: "La crevette-pistolet (Alpheidae) étourdit ses proies par une onde de choc acoustique."
  },
  {
    difficulty: 'difficile',
    theme: 'Océans',
    q: "Quel détroit stratégique sépare l'Espagne du Maroc et relie l'Atlantique à la Méditerranée ?",
    a: "Le détroit de Gibraltar",
    wrong: ["Le détroit du Bosphore", "Le détroit d'Ormuz", "Le détroit de Messine"],
    exp: "Large d'environ 14 km à son point le plus étroit, il sépare l'Europe de l'Afrique."
  },
  {
    difficulty: 'difficile',
    theme: 'Montagnes',
    q: "En mesurant depuis le centre de la Terre (en raison du renflement équatorial), quel sommet est le point le plus éloigné du centre terrestre ?",
    a: "Le Chimborazo (Équateur)",
    wrong: ["Le mont Everest", "Le Mauna Kea", "Le Denali"],
    exp: "Situé près de l'équateur à 6 263 m d'altitude, le sommet du Chimborazo dépasse l'Everest d'environ 2 km par rapport au centre de la Terre."
  },
  {
    difficulty: 'difficile',
    theme: 'Infrastructures',
    q: "Quel ouvrage relie la Suède (Malmö) au Danemark (Copenhague) en combinant un pont à haubans, une île artificielle et un tunnel ?",
    a: "Le pont de l'Øresund",
    wrong: ["Le pont du Grand Belt", "Le pont de Storebælt", "Le tunnel de Fehmarn"],
    exp: "Long de près de 16 km au total, le lien de l'Øresund a été inauguré en 2000."
  },
  {
    difficulty: 'difficile',
    theme: 'Pays',
    q: "Quel pays d'Asie du Sud-Est compte plus de 17 000 îles, formant le plus grand archipel du monde ?",
    a: "L'Indonésie",
    wrong: ["Les Philippines", "La Malaisie", "Le Japon"],
    exp: "L'Indonésie s'étend sur plus de 5 000 km d'ouest en est à travers plus de 17 000 îles."
  },
  {
    difficulty: 'difficile',
    theme: 'Animaux',
    q: "Quel animal possède les yeux les plus grands de tout le règne animal (jusqu'à 27 cm de diamètre) ?",
    a: "Le calmar colossal",
    wrong: ["Le cachalot", "La baleine bleue", "L'autruche"],
    exp: "Vivant dans les abysses antarctiques, le calmar colossal repère les prédateurs dans l'obscurité grâce à ses yeux géants."
  },
  {
    difficulty: 'difficile',
    theme: 'Océans',
    q: "Quel océan est le plus salé en surface en moyenne ?",
    a: "L'océan Atlantique",
    wrong: ["L'océan Pacifique", "L'océan Arctique", "L'océan Indien"],
    exp: "En raison d'une forte évaporation et d'apports d'eau douce moindres en proportion, l'Atlantique présente une salinité moyenne d'environ 35,4 g/L."
  },
  {
    difficulty: 'difficile',
    theme: 'Infrastructures',
    q: "Quel barrage situé entre le Brésil et le Paraguay figure parmi les plus grands producteurs d'électricité au monde ?",
    a: "Le barrage d'Itaipu",
    wrong: ["Le barrage de Belo Monte", "Le barrage de Tucuruí", "Le barrage d'Assouan"],
    exp: "Construit sur le fleuve Paraná, Itaipu fournit une part majeure de l'électricité du Paraguay et du Brésil."
  },
  {
    difficulty: 'difficile',
    theme: 'Montagnes',
    q: "Dans quelle chaîne montagneuse culmine le Denali (6 190 m), plus haut sommet d'Amérique du Nord ?",
    a: "La chaîne d'Alaska",
    wrong: ["Les montagnes Rocheuses", "La Sierra Nevada", "Les Appalaches"],
    exp: "Le Denali (anciennement mont McKinley) se situe au cœur de la chaîne d'Alaska."
  },
  {
    difficulty: 'difficile',
    theme: 'Monde & Sciences',
    q: "Combien de plaques tectoniques majeures se rejoignent dans la zone volcanique appelée « ceinture de feu du Pacifique » ?",
    a: "Plus de 450 volcans actifs autour de la plaque Pacifique",
    wrong: ["Uniquement 2 plaques sans volcans", "Seulement l'Atlantique Nord", "Le rift est-africain"],
    exp: "La ceinture de feu du Pacifique concentre environ 75 % des volcans actifs de la planète."
  },

  // ========================
  // MAÎTRE
  // ========================
  {
    difficulty: 'maitre',
    theme: 'Infrastructures',
    q: "Quel pont suspendu inauguré en 2022 en Turquie possède la plus longue portée centrale du monde (2 023 mètres) ?",
    a: "Le pont du 1915 Çanakkale",
    wrong: ["Le pont Osman Gazi", "Le pont Akashi Kaikyō", "Le pont de Yangsigang"],
    exp: "Franchissant le détroit des Dardanelles, sa portée de 2 023 m a battu le record d'Akashi Kaikyō (1 991 m)."
  },
  {
    difficulty: 'maitre',
    theme: 'Océans',
    q: "Quel terme océanographique désigne la zone crépusculaire comprise entre 200 m et 1 000 m de profondeur ?",
    a: "La zone mésopélagique",
    wrong: ["La zone épipélagique", "La zone bathypélagique", "La zone hadale"],
    exp: "Au-delà de 200 m (zone épipélagique) et jusqu'à 1 000 m, la lumière décline : c'est la zone mésopélagique."
  },
  {
    difficulty: 'maitre',
    theme: 'Montagnes',
    q: "Combien de sommets sur Terre dépassent l'altitude symbolique des 8 000 mètres ?",
    a: "14 sommets",
    wrong: ["8 sommets", "12 sommets", "18 sommets"],
    exp: "Tous les 14 « huit mille » se trouvent dans l'Himalaya et le Karakoram."
  },
  {
    difficulty: 'maitre',
    theme: 'Animaux',
    q: "Quelle particularité biologique possède la méduse Turritopsis dohrnii ?",
    a: "Elle peut inverser son cycle cellulaire pour redevenir polype",
    wrong: ["Elle vit uniquement dans les lacs salés de Bolivie", "Elle respire par un poumon interne", "Elle migre par voie terrestre"],
    exp: "Surnommée « méduse immortelle », elle peut réinitialiser ses cellules matures par transdifférenciation."
  },
  {
    difficulty: 'maitre',
    theme: 'Pays',
    q: "Quels deux pays d'Amérique du Sud ne possèdent aucun accès direct à la mer ?",
    a: "La Bolivie et le Paraguay",
    wrong: ["L'Uruguay et le Paraguay", "La Bolivie et l'Équateur", "Le Suriname et la Bolivie"],
    exp: "La Bolivie et le Paraguay sont les deux seuls États enclavés d'Amérique du Sud."
  },
  {
    difficulty: 'maitre',
    theme: 'Infrastructures',
    q: "Comment appelle-t-on le système néerlandais de digues, barrages et écluses protégeant le pays contre les marées de la mer du Nord ?",
    a: "Le Plan Delta",
    wrong: ["Le mur de Zuider", "Le projet Mose", "La digue d'Øresund"],
    exp: "Lancé après la tempête de 1953, le Plan Delta est considéré comme l'une des merveilles du génie civil moderne."
  },
  {
    difficulty: 'maitre',
    theme: 'Océans',
    q: "Comment se nomme le point océanique le plus éloigné de toute terre émergée (à 2 688 km de toute côte dans le Pacifique Sud) ?",
    a: "Le point Nemo",
    wrong: ["Le point Challenger", "Le point Kerguelen", "Le cap Horn"],
    exp: "Le pôle maritime d'inaccessibilité, baptisé Point Nemo, est parfois plus proche des astronautes de l'ISS que des humains sur Terre."
  },
  {
    difficulty: 'maitre',
    theme: 'Montagnes',
    q: "Si on mesure du pied océanique jusqu'au sommet, quelle montagne d'Hawaï dépasse 10 200 m au total ?",
    a: "Le Mauna Kea",
    wrong: ["Le Mauna Loa", "Le Haleakalā", "Le mont Rainier"],
    exp: "Le volcan bouclier Mauna Kea culmine à 4 207 m au-dessus de l'eau mais s'enracine à ~6 000 m sous le Pacifique."
  },
  {
    difficulty: 'maitre',
    theme: 'Animaux',
    q: "Quel invertébré microscopique résiste au vide spatial, aux radiations intenses et à des températures de -272 °C à +150 °C ?",
    a: "Le tardigrade",
    wrong: ["Le rotifère", "La planaires", "L'hydre d'eau douce"],
    exp: "En cryptobiose, le tardigrade suspend son métabolisme et survit aux conditions les plus extrêmes."
  },
  {
    difficulty: 'maitre',
    theme: 'Pays',
    q: "Quel pays d'Afrique centrale partage des frontières terrestres avec le plus grand nombre d'États (9 pays voisins) ?",
    a: "La RD Congo",
    wrong: ["Le Cameroun", "La Tanzanie", "Le Tchad"],
    exp: "La République démocratique du Congo possède 9 frontières terrestres (la Tanzanie en compte 8)."
  },
  {
    difficulty: 'maitre',
    theme: 'Infrastructures',
    q: "Dans quel pays se situe le pont Danyang-Kunshan, plus long viaduc ferroviaire du monde (164,8 km) ?",
    a: "En Chine",
    wrong: ["Au Japon", "En Corée du Sud", "En Inde"],
    exp: "Ce viaduc porte la ligne à grande vitesse Pékin–Shanghai au-dessus de plaines alluviales et de rizières."
  },
  {
    difficulty: 'maitre',
    theme: 'Océans',
    q: "Quelle fosse océanique dépasse 10 000 m dans l'hémisphère Sud (océan Pacifique Sud) ?",
    a: "La fosse des Tonga",
    wrong: ["La fosse de Java", "La fosse de Sandwich du Sud", "La fosse de Kermadec uniquement"],
    exp: "L'Horizon Deep dans la fosse des Tonga atteint environ 10 882 mètres de profondeur."
  },
  {
    difficulty: 'maitre',
    theme: 'Animaux',
    q: "Quel reptile marin des îles Galápagos est l'unique lézard actuel capable de se nourrir d'algues sous l'eau ?",
    a: "L'iguane marin des Galápagos",
    wrong: ["Le varan de Komodo", "Le basilic vert", "Le gecko diurne"],
    exp: "Amblyrhynchus cristatus plonge jusqu'à 20 m dans les eaux froides pour brouter des algues marines."
  },
  {
    difficulty: 'maitre',
    theme: 'Monde & Sciences',
    q: "Quel détroit relie l'océan Atlantique Nord à l'océan Pacifique Nord par l'extrême-orient russe et l'Alaska ?",
    a: "Le détroit de Béring",
    wrong: ["Le détroit de Magellan", "Le détroit de Torres", "Le détroit de Malacca"],
    exp: "Large d'environ 85 km, le détroit de Béring sépare la Sibérie de l'Alaska."
  }
];

export const REBUS_PAIRS: Array<{
  icons: string[];
  a: string;
  wrong: [string, string, string];
  exp: string;
}> = [
  { icons: ["☀️", "🌻"], a: "Tournesol", wrong: ["Marguerite", "Arc-en-ciel", "Éclipse"], exp: "Fleur qui suit la course du soleil." },
  { icons: ["🌙", "🥐"], a: "Croissant", wrong: ["Étoile", "Pain au lait", "Sablier"], exp: "Forme de la lune et viennoiserie célèbre." },
  { icons: ["❄️", "☃️"], a: "Bonhomme de neige", wrong: ["Avalanche", "Banquise", "Glacier"], exp: "Sculpture hivernale de neige." },
  { icons: ["🔥", "🚒"], a: "Pompier", wrong: ["Ambulance", "Fumée", "Volcan"], exp: "Professionnel qui éteint les incendies." },
  { icons: ["👑", "🦁"], a: "Roi des animaux", wrong: ["Cirque", "Savane", "Tigre"], exp: "Le lion couronné, roi de la savane." },
  { icons: ["🌊", "🏄"], a: "Surf", wrong: ["Natation", "Plongée", "Voile"], exp: "Glisser sur les vagues de l'océan." },
  { icons: ["🚀", "🌕"], a: "Mission lunaire", wrong: ["Météorite", "Éclipse", "Télescope"], exp: "Fusée en direction de la Lune." },
  { icons: ["🎵", "🎹"], a: "Pianiste", wrong: ["Violoniste", "Chef d'orchestre", "Chanteur"], exp: "Musicien jouant des notes sur un piano." },
  { icons: ["⚡", "🌩️"], a: "Orage", wrong: ["Brise", "Arc-en-ciel", "Verglas"], exp: "Éclairs et tonnerre dans un ciel orageux." },
  { icons: ["🐝", "🍯"], a: "Ruche / Miel", wrong: ["Frelon", "Confiture", "Sucre"], exp: "Les abeilles produisent le miel." },
  { icons: ["🧭", "🗺️"], a: "Orientation", wrong: ["Astronomie", "Géologie", "Botanique"], exp: "Boussole et carte pour trouver son chemin." },
  { icons: ["📸", "🏔️"], a: "Photo de paysage", wrong: ["Alpinisme", "Peinture", "Randonnée"], exp: "Capturer la montagne en photo." }
];
