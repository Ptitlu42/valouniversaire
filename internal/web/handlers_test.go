package web

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestNewServer(t *testing.T) {
	server := NewServer()
	
	if server.games == nil {
		t.Error("Expected games map to be initialized")
	}
	
	if len(server.games) != 0 {
		t.Error("Expected empty games map")
	}
}

func TestHealthHandler(t *testing.T) {
	server := NewServer()
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()
	
	server.HealthHandler(w, req)
	
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
	
	var response APIResponse
	err := json.NewDecoder(w.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	
	if !response.Success {
		t.Error("Expected success to be true")
	}
	
	data, ok := response.Data.(map[string]interface{})
	if !ok {
		t.Error("Expected data to be a map")
	}
	
	if data["status"] != "ok" {
		t.Error("Expected status to be 'ok'")
	}
}

func TestGameStateHandler(t *testing.T) {
	server := NewServer()
	
	t.Run("missing player name", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/state", nil)
		w := httptest.NewRecorder()
		
		server.GameStateHandler(w, req)
		
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
	
	t.Run("valid request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/state?player_name=TestPlayer", nil)
		w := httptest.NewRecorder()
		
		server.GameStateHandler(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		var response APIResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}
		
		if !response.Success {
			t.Error("Expected success to be true")
		}
		
		data, ok := response.Data.(map[string]interface{})
		if !ok {
			t.Error("Expected data to be a map")
		}
		
		if data["player_name"] != "TestPlayer" {
			t.Error("Expected player name to be 'TestPlayer'")
		}
	})
	
	t.Run("wrong method", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/state?player_name=TestPlayer", nil)
		w := httptest.NewRecorder()
		
		server.GameStateHandler(w, req)
		
		if w.Code != http.StatusMethodNotAllowed {
			t.Errorf("Expected status 405, got %d", w.Code)
		}
	})
}

func TestActionHandler(t *testing.T) {
	server := NewServer()
	
	t.Run("chop action", func(t *testing.T) {
		actionReq := ActionRequest{
			PlayerName: "TestPlayer",
			Action:     "chop",
		}
		
		reqBody, _ := json.Marshal(actionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		var response APIResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}
		
		if !response.Success {
			t.Error("Expected success to be true")
		}
	})
	
	t.Run("upgrade axe action", func(t *testing.T) {
		player := "TestPlayer2"
		g := server.getOrCreateGame(player)
		g.State.Wood = 100
		
		actionReq := ActionRequest{
			PlayerName: player,
			Action:     "upgrade_axe",
		}
		
		reqBody, _ := json.Marshal(actionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		var response APIResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}
		
		if !response.Success {
			t.Error("Expected success to be true")
		}
	})
	
	t.Run("buy worker action", func(t *testing.T) {
		player := "TestPlayer3"
		g := server.getOrCreateGame(player)
		g.State.Wood = 1000
		
		actionReq := ActionRequest{
			PlayerName: player,
			Action:     "buy_worker",
			Target:     "ptit_lu",
		}
		
		reqBody, _ := json.Marshal(actionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		var response APIResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}
		
		if !response.Success {
			t.Error("Expected success to be true")
		}
	})
	
	t.Run("buy upgrade action", func(t *testing.T) {
		player := "TestPlayer4"
		g := server.getOrCreateGame(player)
		g.State.Wood = 1000
		
		actionReq := ActionRequest{
			PlayerName: player,
			Action:     "buy_upgrade",
			Target:     "auto_clicker",
		}
		
		reqBody, _ := json.Marshal(actionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		var response APIResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}
		
		if !response.Success {
			t.Error("Expected success to be true")
		}
	})
	
	t.Run("buy beer action", func(t *testing.T) {
		player := "TestPlayer5"
		g := server.getOrCreateGame(player)
		g.State.Wood = 100
		
		actionReq := ActionRequest{
			PlayerName: player,
			Action:     "buy_beer",
		}
		
		reqBody, _ := json.Marshal(actionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		var response APIResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}
		
		if !response.Success {
			t.Error("Expected success to be true")
		}
	})
	
	t.Run("prestige action", func(t *testing.T) {
		player := "TestPlayer6"
		g := server.getOrCreateGame(player)
		g.State.Beer = 1000
		
		actionReq := ActionRequest{
			PlayerName: player,
			Action:     "prestige",
		}
		
		reqBody, _ := json.Marshal(actionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		var response APIResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}
		
		if !response.Success {
			t.Error("Expected success to be true")
		}
	})
	
	t.Run("invalid action", func(t *testing.T) {
		actionReq := ActionRequest{
			PlayerName: "TestPlayer",
			Action:     "invalid_action",
		}
		
		reqBody, _ := json.Marshal(actionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
	
	t.Run("missing player name", func(t *testing.T) {
		actionReq := ActionRequest{
			Action: "chop",
		}
		
		reqBody, _ := json.Marshal(actionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
	
	t.Run("invalid JSON", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
	
	t.Run("wrong method", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/action", nil)
		w := httptest.NewRecorder()
		
		server.ActionHandler(w, req)
		
		if w.Code != http.StatusMethodNotAllowed {
			t.Errorf("Expected status 405, got %d", w.Code)
		}
	})
}

func TestScoresHandler(t *testing.T) {
	server := NewServer()
	
	server.getOrCreateGame("Player1")
	server.getOrCreateGame("Player2")
	
	req := httptest.NewRequest(http.MethodGet, "/api/scores", nil)
	w := httptest.NewRecorder()
	
	server.ScoresHandler(w, req)
	
	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
	
	var response APIResponse
	err := json.NewDecoder(w.Body).Decode(&response)
	if err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	
	if !response.Success {
		t.Error("Expected success to be true")
	}
	
	scores, ok := response.Data.([]interface{})
	if !ok {
		t.Error("Expected data to be an array")
	}
	
	if len(scores) != 2 {
		t.Errorf("Expected 2 scores, got %d", len(scores))
	}
}

func TestResetGameHandler(t *testing.T) {
	server := NewServer()
	
	g := server.getOrCreateGame("TestPlayer")
	g.State.Wood = 100
	g.State.Beer = 5
	
	t.Run("valid reset", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/reset?player_name=TestPlayer", nil)
		w := httptest.NewRecorder()
		
		server.ResetGameHandler(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		var response APIResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		if err != nil {
			t.Fatalf("Failed to decode response: %v", err)
		}
		
		if !response.Success {
			t.Error("Expected success to be true")
		}
		
		data, ok := response.Data.(map[string]interface{})
		if !ok {
			t.Error("Expected data to be a map")
		}
		
		if data["wood"].(float64) != 0 {
			t.Error("Expected wood to be reset to 0")
		}
		
		if data["beer"].(float64) != 0 {
			t.Error("Expected beer to be reset to 0")
		}
	})
	
	t.Run("missing player name", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/reset", nil)
		w := httptest.NewRecorder()
		
		server.ResetGameHandler(w, req)
		
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d", w.Code)
		}
	})
	
	t.Run("wrong method", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/reset?player_name=TestPlayer", nil)
		w := httptest.NewRecorder()
		
		server.ResetGameHandler(w, req)
		
		if w.Code != http.StatusMethodNotAllowed {
			t.Errorf("Expected status 405, got %d", w.Code)
		}
	})
}

func TestCORSHandler(t *testing.T) {
	server := NewServer()
	handler := server.CORSHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	
	t.Run("OPTIONS request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/", nil)
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		if w.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Error("Expected CORS header to be set")
		}
	})
	
	t.Run("Regular request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}
		
		if w.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Error("Expected CORS header to be set")
		}
	})
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		duration time.Duration
		expected string
	}{
		{30 * time.Second, "30s"},
		{2*time.Minute + 30*time.Second, "2m 30s"},
		{1*time.Hour + 30*time.Minute + 15*time.Second, "1h 30m 15s"},
		{2*time.Hour + 5*time.Second, "2h 0m 5s"},
	}
	
	for _, test := range tests {
		result := formatDuration(test.duration)
		if result != test.expected {
			t.Errorf("Expected %s, got %s for duration %v", test.expected, result, test.duration)
		}
	}
}

func TestGetOrCreateGame(t *testing.T) {
	server := NewServer()
	
	t.Run("create new game", func(t *testing.T) {
		game1 := server.getOrCreateGame("NewPlayer")
		
		if game1 == nil {
			t.Error("Expected game to be created")
		}
		
		if game1.State.PlayerName != "NewPlayer" {
			t.Error("Expected player name to be 'NewPlayer'")
		}
		
		if len(server.games) != 1 {
			t.Errorf("Expected 1 game, got %d", len(server.games))
		}
	})
	
	t.Run("get existing game", func(t *testing.T) {
		game1 := server.getOrCreateGame("ExistingPlayer")
		game1.State.Wood = 50
		
		game2 := server.getOrCreateGame("ExistingPlayer")
		
		if game1 != game2 {
			t.Error("Expected same game instance")
		}
		
		if game2.State.Wood != 50 {
			t.Error("Expected wood to be preserved")
		}
	})
}

func TestSetupRoutes(t *testing.T) {
	server := NewServer()
	mux := server.SetupRoutes()
	
	if mux == nil {
		t.Error("Expected mux to be created")
	}
	
	routes := []string{
		"/",
		"/api/state",
		"/api/action",
		"/api/scores",
		"/api/reset",
		"/api/health",
		"/static/",
	}
	
	for _, route := range routes {
		req := httptest.NewRequest(http.MethodGet, route, nil)
		w := httptest.NewRecorder()
		
		mux.ServeHTTP(w, req)
		
		if route == "/static/" && w.Code == http.StatusNotFound {
			continue
		}
		
		if w.Code == http.StatusNotFound {
			t.Errorf("Route %s not found", route)
		}
	}
}