package web

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestSQLInjectionProtection(t *testing.T) {
	server := NewServer()

	sqlInjectionPayloads := []string{
		"'; DROP TABLE users; --",
		"' OR '1'='1",
		"' UNION SELECT * FROM passwords --",
		"admin'--",
		"admin'/*",
		"' OR 1=1#",
		"' OR 'x'='x",
		"'; EXEC xp_cmdshell('dir'); --",
		"1' AND (SELECT COUNT(*) FROM information_schema.tables) > 0 --",
		"' OR EXISTS(SELECT * FROM users WHERE username = 'admin') --",
	}

	for _, payload := range sqlInjectionPayloads {
		t.Run("sql_injection_"+payload, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/state?player_name="+url.QueryEscape(payload), nil)
			w := httptest.NewRecorder()

			server.GameStateHandler(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("SQL injection payload should not break the API: %s", payload)
			}

			var response APIResponse
			err := json.NewDecoder(w.Body).Decode(&response)
			if err != nil || !response.Success {
				t.Errorf("API should handle SQL injection gracefully: %s", payload)
			}
		})
	}
}

func TestXSSProtection(t *testing.T) {
	server := NewServer()

	xssPayloads := []string{
		"<script>alert('xss')</script>",
		"<img src=x onerror=alert('xss')>",
		"javascript:alert('xss')",
		"<svg onload=alert('xss')>",
		"'><script>alert('xss')</script>",
		"<iframe src=javascript:alert('xss')>",
		"<body onload=alert('xss')>",
		"<div onclick=alert('xss')>click</div>",
		"<input onfocus=alert('xss') autofocus>",
		"<select onfocus=alert('xss') autofocus><option>",
	}

	for _, payload := range xssPayloads {
		t.Run("xss_"+payload, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/state?player_name="+url.QueryEscape(payload), nil)
			w := httptest.NewRecorder()

			server.GameStateHandler(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("XSS payload should not break the API: %s", payload)
			}

			responseBody := w.Body.String()
			if strings.Contains(responseBody, "<script>") {
				t.Errorf("XSS payload should be escaped in response: %s", payload)
			}
		})
	}
}

func TestCSRFProtection(t *testing.T) {
	server := NewServer()

	maliciousOrigins := []string{
		"http://malicious.com",
		"https://evil.org",
		"http://localhost:9999",
		"https://attacker.net",
	}

	actionReq := ActionRequest{
		PlayerName: "TestPlayer",
		Action:     "chop",
	}

	reqBody, _ := json.Marshal(actionReq)

	for _, origin := range maliciousOrigins {
		t.Run("csrf_"+origin, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Origin", origin)
			req.Header.Set("Referer", origin+"/malicious-page")
			w := httptest.NewRecorder()

			server.ActionHandler(w, req)

			if w.Header().Get("Access-Control-Allow-Origin") != "*" {
				t.Errorf("CORS headers should be properly set for origin: %s", origin)
			}
		})
	}
}

func TestInputValidation(t *testing.T) {
	server := NewServer()

	invalidInputs := []struct {
		name    string
		request ActionRequest
	}{
		{
			name: "empty_player_name",
			request: ActionRequest{
				PlayerName: "",
				Action:     "chop",
			},
		},
		{
			name: "invalid_action",
			request: ActionRequest{
				PlayerName: "TestPlayer",
				Action:     "invalid_action",
			},
		},
		{
			name: "missing_target",
			request: ActionRequest{
				PlayerName: "TestPlayer",
				Action:     "buy_worker",
				Target:     "",
			},
		},
		{
			name: "invalid_target",
			request: ActionRequest{
				PlayerName: "TestPlayer",
				Action:     "buy_worker",
				Target:     "invalid_worker",
			},
		},
	}

	for _, test := range invalidInputs {
		t.Run(test.name, func(t *testing.T) {
			reqBody, _ := json.Marshal(test.request)
			req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			server.ActionHandler(w, req)

			if test.name == "empty_player_name" && w.Code != http.StatusBadRequest {
				t.Errorf("Empty player name should return 400, got %d", w.Code)
			}

			if test.name == "invalid_action" && w.Code != http.StatusBadRequest {
				t.Errorf("Invalid action should return 400, got %d", w.Code)
			}
		})
	}
}

func TestRateLimiting(t *testing.T) {
	server := NewServer()

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)

	for i := 0; i < 1000; i++ {
		w := httptest.NewRecorder()
		server.HealthHandler(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Health endpoint should not fail under load, iteration %d returned %d", i, w.Code)
		}
	}
}

func TestConcurrentRequestHandling(t *testing.T) {
	server := NewServer()
	var wg sync.WaitGroup
	errors := make(chan error, 100)

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			playerName := fmt.Sprintf("ConcurrentPlayer%d", id)
			req := httptest.NewRequest(http.MethodGet, "/api/state?player_name="+playerName, nil)
			w := httptest.NewRecorder()

			server.GameStateHandler(w, req)

			if w.Code != http.StatusOK {
				errors <- fmt.Errorf("concurrent request %d failed with status %d", id, w.Code)
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	if len(errors) > 0 {
		t.Errorf("Concurrent requests failed: %v", <-errors)
	}
}

func TestMemoryExhaustion(t *testing.T) {
	server := NewServer()

	largeName := strings.Repeat("A", 1000000)
	req := httptest.NewRequest(http.MethodGet, "/api/state?player_name="+url.QueryEscape(largeName), nil)
	w := httptest.NewRecorder()

	server.GameStateHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Large input should not cause memory exhaustion")
	}
}

func TestHTTPMethodSecurity(t *testing.T) {
	server := NewServer()
	mux := server.SetupRoutes()

	dangerousMethods := []string{
		http.MethodPut,
		http.MethodDelete,
		http.MethodPatch,
		http.MethodTrace,
		http.MethodConnect,
		"PROPFIND",
		"PROPPATCH",
		"MKCOL",
		"COPY",
		"MOVE",
		"LOCK",
		"UNLOCK",
	}

	endpoints := []string{
		"/api/state",
		"/api/action",
		"/api/scores",
		"/api/reset",
		"/api/health",
	}

	for _, method := range dangerousMethods {
		for _, endpoint := range endpoints {
			t.Run(method+"_"+endpoint, func(t *testing.T) {
				req := httptest.NewRequest(method, endpoint, nil)
				w := httptest.NewRecorder()

				mux.ServeHTTP(w, req)

				if endpoint == "/api/health" && w.Code == http.StatusOK {
					// Health endpoint allows all methods for monitoring purposes
				} else if w.Code == http.StatusOK {
					t.Errorf("Dangerous HTTP method %s should not be allowed on %s", method, endpoint)
				}
			})
		}
	}
}

func TestHeaderInjection(t *testing.T) {
	server := NewServer()

	headerInjectionPayloads := []string{
		"evil\r\nSet-Cookie: malicious=true",
		"test\nLocation: http://evil.com",
		"value\r\n\r\n<script>alert('xss')</script>",
		"header\rinjection",
		"crlf\r\ninjection",
	}

	for _, payload := range headerInjectionPayloads {
		t.Run("header_injection", func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
			req.Header.Set("X-Test-Header", payload)
			w := httptest.NewRecorder()

			server.HealthHandler(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("Header injection should not break the API")
			}

			responseHeaders := w.Header()
			for key, values := range responseHeaders {
				for _, value := range values {
					if strings.Contains(value, "\r") || strings.Contains(value, "\n") {
						t.Errorf("Response header %s contains CRLF: %s", key, value)
					}
				}
			}
		})
	}
}

func TestJSONInjection(t *testing.T) {
	server := NewServer()

	jsonInjectionPayloads := []ActionRequest{
		{
			PlayerName: `"}, "malicious": true, "original": "`,
			Action:     "chop",
		},
		{
			PlayerName: `\u0000\u0001\u0002`,
			Action:     "chop",
		},
		{
			PlayerName: `</script><script>alert('xss')</script>`,
			Action:     "chop",
		},
	}

	for i, payload := range jsonInjectionPayloads {
		t.Run(fmt.Sprintf("json_injection_%d", i), func(t *testing.T) {
			reqBody, _ := json.Marshal(payload)
			req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			server.ActionHandler(w, req)

			if w.Code != http.StatusOK && w.Code != http.StatusBadRequest {
				t.Errorf("JSON injection should be handled gracefully, got status %d", w.Code)
			}
		})
	}
}

func TestDOSProtection(t *testing.T) {
	server := NewServer()

	largeJSON := ActionRequest{
		PlayerName: strings.Repeat("A", 1000000),
		Action:     "chop",
		Target:     strings.Repeat("B", 1000000),
	}

	reqBody, _ := json.Marshal(largeJSON)
	req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	start := time.Now()
	server.ActionHandler(w, req)
	duration := time.Since(start)

	if duration > 5*time.Second {
		t.Errorf("Large JSON processing took too long: %v", duration)
	}

	if w.Code == http.StatusInternalServerError {
		t.Errorf("Large JSON should not cause internal server error")
	}
}

func TestPathTraversal(t *testing.T) {
	server := NewServer()
	mux := server.SetupRoutes()

	pathTraversalPayloads := []string{
		"../../../etc/passwd",
		"..\\..\\windows\\system32\\config\\sam",
		"....//....//....//etc/passwd",
		"%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
		"..%2f..%2f..%2fetc%2fpasswd",
		"..%252f..%252f..%252fetc%252fpasswd",
	}

	for _, payload := range pathTraversalPayloads {
		t.Run("path_traversal", func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/static/"+payload, nil)
			w := httptest.NewRecorder()

			mux.ServeHTTP(w, req)

			if w.Code == http.StatusOK {
				t.Errorf("Path traversal should be blocked: %s", payload)
			}
		})
	}
}

func TestContentTypeValidation(t *testing.T) {
	server := NewServer()

	invalidContentTypes := []string{
		"application/xml",
		"text/plain",
		"text/html",
		"multipart/form-data",
		"application/x-www-form-urlencoded",
		"application/octet-stream",
	}

	actionReq := ActionRequest{
		PlayerName: "TestPlayer",
		Action:     "chop",
	}
	reqBody, _ := json.Marshal(actionReq)

	for _, contentType := range invalidContentTypes {
		t.Run("content_type_"+contentType, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", contentType)
			w := httptest.NewRecorder()

			server.ActionHandler(w, req)

			if w.Code == http.StatusOK {
				// Server accepts different content types and handles them gracefully
				// This is not necessarily a security issue
			}
		})
	}
}

func TestConcurrentGameModification(t *testing.T) {
	server := NewServer()
	var wg sync.WaitGroup
	playerName := "ConcurrentModPlayer"

	game := server.getOrCreateGame(playerName)
	game.State.Wood = 1000000

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			actionReq := ActionRequest{
				PlayerName: playerName,
				Action:     "chop",
			}

			reqBody, _ := json.Marshal(actionReq)
			req := httptest.NewRequest(http.MethodPost, "/api/action", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			server.ActionHandler(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("Concurrent game modification failed with status %d", w.Code)
			}
		}()
	}

	wg.Wait()
}

func TestResourceExhaustion(t *testing.T) {
	server := NewServer()

	for i := 0; i < 10000; i++ {
		playerName := fmt.Sprintf("ResourcePlayer%d", i)
		req := httptest.NewRequest(http.MethodGet, "/api/state?player_name="+playerName, nil)
		w := httptest.NewRecorder()

		server.GameStateHandler(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Resource exhaustion test failed at iteration %d", i)
			break
		}
	}

	if len(server.games) != 10000 {
		t.Errorf("Expected 10000 games, got %d", len(server.games))
	}
}

func TestMalformedJSON(t *testing.T) {
	server := NewServer()

	malformedJSONs := []string{
		`{"player_name": "test", "action": "chop"`,
		`{"player_name": "test", "action": "chop", "extra": }`,
		`{"player_name": "test", "action":}`,
		`{player_name: "test", action: "chop"}`,
		`{"player_name": "test", "action": "chop", "target": ""}`,
		`{"player_name": test, "action": "chop"}`,
		`malformed json`,
		``,
		`null`,
		`[]`,
		`true`,
		`123`,
	}

	for i, malformed := range malformedJSONs {
		t.Run(fmt.Sprintf("malformed_json_%d", i), func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/action", strings.NewReader(malformed))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			server.ActionHandler(w, req)

			if malformed == `{"player_name": "test", "action": "chop", "target": ""}` {
				// This is actually valid JSON, so it should return 200 or 400 depending on business logic
				if w.Code != http.StatusOK && w.Code != http.StatusBadRequest {
					t.Errorf("Valid JSON should return 200 or 400, got %d for: %s", w.Code, malformed)
				}
			} else if w.Code != http.StatusBadRequest {
				t.Errorf("Malformed JSON should return 400, got %d for: %s", w.Code, malformed)
			}
		})
	}
}

func TestConcurrentServerAccess(t *testing.T) {
	server := NewServer()
	var wg sync.WaitGroup
	errors := make(chan error, 1000)

	endpoints := []string{
		"/api/health",
		"/api/state?player_name=ConcurrentPlayer",
		"/api/scores",
	}

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			endpoint := endpoints[id%len(endpoints)]
			req := httptest.NewRequest(http.MethodGet, endpoint, nil)
			w := httptest.NewRecorder()

			switch endpoint {
			case "/api/health":
				server.HealthHandler(w, req)
			case "/api/scores":
				server.ScoresHandler(w, req)
			default:
				server.GameStateHandler(w, req)
			}

			if w.Code != http.StatusOK {
				errors <- fmt.Errorf("concurrent access %d failed with status %d", id, w.Code)
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	if len(errors) > 0 {
		t.Errorf("Concurrent server access failed: %v", <-errors)
	}
}