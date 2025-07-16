package game

import (
	"math"
	"sync"
	"testing"
	"time"
)

func TestConcurrentGameAccess(t *testing.T) {
	game := NewGame("ConcurrentPlayer")
	var wg sync.WaitGroup
	errors := make(chan error, 1000)
	
	operations := []func() error{
		func() error { _, _, err := game.ChopTree(); return err },
		func() error { return game.UpgradeAxe() },
		func() error { return game.BuyWorker("ptit_lu") },
		func() error { return game.BuyUpgrade("auto_clicker") },
		func() error { return game.BuyBeer() },
		func() error { game.ProcessWorkers(); return nil },
		func() error { _ = game.GetPrices(); return nil },
		func() error { _ = game.GetGameDuration(); return nil },
		func() error { _ = game.CanPrestige(); return nil },
		func() error { _ = game.IsGameWon(); return nil },
	}
	
	game.State.Wood = 1000000
	
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < 10; j++ {
				op := operations[j%len(operations)]
				if err := op(); err != nil && err.Error() != "not enough wood: need 15, have 0" {
					select {
					case errors <- err:
					default:
					}
				}
			}
		}(i)
	}
	
	wg.Wait()
	close(errors)
	
	if len(errors) > 0 {
		t.Errorf("Concurrent operations failed with error: %v", <-errors)
	}
}

func TestMassiveTreeChopping(t *testing.T) {
	game := NewGame("MassiveChopPlayer")
	
	for i := 0; i < 10000; i++ {
		_, _, err := game.ChopTree()
		if err != nil {
			t.Errorf("Tree chopping failed at iteration %d: %v", i, err)
			break
		}
	}
	
	if game.State.Stats.TotalClicks != 10000 {
		t.Errorf("Expected 10000 clicks, got %d", game.State.Stats.TotalClicks)
	}
}

func TestExtremeWorkerNumbers(t *testing.T) {
	game := NewGame("ExtremeWorkerPlayer")
	game.State.Wood = 100000000 // Large but reasonable amount
	
	targetWorkers := 50 // More reasonable target
	for i := 0; i < targetWorkers; i++ {
		err := game.BuyWorker("ptit_lu")
		if err != nil {
			break // Stop if we run out of wood
		}
	}
	
	game.State.LastUpdate = time.Now().Add(-5 * time.Second)
	game.ProcessWorkers()
	
	if game.State.Workers.PtitLu < 1 {
		t.Errorf("Should have bought at least 1 PtitLu worker, got %d", game.State.Workers.PtitLu)
	}
}

func TestExtremeUpgradeLevels(t *testing.T) {
	game := NewGame("ExtremeUpgradePlayer")
	game.State.Wood = math.MaxInt32
	
	for i := 0; i < 100; i++ {
		game.BuyUpgrade("auto_clicker")
		game.BuyUpgrade("lumberjack_school")
		game.BuyUpgrade("brewery_bonus")
		game.BuyUpgrade("golden_axe")
	}
	
	if game.State.Upgrades.AutoClicker != 100 {
		t.Errorf("Expected 100 auto clicker upgrades, got %d", game.State.Upgrades.AutoClicker)
	}
}

func TestExtremeAxeUpgrades(t *testing.T) {
	game := NewGame("ExtremeAxePlayer")
	game.State.Wood = math.MaxInt32
	
	for i := 0; i < 1000; i++ {
		err := game.UpgradeAxe()
		if err != nil {
			t.Errorf("Axe upgrade failed at level %d: %v", i, err)
			break
		}
	}
	
	if game.State.AxeLevel != 1001 {
		t.Errorf("Expected axe level 1001, got %d", game.State.AxeLevel)
	}
}

func TestMassiveBeerPurchasing(t *testing.T) {
	game := NewGame("MassiveBeerPlayer")
	game.State.Wood = math.MaxInt32
	
	for i := 0; i < 1000; i++ {
		err := game.BuyBeer()
		if err != nil {
			t.Errorf("Beer purchase failed at beer %d: %v", i, err)
			break
		}
	}
	
	if game.State.Beer != 1000 {
		t.Errorf("Expected 1000 beers, got %d", game.State.Beer)
	}
}

func TestMultiplePrestigeOperations(t *testing.T) {
	game := NewGame("MultiPrestigePlayer")
	
	for i := 0; i < 10; i++ {
		game.State.Beer = 1000
		game.State.Wood = 500
		game.State.AxeLevel = 10
		
		err := game.Prestige()
		if err != nil {
			t.Errorf("Prestige %d failed: %v", i, err)
			break
		}
		
		if game.State.Beer != 0 || game.State.Wood != 0 || game.State.AxeLevel != 1 {
			t.Errorf("Prestige %d didn't reset properly", i)
		}
	}
	
	if game.State.PrestigePoints != 100 {
		t.Errorf("Expected 100 prestige points, got %d", game.State.PrestigePoints)
	}
}

func TestLongRunningGame(t *testing.T) {
	game := NewGame("LongRunningPlayer")
	
	startTime := time.Now()
	
	for time.Since(startTime) < 100*time.Millisecond {
		game.ChopTree()
		game.ProcessWorkers()
		
		if game.State.Wood >= 25 {
			game.BuyWorker("ptit_lu")
		}
		if game.State.Wood >= 15 {
			game.UpgradeAxe()
		}
		if game.State.Wood >= 4 {
			game.BuyBeer()
		}
	}
	
	duration := game.GetGameDuration()
	if duration < 100*time.Millisecond {
		t.Errorf("Game duration seems incorrect: %v", duration)
	}
}

func TestMemoryStress(t *testing.T) {
	games := make([]*Game, 1000)
	
	for i := 0; i < 1000; i++ {
		games[i] = NewGame("MemoryStressPlayer" + string(rune(i)))
		
		for j := 0; j < 100; j++ {
			games[i].ChopTree()
			games[i].ProcessWorkers()
		}
	}
	
	for i := 0; i < 1000; i++ {
		if games[i].State.Stats.TotalClicks != 100 {
			t.Errorf("Game %d should have 100 clicks, got %d", i, games[i].State.Stats.TotalClicks)
		}
	}
}

func TestRaceConditionWorkerProcessing(t *testing.T) {
	game := NewGame("RaceConditionPlayer")
	game.State.Workers.PtitLu = 10
	game.State.Workers.Mathieu = 5
	game.State.Workers.Vico = 2
	
	var wg sync.WaitGroup
	results := make(chan int, 100)
	
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			game.State.LastUpdate = time.Now().Add(-2 * time.Second)
			woodGained := game.ProcessWorkers()
			results <- woodGained
		}()
	}
	
	wg.Wait()
	close(results)
	
	total := 0
	count := 0
	for result := range results {
		total += result
		count++
	}
	
	if count != 100 {
		t.Errorf("Expected 100 results, got %d", count)
	}
}

func TestCriticalHitStress(t *testing.T) {
	game := NewGame("CriticalHitPlayer")
	game.State.Upgrades.GoldenAxe = 10
	
	criticalHits := 0
	totalChops := 10000
	
	for i := 0; i < totalChops; i++ {
		_, isCritical, _ := game.ChopTree()
		if isCritical {
			criticalHits++
		}
	}
	
	expectedRate := game.getCriticalChance()
	actualRate := float64(criticalHits) / float64(totalChops)
	
	tolerance := 0.05
	if math.Abs(actualRate-expectedRate) > tolerance {
		t.Errorf("Critical hit rate %f not within tolerance of expected %f", actualRate, expectedRate)
	}
}

func TestIntegerOverflow(t *testing.T) {
	game := NewGame("OverflowPlayer")
	
	game.State.Wood = math.MaxInt32 - 1000
	game.State.Beer = math.MaxInt32 - 1000
	game.State.PrestigePoints = math.MaxInt32 - 1000
	
	for i := 0; i < 100; i++ {
		game.State.Wood++
		game.State.Beer++
		game.State.PrestigePoints++
		
		if game.State.Wood < 0 || game.State.Beer < 0 || game.State.PrestigePoints < 0 {
			t.Errorf("Integer overflow detected at iteration %d", i)
			break
		}
	}
}

func TestExtremelyLongPlayerNames(t *testing.T) {
	longName := ""
	for i := 0; i < 10000; i++ {
		longName += "a"
	}
	
	game := NewGame(longName)
	
	if game.State.PlayerName != longName {
		t.Errorf("Long player name not preserved correctly")
	}
	
	_, _, err := game.ChopTree()
	if err != nil {
		t.Errorf("Game with long name failed to function: %v", err)
	}
}

func BenchmarkConcurrentGameOperations(b *testing.B) {
	game := NewGame("BenchConcurrentPlayer")
	game.State.Wood = 1000000
	
	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			game.ChopTree()
		}
	})
}

func BenchmarkMassiveWorkerProcessing(b *testing.B) {
	game := NewGame("BenchMassivePlayer")
	game.State.Workers.PtitLu = 1000
	game.State.Workers.Mathieu = 500
	game.State.Workers.Vico = 100
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		game.State.LastUpdate = time.Now().Add(-2 * time.Second)
		game.ProcessWorkers()
	}
}

func BenchmarkComplexGameState(b *testing.B) {
	game := NewGame("BenchComplexPlayer")
	game.State.Wood = 1000000
	game.State.Beer = 500
	game.State.PrestigePoints = 50
	game.State.AxeLevel = 100
	game.State.Workers.PtitLu = 100
	game.State.Workers.Mathieu = 50
	game.State.Workers.Vico = 25
	game.State.Upgrades.AutoClicker = 10
	game.State.Upgrades.LumberjackSchool = 5
	game.State.Upgrades.BreweryBonus = 8
	game.State.Upgrades.GoldenAxe = 3
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		game.ChopTree()
		game.ProcessWorkers()
		prices := game.GetPrices()
		_ = len(prices)
	}
}