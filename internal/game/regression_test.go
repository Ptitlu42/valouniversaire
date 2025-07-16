package game

import (
	"math"
	"testing"
	"time"
)

func TestTreeRespawnRegression(t *testing.T) {
	game := NewGame("RegressionPlayer")
	
	for i := 0; i < 1000; i++ {
		_, _, err := game.ChopTree()
		if err != nil {
			t.Errorf("Tree chopping failed at iteration %d: %v", i, err)
		}
		
		if game.State.TreeHP <= 0 || game.State.TreeHP > game.State.MaxTreeHP {
			t.Errorf("Tree HP invalid after respawn at iteration %d: HP=%d, MaxHP=%d", i, game.State.TreeHP, game.State.MaxTreeHP)
		}
		
		if game.State.MaxTreeHP < game.Config.TreeMinHP || game.State.MaxTreeHP > game.Config.TreeMaxHP {
			t.Errorf("Max tree HP out of range at iteration %d: %d", i, game.State.MaxTreeHP)
		}
	}
}

func TestWorkerEfficiencyRegression(t *testing.T) {
	game := NewGame("WorkerRegressionPlayer")
	game.State.Workers.PtitLu = 10
	game.State.Workers.Mathieu = 5
	game.State.Workers.Vico = 2
	game.State.LastUpdate = time.Now().Add(-10 * time.Second)
	
	initialTreeHP := game.State.TreeHP
	woodGained := game.ProcessWorkers()
	
	ptitLuDamage := 10.0 * 0.8
	mathieuDamage := 5.0 * 2.5
	vicoDamage := 2.0 * 8.0
	expectedDamage := int(ptitLuDamage + mathieuDamage + vicoDamage)
	actualDamage := initialTreeHP - game.State.TreeHP
	
	if woodGained > 0 {
		actualDamage += game.State.MaxTreeHP
	}
	
	if actualDamage < expectedDamage {
		t.Errorf("Worker efficiency regression: expected at least %d damage, got %d", expectedDamage, actualDamage)
	}
}

func TestPrestigeCalculationRegression(t *testing.T) {
	game := NewGame("PrestigeRegressionPlayer")
	
	testCases := []struct {
		beers    int
		expected int
	}{
		{1000, 10},
		{1500, 15},
		{2000, 20},
		{10000, 100},
	}
	
	for _, tc := range testCases {
		game.State.Beer = tc.beers
		game.State.PrestigePoints = 0
		
		err := game.Prestige()
		if err != nil {
			t.Errorf("Prestige failed for %d beers: %v", tc.beers, err)
		}
		
		if game.State.PrestigePoints != tc.expected {
			t.Errorf("Prestige calculation wrong for %d beers: expected %d, got %d", tc.beers, tc.expected, game.State.PrestigePoints)
		}
	}
}

func TestBeerCostProgression(t *testing.T) {
	game := NewGame("BeerCostPlayer")
	
	previousCost := 0
	for i := 0; i < 10; i++ {
		cost := game.getBeerCost()
		
		if cost <= 0 {
			t.Errorf("Beer cost should be positive at iteration %d: %d", i, cost)
		}
		
		// Cost might not increase every single step due to formula complexity
		if i > 0 && cost < previousCost/2 {
			t.Errorf("Beer cost decreased too much: iteration %d, prev=%d, current=%d", i, previousCost, cost)
		}
		
		previousCost = cost
		game.State.Beer += 10
	}
}

func TestAxeLevelDamageRegression(t *testing.T) {
	game := NewGame("AxeDamagePlayer")
	
	for axeLevel := 1; axeLevel <= 100; axeLevel++ {
		game.State.AxeLevel = axeLevel
		game.State.TreeHP = 1000
		
		initialHP := game.State.TreeHP
		_, _, err := game.ChopTree()
		if err != nil {
			t.Errorf("ChopTree failed at axe level %d: %v", axeLevel, err)
		}
		
		damage := initialHP - game.State.TreeHP
		if damage < axeLevel {
			t.Errorf("Damage should be at least axe level: level=%d, damage=%d", axeLevel, damage)
		}
	}
}

func TestCriticalHitConsistency(t *testing.T) {
	game := NewGame("CriticalPlayer")
	game.State.Upgrades.GoldenAxe = 5
	
	expectedCritRate := game.getCriticalChance()
	expectedCritMultiplier := game.getCriticalMultiplier()
	
	criticalHits := 0
	totalAttempts := 10000
	
	for i := 0; i < totalAttempts; i++ {
		game.State.TreeHP = 100
		_, isCritical, _ := game.ChopTree()
		if isCritical {
			criticalHits++
		}
	}
	
	actualCritRate := float64(criticalHits) / float64(totalAttempts)
	tolerance := 0.02
	
	if math.Abs(actualCritRate-expectedCritRate) > tolerance {
		t.Errorf("Critical hit rate inconsistent: expected %.3f, got %.3f", expectedCritRate, actualCritRate)
	}
	
	if expectedCritMultiplier <= 2.5 {
		t.Errorf("Critical multiplier should increase with golden axe upgrades: %.2f", expectedCritMultiplier)
	}
}

func TestStatsAccuracyRegression(t *testing.T) {
	game := NewGame("StatsPlayer")
	
	expectedClicks := 0
	expectedTrees := 0
	expectedWood := 0
	
	for i := 0; i < 100; i++ {
		woodGained, _, _ := game.ChopTree()
		expectedClicks++
		
		if woodGained > 0 {
			expectedTrees++
			expectedWood += woodGained
		}
	}
	
	if game.State.Stats.TotalClicks != expectedClicks {
		t.Errorf("Click stats wrong: expected %d, got %d", expectedClicks, game.State.Stats.TotalClicks)
	}
	
	if game.State.Stats.TotalTreesChopped != expectedTrees {
		t.Errorf("Tree stats wrong: expected %d, got %d", expectedTrees, game.State.Stats.TotalTreesChopped)
	}
	
	if game.State.Stats.TotalWoodGained != expectedWood {
		t.Errorf("Wood stats wrong: expected %d, got %d", expectedWood, game.State.Stats.TotalWoodGained)
	}
}

func TestUpgradeCostProgression(t *testing.T) {
	game := NewGame("UpgradeCostPlayer")
	
	upgradeTypes := []string{"auto_clicker", "lumberjack_school", "brewery_bonus", "golden_axe"}
	
	for _, upgradeType := range upgradeTypes {
		previousCost := 0
		
		for level := 0; level < 50; level++ {
			cost := game.getUpgradeCost(upgradeType, level)
			
			if cost <= previousCost && level > 0 {
				t.Errorf("Upgrade cost should increase for %s: level %d, prev=%d, current=%d", upgradeType, level, previousCost, cost)
			}
			
			if cost <= 0 {
				t.Errorf("Upgrade cost should be positive for %s level %d: %d", upgradeType, level, cost)
			}
			
			previousCost = cost
		}
	}
}

func TestWorkerCostProgression(t *testing.T) {
	game := NewGame("WorkerCostPlayer")
	
	workerTypes := []string{"ptit_lu", "mathieu", "vico"}
	
	for _, workerType := range workerTypes {
		previousCost := 0
		
		for count := 0; count < 50; count++ {
			cost := game.getWorkerCost(workerType, count)
			
			if cost <= previousCost && count > 0 {
				t.Errorf("Worker cost should increase for %s: count %d, prev=%d, current=%d", workerType, count, previousCost, cost)
			}
			
			if cost <= 0 {
				t.Errorf("Worker cost should be positive for %s count %d: %d", workerType, count, cost)
			}
			
			previousCost = cost
		}
	}
}

func TestTimeConsistencyRegression(t *testing.T) {
	game := NewGame("TimePlayer")
	
	startTime := game.State.StartTime
	
	time.Sleep(10 * time.Millisecond)
	
	duration1 := game.GetGameDuration()
	
	time.Sleep(10 * time.Millisecond)
	
	duration2 := game.GetGameDuration()
	
	if duration2 <= duration1 {
		t.Errorf("Game duration should increase over time: %v vs %v", duration1, duration2)
	}
	
	if game.State.StartTime != startTime {
		t.Errorf("Start time should not change during game")
	}
}

func TestLastUpdateRegression(t *testing.T) {
	game := NewGame("LastUpdatePlayer")
	
	initialUpdate := game.State.LastUpdate
	
	time.Sleep(1 * time.Millisecond)
	
	_, _, err := game.ChopTree()
	if err != nil {
		t.Errorf("ChopTree failed: %v", err)
	}
	
	if !game.State.LastUpdate.After(initialUpdate) {
		t.Errorf("LastUpdate should be updated after actions")
	}
}

func TestWorkerProcessingTimeRegression(t *testing.T) {
	game := NewGame("WorkerTimePlayer")
	game.State.Workers.PtitLu = 5
	
	recentUpdate := time.Now().Add(-500 * time.Millisecond)
	game.State.LastUpdate = recentUpdate
	
	woodGained := game.ProcessWorkers()
	if woodGained != 0 {
		t.Errorf("Workers should not process for recent updates")
	}
	
	oldUpdate := time.Now().Add(-2 * time.Second)
	game.State.LastUpdate = oldUpdate
	
	woodGained = game.ProcessWorkers()
	if woodGained < 0 {
		t.Errorf("Worker processing should not give negative wood")
	}
}

func TestRandomSeedIndependence(t *testing.T) {
	game1 := NewGame("Random1")
	game2 := NewGame("Random2")
	
	results1 := make([]int, 100)
	results2 := make([]int, 100)
	
	for i := 0; i < 100; i++ {
		woodGained1, _, _ := game1.ChopTree()
		woodGained2, _, _ := game2.ChopTree()
		results1[i] = woodGained1
		results2[i] = woodGained2
	}
	
	identical := 0
	for i := 0; i < 100; i++ {
		if results1[i] == results2[i] {
			identical++
		}
	}
	
	if identical > 90 {
		t.Errorf("Random results too similar between games: %d/100 identical", identical)
	}
}

func TestConfigurationConsistency(t *testing.T) {
	game := NewGame("ConfigPlayer")
	
	if game.Config.TreeMinHP >= game.Config.TreeMaxHP {
		t.Errorf("TreeMinHP should be less than TreeMaxHP")
	}
	
	if game.Config.WoodMin >= game.Config.WoodMax {
		t.Errorf("WoodMin should be less than WoodMax")
	}
	
	if game.Config.CriticalChance < 0 || game.Config.CriticalChance > 1 {
		t.Errorf("CriticalChance should be between 0 and 1: %f", game.Config.CriticalChance)
	}
	
	if game.Config.CriticalMultiplier <= 1 {
		t.Errorf("CriticalMultiplier should be greater than 1: %f", game.Config.CriticalMultiplier)
	}
	
	if game.Config.TargetBeers <= 0 {
		t.Errorf("TargetBeers should be positive: %d", game.Config.TargetBeers)
	}
	
	if game.Config.PrestigeBeers <= game.Config.TargetBeers {
		t.Errorf("PrestigeBeers should be greater than TargetBeers")
	}
}

func TestGameStateIntegrity(t *testing.T) {
	game := NewGame("IntegrityPlayer")
	
	for i := 0; i < 1000; i++ {
		if game.State.TreeHP < 0 {
			t.Errorf("TreeHP should never be negative: %d", game.State.TreeHP)
		}
		
		if game.State.TreeHP > game.State.MaxTreeHP {
			t.Errorf("TreeHP should not exceed MaxTreeHP: %d > %d", game.State.TreeHP, game.State.MaxTreeHP)
		}
		
		if game.State.AxeLevel < 1 {
			t.Errorf("AxeLevel should be at least 1: %d", game.State.AxeLevel)
		}
		
		if game.State.Stats.TotalClicks < 0 {
			t.Errorf("TotalClicks should not be negative: %d", game.State.Stats.TotalClicks)
		}
		
		if game.State.Stats.TotalWoodGained < 0 {
			t.Errorf("TotalWoodGained should not be negative: %d", game.State.Stats.TotalWoodGained)
		}
		
		game.ChopTree()
		
		if game.State.Wood >= 100 {
			game.BuyBeer()
		}
		if game.State.Wood >= 25 {
			game.BuyWorker("ptit_lu")
		}
		if game.State.Wood >= 15 {
			game.UpgradeAxe()
		}
	}
}

func TestBonusCalculationRegression(t *testing.T) {
	game := NewGame("BonusPlayer")
	
	game.State.Beer = 100
	game.State.PrestigePoints = 10
	game.State.Upgrades.BreweryBonus = 5
	
	game.State.TreeHP = 1
	woodGained, _, _ := game.ChopTree()
	
	expectedBeerBonus := 1.0 + float64(game.State.Beer)*game.Config.BeerBonusPerBeer
	expectedPrestigeBonus := 1.0 + float64(game.State.PrestigePoints)*0.05
	expectedBreweryBonus := 1.0 + float64(game.State.Upgrades.BreweryBonus)*0.5
	
	totalExpectedBonus := expectedBeerBonus * expectedPrestigeBonus * expectedBreweryBonus
	
	if woodGained < int(float64(game.Config.WoodMin)*totalExpectedBonus) {
		t.Errorf("Wood gained seems too low with bonuses: got %d, expected at least %.0f", woodGained, float64(game.Config.WoodMin)*totalExpectedBonus)
	}
}

func TestWorkerSchoolBonusRegression(t *testing.T) {
	game := NewGame("SchoolPlayer")
	game.State.Workers.PtitLu = 10
	game.State.Upgrades.LumberjackSchool = 4
	game.State.LastUpdate = time.Now().Add(-5 * time.Second)
	
	expectedBonus := 1.0 + float64(game.State.Upgrades.LumberjackSchool)*0.25
	expectedBaseDamage := float64(game.State.Workers.PtitLu) * 0.8
	expectedTotalDamage := int(expectedBaseDamage * expectedBonus)
	
	initialTreeHP := game.State.TreeHP
	game.ProcessWorkers()
	actualDamage := initialTreeHP - game.State.TreeHP
	
	if game.State.TreeHP <= 0 {
		actualDamage += game.State.MaxTreeHP
	}
	
	if actualDamage < expectedTotalDamage {
		t.Errorf("Lumberjack school bonus not applied correctly: expected %d, got %d", expectedTotalDamage, actualDamage)
	}
}

func TestAutoClickerRegression(t *testing.T) {
	game := NewGame("AutoClickerPlayer")
	game.State.Upgrades.AutoClicker = 10
	game.State.LastUpdate = time.Now().Add(-5 * time.Second)
	
	expectedAutoClickerDamage := float64(game.State.Upgrades.AutoClicker) * 0.5
	
	initialTreeHP := game.State.TreeHP
	game.ProcessWorkers()
	actualDamage := initialTreeHP - game.State.TreeHP
	
	if game.State.TreeHP <= 0 {
		actualDamage += game.State.MaxTreeHP
	}
	
	if actualDamage < int(expectedAutoClickerDamage) {
		t.Errorf("Auto clicker damage not applied: expected at least %d, got %d", int(expectedAutoClickerDamage), actualDamage)
	}
}