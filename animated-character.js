/**
 * SISTEMA DE ANIMACIÓN DE PERSONAJES PARA PIXI.JS v8
 * ====================================================
 *
 * Este archivo contiene las clases necesarias para crear personajes animados
 * que pueden cambiar entre múltiples animaciones (correr, caminar, atacar, etc.)
 * y direcciones (arriba, abajo, izquierda, derecha) de forma fluida.
 *
 * COMPONENTES PRINCIPALES:
 * - AnimatedCharacter: Clase principal del personaje animado
 * - TextureFactory: Utilidad para procesar spritesheets y crear texturas
 */

/**
 * CLASE ANIMATEDCHARACTER
 * =======================
 *
 * Esta clase extiende PIXI.AnimatedSprite para crear un personaje que puede:
 * 1. Manejar múltiples animaciones (correr, caminar, atacar, etc.)
 * 2. Cambiar direcciones automáticamente
 * 3. Preservar el frame actual al cambiar animaciones
 * 4. Moverse por la pantalla
 * 5. Manejar animaciones con y sin direcciones
 *
 * FUNCIONAMIENTO:
 * - Un solo sprite que cambia sus texturas según la animación/dirección
 * - Cada animación tiene 4 direcciones: up, left, down, right
 */
class AnimatedCharacter extends PIXI.AnimatedSprite {
  /**
   * CONSTRUCTOR
   * Inicializa el personaje con una textura vacía como placeholder
   */
  constructor() {
    // Usar textura vacía de PIXI como placeholder inicial
    // Esto evita errores de inicialización hasta que se carguen las animaciones reales
    super([PIXI.Texture.EMPTY]);

    // === PROPIEDADES DEL PERSONAJE ===

    // Almacena todas las animaciones disponibles
    // Estructura: { nombreAnimacion: { textures: {}, frameCount: 8, speed: 0.15, directions: [] } }
    this.animations = {};

    // Nombre de la animación actual (ej: 'run', 'walk', 'attack')
    this.currentAnimation = null;

    // Dirección actual del personaje ('up', 'down', 'left', 'right')
    this.currentDirection = "down";

    // Velocidad de movimiento en píxeles por frame
    this.speed = 5;

    // === CONFIGURACIÓN INICIAL ===

    // Centrar el punto de anclaje para rotaciones y posicionamiento correcto
    this.anchor.set(0.5);

    // Iniciar la animación (aunque esté con textura vacía)
    this.play();

    // Mantener invisible hasta que se cargue la primera animación
    this.visible = false;
  }

  /**
   * CREAR PERSONAJE CON MÚLTIPLES ANIMACIONES (MÉTODO ESTÁTICO)
   * ===========================================================
   *
   * Método factory que crea una nueva instancia de AnimatedCharacter y
   * carga múltiples animaciones de una vez. Patrón Factory Method.
   *
   * @param {Object} animationConfigs - Configuración de las animaciones
   * @param {number} frameW - Ancho de cada frame en el spritesheet
   * @param {number} frameH - Alto de cada frame en el spritesheet
   * @param {Array} directions - Array de direcciones ['up', 'left', 'down', 'right']
   * @param {string} basePath - Ruta base donde están los archivos PNG (default: 'pngs/')
   * @returns {Promise<{character: AnimatedCharacter, loadResults: Object}>} - Promesa que resuelve con el personaje y estadísticas
   */
  static async CreateCharacterWithManyAnimations(
    animationConfigs,
    frameW,
    frameH,
    directions,
    basePath = "pngs/"
  ) {
    // Crear nueva instancia del personaje
    const character = new AnimatedCharacter();

    const loadResults = {
      successful: [],
      failed: [],
      total: Object.keys(animationConfigs).length,
    };

    console.log(`🎭 Creando personaje con ${loadResults.total} animaciones...`);

    for (const [animName, config] of Object.entries(animationConfigs)) {
      try {
        // Cargar la imagen del spritesheet
        const texture = await PIXI.Assets.load(`${basePath}${animName}.png`);

        // Convertir el spritesheet en texturas usables
        const result = TextureFactory.createFrameTextures(
          texture,
          frameW,
          frameH,
          directions
        );

        // Agregar la animación al personaje
        character.addAnimation(
          animName,
          result.textureData,
          result.frameCount,

          config.speed
        );

        // Registrar éxito
        loadResults.successful.push(animName);
        console.log(`✅ Cargada: ${animName} (${result.frameCount} frames)`);
      } catch (error) {
        // Registrar fallo
        loadResults.failed.push({ name: animName, error: error.message });
        console.warn(`❌ Error cargando: ${animName}`, error);
      }
    }

    // Mostrar resumen final
    console.log(
      `🎯 Personaje creado: ${loadResults.successful.length}/${loadResults.total} animaciones exitosas`
    );
    if (loadResults.failed.length > 0) {
      console.warn(
        `⚠️  Animaciones fallidas:`,
        loadResults.failed.map((f) => f.name)
      );
    }

    // Retornar el personaje configurado y las estadísticas
    return {
      character,
      loadResults,
    };
  }

  /**
   * AGREGAR NUEVA ANIMACIÓN
   * ========================
   *
   * Registra una nueva animación en el personaje con todos sus frames y direcciones
   *
   * @param {string} name - Nombre de la animación (ej: 'run', 'attack')
   * @param {Object} textureData - Objeto con texturas organizadas por dirección
   * @param {number} frameCount - Número de frames en la animación
   * @param {Array} directions - Array de direcciones disponibles ['up', 'left', 'down', 'right']
   * @param {number} speed - Velocidad de reproducción (0.1 = lento, 0.3 = rápido)
   * @returns {AnimatedCharacter} - Retorna this para encadenamiento de métodos
   */
  addAnimation(name, textureData, frameCount, speed = 0.15) {
    // Guardar los datos de la animación en el registro interno

    this.animations[name] = {
      textures: textureData, // Las texturas de cada frame/dirección
      frameCount: frameCount, // Cuántos frames tiene la animación
      speed: speed, // Qué tan rápido se reproduce
      directions: Object.keys(textureData), // Qué direcciones están disponibles
    };

    // Si es la primera animación que agregamos, usarla como predeterminada
    if (!this.currentAnimation) {
      this.visible = true; // Hacer visible el sprite ahora que tiene contenido
      this.changeAnimation(name, this.currentDirection);
    }

    return this; // Permite encadenar métodos: character.addAnimation(...).setScale(...)
  }

  /**
   * CAMBIAR ANIMACIÓN Y/O DIRECCIÓN
   * ================================
   *
   * Método principal para cambiar entre animaciones. Maneja:
   * - Cambio de animación (run -> walk)
   * - Cambio de dirección (up -> left)
   * - Preservación del frame actual
   * - Fallback automático para animaciones sin direcciones
   *
   * @param {string} animationName - Nombre de la animación a usar
   * @param {string|null} direction - Dirección deseada (null = mantener actual)
   * @returns {AnimatedCharacter} - Retorna this para encadenamiento
   */
  changeAnimation(animationName, direction = null) {
    // === VALIDACIÓN DE ENTRADA ===

    // Verificar que la animación existe
    if (!this.animations[animationName]) {
      console.error(`La animación "${animationName}" no existe`);
      return this;
    }

    // Si no se especifica dirección, mantener la actual
    if (direction === null) {
      direction = this.currentDirection;
    }

    // === SISTEMA DE FALLBACK PARA DIRECCIONES ===

    // Verificar si la dirección solicitada existe para esta animación
    if (!this.animations[animationName].textures[direction]) {
      // Si no existe esa dirección, usar la primera disponible
      // Esto es útil para animaciones como 'hurt' que solo tienen una dirección

      direction = Object.keys(this.animations[animationName].textures)[0];
    }

    // === APLICAR CAMBIOS SOLO SI ES NECESARIO ===

    // Solo proceder si realmente hay un cambio (optimización de rendimiento)
    if (
      this.currentAnimation !== animationName ||
      this.currentDirection !== direction
    ) {
      // Guardar el estado actual antes de hacer cambios
      const wasPlaying = this.playing; // ¿Estaba reproduciéndose?
      const currentFrame = this.currentFrame; // ¿En qué frame estaba?

      // === CAMBIAR LAS TEXTURAS DEL SPRITE ===

      // Reemplazar el array de texturas del sprite con las nuevas
      this.textures = this.animations[animationName].textures[direction];

      // Ajustar la velocidad de reproducción
      this.animationSpeed = this.animations[animationName].speed;

      // === PRESERVAR POSICIÓN EN LA ANIMACIÓN ===

      // Calcular qué frame usar en la nueva animación
      const newAnimationFrameCount =
        this.animations[animationName].textures[direction].length;

      // Si el frame actual es mayor al máximo de la nueva animación, usar el último
      const targetFrame = Math.min(currentFrame, newAnimationFrameCount - 1);

      // === APLICAR EL NUEVO FRAME ===

      // Continuar reproduciendo desde el frame calculado si estaba reproduciéndose
      if (wasPlaying) {
        this.gotoAndPlay(targetFrame);
      } else {
        // Si estaba pausado, ir al frame pero sin reproducir
        this.gotoAndStop(targetFrame);
      }

      // === ACTUALIZAR ESTADO INTERNO ===

      // Guardar los nuevos valores (IMPORTANTE: después de hacer los cambios)
      this.currentAnimation = animationName;
      this.currentDirection = direction;
    }

    return this;
  }

  /**
   * CAMBIAR SOLO LA DIRECCIÓN
   * =========================
   *
   * Método de conveniencia para cambiar solo la dirección manteniendo la animación actual
   *
   * @param {string} direction - Nueva dirección ('up', 'down', 'left', 'right')
   * @returns {AnimatedCharacter} - Retorna this para encadenamiento
   */
  changeDirection(direction) {
    if (this.currentAnimation) {
      return this.changeAnimation(this.currentAnimation, direction);
    }
    return this;
  }

  /**
   * ESTABLECER ESCALA
   * =================
   *
   * Cambia el tamaño del personaje (útil para hacer sprites más grandes o pequeños)
   *
   * @param {number} scale - Factor de escala (1.0 = tamaño normal, 0.5 = mitad, 2.0 = doble)
   * @returns {AnimatedCharacter} - Retorna this para encadenamiento
   */
  setScale(scale) {
    this.scale.set(scale);
    return this;
  }

  /**
   * PAUSAR ANIMACIÓN
   * ================
   *
   * Detiene la reproducción de la animación (el sprite queda estático)
   *
   * @returns {AnimatedCharacter} - Retorna this para encadenamiento
   */
  pause() {
    this.stop();
    return this;
  }

  /**
   * REPRODUCIR ANIMACIÓN
   * ====================
   *
   * Reanuda la reproducción de la animación
   *
   * @returns {AnimatedCharacter} - Retorna this para encadenamiento
   */
  play() {
    super.play();
    return this;
  }

  /**
   * OBTENER ANIMACIONES DISPONIBLES
   * ================================
   *
   * Devuelve una lista de todas las animaciones registradas
   *
   * @returns {Array} - Array con los nombres de las animaciones
   */
  getAvailableAnimations() {
    return Object.keys(this.animations);
  }

  /**
   * OBTENER DIRECCIONES DISPONIBLES
   * ================================
   *
   * Devuelve las direcciones disponibles para una animación específica
   *
   * @param {string} animationName - Nombre de la animación a consultar
   * @returns {Array} - Array con las direcciones disponibles
   */
  getAvailableDirections(animationName) {
    if (this.animations[animationName]) {
      return this.animations[animationName].directions;
    }
    return [];
  }
}

/**
 * CLASE TEXTUREFACTORY
 * =====================
 *
 * Clase utilitaria que procesa spritesheets y convierte las imágenes en
 * arrays de texturas organizadas por dirección.
 *
 * FUNCIONAMIENTO:
 * 1. Analiza las dimensiones del spritesheet
 * 2. Calcula automáticamente cuántos frames tiene
 * 3. Detecta si tiene múltiples direcciones o es unidireccional
 * 4. Corta la imagen en frames individuales
 * 5. Organiza los frames por dirección
 *
 * FORMATO DE SPRITESHEET ESPERADO:
 * - Frames organizados horizontalmente (fila = dirección, columna = frame)
 * - Orden de filas: up, left, down, right
 * - Todos los frames del mismo tamaño
 */
class TextureFactory {
  /**
   * CREAR TEXTURAS DESDE SPRITESHEET
   * =================================
   *
   * Método principal que convierte una imagen spritesheet en texturas utilizables
   *
   * @param {PIXI.Texture} baseTexture - La imagen completa del spritesheet
   * @param {number} frameWidth - Ancho de cada frame individual en píxeles
   * @param {number} frameHeight - Alto de cada frame individual en píxeles
   * @param {Array} directions - Array de direcciones ['up', 'left', 'down', 'right']
   * @returns {Object} - Objeto con textureData, frameCount
   */
  static createFrameTextures(baseTexture, frameWidth, frameHeight, directions) {
    // Objeto que contendrá las texturas organizadas por dirección
    const textureData = {};

    // === ANÁLISIS AUTOMÁTICO DEL SPRITESHEET ===

    // Calcular cuántos frames hay horizontalmente
    const frameCount = Math.floor(baseTexture.width / frameWidth);

    // Calcular cuántas filas (direcciones) hay verticalmente
    const rowCount = Math.floor(baseTexture.height / frameHeight);

    // Información de debug para el desarrollador
    // console.log(
    //   `Image: ${baseTexture.width}x${baseTexture.height}, Frames: ${frameCount}, Rows: ${rowCount}`
    // );

    // === PROCESAMIENTO SEGÚN EL TIPO DE SPRITESHEET ===

    // CASO 1: SPRITESHEET MULTIDIRECCIONAL
    // =====================================
    // El spritesheet tiene 4+ filas, una para cada dirección
    // Ejemplo: run.png (cada fila = una dirección)

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const direction = directions[rowIndex];
      textureData[direction] = []; // Inicializar array para esta dirección

      // Procesar cada frame de esta fila
      for (let i = 0; i < frameCount; i++) {
        // === DEFINIR EL RECTÁNGULO DEL FRAME ===

        // Calcular la posición exacta de este frame en el spritesheet
        const frame = new PIXI.Rectangle(
          i * frameWidth, // X: columna * ancho del frame
          rowIndex * frameHeight, // Y: fila * alto del frame
          frameWidth, // Ancho del frame
          frameHeight // Alto del frame
        );

        // === CREAR LA TEXTURA DEL FRAME ===

        // Extraer este pedazo específico de la imagen completa
        const frameTexture = new PIXI.Texture({
          source: baseTexture, // Imagen fuente
          frame: frame, // Región específica a extraer
        });

        // Agregar este frame al array de esta dirección
        textureData[direction].push(frameTexture);
      }
    }

    // === RETORNAR RESULTADOS ===

    return {
      textureData: textureData, // Las texturas organizadas por dirección
      frameCount: frameCount, // Número de frames detectado
    };
  }
}

// === EXPORTAR LAS CLASES ===

// Hacer las clases disponibles globalmente o para importación
if (typeof module !== "undefined" && module.exports) {
  // Para Node.js / sistemas de módulos
  module.exports = { AnimatedCharacter, TextureFactory };
} else {
  // Para uso directo en el navegador
  window.AnimatedCharacter = AnimatedCharacter;
  window.TextureFactory = TextureFactory;
}
