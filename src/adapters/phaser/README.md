# Phaser adapter

`PrototypeScene` renders the stage 1 side-scrolling platformer, runs Arcade Physics and translates input/collisions
into `GameplayController` commands. Damage, phase, shared health and checkpoint rules remain in
core. Phaser is dynamically imported only after the player chooses “Новая игра”.
