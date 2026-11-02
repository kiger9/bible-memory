export default function VerseText({ text, reference }: { text: string; reference: string }) {
  return (
    <figure className="verse">
      <blockquote className="verse-text">{text}</blockquote>
      <figcaption className="verse-ref">{reference}</figcaption>
    </figure>
  )
}
