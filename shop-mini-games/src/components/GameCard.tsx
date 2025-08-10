interface GameDetails {
  route: string;
  image: string;
  name: string;
  description?: string;
  onNavigate: () => void;
}

export default function GameCard({
  gameDetails,
}: {
  gameDetails: GameDetails;
}) {
  const { route, image, name, description, onNavigate } = gameDetails;

  return (
    <div
      className="relative w-full h-48 bg-gray-400 bg-cover bg-center bg-no-repeat rounded-lg cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
      style={{
        backgroundImage: image,
        minHeight: "192px",
      }}
      onClick={onNavigate}
      role="button"
      tabIndex={0}
      aria-label={route}
    >
      <div className="flex flex-row absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
        <div>
          <h3 className="text-lg font-bold">{name}</h3>
          <p className="text-sm text-gray-300">
            {description || "Click to play!"}
          </p>
        </div>
        <button className="ml-auto bg-white text-black rounded-xl px-3">
          Solve
        </button>
      </div>
    </div>
  );
}
