import Image from "next/image";
import Link from "next/link";

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
  return (
    <>
      <main className="bg-transparent font-sans text-[#2f2f2e]">
        <section className="relative flex min-h-[800px] h-screen items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              alt="Purdue Campus"
              className="object-cover"
              fill
              priority
              sizes="100vw"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxGfhuniDmWPL7z9h3jaBT9Jsu7Y7L43B-ZXxCBooyD23NY1JH8SDLbUMCxkvfLESpponx6OJAUSZ6sTEWt7cnTE_PSUe0nyPSwIOPuaudxjv_RNo2WsjqOclUQhF3QrwUssUMUHBGrsXFeL0XViBZus5sFFKYKwPp_XZTvdL_3uxZuhDzjm2WV1N8Vlset-RWxeOvtFpqkeQYcB8446ljcgX58moyo2pGHSyNTkQGWU1krvIJvFcv1sQC4Ex875MBlGqzAzfIHhNz"
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
                      placeholder="Spring 2025"
                      type="text"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-start border-t border-[#afadac]/30 py-2 md:border-l md:border-t-0 md:pl-4">
                  <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#0052d0]">Budget</span>
                  <div className="flex w-full items-center gap-2">
                    <span className="text-sm text-[#0052d0]">$</span>
                    <input
                      className="w-full border-none bg-transparent p-0 font-bold text-[#2f2f2e] placeholder:text-[#787676] focus:ring-0"
                      placeholder="$500 - $900"
                      type="text"
                    />
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
              <button className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-3 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20">
                <span className="transition-transform group-hover:rotate-12">◧</span>
                3D View
              </button>
              <Link
                className="rounded-full bg-[#a03a0f] px-8 py-3 font-bold text-[#ffefeb] shadow-lg transition-all hover:brightness-110"
                href="/listings/new"
              >
                Post Your Sublease
              </Link>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 animate-bounce flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Scroll to curate</span>
            <span className="text-white">↓</span>
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

        <section className="relative mx-auto my-24 max-w-7xl overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#e0e7ff] to-[#f5f3ff] px-8 py-32">
          <div className="relative z-10 grid items-center gap-16 lg:grid-cols-2">
            <div className="flex flex-col gap-8">
              <h2 className="font-display text-5xl font-extrabold leading-none text-[#001e5a] md:text-7xl">
                See It Before
                <br />
                You Visit.
              </h2>
              <p className="max-w-md text-xl text-[#001e5a]/80">
                Experience the space in ultra-high fidelity. Our kinetic 3D walkthroughs let you feel the vibe before you even step on campus.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex w-fit items-center gap-4 rounded-2xl bg-white/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff946e] text-[#5c1a00]">◎</div>
                  <div>
                    <h4 className="font-bold text-[#001e5a]">Full Spatial View</h4>
                    <p className="text-sm opacity-70">Interactive floorplan mapping</p>
                  </div>
                </div>
                <div className="flex w-fit items-center gap-4 rounded-2xl bg-white/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0052d0] text-[#f1f2ff]">◉</div>
                  <div>
                    <h4 className="font-bold text-[#001e5a]">Vibe Check</h4>
                    <p className="text-sm opacity-70">Check lighting and views in real-time</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div
                className="absolute h-[120%] w-[120%] rounded-full bg-cover bg-center opacity-30 blur-3xl"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA9_FwICJuNVAXyAplhCjb_s39fO92NbqLIJTDzgwzAUdpQ3mr3xA9Xc6mtrFvIKajficSqjgfJJAVwRluoy4lSGqofV_pWMNb2F164aP4_PkaAuWoG97gjiomInRQvMpVnBDbMbjxyJDY3kAukmRj3dxAmKn0qOEoD7i5Qi_gac29TDwcHf2IY2tztiA5UMWcRoU3rMXYcyRoKYZpK-cWsIxj1fMmiEOtnuyD2o7gi8wY7R1OpYZqLT3Ulb0nSPcsSPiXwKybYUo09')",
                }}
              />
              <div className="relative aspect-[9/19.5] w-full max-w-[320px] rotate-[-2deg] overflow-hidden rounded-[3rem] border-[12px] border-[#1a1a1a] bg-[#f9f6f5] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transition-transform duration-700 hover:rotate-0">
                <Image
                  alt="3D digital architectural visualization"
                  className="object-cover"
                  fill
                  sizes="320px"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9_FwICJuNVAXyAplhCjb_s39fO92NbqLIJTDzgwzAUdpQ3mr3xA9Xc6mtrFvIKajficSqjgfJJAVwRluoy4lSGqofV_pWMNb2F164aP4_PkaAuWoG97gjiomInRQvMpVnBDbMbjxyJDY3kAukmRj3dxAmKn0qOEoD7i5Qi_gac29TDwcHf2IY2tztiA5UMWcRoU3rMXYcyRoKYZpK-cWsIxj1fMmiEOtnuyD2o7gi8wY7R1OpYZqLT3Ulb0nSPcsSPiXwKybYUo09"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/20 text-5xl text-white shadow-2xl backdrop-blur-md transition-transform hover:scale-110">
                    ▶
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-4 h-48 w-32 rotate-12 rounded-full bg-stone-900/10 blur-2xl" />
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#a03a0f]/10 blur-[100px]" />
        </section>
      </main>

      <footer className="mt-auto w-full bg-stone-100 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-12 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <div className="font-display text-lg font-bold text-stone-800">BoilerSub</div>
            <p className="text-center text-sm tracking-wide text-stone-500 md:text-left">
              © 2024 BoilerSub. The Kinetic Curator for Purdue Housing.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {["Privacy", "Terms", "Safety", "Contact", "About Us"].map((item) => (
              <a
                key={item}
                className="text-sm tracking-wide text-stone-500 underline decoration-blue-500/30 transition-all hover:text-stone-900"
                href="#"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex gap-4 text-stone-400">
            <span className="cursor-pointer transition-colors hover:text-blue-600">⤴</span>
            <span className="cursor-pointer transition-colors hover:text-blue-600">◌</span>
          </div>
        </div>
      </footer>
    </>
  );
}
