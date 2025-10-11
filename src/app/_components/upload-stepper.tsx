"use client";

import React, { useState } from 'react';

const steps = [
  'Select Video',
  'Add Details',
  'Apply Filters',
  'Preview & Upload',
];

export const UploadStepper: React.FC = () => {
  const [current, setCurrent] = useState(0);

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <ul className="steps w-full mb-6">
        {steps.map((step, idx) => (
          <li
            key={step}
            className={`step ${idx <= current ? 'step-primary' : ''}`}
            onClick={() => setCurrent(idx)}
          >
            {step}
          </li>
        ))}
      </ul>
      <div className="card bg-base-100 p-6 shadow">
        <h2 className="text-xl font-bold mb-2">{steps[current]}</h2>
        <p>Step content for: {steps[current]}</p>
        <div className="flex gap-2 mt-4">
          <button className="btn btn-secondary" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>Back</button>
          <button className="btn btn-primary" onClick={() => setCurrent(Math.min(steps.length - 1, current + 1))} disabled={current === steps.length - 1}>Next</button>
        </div>
      </div>
    </div>
  );
};
