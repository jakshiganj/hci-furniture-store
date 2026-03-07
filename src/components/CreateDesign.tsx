import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sofa, UtensilsCrossed, Bed } from 'lucide-react';

const roomOptions = [
    {
        type: 'Living Room',
        icon: Sofa,
        description: 'Design a comfortable and stylish living space with sofas, tables, and décor.',
    },
    {
        type: 'Dining Room',
        icon: UtensilsCrossed,
        description: 'Create the perfect dining area with tables, chairs, and elegant accents.',
    },
    {
        type: 'Bedroom',
        icon: Bed,
        description: 'Craft a restful sanctuary with beds, nightstands, and cozy furnishings.',
    },
];

function RoomCard({
    room,
    index,
    selected,
    onSelect,
}: {
    room: typeof roomOptions[0];
    index: number;
    selected: boolean;
    onSelect: () => void;
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });
    const Icon = room.icon;

    return (
        <motion.button
            ref={ref}
            type="button"
            onClick={onSelect}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`group text-center px-6 lg:px-10 py-10 rounded-2xl border transition-all duration-500 cursor-pointer
                ${selected
                    ? 'border-sage bg-sage/10'
                    : 'border-stone-light bg-warm-white hover:border-stone-dark/40 hover:bg-stone-light/40'
                }`}
        >
            <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-6 transition-colors duration-500
                    ${selected
                        ? 'bg-sage/20'
                        : 'bg-stone-light group-hover:bg-sage/20'
                    }`}
            >
                <Icon size={22} strokeWidth={1.3} className="text-charcoal/70" />
            </div>
            <h3 className="font-serif text-xl md:text-2xl text-charcoal mb-4">
                {room.type}
            </h3>
            <p className="text-charcoal/50 text-sm leading-relaxed max-w-xs mx-auto">
                {room.description}
            </p>
        </motion.button>
    );
}

export default function CreateDesign() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });
    const [roomType, setRoomType] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSelect = (type: string) => {
        setRoomType(type);
        // Persist selection and navigate to designer workspace
        localStorage.setItem('roomType', type);
        console.log(`${type} selected`);
        navigate('/designer');
    };

    return (
        <section id="create-design" className="py-28 lg:py-40 bg-cream">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                {/* Section Header */}
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-20"
                >
                    <p className="text-[12px] tracking-[0.3em] uppercase text-stone-dark mb-4">
                        Start Fresh
                    </p>
                    <h2 className="font-serif text-3xl md:text-5xl text-charcoal text-balance">
                        Create New <span className="italic">Design</span>
                    </h2>
                </motion.div>

                {/* Room Options Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {roomOptions.map((room, i) => (
                        <RoomCard
                            key={room.type}
                            room={room}
                            index={i}
                            selected={roomType === room.type}
                            onSelect={() => handleSelect(room.type)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
