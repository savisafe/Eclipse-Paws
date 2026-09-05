// Shared between PlayerMovementSystem and CompanionSystem so the companion's jump arc matches
// the player-controlled cat exactly (GAM-010/GAM-014).
export const PLAYER_SPEED = 255;
// A jump rises ~183px at the world's gravity of 1050. That is deliberately more than the ~150px
// of the earlier prototype: with a 120px-tall body, a shelf you can walk under (needs ≥132px of
// clearance) has to sit high enough that the shorter jump could no longer reach its top, which
// turned every overhead ledge into a wall.
export const JUMP_SPEED = 620;
