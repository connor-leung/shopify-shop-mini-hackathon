import React from "react";

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
    <div className="min-h-screen bg-gradient-to-t from-white to-[#EEEAFF] relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/img/connections-bg.png)" }}
      />

      {/* Content */}
      <div className="relative z-10 pt-12 px-4 pb-8 max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-extrabold mb-4">Shopify Connections</h1>

        <p className="mb-4 text-gray-700 leading-relaxed">
          Match the products into <strong>4 groups</strong> of 4 based on a
          hidden category. Each group has a difficulty – Easy, Medium, Hard, and
          Expert. You have <strong>4 lives</strong>. A wrong guess costs a life.
          Solve all groups before you run out of lives!
        </p>

        <ol className="text-left list-decimal list-inside space-y-1 mb-6 text-gray-700">
          <li>Select up to 4 items you think belong together.</li>
          <li>
            Tap <span className="font-semibold">Submit</span> to check.
          </li>
          <li>
            If correct, the group is locked in and its colour (green, yellow,
            orange, red) shows its difficulty.
          </li>
          <li>
            Use the clues – remaining items and difficulties – to find the rest.
          </li>
        </ol>

        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full mb-3"
          onClick={onStart}
        >
          Start Game
        </button>

        {onBack && (
          <button
            className="px-4 py-2 text-sm text-blue-600 underline"
            onClick={onBack}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
