import Image from "next/image";
import Story from "./UI/story";
import Reel from "./UI/reels";

export default function Home() {
  return (
    <div>
      <div className="fixed top-0 flex p-4 gap-8 border border-gray-200 bg-white">{Array.from({ length: 12 }).map((_, index) => (
        <Story key={index} />
      ))}</div> 
      <div className="flex pt-40 gap-8 flex-col items-center justify-center right-0 left-0">{Array.from({ length: 12 }).map((_, index) => (
        <Reel key={index} />
      ))}</div> 
    </div>
  );
}
