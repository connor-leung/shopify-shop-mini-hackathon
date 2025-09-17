import { usePopularProducts, ProductCard } from "@shopify/shop-minis-react";
import { Button } from "../components/Button";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div
      className="min-h-screen pt-12 px-4 pb-6 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(to bottom, #FAFAFA, #EEEAFF)" }}
    >
      <div className="flex justify-center mb-6 animate-[fadeInUp_0.6s_ease-out]">
        <img
          src="https://i.postimg.cc/wjTdTDJM/logo.png"
          alt="logo"
          className="max-w-1/2 h-auto"
        />
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
        Mini Link
      </h1>
      <span className="text-center text-gray-500 mb-6 w-3/4 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
        {" "}
        Group together Shop items by their hidden link!
      </span>
      <div className="flex flex-col space-y-3 mb-6 w-64">
        <Button
          onClick={() => onNavigate("connections-game")}
          variant="primary"
          size="medium"
          className="w-full animate-[fadeInUp_0.6s_ease-out_0.3s_both]"
        >
          <span className="font-bold">Play Now</span>
        </Button>
        <Button
          onClick={() => onNavigate("connections-intro")}
          variant="outline"
          size="medium"
          className="w-full animate-[fadeInUp_0.6s_ease-out_0.4s_both]"
        >
          <span className="font-bold">How to Play</span>
        </Button>
      </div>
    </div>
  );
}
