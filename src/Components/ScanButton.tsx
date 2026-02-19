'use client';

import React from 'react';
import classNames from 'classnames';

type Props = {
  scanning?: boolean;
  onClick?: () => void;
};

export default function ScanButton({ scanning=false, onClick }: Props) {
  return (
    <button
      className={classNames('scan-btn', { 'scanning': scanning })}
      onClick={onClick}
      aria-pressed={scanning}
      aria-label="Scan for leaders"
    >
      <div className="scan-ring" />
      <div className="scan-inner">
        <span className="scan-text">Encounter</span>
      </div>
      {scanning && <div className="wave" />}
    </button>
  );
}
