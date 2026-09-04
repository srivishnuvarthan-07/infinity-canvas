import { Sparkles, GitBranch, Database, Network, LayoutGrid, Binary, PieChart } from 'lucide-react';

export const DIAGRAM_TYPES = [
    {
        id: 'auto',
        label: 'Auto',
        icon: Sparkles,
        placeholder: 'Describe any diagram, flowchart, ERD, mind map, or DSA structure…',
    },

    {
        id: 'flowchart',
        label: 'Flowchart',
        icon: GitBranch,
        placeholder: 'Describe a process or workflow to visualise as a flowchart…',
    },
    {
        id: 'erd',
        label: 'ERD',
        icon: Database,
        placeholder: 'Describe a database schema or entity relationships…',
    },
    {
        id: 'mindmap',
        label: 'Mind Map',
        icon: Network,
        placeholder: 'Enter a topic to brainstorm or explore as a mind map…',
    },
    {
        id: 'dsa',
        label: 'DSA',
        icon: Binary,
        placeholder: 'Describe a data structure or algorithm to visualise (e.g. "how does quicksort work")…',
    },
    {
        id: 'comparison',
        label: 'Comparison',
        icon: LayoutGrid,
        placeholder: 'Describe two or more things to compare (e.g. "React vs Vue vs Angular")…',
    },
];

export function DiagramTypeChips({ selected, onChange }) {
    return (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {DIAGRAM_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = selected === type.id;
                return (
                    <button
                        key={type.id}
                        onClick={() => onChange(type.id)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold
                            whitespace-nowrap transition-all duration-150 shrink-0 border
                            ${isActive
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-700'
                            }
                        `}
                    >
                        <Icon className="w-3 h-3" />
                        {type.label}
                    </button>
                );
            })}
        </div>
    );
}
