import React from 'react';
import { getScoreColor } from '../../utils/helpers';

interface ScoreRingProps {
  score: number;
  size?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
  const color = getScoreColor(score);

  return (
    <div
      className="ring"
      data-v={score}
      style={
        {
          '--p': score,
          '--ringc': color
        } as React.CSSProperties
      }
      role="img"
      aria-label={`Match score ${score} of 100`}
    />
  );
};
