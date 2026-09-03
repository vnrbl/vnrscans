"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function LandingFaq() {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      <AccordionItem value="faq-1" className="glass-panel rounded-[4px] px-5 border-border/40 transition-colors data-[state=open]:border-purple-500/40">
        <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.03em] hover:no-underline text-white hover:text-purple-300 transition-colors py-4.5">
          Is vnrscans completely free to use?
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4.5 pt-1">
          Yes! vnrscans is entirely free for all readers. We do not require any paid subscription to read our indexed series or keep track of your reading progress.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="faq-2" className="glass-panel rounded-[4px] px-5 border-border/40 transition-colors data-[state=open]:border-purple-500/40">
        <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.03em] hover:no-underline text-white hover:text-purple-300 transition-colors py-4.5">
          How does the cultivation realm and Spiritual Qi system work?
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4.5 pt-1">
          As you read chapters, interact with comments, and keep up your daily reading streaks, you gather Spiritual Qi. Accumulating Qi allows your soul to break through higher Cultivation Realms, unlocking rare badges, exclusive animated avatar frames, custom accent glows, and prestigious seasonal community ranks.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="faq-3" className="glass-panel rounded-[4px] px-5 border-border/40 transition-colors data-[state=open]:border-purple-500/40">
        <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.03em] hover:no-underline text-white hover:text-purple-300 transition-colors py-4.5">
          Where does vnrscans get its content?
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4.5 pt-1">
          vnrscans does not store any files on its servers. We only link to media hosted on third-party services. If you have copyright concerns, please visit our DMCA registry page.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="faq-4" className="glass-panel rounded-[4px] px-5 border-border/40 transition-colors data-[state=open]:border-purple-500/40">
        <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.03em] hover:no-underline text-white hover:text-purple-300 transition-colors py-4.5">
          What is your DMCA copyright policy?
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4.5 pt-1">
          We take intellectual property ownership extremely seriously. If you are a copyright holder and believe your work is on our platform without authorization, you can file a quick takedown notice on our DMCA page. We review and remove verified reports within 5 business days.
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="faq-5" className="glass-panel rounded-[4px] px-5 border-border/40 transition-colors data-[state=open]:border-purple-500/40">
        <AccordionTrigger className="text-sm font-bold uppercase tracking-[0.03em] hover:no-underline text-white hover:text-purple-300 transition-colors py-4.5">
          Can independent creators publish their work here?
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground leading-relaxed font-light pb-4.5 pt-1">
          Absolutely! We love supporting independent authors and illustrators. Please reach out to creator@vnrscans.com or use our Contact page form to send us details of your work, and our admin team will assist you in setting up your series.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
