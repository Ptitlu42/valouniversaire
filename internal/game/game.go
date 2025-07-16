package game

import (
	"fmt"
	"math"
	"math/rand"
	"time"
)

type GameState struct {
	PlayerName    string    `json:"player_name"`
	Wood          int       `json:"wood"`
	Beer          int       `json:"beer"`
	PrestigePoints int      `json:"prestige_points"`
	AxeLevel      int       `json:"axe_level"`
	TreeHP        int       `json:"tree_hp"`
	MaxTreeHP     int       `json:"max_tree_hp"`
	Workers       Workers   `json:"workers"`
	Upgrades      Upgrades  `json:"upgrades"`
	Stats         Stats     `json:"stats"`
	StartTime     time.Time `json:"start_time"`
	LastUpdate    time.Time `json:"last_update"`
}

type Workers struct {
	PtitLu  int `json:"ptit_lu"`
	Mathieu int `json:"mathieu"`
	Vico    int `json:"vico"`
}

type Upgrades struct {
	AutoClicker       int `json:"auto_clicker"`
	LumberjackSchool  int `json:"lumberjack_school"`
	BreweryBonus      int `json:"brewery_bonus"`
	GoldenAxe         int `json:"golden_axe"`
}

type Stats struct {
	TotalTreesChopped   int   `json:"total_trees_chopped"`
	TotalWoodGained     int   `json:"total_wood_gained"`
	TotalBeersConsumed  int   `json:"total_beers_consumed"`
	TotalClicks         int   `json:"total_clicks"`
	WorkersHired        int   `json:"workers_hired"`
	CriticalHits        int   `json:"critical_hits"`
	AchievementsUnlocked []string `json:"achievements_unlocked"`
	PrestigeCount       int   `json:"prestige_count"`
}

type Config struct {
	TreeMinHP        int     `json:"tree_min_hp"`
	TreeMaxHP        int     `json:"tree_max_hp"`
	WoodMin          int     `json:"wood_min"`
	WoodMax          int     `json:"wood_max"`
	CriticalChance   float64 `json:"critical_chance"`
	CriticalMultiplier float64 `json:"critical_multiplier"`
	BeerBonusPerBeer float64 `json:"beer_bonus_per_beer"`
	TargetBeers      int     `json:"target_beers"`
	PrestigeBeers    int     `json:"prestige_beers"`
}

type Game struct {
	State  *GameState
	Config *Config
	rand   *rand.Rand
}

func NewGame(playerName string) *Game {
	config := &Config{
		TreeMinHP:        2,
		TreeMaxHP:        6,
		WoodMin:          1,
		WoodMax:          3,
		CriticalChance:   0.1,
		CriticalMultiplier: 2.5,
		BeerBonusPerBeer: 0.015,
		TargetBeers:      420,
		PrestigeBeers:    1000,
	}
	
	now := time.Now()
	state := &GameState{
		PlayerName:     playerName,
		Wood:           0,
		Beer:           0,
		PrestigePoints: 0,
		AxeLevel:       1,
		TreeHP:         5,
		MaxTreeHP:      5,
		Workers:        Workers{},
		Upgrades:       Upgrades{},
		Stats:          Stats{AchievementsUnlocked: []string{}},
		StartTime:      now,
		LastUpdate:     now,
	}
	
	game := &Game{
		State:  state,
		Config: config,
		rand:   rand.New(rand.NewSource(time.Now().UnixNano())),
	}
	
	game.respawnTree()
	return game
}

func (g *Game) ChopTree() (int, bool, error) {
	if g.State.TreeHP <= 0 {
		return 0, false, fmt.Errorf("tree already destroyed")
	}
	
	g.State.Stats.TotalClicks++
	
	baseDamage := g.State.AxeLevel
	prestigeBonus := 1.0 + float64(g.State.PrestigePoints)*0.02
	damage := int(float64(baseDamage) * prestigeBonus)
	
	isCritical := g.rand.Float64() < g.getCriticalChance()
	if isCritical {
		damage = int(float64(damage) * g.getCriticalMultiplier())
		g.State.Stats.CriticalHits++
	}
	
	g.State.TreeHP -= damage
	woodGained := 0
	
	if g.State.TreeHP <= 0 {
		woodGained = g.harvestTree()
		g.respawnTree()
	}
	
	g.State.LastUpdate = time.Now()
	return woodGained, isCritical, nil
}

func (g *Game) harvestTree() int {
	baseWood := g.Config.WoodMin + g.rand.Intn(g.Config.WoodMax-g.Config.WoodMin+1)
	
	beerBonus := 1.0 + float64(g.State.Beer)*g.Config.BeerBonusPerBeer
	prestigeBonus := 1.0 + float64(g.State.PrestigePoints)*0.05
	breweryBonus := 1.0 + float64(g.State.Upgrades.BreweryBonus)*0.5
	
	totalBonus := beerBonus * prestigeBonus * breweryBonus
	woodGained := int(float64(baseWood) * totalBonus)
	
	g.State.Wood += woodGained
	g.State.Stats.TotalTreesChopped++
	g.State.Stats.TotalWoodGained += woodGained
	
	return woodGained
}

func (g *Game) respawnTree() {
	g.State.MaxTreeHP = g.Config.TreeMinHP + g.rand.Intn(g.Config.TreeMaxHP-g.Config.TreeMinHP+1)
	g.State.TreeHP = g.State.MaxTreeHP
}

func (g *Game) getCriticalChance() float64 {
	base := g.Config.CriticalChance
	goldenAxeBonus := float64(g.State.Upgrades.GoldenAxe) * 0.15
	return base + goldenAxeBonus
}

func (g *Game) getCriticalMultiplier() float64 {
	base := g.Config.CriticalMultiplier
	goldenAxeBonus := float64(g.State.Upgrades.GoldenAxe) * 1.0
	return base + goldenAxeBonus
}

func (g *Game) UpgradeAxe() error {
	cost := g.getAxeUpgradeCost()
	if g.State.Wood < cost {
		return fmt.Errorf("not enough wood: need %d, have %d", cost, g.State.Wood)
	}
	
	g.State.Wood -= cost
	g.State.AxeLevel++
	g.State.LastUpdate = time.Now()
	
	return nil
}

func (g *Game) getAxeUpgradeCost() int {
	return int(15 * math.Pow(1.3, float64(g.State.AxeLevel-1)))
}

func (g *Game) BuyWorker(workerType string) error {
	var cost int
	var currentCount *int
	
	switch workerType {
	case "ptit_lu":
		cost = g.getWorkerCost("ptit_lu", g.State.Workers.PtitLu)
		currentCount = &g.State.Workers.PtitLu
	case "mathieu":
		cost = g.getWorkerCost("mathieu", g.State.Workers.Mathieu)
		currentCount = &g.State.Workers.Mathieu
	case "vico":
		cost = g.getWorkerCost("vico", g.State.Workers.Vico)
		currentCount = &g.State.Workers.Vico
	default:
		return fmt.Errorf("unknown worker type: %s", workerType)
	}
	
	if g.State.Wood < cost {
		return fmt.Errorf("not enough wood: need %d, have %d", cost, g.State.Wood)
	}
	
	g.State.Wood -= cost
	*currentCount++
	g.State.Stats.WorkersHired++
	g.State.LastUpdate = time.Now()
	
	return nil
}

func (g *Game) getWorkerCost(workerType string, currentCount int) int {
	baseCosts := map[string]int{
		"ptit_lu": 25,
		"mathieu": 100,
		"vico":    300,
	}
	
	multipliers := map[string]float64{
		"ptit_lu": 1.6,
		"mathieu": 1.5,
		"vico":    1.35,
	}
	
	base := baseCosts[workerType]
	multiplier := multipliers[workerType]
	
	return int(float64(base) * math.Pow(multiplier, float64(currentCount)))
}

func (g *Game) BuyUpgrade(upgradeType string) error {
	var cost int
	var currentLevel *int
	
	switch upgradeType {
	case "auto_clicker":
		cost = g.getUpgradeCost("auto_clicker", g.State.Upgrades.AutoClicker)
		currentLevel = &g.State.Upgrades.AutoClicker
	case "lumberjack_school":
		cost = g.getUpgradeCost("lumberjack_school", g.State.Upgrades.LumberjackSchool)
		currentLevel = &g.State.Upgrades.LumberjackSchool
	case "brewery_bonus":
		cost = g.getUpgradeCost("brewery_bonus", g.State.Upgrades.BreweryBonus)
		currentLevel = &g.State.Upgrades.BreweryBonus
	case "golden_axe":
		cost = g.getUpgradeCost("golden_axe", g.State.Upgrades.GoldenAxe)
		currentLevel = &g.State.Upgrades.GoldenAxe
	default:
		return fmt.Errorf("unknown upgrade type: %s", upgradeType)
	}
	
	if g.State.Wood < cost {
		return fmt.Errorf("not enough wood: need %d, have %d", cost, g.State.Wood)
	}
	
	g.State.Wood -= cost
	*currentLevel++
	g.State.LastUpdate = time.Now()
	
	return nil
}

func (g *Game) getUpgradeCost(upgradeType string, currentLevel int) int {
	baseCosts := map[string]int{
		"auto_clicker":      75,
		"lumberjack_school": 500,
		"brewery_bonus":     200,
		"golden_axe":        1000,
	}
	
	multipliers := map[string]float64{
		"auto_clicker":      1.4,
		"lumberjack_school": 1.8,
		"brewery_bonus":     2.0,
		"golden_axe":        1.2,
	}
	
	base := baseCosts[upgradeType]
	multiplier := multipliers[upgradeType]
	
	return int(float64(base) * math.Pow(multiplier, float64(currentLevel)))
}

func (g *Game) BuyBeer() error {
	cost := g.getBeerCost()
	if g.State.Wood < cost {
		return fmt.Errorf("not enough wood: need %d, have %d", cost, g.State.Wood)
	}
	
	g.State.Wood -= cost
	g.State.Beer++
	g.State.Stats.TotalBeersConsumed++
	g.State.LastUpdate = time.Now()
	
	return nil
}

func (g *Game) getBeerCost() int {
	return int(4 * math.Pow(1.08, float64(g.State.Beer)))
}

func (g *Game) CanPrestige() bool {
	return g.State.Beer >= g.Config.PrestigeBeers
}

func (g *Game) Prestige() error {
	if !g.CanPrestige() {
		return fmt.Errorf("not enough beers for prestige: need %d, have %d", g.Config.PrestigeBeers, g.State.Beer)
	}
	
	prestigePointsGained := g.State.Beer / 100
	g.State.PrestigePoints += prestigePointsGained
	g.State.Stats.PrestigeCount++
	
	g.State.Wood = 0
	g.State.Beer = 0
	g.State.AxeLevel = 1
	g.State.Workers = Workers{}
	g.State.Upgrades = Upgrades{}
	g.respawnTree()
	g.State.LastUpdate = time.Now()
	
	return nil
}

func (g *Game) IsGameWon() bool {
	return g.State.Beer >= g.Config.TargetBeers
}

func (g *Game) ProcessWorkers() int {
	if time.Since(g.State.LastUpdate) < time.Second {
		return 0
	}
	
	workerEfficiency := map[string]float64{
		"ptit_lu": 0.8,
		"mathieu": 2.5,
		"vico":    8.0,
	}
	
	schoolBonus := 1.0 + float64(g.State.Upgrades.LumberjackSchool)*0.25
	prestigeBonus := 1.0 + float64(g.State.PrestigePoints)*0.02
	
	totalDamage := 0.0
	totalDamage += float64(g.State.Workers.PtitLu) * workerEfficiency["ptit_lu"]
	totalDamage += float64(g.State.Workers.Mathieu) * workerEfficiency["mathieu"]
	totalDamage += float64(g.State.Workers.Vico) * workerEfficiency["vico"]
	
	totalDamage *= schoolBonus * prestigeBonus
	
	if g.State.Upgrades.AutoClicker > 0 {
		autoClickerDamage := float64(g.State.Upgrades.AutoClicker) * 0.5
		totalDamage += autoClickerDamage
	}
	
	damage := int(totalDamage)
	woodGained := 0
	
	if damage > 0 {
		g.State.TreeHP -= damage
		if g.State.TreeHP <= 0 {
			woodGained = g.harvestTree()
			g.respawnTree()
		}
		g.State.LastUpdate = time.Now()
	}
	
	return woodGained
}

func (g *Game) GetPrices() map[string]int {
	return map[string]int{
		"axe_upgrade":       g.getAxeUpgradeCost(),
		"ptit_lu":          g.getWorkerCost("ptit_lu", g.State.Workers.PtitLu),
		"mathieu":          g.getWorkerCost("mathieu", g.State.Workers.Mathieu),
		"vico":             g.getWorkerCost("vico", g.State.Workers.Vico),
		"beer":             g.getBeerCost(),
		"auto_clicker":     g.getUpgradeCost("auto_clicker", g.State.Upgrades.AutoClicker),
		"lumberjack_school": g.getUpgradeCost("lumberjack_school", g.State.Upgrades.LumberjackSchool),
		"brewery_bonus":    g.getUpgradeCost("brewery_bonus", g.State.Upgrades.BreweryBonus),
		"golden_axe":       g.getUpgradeCost("golden_axe", g.State.Upgrades.GoldenAxe),
	}
}

func (g *Game) GetGameDuration() time.Duration {
	return time.Since(g.State.StartTime)
}