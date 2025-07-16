package game

import (
	"testing"
	"time"
)

func TestNewGame(t *testing.T) {
	playerName := "TestPlayer"
	game := NewGame(playerName)
	
	if game.State.PlayerName != playerName {
		t.Errorf("Expected player name %s, got %s", playerName, game.State.PlayerName)
	}
	
	if game.State.Wood != 0 {
		t.Errorf("Expected initial wood to be 0, got %d", game.State.Wood)
	}
	
	if game.State.Beer != 0 {
		t.Errorf("Expected initial beer to be 0, got %d", game.State.Beer)
	}
	
	if game.State.AxeLevel != 1 {
		t.Errorf("Expected initial axe level to be 1, got %d", game.State.AxeLevel)
	}
	
	if game.State.TreeHP <= 0 {
		t.Errorf("Expected tree to have HP > 0, got %d", game.State.TreeHP)
	}
	
	if game.State.MaxTreeHP <= 0 {
		t.Errorf("Expected max tree HP > 0, got %d", game.State.MaxTreeHP)
	}
}

func TestChopTree(t *testing.T) {
	game := NewGame("TestPlayer")
	initialTreeHP := game.State.TreeHP
	initialClicks := game.State.Stats.TotalClicks
	
	woodGained, isCritical, err := game.ChopTree()
	
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	
	if game.State.Stats.TotalClicks != initialClicks+1 {
		t.Errorf("Expected clicks to increase by 1, got %d", game.State.Stats.TotalClicks)
	}
	
	if game.State.TreeHP >= initialTreeHP {
		t.Errorf("Expected tree HP to decrease from %d, got %d", initialTreeHP, game.State.TreeHP)
	}
	
	if woodGained < 0 {
		t.Errorf("Expected wood gained >= 0, got %d", woodGained)
	}
	
	if isCritical && game.State.Stats.CriticalHits == 0 {
		t.Errorf("Expected critical hit to be recorded in stats")
	}
}

func TestChopTreeUntilHarvest(t *testing.T) {
	game := NewGame("TestPlayer")
	initialWood := game.State.Wood
	initialTrees := game.State.Stats.TotalTreesChopped
	
	game.State.TreeHP = 1
	
	woodGained, _, err := game.ChopTree()
	
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	
	if woodGained == 0 {
		t.Errorf("Expected wood to be gained when tree is harvested")
	}
	
	if game.State.Wood <= initialWood {
		t.Errorf("Expected wood to increase from %d, got %d", initialWood, game.State.Wood)
	}
	
	if game.State.Stats.TotalTreesChopped != initialTrees+1 {
		t.Errorf("Expected trees chopped to increase by 1")
	}
	
	if game.State.TreeHP <= 0 || game.State.TreeHP > game.State.MaxTreeHP {
		t.Errorf("Expected tree to respawn with HP between 1 and %d, got %d", game.State.MaxTreeHP, game.State.TreeHP)
	}
}

func TestUpgradeAxe(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Wood = 100
	initialLevel := game.State.AxeLevel
	
	err := game.UpgradeAxe()
	
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	
	if game.State.AxeLevel != initialLevel+1 {
		t.Errorf("Expected axe level to increase to %d, got %d", initialLevel+1, game.State.AxeLevel)
	}
	
	if game.State.Wood >= 100 {
		t.Errorf("Expected wood to decrease after upgrade")
	}
}

func TestUpgradeAxeInsufficientWood(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Wood = 0
	initialLevel := game.State.AxeLevel
	
	err := game.UpgradeAxe()
	
	if err == nil {
		t.Errorf("Expected error for insufficient wood")
	}
	
	if game.State.AxeLevel != initialLevel {
		t.Errorf("Expected axe level to remain %d, got %d", initialLevel, game.State.AxeLevel)
	}
}

func TestBuyWorker(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Wood = 1000
	
	workerTypes := []string{"ptit_lu", "mathieu", "vico"}
	
	for _, workerType := range workerTypes {
		initialCount := getWorkerCount(game, workerType)
		initialWood := game.State.Wood
		initialHired := game.State.Stats.WorkersHired
		
		err := game.BuyWorker(workerType)
		
		if err != nil {
			t.Errorf("Expected no error for %s, got %v", workerType, err)
		}
		
		newCount := getWorkerCount(game, workerType)
		if newCount != initialCount+1 {
			t.Errorf("Expected %s count to increase to %d, got %d", workerType, initialCount+1, newCount)
		}
		
		if game.State.Wood >= initialWood {
			t.Errorf("Expected wood to decrease after buying %s", workerType)
		}
		
		if game.State.Stats.WorkersHired != initialHired+1 {
			t.Errorf("Expected workers hired to increase")
		}
	}
}

func TestBuyWorkerInvalidType(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Wood = 1000
	
	err := game.BuyWorker("invalid_worker")
	
	if err == nil {
		t.Errorf("Expected error for invalid worker type")
	}
}

func TestBuyUpgrade(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Wood = 10000
	
	upgradeTypes := []string{"auto_clicker", "lumberjack_school", "brewery_bonus", "golden_axe"}
	
	for _, upgradeType := range upgradeTypes {
		initialLevel := getUpgradeLevel(game, upgradeType)
		initialWood := game.State.Wood
		
		err := game.BuyUpgrade(upgradeType)
		
		if err != nil {
			t.Errorf("Expected no error for %s, got %v", upgradeType, err)
		}
		
		newLevel := getUpgradeLevel(game, upgradeType)
		if newLevel != initialLevel+1 {
			t.Errorf("Expected %s level to increase to %d, got %d", upgradeType, initialLevel+1, newLevel)
		}
		
		if game.State.Wood >= initialWood {
			t.Errorf("Expected wood to decrease after buying %s", upgradeType)
		}
	}
}

func TestBuyBeer(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Wood = 100
	initialBeer := game.State.Beer
	initialConsumed := game.State.Stats.TotalBeersConsumed
	
	err := game.BuyBeer()
	
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	
	if game.State.Beer != initialBeer+1 {
		t.Errorf("Expected beer to increase to %d, got %d", initialBeer+1, game.State.Beer)
	}
	
	if game.State.Stats.TotalBeersConsumed != initialConsumed+1 {
		t.Errorf("Expected total beers consumed to increase")
	}
	
	if game.State.Wood >= 100 {
		t.Errorf("Expected wood to decrease after buying beer")
	}
}

func TestPrestige(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Beer = 1000
	game.State.Wood = 500
	game.State.AxeLevel = 5
	game.State.Workers.PtitLu = 3
	game.State.Upgrades.AutoClicker = 2
	initialPrestigePoints := game.State.PrestigePoints
	initialPrestigeCount := game.State.Stats.PrestigeCount
	
	err := game.Prestige()
	
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	
	expectedPrestigePoints := initialPrestigePoints + 10
	if game.State.PrestigePoints != expectedPrestigePoints {
		t.Errorf("Expected prestige points to be %d, got %d", expectedPrestigePoints, game.State.PrestigePoints)
	}
	
	if game.State.Stats.PrestigeCount != initialPrestigeCount+1 {
		t.Errorf("Expected prestige count to increase")
	}
	
	if game.State.Wood != 0 {
		t.Errorf("Expected wood to reset to 0, got %d", game.State.Wood)
	}
	
	if game.State.Beer != 0 {
		t.Errorf("Expected beer to reset to 0, got %d", game.State.Beer)
	}
	
	if game.State.AxeLevel != 1 {
		t.Errorf("Expected axe level to reset to 1, got %d", game.State.AxeLevel)
	}
	
	if game.State.Workers.PtitLu != 0 {
		t.Errorf("Expected workers to reset to 0")
	}
	
	if game.State.Upgrades.AutoClicker != 0 {
		t.Errorf("Expected upgrades to reset to 0")
	}
}

func TestPrestigeInsufficientBeers(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Beer = 500
	
	err := game.Prestige()
	
	if err == nil {
		t.Errorf("Expected error for insufficient beers")
	}
}

func TestCanPrestige(t *testing.T) {
	game := NewGame("TestPlayer")
	
	if game.CanPrestige() {
		t.Errorf("Expected CanPrestige to be false with %d beers", game.State.Beer)
	}
	
	game.State.Beer = 1000
	
	if !game.CanPrestige() {
		t.Errorf("Expected CanPrestige to be true with %d beers", game.State.Beer)
	}
}

func TestIsGameWon(t *testing.T) {
	game := NewGame("TestPlayer")
	
	if game.IsGameWon() {
		t.Errorf("Expected IsGameWon to be false with %d beers", game.State.Beer)
	}
	
	game.State.Beer = 420
	
	if !game.IsGameWon() {
		t.Errorf("Expected IsGameWon to be true with %d beers", game.State.Beer)
	}
}

func TestProcessWorkers(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Workers.PtitLu = 2
	game.State.Workers.Mathieu = 1
	game.State.LastUpdate = time.Now().Add(-2 * time.Second)
	game.State.TreeHP = 10
	
	initialTreeHP := game.State.TreeHP
	woodGained := game.ProcessWorkers()
	
	if game.State.TreeHP >= initialTreeHP {
		t.Errorf("Expected tree HP to decrease from workers, was %d, now %d", initialTreeHP, game.State.TreeHP)
	}
	
	if woodGained < 0 {
		t.Errorf("Expected wood gained >= 0, got %d", woodGained)
	}
}

func TestProcessWorkersRecentUpdate(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.Workers.PtitLu = 2
	game.State.LastUpdate = time.Now()
	
	initialTreeHP := game.State.TreeHP
	woodGained := game.ProcessWorkers()
	
	if game.State.TreeHP != initialTreeHP {
		t.Errorf("Expected tree HP to remain same for recent update")
	}
	
	if woodGained != 0 {
		t.Errorf("Expected no wood gained for recent update, got %d", woodGained)
	}
}

func TestGetPrices(t *testing.T) {
	game := NewGame("TestPlayer")
	prices := game.GetPrices()
	
	expectedKeys := []string{
		"axe_upgrade", "ptit_lu", "mathieu", "vico", "beer",
		"auto_clicker", "lumberjack_school", "brewery_bonus", "golden_axe",
	}
	
	for _, key := range expectedKeys {
		if price, exists := prices[key]; !exists {
			t.Errorf("Expected price for %s to exist", key)
		} else if price <= 0 {
			t.Errorf("Expected price for %s to be > 0, got %d", key, price)
		}
	}
}

func TestGetGameDuration(t *testing.T) {
	game := NewGame("TestPlayer")
	time.Sleep(10 * time.Millisecond)
	
	duration := game.GetGameDuration()
	if duration <= 0 {
		t.Errorf("Expected game duration > 0, got %v", duration)
	}
}

func TestCriticalChanceWithGoldenAxe(t *testing.T) {
	game := NewGame("TestPlayer")
	baseCritChance := game.getCriticalChance()
	
	game.State.Upgrades.GoldenAxe = 1
	newCritChance := game.getCriticalChance()
	
	if newCritChance <= baseCritChance {
		t.Errorf("Expected critical chance to increase with golden axe")
	}
}

func TestCriticalMultiplierWithGoldenAxe(t *testing.T) {
	game := NewGame("TestPlayer")
	baseCritMultiplier := game.getCriticalMultiplier()
	
	game.State.Upgrades.GoldenAxe = 1
	newCritMultiplier := game.getCriticalMultiplier()
	
	if newCritMultiplier <= baseCritMultiplier {
		t.Errorf("Expected critical multiplier to increase with golden axe")
	}
}

func TestBeerBonusEffect(t *testing.T) {
	game1 := NewGame("TestPlayer1")
	game2 := NewGame("TestPlayer2")
	
	game1.State.TreeHP = 1
	game1.State.Beer = 0
	woodGained1, _, _ := game1.ChopTree()
	
	game2.State.TreeHP = 1
	game2.State.Beer = 100
	woodGained2, _, _ := game2.ChopTree()
	
	if woodGained2 <= woodGained1 {
		t.Errorf("Expected more wood with beer bonus: %d vs %d", woodGained1, woodGained2)
	}
}

func TestPrestigeBonusEffect(t *testing.T) {
	game := NewGame("TestPlayer")
	game.State.TreeHP = 10
	
	baseDamage := game.State.AxeLevel
	game.State.PrestigePoints = 5
	
	game.ChopTree()
	
	expectedDamage := int(float64(baseDamage) * (1.0 + float64(game.State.PrestigePoints)*0.02))
	actualDamage := 10 - game.State.TreeHP
	
	if actualDamage < expectedDamage {
		t.Errorf("Expected damage with prestige bonus to be at least %d, got %d", expectedDamage, actualDamage)
	}
}

func getWorkerCount(game *Game, workerType string) int {
	switch workerType {
	case "ptit_lu":
		return game.State.Workers.PtitLu
	case "mathieu":
		return game.State.Workers.Mathieu
	case "vico":
		return game.State.Workers.Vico
	default:
		return 0
	}
}

func getUpgradeLevel(game *Game, upgradeType string) int {
	switch upgradeType {
	case "auto_clicker":
		return game.State.Upgrades.AutoClicker
	case "lumberjack_school":
		return game.State.Upgrades.LumberjackSchool
	case "brewery_bonus":
		return game.State.Upgrades.BreweryBonus
	case "golden_axe":
		return game.State.Upgrades.GoldenAxe
	default:
		return 0
	}
}

func BenchmarkChopTree(b *testing.B) {
	game := NewGame("BenchmarkPlayer")
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		game.ChopTree()
		if game.State.TreeHP <= 0 {
			game.respawnTree()
		}
	}
}

func BenchmarkProcessWorkers(b *testing.B) {
	game := NewGame("BenchmarkPlayer")
	game.State.Workers.PtitLu = 5
	game.State.Workers.Mathieu = 3
	game.State.Workers.Vico = 1
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		game.State.LastUpdate = time.Now().Add(-2 * time.Second)
		game.ProcessWorkers()
	}
}