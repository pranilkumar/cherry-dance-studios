'use client';

interface HowToPayProps {
  etransferExtra?: string;
}

export default function HowToPay({ etransferExtra }: HowToPayProps) {
  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
        How to pay
      </h2>
      <div className="space-y-2 text-sm text-white/75">
        <p>
          <span className="font-semibold text-white">E-transfer</span>{' '}
          — send to{' '}
          <a href="mailto:cherrydancestudio.cds@gmail.com" className="text-[#ee2435] hover:underline">
            cherrydancestudio.cds@gmail.com
          </a>
          {' '}and include your dancer&rsquo;s name{etransferExtra ? ` ${etransferExtra}` : ''} in the message.
        </p>
        <p>
          <span className="font-semibold text-white">Cash</span>{' '}
          — hand it to us at the studio.
        </p>
        <p>
          <span className="font-semibold text-white">Questions?</span>{' '}
          <a href="https://wa.me/16138903789" className="text-[#ee2435] hover:underline" target="_blank" rel="noreferrer">
            WhatsApp us at 613-890-3789
          </a>
        </p>
      </div>
    </section>
  );
}
