import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Sound {
  id: string;
  name: string;
  icon: string;
  url: string;
}

// Using reliable free sound sources
const NATURE_SOUNDS: Sound[] = [
  { id: 'rain', name: 'Rain', icon: '🌧️', url: 'https://www.soundjay.com/nature/rain-01.mp3' },
  { id: 'thunder', name: 'Thunderstorm', icon: '⛈️', url: 'https://www.soundjay.com/nature/thunder-01.mp3' },
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊', url: 'https://www.soundjay.com/nature/ocean-wave-1.mp3' },
  { id: 'forest', name: 'Forest', icon: '🌲', url: 'https://www.soundjay.com/nature/forest-1.mp3' },
  { id: 'birds', name: 'Birds Singing', icon: '🐦', url: 'https://www.soundjay.com/nature/bird-1.mp3' },
  { id: 'wind', name: 'Wind', icon: '💨', url: 'https://www.soundjay.com/nature/wind-howl-1.mp3' },
  { id: 'fire', name: 'Crackling Fire', icon: '🔥', url: 'https://www.soundjay.com/nature/campfire-1.mp3' },
  { id: 'river', name: 'River Stream', icon: '🏞️', url: 'https://www.soundjay.com/nature/stream-1.mp3' },
  { id: 'waterfall', name: 'Waterfall', icon: '💧', url: 'https://www.soundjay.com/nature/waterfall-1.mp3' },
  { id: 'night', name: 'Night Ambience', icon: '🌙', url: 'https://www.soundjay.com/nature/night-ambience-1.mp3' },
  { id: 'crickets', name: 'Crickets', icon: '🦗', url: 'https://www.soundjay.com/nature/crickets-1.mp3' },
  { id: 'leaves', name: 'Rustling Leaves', icon: '🍃', url: 'https://www.soundjay.com/nature/leaves-1.mp3' },
  { id: 'cafe', name: 'Cafe Ambience', icon: '☕', url: 'https://www.soundjay.com/human/cafe-ambience-1.mp3' },
  { id: 'library', name: 'Library', icon: '📚', url: 'https://www.soundjay.com/human/page-flip-1.mp3' },
  { id: 'keyboard', name: 'Keyboard Typing', icon: '⌨️', url: 'https://www.soundjay.com/mechanical/keyboard-typing-1.mp3' },
  { id: 'clock', name: 'Clock Ticking', icon: '🕐', url: 'https://www.soundjay.com/clock/clock-ticking-1.mp3' },
  { id: 'heartbeat', name: 'Heartbeat', icon: '💓', url: 'https://www.soundjay.com/human/heartbeat-01.mp3' },
  { id: 'train', name: 'Train Journey', icon: '🚂', url: 'https://www.soundjay.com/transportation/train-1.mp3' },
  { id: 'fan', name: 'White Noise', icon: '🌀', url: 'https://www.soundjay.com/nature/wind-1.mp3' },
  { id: 'underwater', name: 'Underwater', icon: '🐠', url: 'https://www.soundjay.com/nature/water-1.mp3' },
];

interface NatureSoundsProps {
  accentColor: string;
}

export function NatureSounds({ accentColor }: NatureSoundsProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const playSound = async (sound: Sound) => {
    if (playingId === sound.id) {
      // Stop current sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
      return;
    }

    // Stop previous sound
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsLoading(sound.id);
    
    try {
      // Play new sound
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = isMuted ? 0 : volume / 100;
      
      audio.addEventListener('canplaythrough', () => {
        setIsLoading(null);
      });
      
      audio.addEventListener('error', () => {
        setIsLoading(null);
        setPlayingId(null);
      });

      await audio.play();
      audioRef.current = audio;
      setPlayingId(sound.id);
    } catch (error) {
      console.error('Failed to play sound:', error);
      setIsLoading(null);
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Focus Sounds</h3>
        <AnimatePresence>
          {playingId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={stopSound}
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <Square className="w-3 h-3 fill-current" />
                Stop
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/50">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[volume]}
          onValueChange={(v) => setVolume(v[0])}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">{volume}%</span>
      </div>

      {/* Sound List */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-1">
          {NATURE_SOUNDS.map((sound, index) => (
            <motion.button
              key={sound.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
              onClick={() => playSound(sound)}
              disabled={isLoading === sound.id}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                "border border-transparent hover:border-border/50",
                playingId === sound.id
                  ? "bg-primary/15"
                  : "bg-secondary/30 hover:bg-secondary/60"
              )}
              style={{
                backgroundColor: playingId === sound.id ? `${accentColor}15` : undefined,
                borderColor: playingId === sound.id ? `${accentColor}40` : undefined,
              }}
            >
              <span className="text-2xl w-8 text-center">{sound.icon}</span>
              <span className="flex-1 text-left text-sm font-medium text-foreground">
                {sound.name}
              </span>
              <AnimatePresence>
                {isLoading === sound.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-4 h-4 border-2 border-muted-foreground/30 border-t-current rounded-full animate-spin"
                  />
                )}
                {playingId === sound.id && isLoading !== sound.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="flex items-center gap-0.5"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full"
                        style={{ backgroundColor: accentColor }}
                        animate={{
                          height: [4, 12, 4],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
