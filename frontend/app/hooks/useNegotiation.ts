import { useState, useRef, useCallback } from 'react';
import { buildApiUrl } from '@/lib/api';
import { OrderProgressStep } from '../types/order';

interface NegotiationState {
    isNegotiating: boolean;
    progress: OrderProgressStep[];
    error: string | null;
    finalResult: any | null;
}

// Track vendors for parallel processing
interface VendorTracker {
    [vendorId: string]: {
        name: string;
        relevant: boolean;
    };
}

interface UseNegotiationReturn extends NegotiationState {
    startNegotiation: (userInput: string, orderData?: any) => void;
    resetNegotiation: () => void;
}

interface NegotiationEvent {
    type: "progress" | "complete" | "error";
    message?: string;
    payload: any;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createFrontendDemoEvents = (userInput: string, orderData?: any): NegotiationEvent[] => {
    const item = orderData?.item || "Office Chairs";
    const quantity = orderData?.quantity?.preferred || 25;
    const budget = orderData?.budget || quantity * 140;

    const vendors = [
        { id: 1, name: "ABC Corp", rating: 4.5, relevant_product_id: "sku-office-1" },
        { id: 3, name: "Premium Furniture", rating: 4.9, relevant_product_id: "sku-furn-3" },
    ];

    const finalReport = {
        recommended_vendor_id: "1",
        recommended_vendor_name: "ABC Corp",
        recommendation_reason: `Best value option for ${item}. Strong balance of price, delivery, and reliability.`,
        human_action: "Use this shortlist as the handoff point for a real supplier conversation.",
        market_summary: `Demo mode compared 2 suppliers for ${quantity} units with a target budget of $${budget}.`,
        vendors: [
            {
                vendor_id: "1",
                vendor_name: "ABC Corp",
                rank: 1,
                score: 92,
                final_offer: { price_total: 3250 },
            },
            {
                vendor_id: "3",
                vendor_name: "Premium Furniture",
                rank: 2,
                score: 87,
                final_offer: { price_total: 3550 },
            },
        ],
    };

    return [
        {
            type: "progress",
            message: "Order details extracted successfully.",
            payload: {
                node: "extract_order",
                state_update: {
                    order_object: {
                        item,
                        quantity: { min: quantity, max: quantity, preferred: quantity },
                        budget,
                        currency: orderData?.currency || "USD",
                        requirements: {
                            mandatory: orderData?.requirements?.mandatory || [],
                            optional: [],
                        },
                        urgency: orderData?.urgency || "medium",
                    },
                },
            },
        },
        {
            type: "progress",
            message: "Found 2 potential vendors in the database.",
            payload: {
                node: "fetch_vendors",
                state_update: { all_vendors: vendors },
            },
        },
        {
            type: "progress",
            message: "Evaluated vendor suitability.",
            payload: {
                node: "evaluate_vendor",
                state_update: {
                    relevant_vendors: [vendors[0]],
                    _evaluated_vendor_id: [vendors[0].id],
                },
            },
        },
        {
            type: "progress",
            message: "Evaluated vendor suitability.",
            payload: {
                node: "evaluate_vendor",
                state_update: {
                    relevant_vendors: [vendors[1]],
                    _evaluated_vendor_id: [vendors[1].id],
                },
            },
        },
        {
            type: "progress",
            message: "Generated negotiation strategy.",
            payload: {
                node: "generate_strategy",
                state_update: {
                    vendor_strategies: {
                        "1": {
                            vendor_name: "ABC Corp",
                            strategy_name: "Benchmark-led close",
                        },
                        "3": {
                            vendor_name: "Premium Furniture",
                            strategy_name: "Premium value pressure",
                        },
                    },
                },
            },
        },
        {
            type: "progress",
            message: "Negotiation round completed.",
            payload: {
                node: "negotiate",
                state_update: {
                    leaderboard: {
                        "1": {
                            vendor_name: "ABC Corp",
                            price_total: 3250,
                            delivery_days: 11,
                            payment_terms: "Net 30",
                            status: "completed",
                        },
                        "3": {
                            vendor_name: "Premium Furniture",
                            price_total: 3550,
                            delivery_days: 10,
                            payment_terms: "Net 30",
                            status: "completed",
                        },
                    },
                },
            },
        },
        {
            type: "progress",
            message: "Finalizing market analysis and reports.",
            payload: {
                node: "aggregator",
                state_update: {
                    market_analysis: {
                        benchmarks: {
                            best_price: 3250,
                            median_price: 3400,
                            spread_percent: 9.23,
                        },
                        rankings: [
                            { vendor_name: "ABC Corp", rank: 1 },
                            { vendor_name: "Premium Furniture", rank: 2 },
                        ],
                    },
                    final_comparison_report: finalReport,
                },
            },
        },
        {
            type: "complete",
            payload: {
                final_state: {
                    final_comparison_report: finalReport,
                },
            },
        },
    ];
};

export const useNegotiation = (): UseNegotiationReturn => {
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [progress, setProgress] = useState<OrderProgressStep[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [finalResult, setFinalResult] = useState<any | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const playbackRef = useRef<Promise<void>>(Promise.resolve());
    const vendorTrackerRef = useRef<VendorTracker>({});

    const resetNegotiation = useCallback(() => {
        setIsNegotiating(false);
        setProgress([]);
        setError(null);
        setFinalResult(null);
        vendorTrackerRef.current = {};
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        playbackRef.current = Promise.resolve();
    }, []);

    const handleNegotiationEvent = (data: NegotiationEvent) => {
        if (data.type === "progress") {
            handleProgressUpdate(data.payload.node, data.message || "", data.payload.state_update);
        } else if (data.type === "complete") {
            setIsNegotiating(false);
            setProgress(prev => prev.map(s => ({ ...s, status: "completed" })));
            if (data.payload?.final_state?.final_comparison_report) {
                setFinalResult(data.payload.final_state.final_comparison_report);
            }
        } else if (data.type === "error") {
            setError(data.payload?.message || "Negotiation failed");
            setIsNegotiating(false);
        }
    };

    const enqueueNegotiationEvent = useCallback((data: NegotiationEvent) => {
        const delay =
            data.type === "progress"
                ? 450
                : data.type === "complete"
                    ? 600
                    : 0;

        playbackRef.current = playbackRef.current.then(async () => {
            if (delay > 0) {
                await wait(delay);
            }

            handleNegotiationEvent(data);
        });

        return playbackRef.current;
    }, []);

    const runFrontendDemoPlayback = useCallback(async (userInput: string, orderData?: any) => {
        for (const event of createFrontendDemoEvents(userInput, orderData)) {
            await enqueueNegotiationEvent(event);
        }

        await playbackRef.current;
    }, [enqueueNegotiationEvent]);

    const startNegotiation = useCallback(async (userInput: string, orderData?: any) => {
        resetNegotiation();
        setIsNegotiating(true);

        // Default initial steps structure (will be updated/activated by events)
        // We can initialize with pending steps if we want a static skeleton, 
        // or build it dynamically. 
        // For smoother UI, let's initialize the known steps as "pending".
        const initialSteps: OrderProgressStep[] = [
            { step: 1, status: "pending", title: "Extracting order details", message: "Analyzing requirements..." },
            { step: 2, status: "pending", title: "Fetching vendors", message: "Searching database..." },
            { step: 3, status: "pending", title: "Evaluating vendors", message: "Checking suitability..." },
            { step: 4, status: "pending", title: "Generating strategies", message: "Planning negotiation..." },
            { step: 5, status: "pending", title: "Negotiating", message: "Talking to vendors..." },
            { step: 6, status: "pending", title: "Finalizing", message: "Aggregating results..." },
        ];
        setProgress(initialSteps);

        try {
            const abortController = new AbortController();
            abortRef.current = abortController;
            let receivedEvents = 0;

            const response = await fetch(buildApiUrl("/negotiate/stream"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_input: userInput,
                    order_object: orderData,
                }),
                signal: abortController.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error(`Negotiation request failed with status ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.trim()) {
                        continue;
                    }

                    receivedEvents += 1;
                    await enqueueNegotiationEvent(JSON.parse(line) as NegotiationEvent);
                }
            }

            const remaining = buffer.trim();
            if (remaining) {
                receivedEvents += 1;
                await enqueueNegotiationEvent(JSON.parse(remaining) as NegotiationEvent);
            }

            if (receivedEvents === 0) {
                await runFrontendDemoPlayback(userInput, orderData);
            }

            await playbackRef.current;

        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
                return;
            }

            console.error("Failed to start negotiation, falling back to demo playback:", e);
            setError(null);
            await runFrontendDemoPlayback(userInput, orderData);
        } finally {
            abortRef.current = null;
        }
    }, [enqueueNegotiationEvent, resetNegotiation, runFrontendDemoPlayback]);

    const handleProgressUpdate = (node: string, message: string, stateUpdate: any) => {
        // Map nodes to steps (1-based index for OrderProgressStep)
        let stepIndex = -1;
        let stepTitle = "";

        switch (node) {
            case "extract_order":
                stepIndex = 1;
                stepTitle = "Order Extracted";
                break;
            case "fetch_vendors":
                stepIndex = 2;
                stepTitle = "Vendors Found";
                // Store all vendors for parallel tracking
                if (stateUpdate.all_vendors) {
                    const vendors = stateUpdate.all_vendors as any[];
                    vendors.forEach((v: any) => {
                        vendorTrackerRef.current[String(v.id)] = {
                            name: v.name || 'Unknown',
                            relevant: false
                        };
                    });
                }
                break;
            case "evaluate_vendor":
                stepIndex = 3;
                stepTitle = "Evaluating Vendors";
                // Track which vendors are relevant (this event may contain 0 or 1 vendor)
                if (stateUpdate.relevant_vendors) {
                    const relevant = stateUpdate.relevant_vendors as any[];
                    relevant.forEach((v: any) => {
                        const vendorId = String(v.id);
                        if (vendorTrackerRef.current[vendorId]) {
                            vendorTrackerRef.current[vendorId].relevant = true;
                        } else {
                            // Vendor not in tracker yet, add it
                            vendorTrackerRef.current[vendorId] = {
                                name: v.name || 'Unknown',
                                relevant: true
                            };
                        }
                    });
                }
                break;
            case "start_strategy_phase": // Or generate_strategy
            case "generate_strategy":
                stepIndex = 4;
                stepTitle = "Generating Strategies";
                break;
            case "start_negotiation_phase":
            case "negotiate":
                stepIndex = 5;
                stepTitle = "Negotiating";
                break;
            case "aggregator":
                stepIndex = 6;
                stepTitle = "Finalizing";
                break;
            default:
                // Unknown node, maybe ignore or log
                return;
        }

        if (stepIndex !== -1) {
            setProgress(prev => {
                const newProgress = [...prev];

                // Find the step in our list
                const existingStepIdx = newProgress.findIndex(s => s.step === stepIndex);

                if (existingStepIdx !== -1) {
                    const step = newProgress[existingStepIdx];
                    const isParallelStep = stepIndex >= 3 && stepIndex <= 5;

                    // Initialize vendor progress if this is a parallel step
                    if (isParallelStep && !step.vendorProgress) {
                        let vendorsToTrack: Array<[string, { name: string; relevant: boolean }]>;

                        if (stepIndex === 3) {
                            // For evaluation step, track ALL vendors
                            vendorsToTrack = Object.entries(vendorTrackerRef.current);
                        } else {
                            // For steps 4-5, only track relevant vendors
                            vendorsToTrack = Object.entries(vendorTrackerRef.current)
                                .filter(([_, info]) => info.relevant);
                        }

                        // For Strategy (4) and Negotiation (5), the "start" node has run, so they are all ACTIVE.
                        // For Evaluation (3), we don't have a start node, so we keep them pending until we get updates (or set active if we want).
                        const initialStatus = (stepIndex === 4 || stepIndex === 5) ? "active" : "pending";

                        const vendorProgress = vendorsToTrack.map(([vendorId, info]) => ({
                            vendorId,
                            vendorName: info.name,
                            status: initialStatus as "active" | "pending" | "completed",
                            output: undefined
                        }));

                        if (vendorProgress.length > 0) {
                            step.vendorProgress = vendorProgress;
                            step.isParallel = true;
                        }
                    }

                    // Update vendor-specific progress for parallel steps
                    if (isParallelStep && step.vendorProgress) {
                        const updatedVendorProgress = [...step.vendorProgress];

                        if (node === "evaluate_vendor") {
                            // This event may contain a vendor that was evaluated
                            // If relevant_vendors has items, this vendor passed; if empty, it didn't
                            const relevant = (stateUpdate.relevant_vendors || []) as any[];

                            // We need to identify which vendor was evaluated
                            // Use _evaluated_vendor_id if provided (NEW LOGIC)
                            let vendorId: string | undefined;

                            // Check if _evaluated_vendor_id exists and is an array (from backend update)
                            if (stateUpdate._evaluated_vendor_id) {
                                if (Array.isArray(stateUpdate._evaluated_vendor_id) && stateUpdate._evaluated_vendor_id.length > 0) {
                                    // Take the last one if multiple, or just iterate? 
                                    // Actually, if parallel completion happens, we might get multiple IDs.
                                    // But for now let's just grab the first one to resolve at least one card.
                                    vendorId = String(stateUpdate._evaluated_vendor_id[0]);
                                } else {
                                    vendorId = String(stateUpdate._evaluated_vendor_id);
                                }
                            }

                            // Find index based on ID (preferred) or first pending (fallback)
                            let targetIdx = -1;

                            if (vendorId) {
                                targetIdx = updatedVendorProgress.findIndex(vp => vp.vendorId === vendorId);
                            } else {
                                targetIdx = updatedVendorProgress.findIndex(vp => vp.status === "pending");
                            }

                            if (targetIdx !== -1) {
                                // If we resolved a vendor, mark it completed based on 'relevant' check
                                // Since 'relevant' array only contains items if suitable, we check if OUR vendor is inside it?
                                // Actually, 'relevant_vendors' accumulates. But the node output only returns the *newly* relevant one.
                                // Wait - LangGraph stream returns the *update*. So if it was rejected, relevant is []. 
                                // We need to know if THIS vendor was relevant.

                                // If the node update returned relevant_vendors with items, and one of them matches our ID, it's relevant.
                                // If it returned empty, it's not.

                                // Actually, the stateUpdate provided here IS the payload from the node.
                                const relevantList = (stateUpdate.relevant_vendors || []) as any[];
                                const isRelevant = relevantList.some((v: any) => String(v.id) === (vendorId || updatedVendorProgress[targetIdx].vendorId));

                                updatedVendorProgress[targetIdx] = {
                                    ...updatedVendorProgress[targetIdx],
                                    status: "completed",
                                    output: isRelevant
                                        ? formatOutput(node, stateUpdate) // Shows vendor name
                                        : "Not suitable for this order"
                                };
                            }

                            // Mark others as active if any completed
                            updatedVendorProgress.forEach((vp, idx) => {
                                if (vp.status === "pending") {
                                    updatedVendorProgress[idx] = { ...vp, status: "active" };
                                }
                            });
                        } else if (node === "generate_strategy" && stateUpdate.vendor_strategies) {
                            const strategies = stateUpdate.vendor_strategies as Record<string, any>;
                            Object.entries(strategies).forEach(([vendorId, strat]: [string, any]) => {
                                const idx = updatedVendorProgress.findIndex(vp => vp.vendorId === vendorId);
                                if (idx !== -1) {
                                    updatedVendorProgress[idx] = {
                                        ...updatedVendorProgress[idx],
                                        status: "completed",
                                        output: formatOutput(node, { vendor_strategies: { [vendorId]: strat } })
                                    };
                                }
                            });
                            // Mark others as active
                            updatedVendorProgress.forEach((vp, idx) => {
                                if (vp.status === "pending") {
                                    updatedVendorProgress[idx] = { ...vp, status: "active" };
                                }
                            });
                        } else if (node === "negotiate" && stateUpdate.leaderboard) {
                            const leaderboard = stateUpdate.leaderboard as Record<string, any>;
                            Object.entries(leaderboard).forEach(([vendorId, offer]: [string, any]) => {
                                const idx = updatedVendorProgress.findIndex(vp => vp.vendorId === vendorId);
                                if (idx !== -1) {
                                    updatedVendorProgress[idx] = {
                                        ...updatedVendorProgress[idx],
                                        status: "completed",
                                        output: formatOutput(node, { leaderboard: { [vendorId]: offer } })
                                    };
                                }
                            });
                            // Mark others as active
                            updatedVendorProgress.forEach((vp, idx) => {
                                if (vp.status === "pending") {
                                    updatedVendorProgress[idx] = { ...vp, status: "active" };
                                }
                            });
                        }

                        // Update step with vendor progress
                        const allVendorsCompleted = updatedVendorProgress.every(vp => vp.status === "completed");
                        newProgress[existingStepIdx] = {
                            ...step,
                            status: allVendorsCompleted ? "completed" : "active",
                            message: message,
                            vendorProgress: updatedVendorProgress,
                            output: formatOutput(node, stateUpdate) // Keep overall output for summary
                        };
                    } else {
                        // Non-parallel step or no vendor progress yet - use existing logic
                        newProgress[existingStepIdx] = {
                            ...step,
                            status: "active",
                            message: message,
                            output: formatOutput(node, stateUpdate)
                        };
                    }

                    // Mark previous steps as completed
                    for (let i = 0; i < existingStepIdx; i++) {
                        newProgress[i] = { ...newProgress[i], status: "completed" };
                    }
                }

                if (node === "aggregator") {
                    // If it's the last one, mark it completed too
                    if (existingStepIdx !== -1) {
                        newProgress[existingStepIdx].status = "completed";
                    }
                    setFinalResult(stateUpdate.final_comparison_report || stateUpdate);
                }

                return newProgress;
            });
        }
    };

    const formatOutput = (node: string, state: any): string => {
        // Helper to make the JSON state look nice in the UI "output" field
        if (node === "extract_order" && state.order_object) {
            const o = state.order_object;
            // Format: • 1x Coffee Machine
            //         Budget: ...
            let text = `• ${o.quantity.preferred}x ${o.item}`;
            if (o.budget) text += `\nBudget: $${o.budget}`;
            if (o.urgency) text += `\nUrgency: ${o.urgency}`;
            return text;
        }
        if (node === "fetch_vendors" && state.all_vendors) {
            const vendors = state.all_vendors as any[];
            if (!vendors || vendors.length === 0) return "No vendors found.";
            return `Found ${vendors.length} potential vendors:\n${vendors.map(v => `• ${v.name} (${v.rating}★)`).join('\n')}`;
        }

        if (node === "evaluate_vendor" && state.relevant_vendors) {
            const relevant = state.relevant_vendors as any[];
            if (!relevant || relevant.length === 0) return "Not suitable for this order.";
            // For vendor-specific output, just show the vendor name
            return relevant.map(v => `• ${v.name}`).join('\n');
        }

        if ((node === "generate_strategy" || node === "start_strategy_phase") && state.vendor_strategies) {
            const strategies = state.vendor_strategies as Record<string, any>;
            return Object.values(strategies).map((strat: any) =>
                `• ${strat.vendor_name || 'Vendor'}: ${strat.strategy_name || 'Standard Strategy'}`
            ).join('\n');
        }

        if ((node === "negotiate" || node === "start_negotiation_phase") && state.leaderboard) {
            const leaderboard = state.leaderboard as Record<string, any>;
            const offers = Object.values(leaderboard).filter(o => o.price_total);
            if (offers.length === 0) return "Waiting for quote...";

            // For vendor-specific output, show price only
            const offer = offers[0] as any;
            return `• Offer: $${offer.price_total}`;
        }

        if (node === "aggregator" && state.market_analysis) {
            const analysis = state.market_analysis;
            if (analysis.benchmarks) {
                return `• Best Price: $${analysis.benchmarks.best_price}\n• Median Price: $${analysis.benchmarks.median_price}\n• Vendor Rankings: ${analysis.rankings.length} ranked`;
            }
        }

        return JSON.stringify(state, null, 2); // Fallback
    };

    return {
        isNegotiating,
        progress,
        error,
        finalResult,
        startNegotiation,
        resetNegotiation
    };
};
