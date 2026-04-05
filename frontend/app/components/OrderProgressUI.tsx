"use client";

import { useState, useEffect, useRef } from "react";
import { OrderProgressStep } from "../types/order";

interface OrderProgressUIProps {
  progress: OrderProgressStep[];
}

// Helper component to render output as cards based on backend data structure
function OutputCards({ output, stepNumber, contextVendorName }: { output: string; stepNumber: number; contextVendorName?: string }) {
  const lines = output.split('\n').filter(line => line.trim());

  // Parse based on step number and output format from backend
  const cards: Array<{ title: string; details?: Array<{ label: string; value: string }>; subtitle?: string }> = [];
  let currentCard: { title: string; details?: Array<{ label: string; value: string }>; subtitle?: string } | null = null;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Step 1: Order Extraction - format: "• 1x Item\nBudget: $X\nUrgency: Y"
    if (stepNumber === 1 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      currentCard = { title: cleanLine, details: [] };
      cards.push(currentCard);
    } else if (stepNumber === 1 && currentCard && trimmed.includes(':')) {
      const [label, value] = trimmed.split(/:(.+)/);
      if (currentCard.details) {
        currentCard.details.push({ label: label.trim(), value: value.trim() });
      }
    }
    // Step 2: Vendors - format: "Found X vendors:\n• Vendor Name (rating★)"
    else if (stepNumber === 2 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      // Extract vendor name and rating if present
      const match = cleanLine.match(/^(.+?)\s*\((\d+(?:\.\d+)?)★\)$/);
      if (match) {
        cards.push({ title: match[1].trim(), subtitle: `${match[2]}★` });
      } else {
        cards.push({ title: cleanLine });
      }
    }
    // Step 3: Evaluated Vendors - format: "Evaluated vendors. X are suitable:\n• Vendor Name"
    else if (stepNumber === 3 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      cards.push({ title: cleanLine, subtitle: "Suitable" });
    }
    // Step 4: Strategies - format: "• Vendor Name: Strategy Name"
    else if (stepNumber === 4 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      if (cleanLine.includes(':')) {
        const [vendor, strategy] = cleanLine.split(/:(.+)/);
        cards.push({ title: vendor.trim(), subtitle: strategy.trim() });
      } else {
        cards.push({ title: cleanLine });
      }
    }
    // Step 5: Negotiation Offers - format: "Latest Offers:\n• Vendor Name: $price"
    else if (stepNumber === 5 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      if (cleanLine.includes(':')) {
        const [vendor, price] = cleanLine.split(/:(.+)/);
        cards.push({ title: vendor.trim(), subtitle: price.trim() });
      } else {
        cards.push({ title: cleanLine });
      }
    }
    // Step 6: Market Analysis - format: "• Best Price: $X\n• Median Price: $Y\n• Vendor Rankings: X ranked"
    else if (stepNumber === 6 && trimmed.startsWith('•')) {
      const cleanLine = trimmed.substring(1).trim();
      if (cleanLine.includes(':')) {
        const [label, value] = cleanLine.split(/:(.+)/);
        cards.push({ title: label.trim(), subtitle: value.trim() });
      } else {
        cards.push({ title: cleanLine });
      }
    }
    // Generic fallback for bullet points or plain lines
    else {
      let cleanLine = trimmed;
      if (trimmed.startsWith('•')) {
        cleanLine = trimmed.substring(1).trim();
      }

      // Clean up redundant vendor names if provided
      if (contextVendorName && cleanLine.startsWith(contextVendorName)) {
        // If "VendorName: Value", strip prefix
        if (cleanLine.includes(':')) {
          cleanLine = cleanLine.substring(cleanLine.indexOf(':') + 1).trim();
        }
        // If just "VendorName", implies status confirmation
        else if (cleanLine === contextVendorName) {
          cleanLine = "Verified Suitable";
        }
      }

      if (cleanLine.includes(':')) {
        const splitIdx = cleanLine.indexOf(':');
        const title = cleanLine.substring(0, splitIdx).trim();
        const val = cleanLine.substring(splitIdx + 1).trim();
        cards.push({ title, subtitle: val });
      } else {
        cards.push({ title: cleanLine });
      }
    }
  });

  if (cards.length > 0) {
    return (
      <div className="grid grid-cols-1 gap-2">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-[#5C4A3A] text-sm">{card.title}</h4>
            {card.details && card.details.length > 0 && (
              <div className="mt-2 space-y-1">
                {card.details.map((detail, detailIdx) => (
                  <div key={detailIdx} className="text-xs text-[#8B7355]">
                    <span className="font-medium">{detail.label}:</span> <span className="text-[#6B5B4F]">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}
            {card.subtitle && !card.details && (
              <p className="text-sm text-[#8B7355] mt-1 font-medium">{card.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Default: show as simple text block if no bullet structure found
  return (
    <div className="bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/40 shadow-sm">
      <div className="text-sm text-[#6B5B4F] leading-relaxed whitespace-pre-wrap font-medium">
        {output}
      </div>
    </div>
  );
}

export default function OrderProgressUI({ progress }: OrderProgressUIProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Track manually expanded steps (completed ones that user wants to see)
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Prefer completed/active steps, but never render an empty shell if the
  // stream has not produced visible updates yet.
  const visibleSteps = (() => {
    const startedSteps = progress.filter(
      (step) => step.status === "completed" || step.status === "active"
    );

    if (startedSteps.length > 0) {
      return startedSteps;
    }

    if (progress.length > 0) {
      const [firstStep, ...rest] = progress;
      return [{ ...firstStep, status: "active" as const }, ...rest];
    }

    return [];
  })();

  // Get the current active step
  const activeStep =
    progress.find((step) => step.status === "active") ?? visibleSteps[0];
  const allCompleted = progress.length > 0 && progress.every((step) => step.status === "completed");

  // Determine the title based on current step
  const getTitle = () => {
    if (allCompleted) return "Order Processing Complete";
    if (activeStep) return activeStep.title;
    return "Processing Order";
  };

  // Toggle step expansion
  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev =>
      prev.includes(stepNumber)
        ? prev.filter(s => s !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  // Auto-scroll to bottom when progress updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [progress.length, activeStep?.step]);

  return (
    <div className="w-full max-w-6xl mb-6">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes unfold {
          from { opacity: 0; transform: translateY(-10px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 1000px; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .unfolding { animation: unfold 0.6s ease-out forwards; overflow: hidden; }
        .shimmer-text {
          background: linear-gradient(90deg, #8B7355 0%, #D2B48C 50%, #8B7355 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 2s linear infinite;
        }
      `}} />
      <div className="bg-gradient-to-br from-white/60 via-[#FAF0E6]/50 to-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#5C4A3A]">
            {getTitle()}
          </h2>
          {/* Collapsing/Expansion controls could go here if needed globally */}
        </div>

        <div className="space-y-6 relative pl-6">
          {/* Continuous main vertical line */}
          <div className="absolute left-3 w-0.5 bg-[#DEB887] top-0 bottom-0 z-0" style={{ marginLeft: '0' }} />

          {visibleSteps.map((step, index) => {
            const isParallelStep = step.vendorProgress && step.vendorProgress.length > 0;
            const prevStep = index > 0 ? visibleSteps[index - 1] : null;
            const prevIsParallel = prevStep?.vendorProgress && prevStep.vendorProgress.length > 0;

            // Logic for collapsing:
            // Active step is ALWAYS expanded.
            // Completed steps are collapsed by default, unless in expandedSteps.
            // Exception: The very last visible step (if completed and no active step exists yet) typically stays expanded until next starts?
            // User requested "collapse already done steps".
            const isActive = step.status === "active";
            const isExpandedState = isActive || expandedSteps.includes(step.step);

            if (isParallelStep) {
              const vendorCount = step.vendorProgress!.length;

              return (
                <div key={step.step} className="relative pb-2">
                  {/* Step Header (Clickable for toggle) */}
                  <div
                    className="flex items-center gap-4 relative z-10 cursor-pointer group"
                    onClick={() => !isActive && toggleStep(step.step)}
                  >
                    <div className="relative flex-shrink-0 mt-1" style={{ marginLeft: '-24px' }}>
                      {step.status === "completed" ? (
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] shadow-md flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-[#8B7355] border-t-transparent animate-spin bg-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-semibold ${isActive ? "text-[#8B7355]" : "text-[#5C4A3A]"}`}>
                        {step.title}
                      </h3>
                      {!isActive && (
                        <span className="text-xs text-[#8B7355]/60 group-hover:text-[#8B7355] transition-colors">
                          {isExpandedState ? "(Hide)" : "(Show details)"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Parallel Content Body */}
                  {isExpandedState && (
                    <div className="ml-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative mt-8 unfolding">
                      {step.vendorProgress!.map((vendorProgress, vIndex) => {
                        const isFirst = vIndex === 0;
                        const isLast = vIndex === vendorCount - 1;
                        const baseLineClass = `absolute border-[#DEB887] border-dotted`;
                        const vertLineClass = `${baseLineClass} border-l-2`;
                        const horizLineClass = `${baseLineClass} border-t-2`;

                        return (
                          <div key={vendorProgress.vendorId} className="flex flex-col items-center gap-3 relative">
                            {/* Branching Logic (Visual Lines) */}
                            {!prevIsParallel ? (
                              <>
                                <div className={`${vertLineClass} w-0.5`} style={{ left: '50%', transform: 'translateX(-50%)', top: '-32px', height: '32px' }} />
                                <div className={`${horizLineClass} h-0.5`} style={{ right: '50%', top: '-32px', width: isFirst ? 'calc(50% + 80px)' : 'calc(50% + 20px)' }} />
                                {!isLast && (
                                  <div className={`${horizLineClass} h-0.5`} style={{ left: '50%', top: '-32px', width: 'calc(50% + 20px)' }} />
                                )}
                              </>
                            ) : (
                              <div className={`${vertLineClass} w-0.5`} style={{ left: '50%', transform: 'translateX(-50%)', top: '-120px', height: '120px' }} />
                            )}

                            {/* Card Content */}
                            <div className="w-full relative z-20 flex flex-col items-center pb-4">
                              <h4 className="text-sm font-bold text-[#5C4A3A] mb-2 text-center">
                                {vendorProgress.vendorName}
                              </h4>
                              {vendorProgress.status === "active" && !vendorProgress.output ? (
                                <div className="bg-white backdrop-blur-xl rounded-2xl px-4 py-3 border border-white shadow-md w-full">
                                  <div className="flex flex-col items-center justify-center py-2">
                                    <p className="text-xs font-bold shimmer-text text-center">
                                      {step.step === 4 ? "Developing strategy..." :
                                        step.step === 5 ? "Conducting negotiation..." :
                                          step.step === 3 ? "Evaluating suitability..." :
                                            "Processing..."}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full">
                                  {vendorProgress.output ? (
                                    typeof vendorProgress.output === 'string' ? (
                                      <OutputCards output={vendorProgress.output} stepNumber={step.step} contextVendorName={vendorProgress.vendorName} />
                                    ) : (
                                      <div className="bg-white backdrop-blur-xl rounded-2xl px-4 py-3 border border-white shadow-md">{vendorProgress.output}</div>
                                    )
                                  ) : (
                                    <div className="bg-white backdrop-blur-xl rounded-2xl px-4 py-3 border border-white shadow-md opacity-70">
                                      <p className="text-xs text-[#8B7355] text-center">{step.message}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Single Step Rendering
            return (
              <div key={step.step} className="relative pb-4">
                <div
                  className="flex items-center gap-4 relative z-10 cursor-pointer group"
                  onClick={() => !isActive && toggleStep(step.step)}
                >
                  <div className="relative flex-shrink-0 mt-1" style={{ marginLeft: '-24px' }}>
                    {step.status === "completed" ? (
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] shadow-md flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-[#8B7355] border-t-transparent animate-spin bg-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-semibold ${isActive ? "text-[#8B7355]" : "text-[#5C4A3A]"}`}>
                      {step.title}
                    </h3>
                    {!isActive && (
                      <span className="text-xs text-[#8B7355]/60 group-hover:text-[#8B7355] transition-colors">
                        {isExpandedState ? "(Hide)" : "(Show details)"}
                      </span>
                    )}
                  </div>
                </div>

                {isExpandedState && (
                  <div className="flex-1 ml-8 mt-3 unfolding">
                    {step.status === "active" && !step.output ? (
                      <div className="bg-white/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/40 shadow-md">
                        <p className="text-xs font-bold shimmer-text">Processing...</p>
                      </div>
                    ) : step.output ? (
                      <div className="space-y-3">
                        {typeof step.output === 'string' ? (
                          <OutputCards output={step.output} stepNumber={step.step} />
                        ) : (
                          <div className="bg-white/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/40 shadow-md">
                            {step.output}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/40 shadow-md opacity-70">
                        <p className="text-sm text-[#6B5B4F] leading-relaxed">
                          {step.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Invisible element for auto-scroll target */}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>
    </div>
  );
}
