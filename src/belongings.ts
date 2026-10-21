// The things a made house's friends can have in their rooms (ADR 0020): a set
// of pictures made once with the course's image endpoint by
// scripts/make-belongings.py and committed as public/art/thing-<key>.png, so
// the live site never calls an image model. The maker's form offers only
// these. Never rename a key: saved houses name their friends' things by it.

export type Belonging = { key: string; label: string; prompt: string };

export const BELONGINGS: Belonging[] = [
  { key: "guitar", label: "a guitar", prompt: "an acoustic guitar" },
  { key: "keyboard", label: "a keyboard", prompt: "a small electric piano keyboard" },
  { key: "headphones", label: "big headphones", prompt: "a pair of big over-ear headphones" },
  { key: "record-player", label: "a record player", prompt: "a vintage record player with a vinyl record" },
  { key: "fairy-lights", label: "fairy lights", prompt: "a loose string of warm glowing fairy lights" },
  { key: "lava-lamp", label: "a lava lamp", prompt: "a glowing orange lava lamp" },
  { key: "candles", label: "candles", prompt: "three lit pillar candles" },
  { key: "plants", label: "too many plants", prompt: "a cluster of three small potted houseplants" },
  { key: "monstera", label: "a monstera", prompt: "a monstera plant in a pot" },
  { key: "cactus", label: "a little cactus", prompt: "a little cactus in a terracotta pot" },
  { key: "flowers", label: "fresh flowers", prompt: "a jar of fresh wildflowers" },
  { key: "books", label: "a stack of books", prompt: "a stack of colourful books" },
  { key: "journal", label: "a journal", prompt: "a closed leather journal with a ribbon bookmark and a pen beside it, isolated" },
  { key: "laptop", label: "a laptop", prompt: "an open silver laptop with stickers on the lid, isolated" },
  { key: "camera", label: "a camera", prompt: "a vintage film camera" },
  { key: "game-controller", label: "a game controller", prompt: "a video game controller" },
  { key: "telescope", label: "a telescope", prompt: "a small telescope on a tripod" },
  { key: "chess", label: "a chess board", prompt: "a chess board with a few pieces" },
  { key: "paints", label: "paints and brushes", prompt: "a watercolour paint palette with brushes" },
  { key: "easel", label: "an easel", prompt: "a small painting easel with a canvas" },
  { key: "sewing-machine", label: "a sewing machine", prompt: "a vintage sewing machine" },
  { key: "yarn", label: "knitting", prompt: "balls of yarn with knitting needles" },
  { key: "yoga-mat", label: "a yoga mat", prompt: "a rolled-up yoga mat" },
  { key: "dumbbells", label: "dumbbells", prompt: "a pair of small dumbbells" },
  { key: "football", label: "a football", prompt: "a football" },
  { key: "skateboard", label: "a skateboard", prompt: "a skateboard" },
  { key: "teddy", label: "a teddy bear", prompt: "a soft teddy bear" },
  { key: "plushies", label: "a pile of plushies", prompt: "a small pile of cute plush toys" },
  { key: "cat-bed", label: "a cat bed", prompt: "a round cat bed with a sleeping cat" },
  { key: "fish-tank", label: "a fish tank", prompt: "a small round fishbowl with a goldfish" },
  { key: "teapot", label: "a teapot", prompt: "a teapot and a cup of tea" },
  { key: "coffee", label: "a coffee mug", prompt: "a steaming mug of coffee" },
  { key: "snacks", label: "a snack stash", prompt: "a basket of snacks and chocolate bars" },
  { key: "polaroids", label: "polaroids", prompt: "a few polaroid photos pinned on string" },
  { key: "posters", label: "posters", prompt: "a single colourful music poster with its corners curling, taped up with washi tape, isolated object, not a room" },
  { key: "globe", label: "a globe", prompt: "a desk globe" },
  { key: "clock", label: "an alarm clock", prompt: "a round twin-bell alarm clock" },
  { key: "mirror", label: "a mirror", prompt: "a round standing mirror" },
  { key: "makeup", label: "makeup", prompt: "a little makeup bag with lipstick and brushes" },
  { key: "perfume", label: "perfume", prompt: "two pretty perfume bottles" },
  { key: "sneakers", label: "sneakers", prompt: "a pair of sneakers" },
  { key: "beanbag", label: "a beanbag", prompt: "a big squishy mustard-yellow beanbag chair filling the frame, isolated" },
];

export const MAX_BELONGINGS = 6;

const byKey = new Map(BELONGINGS.map((b) => [b.key, b]));

export const belonging = (key: string): Belonging | undefined => byKey.get(key);

export const belongingArt = (key: string): string => `thing-${key}.png`;
