"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const featureCards = [
  {
    title: "The Aspire Loft",
    subtitle: "Steps away from Discovery Park.",
    price: "$1,150",
    note: "/ month",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAT6wnQHCsXhCwIA6pO7Q7Nd9mbYpQgKZOv3iQ71tp2GlK9PygpF_Bez6txbF59vQLViV2S87m14PdBa36ZFN-StoNWQyiGVS5LeYFU0X05yPRdRQ-5F0EGYrzqQeu2KvlYQS5MmGSxjyCUq9zD9K0mV5x0vFnpAr3lXDM6TIbLQGx-ULDdkoEOMTU96sYZ0zumFj80TkhRbdttCBFAE8JEo6CggszmZxs_5Z_TLpRWQ0IBmft_a_-ZJWf5-HLuT3z1sgN8tX9Uahi",
  },
  {
    title: "State Street Studio",
    subtitle: "$780 · Quiet Area",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCBrTL2Sr9iyhTqMkBMV_VFLP_VZZqpSyaBvhhD9QwtihfKDt-dpUw2jqTNt3rNgQJlMFoIMsPDlsH4qbmxIEt9QkB-GZ-W8VLZjAU_DyAPPQvB-mYAvEFFI3_aVuO82nk2DlJuTSdtuxJX3UFmTkLnBRLS1xbSjiPp42JdleDInBANrR3dAxxbFji6rpLTGWPA3uF47W1ByMwqLyfUYgvsGfu1GUeXUBS3wGs7c-cYmYlRuef3DQGJQCFTOvOF7pMcW74OrMHZXle6",
  },
];

const avatarImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKel1RiDhFlbnnLSfN_CdV4un6cSvh_dfhJ5h8HJr_FZot5Ww95Uf1oKVzPAprtYDQyBuPiIW2RBQp7ohZ3ksvZzmOs-xDJFTEjlJmO3n_2pYrSTbMkxRm4jWLUPN-RXTqV8z5sEqi4770bc6s6jA0N_ugi3IDauntyUP520VU_a3-jkixx7WePeFLoAx26GdOxXZret-g7xukiJ7fwZawUXaIuNjRWTiBY7fzxNN_e-qnNVZdfbE6OXLtDxJYBPhCp-m5ixbiHGl5",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDRks3k33bnE1LwFvwQYUtDoOpByHo7QQcEPxNEd8tlkhbYE4YNhAa3RSBkepOnn6HBIu_GhlwlBw40s_EHxEq4r3Xyg3jiEBAkAudKF2Hp-vbHYP31DUjhYc1mqRWS2Mi-emAAYdqMsQ_qDHQKvSsAWH_NPJpVZaZhfmpjvsMaaQmHOsWivxNKsUqUlu6W48JcywBrXUmexgiqtF0dY6Xfhq3aeib35bBhUS5zqFr8wwG1LnhjFn20zFEIX8kSlvS-EnHpuVi3yz7y",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ3nAt2dsAcmCsNbRsaup3S1FfBTbt5qCyzRc2Q_lRCjKjOQpsp7OX3sR_PORpYp8XoNCVHN6xEVG6GIGVMNSO2LnPMfOjziViMuLyz5WX4EwmjE7n8UVcjONGot_a71Co-dkoebkR0aUbjJaQn3ovSJpfbXe3aa3vUcLvwggFplVdS-C4EDEAxlPllFKFR-cYjw7lE7SwWbJcXknR6LkBOb-zY0Rafgc9auE3WOLmCjEYRurskjvdsyq5iuZM5LjTJ0ADOsM_UdJx",
];

export default function HomePage() {
  const [heroScale, setHeroScale] = useState(1.14);

  useEffect(() => {
    const handleScroll = () => {
      const progress = Math.min(window.scrollY / 420, 1);
      setHeroScale(1.14 - progress * 0.08);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <main className="bg-transparent font-sans text-[#2f2f2e]">
        <section className="relative flex min-h-[800px] h-screen items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 z-0 origin-center transition-transform duration-300 ease-out will-change-transform"
            style={{ transform: `scale(${heroScale})` }}
          >
            <Image
              alt="Purdue Campus"
              className="object-cover"
              fill
              priority
              sizes="100vw"
              src="/landing-hero-stitch-screen.png"
            />
            <div className="absolute inset-0 bg-black/30 backdrop-brightness-75" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-center">
            <div className="mb-12">
              <h1 className="mb-6 font-display text-6xl font-extrabold tracking-tighter text-white drop-shadow-2xl md:text-8xl">
                Stop doomscrolling
                <br />
                <span className="text-[#c3d0ff]">Apartments</span>
              </h1>
              <p className="mx-auto mb-12 max-w-2xl text-xl font-medium text-white/90 drop-shadow-md md:text-2xl">
                The elite housing curator for the Purdue community. Find your next home in West Lafayette with kinetic
                precision.
              </p>
            </div>

            <div className="glass-panel mx-auto flex max-w-4xl flex-col items-center gap-2 rounded-2xl p-2 shadow-2xl md:flex-row">
              <div className="grid w-full flex-1 grid-cols-1 gap-2 px-4 md:grid-cols-3">
                <div className="flex flex-col items-start py-2">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#0052d0]">Location</span>
                  <div className="flex w-full items-center gap-2">
                    <span className="text-sm text-[#0052d0]">◎</span>
                    <input
                      className="w-full border-none bg-transparent p-0 font-bold text-[#2f2f2e] placeholder:text-[#787676] focus:ring-0"
                      defaultValue="Purdue University"
                      placeholder="Near Campus..."
                      type="text"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start border-t border-[#afadac]/30 py-2 md:border-l md:border-t-0 md:pl-4">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#0052d0]">Duration</span>
                  <div className="flex w-full items-center gap-2">
                    <span className="text-sm text-[#0052d0]">◌</span>
                    <input
                      className="w-full border-none bg-transparent p-0 font-bold text-[#2f2f2e] placeholder:text-[#787676] focus:ring-0"
                      defaultValue="Spring 2025"
                      placeholder="Spring 2025"
                      type="text"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start border-t border-[#afadac]/30 py-2 md:border-l md:border-t-0 md:pl-4">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#0052d0]">Budget</span>
                  <div className="flex w-full items-center gap-2">
                    <span className="text-sm text-[#0052d0]">$</span>
                    <select className="w-full cursor-pointer border-none bg-transparent p-0 font-bold text-[#2f2f2e] focus:ring-0">
                      <option value="500-1500">$500 - $1500</option>
                    </select>
                  </div>
                </div>
              </div>
              <Link
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052d0] px-10 py-4 font-bold text-white shadow-lg transition-all hover:bg-[#0047b7] active:scale-95 md:w-auto"
                href="/listings"
              >
                <span>⌕</span>
                Explore Now
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">

              <Link
                className="rounded-full bg-[#a03a0f] px-8 py-3 font-bold text-[#ffefeb] shadow-lg transition-all hover:brightness-110"
                href="/listings/new"
              >
                Post Your Sublease
              </Link>
            </div>
          </div>

        </section>

        <section className="mx-auto max-w-7xl bg-transparent px-8 py-24" id="selection">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#a03a0f]">The Selection</span>
              <h2 className="mt-2 font-display text-5xl font-black tracking-tighter text-[#2f2f2e]">
                Curated Living Spaces
              </h2>
            </div>
            <p className="max-w-md font-medium text-[#5c5b5b]">
              We hand-pick listings that match the high-velocity energy of Purdue students. No static grids, only dynamic opportunities.
            </p>
          </div>

          <div className="grid h-auto grid-cols-1 gap-6 md:h-[600px] md:grid-cols-4 md:grid-rows-2">
            <div className="group relative overflow-hidden rounded-[1.5rem] md:col-span-2 md:row-span-2">
              <Image
                alt="Luxury Living"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                src={featureCards[0].image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-[#ff946e] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#5c1a00]">
                    Available Now
                  </span>
                </div>
                <h3 className="mb-2 font-display text-3xl font-bold text-white">{featureCards[0].title}</h3>
                <p className="mb-4 font-medium text-white/70">{featureCards[0].subtitle}</p>
                <span className="font-display text-4xl font-black text-[#c3d0ff]">
                  {featureCards[0].price}
                  <span className="ml-2 text-sm font-normal text-white/60">{featureCards[0].note}</span>
                </span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[1.5rem] md:col-span-2">
              <Image
                alt="Cozy Studio"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                src={featureCards[1].image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="mb-1 font-display text-2xl font-bold text-white">{featureCards[1].title}</h3>
                <p className="text-sm text-white/70">{featureCards[1].subtitle}</p>
              </div>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] bg-[#0052d0] p-8">
              <div className="text-white">
                <span className="mb-4 block text-4xl">⚡</span>
                <h3 className="text-2xl font-bold leading-tight">Instant Match Technology</h3>
              </div>
              <p className="text-sm text-white/80">Get notified the second a lease matching your vibe hits the market.</p>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-[#afadac]/10 bg-[#dfdcdc] p-8">
              <div className="text-[#6a5a32]">
                <h3 className="font-display text-5xl font-black">2.4k</h3>
                <p className="mt-2 text-sm font-bold uppercase tracking-widest">Active Students</p>
              </div>
              <div className="-space-x-3 flex">
                {avatarImages.map((src) => (
                  <Image
                    key={src}
                    alt="student"
                    className="h-10 w-10 rounded-full border-2 border-white object-cover"
                    height={40}
                    sizes="40px"
                    src={src}
                    width={40}
                  />
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#0052d0] text-xs font-bold text-white">
                  +12
                </div>
              </div>
            </div>
          </div>
        </section>


      </main>
    </>
  );
}
