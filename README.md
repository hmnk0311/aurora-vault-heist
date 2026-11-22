# aurora-vault-heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/hmnk0311/aurora-vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/hmnk0311/aurora-vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Aurora Vault Heist is an original top-down heist game played in a desktop browser. One thief crosses the Meridian Trust bank floor on three nights: slip past patrol guards with vision cones and sweeping security cameras, lift the keycard from the office, hack the laser terminal in the security room (or crawl the vent duct), crack the vault door, steal the Aurora Diamond and reach the getaway van before the alarm meter fills. Tools cost you: an EMP blinds the cameras but surges the alarm, and a decoy coin pulls a guard off his patrol. Shadow carpets and tiptoeing slow how fast you are spotted, several routes cross every room, and a quiet escape pays a ghost bonus. Push the alarm past halfway and the bank goes on lockdown watch - every patrol steps up a gear - and the diamond's pedestal is wired, so lifting it costs alarm and pulls a guard toward the vault door: the run back to the van is the loudest part of the job. Optional loot (a gallery portrait, the lobby register, cash and gold) rewards the greedy, the HUD tracks the five steps of the job, and clearing all three nights completes the campaign with a banked total.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Move with WASD or the arrow keys, hold Shift to tiptoe, hold E to hack and crack, X for EMP, Q for a decoy coin, R to retry. To hand the game in the way the grader does: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=aurora-vault-heist&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
