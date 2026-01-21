import { CreateRoomCard } from "./create-room-card";
import { JoinRoomCard } from "./join-room-card";

export function ActionCards() {
  return (
    <section className="px-4 pb-12 sm:pb-16">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <CreateRoomCard />
        <JoinRoomCard />
      </div>
    </section>
  );
}
