"use client";
import { useState } from "react";

export function Explainer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] underline-offset-4 hover:underline"
      >
        How it works
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-[640px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 fade-in"
            style={{ maxHeight: "85vh", overflowY: "auto" }}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-[20px] font-semibold text-[var(--text)]">
                What is this?
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text)] text-[18px] leading-none"
                aria-label="close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-[14px] leading-relaxed text-[var(--text-muted)]">
              <p>
                A working mini Google Ads stack. Type a query, watch advertisers
                compete for slots in a real-time auction. Built from scratch to
                show the math most people get wrong.
              </p>

              <div>
                <div className="text-[12px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
                  Four wrong intuitions this fixes
                </div>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>
                    <span className="text-[var(--text)]">Bid is not what you pay.</span>
                    {" "}GSP charges the minimum needed to beat the next ranker.
                  </li>
                  <li>
                    <span className="text-[var(--text)]">A lower bid can win.</span>
                    {" "}Ad Rank = Bid × Quality Score. High QS beats high bid.
                  </li>
                  <li>
                    <span className="text-[var(--text)]">Quality Score cuts CPC.</span>
                    {" "}Same slot, higher QS → lower price per click.
                  </li>
                  <li>
                    <span className="text-[var(--text)]">Slot 1 is not always best ROI.</span>
                    {" "}Slot 3 is often cheaper per conversion.
                  </li>
                </ol>
              </div>

              <div>
                <div className="text-[12px] uppercase tracking-wider text-[var(--text-dim)] mb-2">
                  Try this
                </div>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    Search <code className="text-[var(--text)] bg-[var(--bg-elevated)] px-1 rounded">vay tiền online</code>.
                    The winner has a lower bid than slot 2 but higher Quality Score.
                  </li>
                  <li>
                    Click any result to see the Ad Rank breakdown. Click <em>Show breakdown</em>
                    {" "}to see Quality Score components.
                  </li>
                  <li>
                    Switch the user-intent chip to see Smart Bidding strategies
                    raise or lower the bid for the same query.
                  </li>
                  <li>
                    Open the pipeline canvas at the bottom to see the auction as
                    a node graph. Drag bid and QS sliders to re-run live.
                  </li>
                </ul>
              </div>

              <p className="text-[12px] text-[var(--text-dim)] pt-2 border-t border-[var(--separator)]">
                Synthetic data. No real ad inventory or money. Source on{" "}
                <a
                  href="https://github.com/hdviettt/mini-google-ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--link-blue)] hover:underline"
                >
                  GitHub
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
