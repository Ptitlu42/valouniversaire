package web

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"sync"
	"time"
	"valouniversaire/internal/game"
)

type Server struct {
	games    map[string]*game.Game
	gamesMux sync.RWMutex
	tmpl     *template.Template
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type GameStateResponse struct {
	*game.GameState
	Prices        map[string]int `json:"prices"`
	CanPrestige   bool           `json:"can_prestige"`
	IsGameWon     bool           `json:"is_game_won"`
	GameDuration  string         `json:"game_duration"`
}

type ActionRequest struct {
	PlayerName string `json:"player_name"`
	Action     string `json:"action"`
	Target     string `json:"target,omitempty"`
}

func NewServer() *Server {
	tmpl, err := template.ParseGlob("templates/*.html")
	if err != nil {
		log.Printf("Template parsing error: %v", err)
	}
	
	return &Server{
		games: make(map[string]*game.Game),
		tmpl:  tmpl,
	}
}

func (s *Server) getOrCreateGame(playerName string) *game.Game {
	s.gamesMux.Lock()
	defer s.gamesMux.Unlock()
	
	if g, exists := s.games[playerName]; exists {
		return g
	}
	
	g := game.NewGame(playerName)
	s.games[playerName] = g
	return g
}

func (s *Server) HomeHandler(w http.ResponseWriter, r *http.Request) {
	if s.tmpl == nil {
		w.Header().Set("Content-Type", "text/html")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("<html><body><h1>Valouniversaire Game</h1><p>Template not available in test mode</p></body></html>"))
		return
	}
	
	err := s.tmpl.ExecuteTemplate(w, "index.html", nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Server) GameStateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	playerName := r.URL.Query().Get("player_name")
	if playerName == "" {
		s.sendError(w, "Player name is required", http.StatusBadRequest)
		return
	}
	
	g := s.getOrCreateGame(playerName)
	
	g.ProcessWorkers()
	
	response := GameStateResponse{
		GameState:    g.State,
		Prices:       g.GetPrices(),
		CanPrestige:  g.CanPrestige(),
		IsGameWon:    g.IsGameWon(),
		GameDuration: formatDuration(g.GetGameDuration()),
	}
	
	s.sendSuccess(w, response)
}

func (s *Server) ActionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req ActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.sendError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	
	if req.PlayerName == "" {
		s.sendError(w, "Player name is required", http.StatusBadRequest)
		return
	}
	
	g := s.getOrCreateGame(req.PlayerName)
	
	var result interface{}
	var err error
	
	switch req.Action {
	case "chop":
		var woodGained int
		var isCritical bool
		woodGained, isCritical, err = g.ChopTree()
		result = map[string]interface{}{
			"wood_gained": woodGained,
			"is_critical": isCritical,
		}
		
	case "upgrade_axe":
		err = g.UpgradeAxe()
		result = "Axe upgraded successfully"
		
	case "buy_worker":
		if req.Target == "" {
			s.sendError(w, "Worker type is required", http.StatusBadRequest)
			return
		}
		err = g.BuyWorker(req.Target)
		result = fmt.Sprintf("Worker %s hired successfully", req.Target)
		
	case "buy_upgrade":
		if req.Target == "" {
			s.sendError(w, "Upgrade type is required", http.StatusBadRequest)
			return
		}
		err = g.BuyUpgrade(req.Target)
		result = fmt.Sprintf("Upgrade %s purchased successfully", req.Target)
		
	case "buy_beer":
		err = g.BuyBeer()
		result = "Beer purchased successfully"
		
	case "prestige":
		err = g.Prestige()
		result = "Prestige activated successfully"
		
	default:
		s.sendError(w, "Unknown action: "+req.Action, http.StatusBadRequest)
		return
	}
	
	if err != nil {
		s.sendError(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	response := GameStateResponse{
		GameState:    g.State,
		Prices:       g.GetPrices(),
		CanPrestige:  g.CanPrestige(),
		IsGameWon:    g.IsGameWon(),
		GameDuration: formatDuration(g.GetGameDuration()),
	}
	
	s.sendSuccess(w, map[string]interface{}{
		"action_result": result,
		"game_state":    response,
	})
}

func (s *Server) ScoresHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		s.sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	s.gamesMux.RLock()
	defer s.gamesMux.RUnlock()
	
	type ScoreEntry struct {
		PlayerName     string        `json:"player_name"`
		Beer           int           `json:"beer"`
		PrestigePoints int           `json:"prestige_points"`
		GameDuration   string        `json:"game_duration"`
		IsGameWon      bool          `json:"is_game_won"`
		TotalWood      int           `json:"total_wood"`
		TotalClicks    int           `json:"total_clicks"`
	}
	
	var scores []ScoreEntry
	for _, g := range s.games {
		scores = append(scores, ScoreEntry{
			PlayerName:     g.State.PlayerName,
			Beer:           g.State.Beer,
			PrestigePoints: g.State.PrestigePoints,
			GameDuration:   formatDuration(g.GetGameDuration()),
			IsGameWon:      g.IsGameWon(),
			TotalWood:      g.State.Stats.TotalWoodGained,
			TotalClicks:    g.State.Stats.TotalClicks,
		})
	}
	
	s.sendSuccess(w, scores)
}

func (s *Server) ResetGameHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	playerName := r.URL.Query().Get("player_name")
	if playerName == "" {
		s.sendError(w, "Player name is required", http.StatusBadRequest)
		return
	}
	
	s.gamesMux.Lock()
	delete(s.games, playerName)
	s.gamesMux.Unlock()
	
	g := s.getOrCreateGame(playerName)
	
	response := GameStateResponse{
		GameState:    g.State,
		Prices:       g.GetPrices(),
		CanPrestige:  g.CanPrestige(),
		IsGameWon:    g.IsGameWon(),
		GameDuration: formatDuration(g.GetGameDuration()),
	}
	
	s.sendSuccess(w, response)
}

func (s *Server) HealthHandler(w http.ResponseWriter, r *http.Request) {
	s.sendSuccess(w, map[string]interface{}{
		"status":      "ok",
		"timestamp":   time.Now(),
		"active_games": len(s.games),
	})
}

func (s *Server) sendSuccess(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	
	response := APIResponse{
		Success: true,
		Data:    data,
	}
	
	json.NewEncoder(w).Encode(response)
}

func (s *Server) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.WriteHeader(statusCode)
	
	response := APIResponse{
		Success: false,
		Error:   message,
	}
	
	json.NewEncoder(w).Encode(response)
}

func (s *Server) CORSHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}

func formatDuration(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60
	
	if hours > 0 {
		return fmt.Sprintf("%dh %dm %ds", hours, minutes, seconds)
	} else if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	} else {
		return fmt.Sprintf("%ds", seconds)
	}
}

func (s *Server) DebugHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tmpl, err := template.ParseFiles("templates/debug.html")
	if err != nil {
		log.Printf("Debug template error: %v", err)
		http.Error(w, "Template error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	
	data := map[string]interface{}{
		"Title": "Valouniversaire - Debug Mode",
		"ServerTime": time.Now().Format("2006-01-02 15:04:05"),
		"ActiveGames": len(s.games),
	}
	
	if err := tmpl.Execute(w, data); err != nil {
		log.Printf("Debug template execution error: %v", err)
		http.Error(w, "Template execution error", http.StatusInternalServerError)
	}
}

func (s *Server) SetupRoutes() *http.ServeMux {
	mux := http.NewServeMux()
	
	mux.Handle("/", s.CORSHandler(http.HandlerFunc(s.HomeHandler)))
	mux.Handle("/debug", s.CORSHandler(http.HandlerFunc(s.DebugHandler)))
	mux.Handle("/api/state", s.CORSHandler(http.HandlerFunc(s.GameStateHandler)))
	mux.Handle("/api/action", s.CORSHandler(http.HandlerFunc(s.ActionHandler)))
	mux.Handle("/api/scores", s.CORSHandler(http.HandlerFunc(s.ScoresHandler)))
	mux.Handle("/api/reset", s.CORSHandler(http.HandlerFunc(s.ResetGameHandler)))
	mux.Handle("/api/health", s.CORSHandler(http.HandlerFunc(s.HealthHandler)))
	
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static/"))))
	
	return mux
}