interface PromptChipsProps {
  onSelect: (value: string) => void;
}

const prompts = [
  "Need 25 ergonomic office chairs under $4,000 with 2-year warranty",
  "Source 40 wireless keyboards for our Berlin office, medium urgency",
  "Find quotes for 15 standing desks with delivery inside 2 weeks",
];

export default function PromptChips({ onSelect }: PromptChipsProps) {
  return (
    <div className="w-full max-w-4xl">
      <p className="mb-3 text-sm font-medium text-[#6B5B4F]">
        Try one of these sample requests
      </p>
      <div className="flex flex-wrap gap-3">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="rounded-full border border-[#DEB887]/50 bg-white/75 px-4 py-2 text-left text-sm text-[#5C4A3A] shadow-sm transition hover:border-[#8B7355]/60 hover:bg-white"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
