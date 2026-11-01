import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FadeUp } from "@/components/Reveal";

const faqs = [
  { q: "What is FadäRhy?", a: "FadäRhy is an ecosystem navigator for founders. You describe where you are and what you need in plain words, and FadäRhy returns source-linked routes to relevant people, programmes, expertise, laboratories and funding, with a clear next step." },
  { q: "Who is FadäRhy for?", a: "Life-sciences founders who need to find the right people, programmes, labs and funding. Programmes and ecosystem organisations can also run a pilot to route founders faster and see what happened next." },
  { q: "Is FadäRhy free?", a: "Yes, for founders. There are zero platform fees, and partners can\u2019t pay to appear higher in a founder\u2019s route." },
  { q: "How does FadäRhy decide what to recommend?", a: "It turns your description into a short profile you can check and correct, then matches it to organisations. Every recommendation says why it fits and shows its source, with a link and the date it was last checked." },
  { q: "Which regions does FadäRhy cover?", a: "FadäRhy is Basel-first and Swiss-wide, with a focus on Basel and the Upper Rhine." },
  { q: "What happens to my information?", a: "You control what you share. A programme only sees what you approve for a specific referral." },
  { q: "Where does FadäRhy come from?", a: "FadäRhy was built in Basel, for the founders and organisations of the Basel and Upper Rhine ecosystem." },
  { q: "What does the name FadäRhy mean?", a: "\u201cRhy\u201d is the Basel dialect word for the Rhine, the river that connects the region. FadäRhy is the thread that helps founders find their way along it." },
  { q: "Is FadäRhy a registered company?", a: "Ask us about a pilot and we will share our company details." },
];

export function Faq() {
  return (
    <section id="faq" className="bg-background px-4 py-20 lg:py-28">
      <FadeUp className="mx-auto max-w-[820px] px-1 text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-link">FAQ</p>
        <h2 className="mt-3 md-headline-medium font-medium! tracking-[-0.02em]! text-ink lg:md-headline-large">FadäRhy FAQs</h2>
        <Accordion type="single" collapsible className="mt-8 text-left">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`} className="border-0">
              <AccordionTrigger className="py-6 text-left md-title-large text-[20px]! hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="pb-6 md-body-large text-ink-muted">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-16 text-center md-body-large text-ink-muted">
          Didn't find what you were looking for?{" "}
          <a href="mailto:hallo@fadarhy.ch?subject=Pilot%20enquiry%20for%20Fad%C3%A4Rhy" className="text-link underline underline-offset-4">Ask us about a pilot</a>
        </p>
      </FadeUp>
    </section>
  );
}
