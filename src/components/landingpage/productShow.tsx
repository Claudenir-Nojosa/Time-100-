import React from "react";
import TitleSection from "./title-section";
import Image from "next/image";
import Cal from "../../../public/cal.png";

const ProductShowSection = () => {
  return (
    <section
      className="px-4
    sm:px-6
    flex
    justify-center
    items-center
    flex-col
    relative
  "
    >
      <div
        className="w-[30%]
      blur-[120px]
      rounded-full
      h-32
      absolute
      bg-brand-primaryPurple/50
      -z-10
      top-22
    "
      />
      <TitleSection
        title="Keep track of your meetings all in one place"
        subheading="Capture your ideas, thoughts, and meeting notes in a structured and organized manner."
        pill="Features"
      />
      <div
        className="mt-10
      max-w-[450px]
      flex
      justify-center
      items-center
      relative
      sm:ml-0
      rounded-2xl
      border-8
      border-washed-purple-300 
      border-opacity-10
    "
      >
        <Image src={Cal} alt="Banner" className="rounded-2xl" />
      </div>
    </section>
  );
};

export default ProductShowSection;
