import type { RichText, RichBlock } from './types'

function RichBlockElement({ block }: { block: RichBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="mb-4 leading-relaxed">{block.text}</p>
    case 'heading':
      if (block.level === 2) {
        return <h2 className="mb-3 mt-8 text-2xl font-semibold">{block.text}</h2>
      }
      return <h3 className="mb-2 mt-6 text-xl font-semibold">{block.text}</h3>
    case 'list':
      return (
        <ul className="mb-4 ml-6 list-disc space-y-1">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'quote':
      return (
        <blockquote className="my-6 border-l-4 border-accent pl-4 italic text-muted">
          {block.text}
        </blockquote>
      )
  }
}

export function PortableBlocks({ blocks }: { blocks: RichText }) {
  return (
    <>
      {blocks.map((block, i) => (
        <RichBlockElement key={i} block={block} />
      ))}
    </>
  )
}
