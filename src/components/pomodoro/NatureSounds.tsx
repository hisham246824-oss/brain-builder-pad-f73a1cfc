import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
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

const NATURE_SOUNDS: Sound[] = [
  { id: 'rain', name: 'Rain', icon: '🌧️', url: 'https://cdn.pixabay.com/audio/2022/05/16/audio_169acf8879.mp3' },
  { id: 'thunder', name: 'Thunder', icon: '⛈️', url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_a583f2fd46.mp3' },
  { id: 'ocean', name: 'Ocean Waves', icon: '🌊', url: 'https://cdn.pixabay.com/audio/2024/07/17/audio_165acce56c.mp3' },
  { id: 'forest', name: 'Forest', icon: '🌲', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf94.mp3' },
  { id: 'birds', name: 'Birds Singing', icon: '🐦', url: 'https://cdn.pixabay.com/audio/2022/03/09/audio_c1e5e6a88a.mp3' },
  { id: 'wind', name: 'Wind', icon: '💨', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_067a47f0f3.mp3' },
  { id: 'fire', name: 'Crackling Fire', icon: '🔥', url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bba415.mp3' },
  { id: 'river', name: 'River Stream', icon: '🏞️', url: 'https://cdn.pixabay.com/audio/2022/02/07/audio_5c4249f695.mp3' },
  { id: 'waterfall', name: 'Waterfall', icon: '💧', url: 'https://cdn.pixabay.com/audio/2024/09/16/audio_fe659b30bf.mp3' },
  { id: 'night', name: 'Night Ambience', icon: '🌙', url: 'https://cdn.pixabay.com/audio/2022/08/04/audio_884fe92c21.mp3' },
  { id: 'crickets', name: 'Crickets', icon: '🦗', url: 'https://cdn.pixabay.com/audio/2024/04/16/audio_7c5ffc9f40.mp3' },
  { id: 'leaves', name: 'Rustling Leaves', icon: '🍃', url: 'https://cdn.pixabay.com/audio/2024/02/26/audio_30e8b3ec15.mp3' },
  { id: 'cafe', name: 'Cafe Ambience', icon: '☕', url: 'https://cdn.pixabay.com/audio/2022/04/27/audio_67bcce35c2.mp3' },
  { id: 'library', name: 'Library', icon: '📚', url: 'https://cdn.pixabay.com/audio/2024/10/17/audio_c88ef0e879.mp3' },
  { id: 'keyboard', name: 'Keyboard Typing', icon: '⌨️', url: 'https://cdn.pixabay.com/audio/2024/03/27/audio_b19a0fec50.mp3' },
  { id: 'clock', name: 'Clock Ticking', icon: '🕐', url: 'https://cdn.pixabay.com/audio/2024/11/10/audio_b3a2c92f62.mp3' },
  { id: 'heartbeat', name: 'Heartbeat', icon: '💓', url: 'https://cdn.pixabay.com/audio/2022/10/18/audio_69a61cd6d6.mp3' },
  { id: 'train', name: 'Train Journey', icon: '🚂', url: 'https://cdn.pixabay.com/audio/2024/04/17/audio_da76da8e52.mp3' },
  { id: 'fan', name: 'Fan White Noise', icon: '🌀', url: 'https://cdn.pixabay.com/audio/2024/06/06/audio_34fee0a66e.mp3' },
  { id: 'underwater', name: 'Underwater', icon: '🐠', url: 'https://cdn.pixabay.com/audio/2023/09/06/audio_0c792cb00f.mp3' },
];

interface NatureSoundsProps {
  accentColor: string;
}

export function NatureSounds({ accentColor }: NatureSoundsProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
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

  const playSound = (sound: Sound) => {
    if (playingId === sound.id) {
      // Stop current sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
    } else {
      // Stop previous sound
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Play new sound
      const audio = new Audio(sound.url);
      audio.loop = true;
      audio.volume = isMuted ? 0 : volume / 100;
      audio.play().catch(console.error);
      audioRef.current = audio;
      setPlayingId(sound.id);
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
        {playingId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={stopSound}
            className="text-muted-foreground hover:text-foreground"
          >
            Stop
          </Button>
        )}
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/50">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
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
        <span className="text-xs text-muted-foreground w-8">{volume}%</span>
      </div>

      {/* Sound List */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="grid grid-cols-2 gap-2">
          {NATURE_SOUNDS.map((sound) => (
            <motion.button
              key={sound.id}
              onClick={() => playSound(sound)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                "border border-transparent",
                playingId === sound.id
                  ? "bg-primary/20 border-primary/30"
                  : "bg-secondary/50 hover:bg-secondary"
              )}
              style={{
                backgroundColor: playingId === sound.id ? `${accentColor}20` : undefined,
                borderColor: playingId === sound.id ? `${accentColor}50` : undefined,
              }}
            >
              <span className="text-2xl">{sound.icon}</span>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground">{sound.name}</span>
              </div>
              <AnimatePresence>
                {playingId === sound.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: accentColor }}
                    />
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
