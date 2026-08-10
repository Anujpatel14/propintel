'use client';

import React from 'react';

const HERO_IMG =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=75';

/**
 * Single full-bleed architecture photo with a strong left/top scrim
 * so white hero copy stays readable.
 */
export default function AtmosphericHero() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#080c18]" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_IMG}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
      />

      {/* Strong readability scrim — left + center for copy */}
      <div className="absolute inset-0 bg-[#080c18]/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080c18]/85 via-[#080c18]/55 to-[#080c18]/25" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#080c18]/55 via-transparent to-transparent" />
      {/* Soft section blend — kept very subtle so it doesn’t wash the photo */}
      <div className="absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-[#f3f6fb]/35 to-transparent" />
    </div>
  );
}
