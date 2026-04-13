'use client';

import React from 'react';
import classNames from 'classnames';

type Props = {
  scanning?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export default function ScanButton({
  scanning = false,
  onClick,
  disabled = false,
  ariaLabel = 'Scan for leaders',
}: Props) {
  return (
    <button
      type="button"
      className={classNames('scan-btn', { scanning })}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={scanning}
      aria-label={ariaLabel}
    >
      <div className="scan-ring" />
      <div className="scan-inner">
        <span className="scan-text">Encounter</span>
      </div>
      {scanning && <div className="wave" />}
    </button>
  );
}