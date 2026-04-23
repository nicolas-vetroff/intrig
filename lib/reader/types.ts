export type VariableValue = number | boolean | string

export type VariableDef = {
  name: string
  type: 'number' | 'boolean' | 'string'
  initial: VariableValue
}

export type Condition = {
  variable: string
  op: '==' | '!=' | '>' | '<' | '>=' | '<='
  value: VariableValue
}

export type Effect = {
  variable: string
  op: 'set' | 'add' | 'sub'
  value: VariableValue
}

export type Choice = {
  id: string
  label: string
  nextNode: string
  conditions?: Condition[]
  effects?: Effect[]
  isPremium?: boolean
}

export type Node =
  | { id: string; type: 'scene'; text: string; illustration?: string; next: string }
  | { id: string; type: 'choice'; text: string; illustration?: string; choices: Choice[] }
  | { id: string; type: 'ending'; endingId: string }

export type Ending = {
  id: string
  type: 'good' | 'bad' | 'neutral' | 'secret'
  title: string
  text: string
  illustration?: string
}

export type BookContent = {
  startNodeId: string
  variablesSchema: VariableDef[]
  nodes: Record<string, Node>
  endings: Record<string, Ending>
}

export type Book = {
  id: string
  slug: string
  title: string
  author: string
  coverImage: string | null
  synopsis: string | null
  genre: string | null
  tags: string[] | null
  estimatedMinutes: number | null
  tier: 'free' | 'premium'
  publishedAt: Date | null
  content: BookContent
}
