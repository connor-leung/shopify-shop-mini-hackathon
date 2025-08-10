import React, { useState, useEffect } from "react";
import { usePopularProducts } from "@shopify/shop-minis-react";
import {
  ProductNode,
  neighbors,
  existsWithinJumps,
  PathResult,
} from "../utils/miniHunt";

interface GameState {
  startProduct: ProductNode | null;
  targetProduct: ProductNode | null;
  currentProduct: ProductNode | null;
  availableProducts: ProductNode[];
  path: string[];
  jumpsUsed: number;
  maxJumps: number;
  gameStatus: "setup" | "playing" | "won" | "lost";
  timeStarted: number | null;
  timeCompleted: number | null;
  livesRemaining: number;
}

const INITIAL_LIVES = 3;
const MAX_JUMPS = 5;

export default function MiniHuntPage() {
  const { products } = usePopularProducts();

  const [gameState, setGameState] = useState<GameState>({
    startProduct: null,
    targetProduct: null,
    currentProduct: null,
    availableProducts: [],
    path: [],
    jumpsUsed: 0,
    maxJumps: MAX_JUMPS,
    gameStatus: "setup",
    timeStarted: null,
    timeCompleted: null,
    livesRemaining: INITIAL_LIVES,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert Shopify products to ProductNode format
  const availableProducts: ProductNode[] =
    products?.map((product) => ({
      id: product.id,
      handle: product.handle,
      title: product.title,
    })) || [];

  const startNewGame = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!availableProducts || availableProducts.length < 2) {
        setError(
          "Not enough products available. Please wait for products to load."
        );
        return;
      }

      // Randomly select start and target products from catalog
      const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
      const start = shuffled[0];
      const target = shuffled[1];

      // Get initial neighbors for the starting product (simulate with related products)
      const initialNeighbors = availableProducts
        .filter((p) => p.id !== start.id && p.id !== target.id)
        .slice(0, 4);

      setGameState({
        startProduct: start,
        targetProduct: target,
        currentProduct: start,
        availableProducts: initialNeighbors,
        path: [start.handle],
        jumpsUsed: 0,
        maxJumps: MAX_JUMPS,
        gameStatus: "playing",
        timeStarted: Date.now(),
        timeCompleted: null,
        livesRemaining: INITIAL_LIVES,
      });
    } catch (err) {
      setError("Failed to start game. Please try again.");
      console.error("Game start error:", err);
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (selectedProduct: ProductNode) => {
    if (gameState.gameStatus !== "playing") return;

    setLoading(true);
    const newPath = [...gameState.path, selectedProduct.handle];
    const newJumpsUsed = gameState.jumpsUsed + 1;

    try {
      // Check if we reached the target
      if (selectedProduct.handle === gameState.targetProduct?.handle) {
        setGameState((prev) => ({
          ...prev,
          currentProduct: selectedProduct,
          path: newPath,
          jumpsUsed: newJumpsUsed,
          gameStatus: "won",
          timeCompleted: Date.now(),
        }));
        return;
      }

      // Check if we're out of jumps
      if (newJumpsUsed >= gameState.maxJumps) {
        const newLives = gameState.livesRemaining - 1;
        if (newLives <= 0) {
          setGameState((prev) => ({
            ...prev,
            currentProduct: selectedProduct,
            path: newPath,
            jumpsUsed: newJumpsUsed,
            gameStatus: "lost",
            livesRemaining: 0,
            timeCompleted: Date.now(),
          }));
        } else {
          // Reset with fewer lives
          setGameState((prev) => ({
            ...prev,
            livesRemaining: newLives,
            jumpsUsed: 0,
            path: [prev.startProduct!.handle],
            currentProduct: prev.startProduct,
          }));
        }
        return;
      }

      // Get neighbors for the selected product (simulate with available products)
      const nextNeighbors = availableProducts
        .filter(
          (p) => p.id !== selectedProduct.id && !newPath.includes(p.handle)
        )
        .slice(0, 4);

      setGameState((prev) => ({
        ...prev,
        currentProduct: selectedProduct,
        availableProducts: nextNeighbors,
        path: newPath,
        jumpsUsed: newJumpsUsed,
      }));
    } catch (err) {
      setError("Failed to make move. Please try again.");
      console.error("Move error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionTime = () => {
    if (!gameState.timeStarted || !gameState.timeCompleted) return 0;
    return (gameState.timeCompleted - gameState.timeStarted) / 1000;
  };

  const submitScore = async () => {
    if (gameState.gameStatus !== "won") return;

    const completionTime = getCompletionTime();
    const score = Math.max(
      0,
      1000 - gameState.jumpsUsed * 100 - completionTime * 10
    );

    try {
      const response = await fetch("http://localhost:8000/api/progress/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "demo_player", // Replace with actual user ID
          completion_time: completionTime,
          score: Math.round(score),
          completed: true,
          lives_remaining: gameState.livesRemaining,
          game_type: "mini-hunt",
        }),
      });

      if (response.ok) {
        console.log("Score submitted successfully");
      }
    } catch (err) {
      console.error("Failed to submit score:", err);
    }
  };

  useEffect(() => {
    if (gameState.gameStatus === "won") {
      submitScore();
    }
  }, [gameState.gameStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Mini Hunt</h1>
          <p className="text-blue-200">
            Find a path from the start product to the target product!
          </p>
        </div>
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {gameState.gameStatus === "setup" && (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                How to Play
              </h2>
              <div className="text-blue-200 space-y-2 text-left max-w-md mx-auto">
                <p>• Find a connection path between two products</p>
                <p>
                  • You have {MAX_JUMPS} jumps and {INITIAL_LIVES} lives
                </p>
                <p>
                  • Products are connected through categories, collections, and
                  recommendations
                </p>
                <p>• Faster completion = higher score!</p>
              </div>
              {availableProducts.length > 0 && (
                <div className="mt-4 text-green-300 text-sm">
                  ✓ {availableProducts.length} products loaded from catalog
                </div>
              )}
            </div>
            <button
              onClick={startNewGame}
              disabled={loading || availableProducts.length < 2}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading
                ? "Setting up..."
                : availableProducts.length < 2
                ? "Loading products..."
                : "Start New Game"}
            </button>
          </div>
        )}

        {gameState.gameStatus === "playing" && (
          <div className="space-y-6">
            {/* Game Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-blue-200 text-sm">Lives</div>
                  <div className="text-2xl font-bold text-white">
                    {"❤️".repeat(gameState.livesRemaining)}
                  </div>
                </div>
                <div>
                  <div className="text-blue-200 text-sm">Jumps Used</div>
                  <div className="text-2xl font-bold text-white">
                    {gameState.jumpsUsed}/{gameState.maxJumps}
                  </div>
                </div>
                <div>
                  <div className="text-blue-200 text-sm">Current</div>
                  <div className="text-lg font-semibold text-white truncate">
                    {gameState.currentProduct?.title}
                  </div>
                </div>
                <div>
                  <div className="text-blue-200 text-sm">Target</div>
                  <div className="text-lg font-semibold text-yellow-300 truncate">
                    {gameState.targetProduct?.title}
                  </div>
                </div>
              </div>
            </div>

            {/* Path Visualization */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Your Path</h3>
              <div className="flex flex-wrap items-center gap-2">
                {gameState.path.map((handle, index) => {
                  const product = [
                    ...availableProducts,
                    gameState.startProduct,
                    gameState.targetProduct,
                  ].find((p) => p?.handle === handle);
                  return (
                    <React.Fragment key={handle}>
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                        {product?.title || handle}
                      </div>
                      {index < gameState.path.length - 1 && (
                        <span className="text-blue-300">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Available Products */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">
                Choose Your Next Product
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.availableProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => makeMove(product)}
                    disabled={loading}
                    className="bg-white/20 hover:bg-white/30 text-white p-4 rounded-lg transition-all duration-200 text-left disabled:opacity-50"
                  >
                    <div className="font-semibold">{product.title}</div>
                    <div className="text-sm text-blue-200">
                      Handle: {product.handle}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(gameState.gameStatus === "won" ||
          gameState.gameStatus === "lost") && (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-6">
              <h2 className="text-3xl font-bold text-white mb-4">
                {gameState.gameStatus === "won"
                  ? "🎉 You Won!"
                  : "💔 Game Over"}
              </h2>

              {gameState.gameStatus === "won" && (
                <div className="space-y-4">
                  <div className="text-green-300 text-lg">
                    Path found in {gameState.jumpsUsed} jumps!
                  </div>
                  <div className="text-blue-200">
                    Time: {getCompletionTime().toFixed(1)}s
                  </div>
                  <div className="text-blue-200">
                    Lives remaining: {gameState.livesRemaining}
                  </div>
                  <div className="text-yellow-300 font-semibold">
                    Score:{" "}
                    {Math.round(
                      Math.max(
                        0,
                        1000 -
                          gameState.jumpsUsed * 100 -
                          getCompletionTime() * 10
                      )
                    )}
                  </div>
                </div>
              )}

              {gameState.gameStatus === "lost" && (
                <div className="text-red-300">
                  Better luck next time! Try to find shorter paths.
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-white font-semibold mb-2">Your Path:</h4>
                <div className="flex flex-wrap justify-center items-center gap-2">
                  {gameState.path.map((handle, index) => {
                    const product = [
                      ...availableProducts,
                      gameState.startProduct,
                      gameState.targetProduct,
                    ].find((p) => p?.handle === handle);
                    return (
                      <React.Fragment key={handle}>
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                          {product?.title || handle}
                        </div>
                        {index < gameState.path.length - 1 && (
                          <span className="text-blue-300">→</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={startNewGame}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Play Again"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
