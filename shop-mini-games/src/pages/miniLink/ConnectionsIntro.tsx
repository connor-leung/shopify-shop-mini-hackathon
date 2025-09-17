import { Button } from "../../components/Button";
import { BackButton } from "../../components/BackButton";

interface ConnectionsIntroProps {
  onStart: () => void;
  onBack?: () => void;
}

// Intro / how-to-play screen for the Shopify Connections game
export default function ConnectionsIntro({
  onStart,
  onBack,
}: ConnectionsIntroProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "linear-gradient(to bottom, #FAFAFA, #EEEAFF)" }}
    >
      {/* Back Button */}
      {onBack && (
        <BackButton
          onClick={onBack}
          variant="floating"
        />
      )}
      
      <div className="px-4 py-8 max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-extrabold mb-4">How to Play Mini Link</h1>

        <p className="mb-4 text-gray-700 leading-relaxed">
          The goal of this game is figure out groups of items that have a shared
          commonality. Select four items at a time and press Submit to make a
          guess.
        </p>

        <p className="mb-6 text-gray-700 leading-relaxed">
          The game will end if you make 4 incorrect guesses. Press Hint to see
          3/4 items that share a commonality to deduce the fourth item from that
          group.
        </p>

        <div className="space-y-3">
          <Button
            onClick={onStart}
            variant="primary"
            size="medium"
            className="w-full"
          >
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}
