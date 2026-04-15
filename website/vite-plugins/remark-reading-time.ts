/**
 * Remark plugin that calculates reading time from MDX content
 * and injects it into the frontmatter export.
 *
 * Walks the MDAST, extracts all text nodes, counts words at ~200 wpm.
 * Minimum reading time is 1 minute.
 */

const WORDS_PER_MINUTE = 200
const WHITESPACE_RE = /\s+/

interface MdastNode {
  children?: MdastNode[]
  data?: { estree?: { body?: EsmStatement[] } }
  type: string
  value?: string
}

interface EsmStatement {
  declaration?: {
    type: string
    declarations: EsmDeclarator[]
  }
  type: string
}

interface EsmDeclarator {
  id?: { name?: string }
  init?: {
    type: string
    properties: EsmProperty[]
  }
}

interface EsmProperty {
  computed: boolean
  key: { type: string; name: string }
  kind: string
  method: boolean
  shorthand: boolean
  type: string
  value: { type: string; value: number; raw: string }
}

function extractText(node: MdastNode): string {
  if (node.value) {
    return node.value
  }
  if (!node.children) {
    return ''
  }

  let text = ''
  for (const child of node.children) {
    text += `${extractText(child)} `
  }
  return text
}

function countWords(text: string): number {
  return text
    .trim()
    .split(WHITESPACE_RE)
    .filter(word => word.length > 0).length
}

function makeReadingTimeProperty(minutes: number): EsmProperty {
  return {
    type: 'Property',
    key: { type: 'Identifier', name: 'readingTime' },
    value: { type: 'Literal', value: minutes, raw: String(minutes) },
    kind: 'init',
    method: false,
    shorthand: false,
    computed: false,
  }
}

function findFrontmatterObject(node: MdastNode): EsmDeclarator['init'] | undefined {
  if (node.type !== 'mdxjsEsm') {
    return
  }

  const body = node.data?.estree?.body
  if (!body) {
    return
  }

  for (const statement of body) {
    if (statement.type !== 'ExportNamedDeclaration') {
      continue
    }
    if (statement.declaration?.type !== 'VariableDeclaration') {
      continue
    }

    for (const declarator of statement.declaration.declarations) {
      if (declarator.id?.name === 'frontmatter' && declarator.init?.type === 'ObjectExpression') {
        return declarator.init
      }
    }
  }

  return
}

function injectReadingTime(tree: MdastNode, minutes: number): void {
  if (!tree.children) {
    return
  }

  for (const node of tree.children) {
    const frontmatter = findFrontmatterObject(node)
    if (frontmatter) {
      frontmatter.properties.push(makeReadingTimeProperty(minutes))
      return
    }
  }
}

export function remarkReadingTime() {
  return (tree: MdastNode) => {
    const text = extractText(tree)
    const words = countWords(text)
    const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))

    injectReadingTime(tree, minutes)
  }
}
