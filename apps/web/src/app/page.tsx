import { Navbar } from "@/components/layout/navbar";
import { BackgroundEffects } from "@/components/lobby/background-effects";
import { HeroSection } from "@/components/lobby/hero-section";
import { ActionCards } from "@/components/lobby/action-cards";
import { RecentRooms } from "@/components/lobby/recent-rooms";

export default function LobbyPage() {
  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Navbar />
      <main className="relative">
        <HeroSection />
        <ActionCards />
        <RecentRooms />
      </main>
    </div>
  );
}
