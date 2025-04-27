import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import TitleSection from "./title-section";
import Banner from "../../../public/appBanner.png";

const HeroSection = () => {
  return (
    <section className="overflow-hidden px-4 sm:px-6 mt-10 sm:flex sm:flex-col gap-4 md:justify-center md:items-center">
      <TitleSection
        pill="✨ Your Workspace, Perfected"
        title="All-In-One Collaboration and Productivity Platform"
      />

      {/* Botão com borda gradiente e fundo preto */}
      <div className="p-[2px] mt-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
        <Button
          variant="btn-secondary"
          className="w-full rounded-md bg-black text-sm text-white hover:bg-black/90"
        >
          Get Cypress Free
        </Button>
      </div>
      <div
        className="md:mt-[-90px]
            sm:w-full
            w-[750px]
            flex
            justify-center
            items-center
            mt-[-40px]
            relative
            sm:ml-0
            ml-[-50px]
          "
      >
        <Image src={Banner} alt="Application Banner" />
        <div
          className="bottom-0
              top-[50%]
              bg-gradient-to-t
              dark:from-background
              left-0
              right-0
              absolute
              z-10
            "
        ></div>
      </div>
    </section>
  );
};

export default HeroSection;
