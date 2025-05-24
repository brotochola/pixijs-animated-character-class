# Animated Character System for PIXI.js v8

## Overview

This file contains a complete animation system for PIXI.js that enables the creation of animated characters capable of seamlessly transitioning between multiple animations (running, walking, attacking, etc.) and directions (up, down, left, right). The system is designed to handle complex sprite animations with intelligent frame preservation and automatic fallback mechanisms.

## Getting Started

### Quick Start - Simplest Animated Character

The easiest way to create an animated character is using the factory method with just one animation:

```javascript
// 1. Setup PIXI.js application
const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });
document.body.appendChild(app.view);

// 2. Define your animation (just one for simplicity)
const animationConfigs = {
  idle: { speed: 0.1 }, // One animation: idle.png
};

// 3. Create the character using the factory method
const result = await AnimatedCharacter.CreateCharacterWithManyAnimations(
  animationConfigs, // What animations to load
  64, // Frame width in pixels
  64, // Frame height in pixels
  ["up", "left", "down", "right"], // Directions
  "sprites/" // Path to your PNG files
);

// 4. Get your character and add it to the stage
const character = result.character;
app.stage.addChild(character);

// 5. Position and scale your character
character.x = app.screen.width / 2;
character.y = app.screen.height / 2;
character.setScale(2.0);

// That's it! Your character is now animating
```

### How the Factory Method Works

The `CreateCharacterWithManyAnimations` factory method handles the complex process of loading and setting up multiple animations:

#### Step-by-Step Process:

1. **Creates Character Instance**: Initializes a new `AnimatedCharacter` with empty textures
2. **Loads PNG Files**: For each animation in `animationConfigs`, loads the corresponding PNG file
3. **Processes Spritesheets**: Uses `TextureFactory` to convert each PNG into individual frame textures
4. **Organizes by Direction**: Separates frames into directional arrays (up, left, down, right)
5. **Registers Animations**: Adds each processed animation to the character
6. **Returns Results**: Provides both the character and loading statistics

#### Behind the Scenes:

```javascript
// What the factory method does internally:
for (const [animName, config] of Object.entries(animationConfigs)) {
  // Load the PNG file
  const texture = await PIXI.Assets.load(`${basePath}${animName}.png`);

  // Convert spritesheet to frame textures
  const result = TextureFactory.createFrameTextures(
    texture,
    frameW,
    frameH,
    directions
  );

  // Add animation to character
  character.addAnimation(
    animName,
    result.textureData,
    result.frameCount,
    config.speed
  );
}
```

### Required File Structure

For the simplest setup, you need:

```
your-project/
├── index.html
├── sprites/
│   └── idle.png     ← Your spritesheet (64x256 pixels for 4 directions)
└── your-script.js
```

### Spritesheet Requirements

Your PNG file should be organized as:

- **Width**: `frameWidth × numberOfFrames` (e.g., 64×8 = 512px for 8 frames)
- **Height**: `frameHeight × numberOfDirections` (e.g., 64×4 = 256px for 4 directions)
- **Layout**:
  ```
  [up-frame1] [up-frame2] [up-frame3] ...
  [left-frame1] [left-frame2] [left-frame3] ...
  [down-frame1] [down-frame2] [down-frame3] ...
  [right-frame1] [right-frame2] [right-frame3] ...
  ```

### Error Handling

The factory method gracefully handles loading failures:

```javascript
const result = await AnimatedCharacter.CreateCharacterWithManyAnimations(
  { idle: { speed: 0.1 }, walk: { speed: 0.15 } },
  64,
  64,
  ["up", "left", "down", "right"],
  "sprites/"
);

// Check what loaded successfully
console.log("Successful:", result.loadResults.successful); // ['idle']
console.log("Failed:", result.loadResults.failed); // [{ name: 'walk', error: '...' }]

// Character works with whatever animations loaded successfully
const character = result.character;
```

This approach means your game won't crash if some animation files are missing - it will simply work with the animations that loaded successfully.

## Core Components

### 1. AnimatedCharacter Class

**Purpose**: Main character class that extends `PIXI.AnimatedSprite` to provide advanced animation management capabilities.

**Key Features**:

- **Multi-Animation Support**: Handle multiple animation states (run, walk, attack, idle, etc.)
- **Directional Animation**: Automatic direction switching (up, down, left, right)
- **Frame Preservation**: Maintains current frame position when switching between animations
- **Movement System**: Built-in movement capabilities with configurable speed
- **Fallback Handling**: Gracefully handles animations without directional variants
- **Fluid Transitions**: Smooth animation changes without jarring resets

**Core Properties**:

- `animations`: Stores all available animations with their configurations
- `currentAnimation`: Currently active animation name
- `currentDirection`: Current facing direction
- `speed`: Movement speed in pixels per frame

**Main Methods**:

#### Static Factory Method

```javascript
AnimatedCharacter.CreateCharacterWithManyAnimations(
  animationConfigs,
  frameW,
  frameH,
  directions,
  basePath
);
```

- Creates a character instance and loads multiple animations simultaneously
- Returns both the character and loading statistics
- Handles loading failures gracefully

#### Animation Management

```javascript
addAnimation(name, textureData, frameCount, speed);
```

- Registers a new animation with the character
- Supports configurable playback speed
- Enables method chaining

```javascript
changeAnimation(animationName, direction);
```

- Primary method for switching animations and/or directions
- Preserves current frame position when possible
- Implements intelligent fallback for missing directions

```javascript
changeDirection(direction);
```

- Convenience method for changing only the direction
- Maintains current animation state

#### Utility Methods

- `setScale(scale)`: Resize the character
- `pause()` / `play()`: Control animation playback
- `getAvailableAnimations()`: List all registered animations
- `getAvailableDirections(animationName)`: Get available directions for an animation

### 2. TextureFactory Class

**Purpose**: Utility class that processes spritesheets and converts them into organized texture arrays for use with AnimatedCharacter.

**Key Features**:

- **Automatic Analysis**: Automatically detects spritesheet dimensions and frame count
- **Multi-Format Support**: Handles both directional and non-directional spritesheets
- **Intelligent Processing**: Automatically organizes frames by direction
- **Flexible Input**: Works with various spritesheet layouts

**Expected Spritesheet Format**:

- Frames organized horizontally (columns = animation frames)
- Rows represent directions (when applicable)
- Standard direction order: up, left, down, right
- All frames must be the same size

**Main Method**:

```javascript
TextureFactory.createFrameTextures(
  baseTexture,
  frameWidth,
  frameHeight,
  directions
);
```

- Processes a complete spritesheet into usable texture arrays
- Returns organized texture data and frame count information
- Handles both single-direction and multi-directional animations

## Usage Example

```javascript
// Define animation configurations
const animationConfigs = {
  run: { speed: 0.2 },
  walk: { speed: 0.1 },
  attack: { speed: 0.3 },
};

// Create character with multiple animations
const result = await AnimatedCharacter.CreateCharacterWithManyAnimations(
  animationConfigs,
  64, // frame width
  64, // frame height
  ["up", "left", "down", "right"],
  "assets/sprites/"
);

const character = result.character;

// Add to stage
app.stage.addChild(character);

// Control the character
character.changeAnimation("run", "right");
character.setScale(2.0);
character.x = 100;
character.y = 100;
```

## Animation Configuration (`animationConfigs`)

The `animationConfigs` parameter is a crucial part of the system that defines how each animation should behave. This object maps animation names to their configuration properties.

### Structure

```javascript
const animationConfigs = {
  animationName: {
    speed: number,
  },
  // ... more animations
};
```

### Properties

- **Key**: Animation name (must match PNG filename without extension)
- **Value**: Configuration object with the following properties:
  - **`speed`** (required): Animation playback speed
    - **Type**: `number`
    - **Range**: `0.05` (very slow) to `0.3` (very fast)
    - **Default**: `0.15` if not specified

### Complete Example

```javascript
const animationConfigs = {
  // Movement animations
  idle: { speed: 0.08 }, // Very slow idle animation
  walk: { speed: 0.1 }, // Slow walking
  run: { speed: 0.15 }, // Medium speed running
  jump: { speed: 0.2 }, // Fast jumping

  // Combat animations
  combat_idle: { speed: 0.1 }, // Combat stance
  slash: { speed: 0.2 }, // Fast sword attack
  thrust: { speed: 0.2 }, // Fast thrust attack
  shoot: { speed: 0.15 }, // Medium bow/gun attack
  spellcast: { speed: 0.12 }, // Slower magic casting

  // Other animations
  sit: { speed: 0.05 }, // Very slow sitting
  climb: { speed: 0.12 }, // Medium climbing
  hurt: { speed: 0.15 }, // Medium hurt reaction
  emote: { speed: 0.1 }, // Medium emote animation
};
```

### File Naming Convention

Each key in `animationConfigs` should correspond to a PNG file in your sprites directory:

- `'run'` expects `run.png`
- `'combat_idle'` expects `combat_idle.png`
- `'spellcast'` expects `spellcast.png`

The system will attempt to load `${basePath}${animationName}.png` for each animation.

## Universal LPC Spritesheet Compatibility

This animation system is engineered to work **perfectly** with spritesheets generated from the industry-standard **[Universal LPC Spritesheet Character Generator](https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/)**. The system leverages the standardized LPC (Liberated Pixel Cup) format, ensuring seamless integration with thousands of community-generated character assets.

### Why LPC Integration Matters

The Universal LPC Spritesheet Generator is the de facto standard for 2D game character creation, used by indie developers worldwide. By architecting our system around LPC specifications, we provide:

- **Zero Configuration**: LPC spritesheets work immediately without modification
- **Massive Asset Library**: Access to thousands of character variations and equipment
- **Community Ecosystem**: Leverage the extensive LPC asset community
- **Professional Quality**: Industry-grade pixel art with consistent styling
- **Open Licensing**: Most LPC assets use permissive licenses suitable for commercial projects

### Live Example: mega_sprite.png

Our repository includes `mega_sprite.png` - a comprehensive demonstration spritesheet generated directly from the LPC Generator. This file showcases:

- **Complete Character Set**: Multiple animations in one optimized spritesheet
- **Standard LPC Format**: 64×64 pixel frames in the canonical 4-directional layout
- **Production Ready**: Demonstrates real-world usage with complex character equipment
- **Performance Optimized**: Single texture atlas reduces draw calls

```javascript
// Using the included mega_sprite.png demonstration
const texture = await PIXI.Assets.load("mega_sprite.png");
const result = TextureFactory.createFrameTextures(
  texture,
  64, // Standard LPC frame width
  64, // Standard LPC frame height
  ["up", "left", "down", "right"] // Standard LPC direction order
);
```

### Compatible LPC Animations

The system automatically recognizes these standard LPC animation names:

#### Movement & Basic Actions

- `idle` - Character standing animation
- `walk` - Standard walking gait
- `run` - Faster movement animation
- `jump` - Jumping or leaping motion
- `climb` - Ladder/wall climbing
- `sit` - Sitting or resting pose
- `emote` - Emotional expressions and gestures

#### Combat & Actions

- `combat_idle` - Combat-ready stance (called "Combat" in LPC)
- `slash` - Melee sword/blade attacks
- `thrust` - Spear/stabbing weapon attacks
- `shoot` - Ranged weapon (bow/crossbow) attacks
- `spellcast` - Magic casting and spellwork
- `hurt` - Damage reaction and pain animations

#### Special Animations

- `watering` - Farming/gardening actions
- `backslash` - Reverse melee attacks
- `halfslash` - Partial melee swings

### Optimized LPC Workflow

#### Method 1: Individual Animation Files

Perfect for selective loading and memory optimization:

```javascript
const animationConfigs = {
  idle: { speed: 0.08 },
  walk: { speed: 0.12 },
  run: { speed: 0.18 },
  slash: { speed: 0.25 },
  spellcast: { speed: 0.15 },
};

const result = await AnimatedCharacter.CreateCharacterWithManyAnimations(
  animationConfigs,
  64,
  64, // Standard LPC dimensions
  ["up", "left", "down", "right"],
  "sprites/" // Directory containing individual LPC PNGs
);
```

#### Method 2: Single Mega Spritesheet

Ideal for performance when using all animations:

```javascript
// Load the complete character from one file
const megaTexture = await PIXI.Assets.load("mega_sprite.png");
const textureData = TextureFactory.createFrameTextures(megaTexture, 64, 64, [
  "up",
  "left",
  "down",
  "right",
]);
// Then add individual animations by extracting frame ranges
```

### LPC Technical Specifications

The system automatically handles the standardized LPC format:

- **Frame Dimensions**: 64×64 pixels (industry standard)
- **Direction Layout**:
  - Row 0: Up-facing animations
  - Row 1: Left-facing animations
  - Row 2: Down-facing animations
  - Row 3: Right-facing animations
- **Frame Sequence**: Horizontal progression for animation frames
- **Color Depth**: 32-bit RGBA with transparency support
- **File Format**: PNG with optimal compression

### Advanced LPC Features

#### Automatic Equipment Layering

The system preserves LPC's layered equipment system:

- Body base layers
- Clothing and armor
- Weapons and accessories
- Hair and facial features

#### Dynamic Character Customization

```javascript
// The system supports runtime character modification
// Perfect for RPG character customization systems
character.changeAnimation("combat_idle");
character.changeDirection("right");
// Equipment changes can be handled through texture swapping
```

### Production Benefits

Using LPC-compatible assets in production provides:

- **Rapid Prototyping**: Skip asset creation, focus on gameplay
- **Consistent Art Style**: Professional, cohesive visual design
- **Scalable Content**: Easy to add new characters and animations
- **Community Support**: Extensive documentation and community knowledge
- **Legal Clarity**: Well-defined licensing terms for commercial use

This architecture makes our animation system not just LPC-compatible, but LPC-optimized, ensuring maximum performance and ease of use with the world's most popular 2D character asset format.

## Technical Implementation Details

### Frame Preservation Algorithm

When switching animations, the system:

1. Captures the current frame index
2. Calculates the equivalent frame in the new animation
3. Ensures the frame index doesn't exceed the new animation's frame count
4. Maintains playback state (playing/paused)

### Fallback Mechanism

For animations without directional variants:

1. Checks if the requested direction exists
2. Falls back to the first available direction if not found
3. Continues operation seamlessly

### Performance Optimizations

- Only processes texture changes when necessary
- Minimal memory footprint through texture reuse
- Efficient frame calculations
- Early exit conditions for unnecessary operations

## Browser Compatibility

The classes are exported for both module systems and direct browser usage:

- **Node.js/Module systems**: Available via `module.exports`
- **Browser**: Available as global `window.AnimatedCharacter` and `window.TextureFactory`

## Dependencies

- **PIXI.js v8**: Core graphics library
- **Modern JavaScript**: Uses ES6+ features (classes, async/await, destructuring)

This system provides a robust foundation for creating complex animated characters in web-based games and interactive applications using PIXI.js.
