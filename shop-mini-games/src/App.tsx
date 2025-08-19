import { useState } from "react";
import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/search/searchPage";
import QuestionDemo from "./pages/search/QuestionDemo";
import ConnectionsIntro from "./pages/miniLink/ConnectionsIntro";
import ConnectionsGame from "./pages/miniLink/ConnectionsGame";
import ConnectionsResults from "./pages/miniLink/ConnectionsResults";
import GameItemsPage from "./pages/miniLink/GameItemsPage";
import MiniHuntPage from "./pages/miniHunt/MiniHuntPage";

export function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [results, setResults] = useState<any>(null);

  // Handle routing based on current page state
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={setCurrentPage} />;
      case "search":
        return <SearchPage onNavigate={setCurrentPage} />;
      case "demo":
        return <QuestionDemo onNavigate={setCurrentPage} />;

      case "connections-intro":
        return (
          <ConnectionsIntro
            onStart={() => setCurrentPage("connections-game")}
            onBack={() => setCurrentPage("home")}
          />
        );

      case "connections-game":
        return (
          <ConnectionsGame
            onFinish={(results) => {
              // Store results in state and navigate
              setResults(results);
              setCurrentPage("connections-results");
            }}
          />
        );

      case "connections-results":
        return (
          <ConnectionsResults
            results={results}
            onPlayAgain={() => setCurrentPage("connections-game")}
            onBackHome={() => setCurrentPage("home")}
            onNavigate={setCurrentPage}
          />
        );

      case "game-items":
        return <GameItemsPage results={results} onNavigate={setCurrentPage} />;

      case "mini-hunt":
        return <MiniHuntPage />;

      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return renderPage();
}
