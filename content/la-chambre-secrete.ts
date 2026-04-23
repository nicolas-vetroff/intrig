import type { Book } from '@/lib/reader/types'

// UUID fige pour permettre des seeds idempotents sur la base locale.
export const LA_CHAMBRE_SECRETE_ID = '00000000-0000-0000-0000-0000000b0001'

export const laChambreSecrete: Book = {
  id: LA_CHAMBRE_SECRETE_ID,
  slug: 'la-chambre-secrete',
  title: 'La Chambre secrète',
  author: 'Anonyme',
  coverImage: null,
  synopsis:
    'Une vieille maison abandonnée. Une porte close. Un choix simple qui n’en est pas un.',
  genre: 'mystère',
  tags: ['test', 'court'],
  estimatedMinutes: 3,
  tier: 'free',
  publishedAt: new Date('2025-01-01T00:00:00Z'),
  content: {
    startNodeId: 'intro',
    variablesSchema: [
      { name: 'aClef', type: 'boolean', initial: false },
      { name: 'courage', type: 'number', initial: 0 },
    ],
    nodes: {
      intro: {
        id: 'intro',
        type: 'scene',
        text: "La maison vous attendait, semble-t-il. La porte cède sous la poussée de votre main, et un courant d'air froid s'échappe du hall comme un soupir.",
        next: 'salon',
      },
      salon: {
        id: 'salon',
        type: 'choice',
        text: "Dans le salon, tout est figé sous la poussière. Sur le guéridon, une petite clef en laiton capte le peu de lumière qui passe encore entre les volets.",
        choices: [
          {
            id: 'prendre-clef',
            label: 'Prendre la clef',
            nextNode: 'couloir',
            effects: [
              { variable: 'aClef', op: 'set', value: true },
              { variable: 'courage', op: 'add', value: 1 },
            ],
          },
          {
            id: 'ignorer-clef',
            label: 'Passer votre chemin',
            nextNode: 'couloir',
          },
        ],
      },
      couloir: {
        id: 'couloir',
        type: 'scene',
        text: "Le couloir s'étire, étroit. Tout au bout, une porte sombre. Rien d'autre.",
        next: 'porte',
      },
      porte: {
        id: 'porte',
        type: 'choice',
        text: 'La porte est verrouillée. Elle ne cédera pas à la force seule.',
        choices: [
          {
            id: 'ouvrir-avec-clef',
            label: 'Utiliser la clef',
            nextNode: 'chambre',
            conditions: [{ variable: 'aClef', op: '==', value: true }],
          },
          {
            id: 'repartir',
            label: 'Rebrousser chemin',
            nextNode: 'end-retour',
          },
        ],
      },
      chambre: {
        id: 'chambre',
        type: 'scene',
        text: 'La clef tourne avec une netteté qui ne trompe pas. Derrière la porte, la chambre est baignée d’une lumière inattendue — comme si quelqu’un avait oublié d’éteindre.',
        next: 'coffre',
      },
      coffre: {
        id: 'coffre',
        type: 'choice',
        text: 'Au centre de la pièce, un coffre de bois noirci. Vous sentez confusément qu’il ne devrait pas être là.',
        choices: [
          {
            id: 'ouvrir-coffre',
            label: 'Ouvrir le coffre',
            nextNode: 'end-tresor',
          },
          {
            id: 'chercher-passage',
            label: 'Examiner les murs',
            nextNode: 'end-secret',
            conditions: [{ variable: 'courage', op: '>=', value: 1 }],
          },
          {
            id: 'partir',
            label: 'Repartir sans y toucher',
            nextNode: 'end-sagesse',
          },
        ],
      },
      'end-retour': { id: 'end-retour', type: 'ending', endingId: 'retour' },
      'end-tresor': { id: 'end-tresor', type: 'ending', endingId: 'tresor' },
      'end-sagesse': { id: 'end-sagesse', type: 'ending', endingId: 'sagesse' },
      'end-secret': { id: 'end-secret', type: 'ending', endingId: 'secret' },
    },
    endings: {
      retour: {
        id: 'retour',
        type: 'neutral',
        title: 'Retour',
        text: 'Vous refermez la porte derrière vous. Demain, peut-être, vous reviendrez — avec ce qu’il faut pour passer.',
      },
      tresor: {
        id: 'tresor',
        type: 'good',
        title: 'Le trésor',
        text: 'À l’intérieur du coffre, une poignée de pièces anciennes et un carnet à la reliure usée. De quoi vivre — ou de quoi s’interroger longtemps.',
      },
      sagesse: {
        id: 'sagesse',
        type: 'good',
        title: 'La sagesse',
        text: 'Vous laissez le coffre intact. Certaines questions restent plus belles quand on ne les ouvre pas.',
      },
      secret: {
        id: 'secret',
        type: 'secret',
        title: 'Passage dérobé',
        text: 'Derrière une tenture, une ouverture étroite. La maison avait un autre secret — et vous êtes de ceux qui le trouvent.',
      },
    },
  },
}
