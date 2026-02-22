/**
 * MovementComponent
 * Pure data component für Movement
 * Keine Methoden, nur Daten - maximale Entkopplung
 */

import { Direction } from './Direction.js';

/**
 * Pure Daten-Klasse für Movement-State
 * Kann unabhängig von jeder Entity existieren
 */
export class MovementComponent {
    /**
     * @param {Object} config - Konfiguration
     * @param {number} config.gridX - Initiale Grid-X-Position
     * @param {number} config.gridY - Initiale Grid-Y-Position
     * @param {number} config.x - Initiale Pixel-X-Position (optional)
     * @param {number} config.y - Initiale Pixel-Y-Position (optional)
     * @param {number} config.speed - Geschwindigkeit in Pixeln/Sekunde
     * @param {Direction} config.direction - Initiale Richtung
     */
    constructor(config = {}) {
        // Grid-Positionen
        this.gridX = config.gridX ?? 0;
        this.gridY = config.gridY ?? 0;
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;

        // Pixel-Positionen
        this.x = config.x ?? (this.gridX * 20 + 10); // Default tileSize 20
        this.y = config.y ?? (this.gridY * 20 + 10);
        this.prevX = this.x;
        this.prevY = this.y;

        // Bewegungsziel
        this.targetGridX = this.gridX;
        this.targetGridY = this.gridY;

        // Bewegungsstatus
        this.moveProgress = 0;
        this.speed = config.speed ?? 100;
        this.direction = config.direction ?? Direction.NONE;
        this.nextDirection = Direction.NONE;
        this.isMoving = false;

        // Modifikatoren
        this.speedMultiplier = 1.0;
        this.isPaused = false;

        // Optional: Entity-Referenz (wenn aus Entity erstellt)
        this.entityId = config.entityId ?? null;
    }

    /**
     * Erstellt ein MovementComponent aus einer bestehenden Entity
     * @param {Object} entity - Entity mit gridX, gridY, x, y, speed, direction
     * @param {Object} options - Zusätzliche Optionen
     * @returns {MovementComponent}
     */
    static fromEntity(entity, options = {}) {
        return new MovementComponent({
            gridX: entity.gridX,
            gridY: entity.gridY,
            x: entity.x,
            y: entity.y,
            speed: entity.speed,
            direction: entity.direction,
            entityId: entity.id,
            ...options
        });
    }

    /**
     * Erstellt eine Kopie dieses Components
     * @returns {MovementComponent}
     */
    clone() {
        const clone = new MovementComponent({
            gridX: this.gridX,
            gridY: this.gridY,
            x: this.x,
            y: this.y,
            speed: this.speed,
            direction: this.direction,
            entityId: this.entityId
        });

        clone.prevGridX = this.prevGridX;
        clone.prevGridY = this.prevGridY;
        clone.prevX = this.prevX;
        clone.prevY = this.prevY;
        clone.targetGridX = this.targetGridX;
        clone.targetGridY = this.targetGridY;
        clone.moveProgress = this.moveProgress;
        clone.nextDirection = this.nextDirection;
        clone.isMoving = this.isMoving;
        clone.speedMultiplier = this.speedMultiplier;
        clone.isPaused = this.isPaused;

        return clone;
    }

    /**
     * Serialisiert das Component
     * @returns {Object}
     */
    serialize() {
        return {
            gridX: this.gridX,
            gridY: this.gridY,
            x: this.x,
            y: this.y,
            direction: this.direction?.name ?? 'NONE',
            speed: this.speed,
            moveProgress: this.moveProgress,
            isMoving: this.isMoving,
            speedMultiplier: this.speedMultiplier,
            isPaused: this.isPaused
        };
    }

    /**
     * Erstellt aus serialisierten Daten
     * @param {Object} data - Serialisierte Daten
     * @returns {MovementComponent}
     */
    static deserialize(data) {
        const component = new MovementComponent({
            gridX: data.gridX,
            gridY: data.gridY,
            x: data.x,
            y: data.y,
            speed: data.speed,
            direction: Direction.fromName(data.direction)
        });

        component.moveProgress = data.moveProgress ?? 0;
        component.isMoving = data.isMoving ?? false;
        component.speedMultiplier = data.speedMultiplier ?? 1.0;
        component.isPaused = data.isPaused ?? false;

        return component;
    }

    /**
     * Aktualisiert Previous-Positionen
     * Sollte vor Bewegung aufgerufen werden
     */
    updatePreviousPositions() {
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;
        this.prevX = this.x;
        this.prevY = this.y;
    }

    /**
     * Prüft ob Entity sich am Tile-Center befindet
     * @param {number} tolerance - Toleranz in Pixeln
     * @returns {boolean}
     */
    isAtCenter(tileSize = 20, tolerance = 1) {
        const centerX = this.gridX * tileSize + tileSize / 2;
        const centerY = this.gridY * tileSize + tileSize / 2;
        return Math.abs(this.x - centerX) <= tolerance &&
               Math.abs(this.y - centerY) <= tolerance;
    }

    /**
     * Berechnet die verbleibende Zeit bis zur Zielposition
     * @param {number} tileSize - Tile-Größe
     * @returns {number} - Zeit in Sekunden
     */
    getRemainingTime(tileSize = 20) {
        if (!this.isMoving || this.moveProgress >= 1) {return 0;}
        const remainingProgress = 1 - this.moveProgress;
        const effectiveSpeed = this.speed * this.speedMultiplier;
        const tilesPerSecond = effectiveSpeed / tileSize;
        return remainingProgress / tilesPerSecond;
    }

    /**
     * Gibt die aktuelle effektive Geschwindigkeit zurück
     * @returns {number}
     */
    getEffectiveSpeed() {
        return this.speed * this.speedMultiplier;
    }
}
