import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'mark';
  height?: number | string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size,
  height = 38,
  variant = 'mark'
}) => {
  const [imgError, setImgError] = useState(false);

  // If full horizontal brand logo lockup is requested
  if (variant === 'full') {
    return (
      <div
        className={`brand-full-wrap ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#090909',
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid #1C1C1F'
        }}
      >
        <img
          src="/logo.png"
          alt="Cube Tech Consults — Customer Excellence & Consulting"
          style={{
            height: height || 36,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            display: 'block'
          }}
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  // If mark/icon only
  if (!imgError) {
    return (
      <img
        src="/logo-icon.png"
        alt="Cube Tech Consults Mark"
        className={`mark ${className}`}
        style={{
          width: size || 40,
          height: size || 40,
          objectFit: 'contain',
          borderRadius: '6px',
          background: '#090909',
          border: '1px solid #1C1C1F',
          padding: '2px',
          flex: 'none'
        }}
        onError={() => setImgError(true)}
        loading="eager"
        decoding="async"
      />
    );
  }

  // High-fidelity fallback SVG
  return (
    <svg
      className={`mark ${className}`}
      viewBox="20 20 480 500"
      aria-hidden="true"
      style={{
        width: size || 40,
        height: size || 40,
        flex: 'none'
      }}
    >
      <path
        fill="#E4050A"
        d="M58 148A215 215 0 0 1 432 122L375 162A150 150 0 0 0 305 112V350Q305 376 260 376Q215 376 215 350V112A150 150 0 0 0 112 215Z"
      />
      <path
        fill="var(--mark-ink)"
        d="M38 172A225 225 0 0 0 436 388C330 420 190 410 120 320C85 270 55 215 38 172Z"
      />
      <path
        fill="#FFC107"
        d="M336 188H462Q485 188 485 212V304Q485 328 462 328H336Q330 328 330 322V194Q330 188 336 188Z"
      />
      <path
        fill="var(--mark-ink)"
        d="M440 210C395 215 360 240 367 262C374 290 410 312 442 316C410 298 392 275 396 255C400 235 418 220 440 210Z"
      />
    </svg>
  );
};
