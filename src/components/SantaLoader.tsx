import Lottie from "lottie-react";
import santaSwing from "../assets/Santa Claus _ Swinging Santa _ Christmas.json";
import Navbar from "./Navbar";
import Snowflakes from "./Snowflakes";

const SantaLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
    <Snowflakes />
    <Navbar />
    <div className="text-center relative z-10">
      <Lottie
        animationData={santaSwing}
        loop={true}
        autoplay={true}
        style={{ height: "300px", width: "300px" }}
      />
      <p className="text-snow-white mt-4">Fetching your holiday events...</p>
    </div>
  </div>
);

export default SantaLoader;
