import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { SearchPage } from "./search/searchPage";
import QuestionDemo from "./components/QuestionDemo";
import ConnectionsIntro from "./components/ConnectionsIntro";
import ConnectionsGame from "./components/ConnectionsGame";
import ConnectionsResults from "./components/ConnectionsResults";
import MiniHuntPage from "./miniHunt/MiniHuntPage";

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
            onQuit={() => setCurrentPage("home")}
          />
        );

      case "connections-results":
        return (
          <ConnectionsResults
            results={results}
            onPlayAgain={() => setCurrentPage("connections-game")}
            onBackHome={() => setCurrentPage("home")}
          />
        );

      case "mini-hunt":
        return <MiniHuntPage />;

      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return renderPage();
}
