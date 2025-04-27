import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { CardDescription, CardTitle } from '../ui/card'
import { USERS } from '@/lib/constants'
import CustomCard from './custom-card'
import { randomUUID } from 'crypto'
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'
import TitleSection from './title-section'

const TestimonialsSection = () => {
  return (
    <section className="relative">
    <div
      className="w-full
      blur-[120px]
      rounded-full
      h-32
      absolute
      bg-brand-primaryPurple/50
      -z-100
      top-56
    "
    />
    <div
      className="mt-20
      px-4
      sm:px-6 
      flex
      flex-col
      overflow-x-hidden
      overflow-visible
    "
    >
      <TitleSection
        title="Trusted by all"
        subheading="Join thousands of satisfied users who rely on our platform for their 
        personal and professional productivity needs."
        pill="Testimonials"
      />
      {[...Array(2)].map((arr, index) => (
        <div
          key={randomUUID()}
          className={twMerge(
            clsx("mt-10 flex flex-nowrap gap-6 self-start", {
              "flex-row-reverse": index === 1,
              "animate-[slide_250s_linear_infinite]": true,
              "animate-[slide_250s_linear_infinite_reverse]": index === 1,
              "ml-[100vw]": index === 1,
            }),
            "hover:paused"
          )}
        >
          {USERS.map((testimonial, index) => (
            <CustomCard
              key={testimonial.name}
              className="w-[500px]
              shrink-0s
              rounded-xl
              dark:bg-gradient-to-t
              dark:from-border dark:to-background
            "
              cardHeader={
                <div
                  className="flex
                  items-center
                  gap-4
              "
                >
                  <Avatar>
                    <AvatarImage src={`/avatars/${index + 1}.png`} />
                    <AvatarFallback>AV</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-foreground">
                      {testimonial.name}
                    </CardTitle>
                    <CardDescription className="dark:text-washed-purple-800">
                      {testimonial.name.toLocaleLowerCase()}
                    </CardDescription>
                  </div>
                </div>
              }
              cardContent={
                <p className="dark:text-washed-purple-800">
                  {testimonial.message}
                </p>
              }
            ></CustomCard>
          ))}
        </div>
      ))}
    </div>
  </section>
  )
}

export default TestimonialsSection