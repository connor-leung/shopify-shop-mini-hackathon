import GameCard from "./GameCard";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="pt-12 px-4 pb-6">
      <h1 className="text-2xl font-bold mb-2">Welcome to Mini Mini Games!</h1>
      <h2>Play games and have fun!</h2>

      <div className="flex flex-col items-center space-y-4 my-6">
        <GameCard
          gameDetails={{
            route: "connections-intro",
            image: "shop-mini-games/public/img/connections-bg.png",
            name: "Mini Link",
            onNavigate: () => onNavigate("connections-intro"),
          }}
        />
        <GameCard
          gameDetails={{
            route: "mini-hunt",
            image:
              "https://via.placeholder.com/400x200/e74c3c/ffffff?text=Mini+Hunt",
            name: "Mini Hunt",
            onNavigate: () => onNavigate("mini-hunt"),
          }}
        />
      </div>
    </div>
  );
}
