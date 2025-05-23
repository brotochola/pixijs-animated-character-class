# Animated Character System for PIXI.js v8

## Overview

This file contains a complete animation system for PIXI.js that enables the creation of animated characters capable of seamlessly transitioning between multiple animations (running, walking, attacking, etc.) and directions (up, down, left, right). The system is designed to handle complex sprite animations with intelligent frame preservation and automatic fallback mechanisms.

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

This animation system is designed to work seamlessly with spritesheets generated from the **[Universal LPC Spritesheet Character Generator](https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/)**.

### Compatible LPC Animations

The following animation names are directly compatible with LPC spritesheets:

- `spellcast` - Magic casting animation
- `thrust` - Spear/thrust attack
- `walk` - Walking animation
- `slash` - Sword slash attack
- `shoot` - Bow/ranged attack
- `hurt` - Damage reaction
- `climb` - Climbing ladders/walls
- `idle` - Standing idle
- `jump` - Jumping animation
- `sit` - Sitting animation
- `emote` - Emotional expressions
- `run` - Running animation
- `combat_idle` - Combat ready stance (called "Combat" in LPC)

### LPC Workflow

1. **Generate Character**: Use the [Universal LPC Spritesheet Character Generator](https://liberatedpixelcup.github.io/Universal-LPC-Spritesheet-Character-Generator/) to create your character
2. **Download Animations**: Download individual animation spritesheets as PNG files
3. **Configure**: Create an `animationConfigs` object with the downloaded animation names
4. **Load**: Use `CreateCharacterWithManyAnimations()` to load all animations at once

### LPC Spritesheet Format

LPC spritesheets follow the expected format:

- **Frame Size**: Typically 64×64 pixels
- **Direction Order**: up, left, down, right (rows)
- **Frame Layout**: Horizontal frames for animation sequence
- **Standard Directions**: 4-directional movement support

This makes the system plug-and-play with LPC assets, requiring no additional processing or conversion steps.

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
