import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/assemblio/Header";
import { Hero } from "@/components/assemblio/Hero";
import { Support } from "@/components/assemblio/Support";
import { HowItWorks } from "@/components/assemblio/HowItWorks";
import { Finds } from "@/components/assemblio/Finds";
import { Principles } from "@/components/assemblio/Principles";
import { Faq } from "@/components/assemblio/Faq";
import { JoinPilot } from "@/components/assemblio/JoinPilot";
import { SiteFooter } from "@/components/assemblio/SiteFooter";
import { Pilot } from "@/components/assemblio/Pilot";
import { Journey } from "@/components/assemblio/Journey";
import { Team } from "@/components/assemblio/Team";
import { NameStory } from "@/components/assemblio/NameStory";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="min-h-screen bg-section font-sans text-ink">
      <Header />
      <Hero />
      <Support />
      <HowItWorks />
      <Finds />
      <Principles />
      <Pilot />
      <Journey />
      <Team />
      <NameStory />
      <Faq />
      <JoinPilot />
      <SiteFooter />
    </main>
  );
}
