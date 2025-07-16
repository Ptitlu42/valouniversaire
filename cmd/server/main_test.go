package main

import (
	"os"
	"testing"
)

func TestGetEnv(t *testing.T) {
	tests := []struct {
		name         string
		key          string
		defaultValue string
		envValue     string
		expected     string
	}{
		{
			name:         "environment variable exists",
			key:          "TEST_ENV_VAR",
			defaultValue: "default",
			envValue:     "custom",
			expected:     "custom",
		},
		{
			name:         "environment variable does not exist",
			key:          "NON_EXISTENT_VAR",
			defaultValue: "default",
			envValue:     "",
			expected:     "default",
		},
		{
			name:         "empty environment variable",
			key:          "EMPTY_VAR_DONT_SET",
			defaultValue: "default",
			envValue:     "",
			expected:     "default",
		},
		{
			name:         "environment variable with spaces",
			key:          "SPACE_VAR",
			defaultValue: "default",
			envValue:     "  value  ",
			expected:     "  value  ",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				os.Setenv(tt.key, tt.envValue)
				defer os.Unsetenv(tt.key)
			}

			result := getEnv(tt.key, tt.defaultValue)
			if result != tt.expected {
				t.Errorf("getEnv(%q, %q) = %q, want %q", tt.key, tt.defaultValue, result, tt.expected)
			}
		})
	}
}

func TestGetEnvWithSpecialCharacters(t *testing.T) {
	specialValues := []string{
		"localhost:8080",
		"0.0.0.0",
		"127.0.0.1:3000",
		"https://example.com",
		"tcp://host:port",
		"unix:///var/run/socket",
		"",
		" ",
		"!@#$%^&*()",
		"πé∑∂∆",
	}

	for i, value := range specialValues {
		t.Run("special_value_"+string(rune(i)), func(t *testing.T) {
			key := "SPECIAL_TEST_VAR"
			if value == "" {
				os.Unsetenv(key)
				result := getEnv(key, "default")
				if result != "default" {
					t.Errorf("getEnv with empty value failed: got %q, want %q", result, "default")
				}
			} else {
				os.Setenv(key, value)
				defer os.Unsetenv(key)
				result := getEnv(key, "default")
				if result != value {
					t.Errorf("getEnv with special value failed: got %q, want %q", result, value)
				}
			}
		})
	}
}

func TestGetEnvConcurrency(t *testing.T) {
	done := make(chan bool, 100)
	
	for i := 0; i < 100; i++ {
		go func(id int) {
			key := "CONCURRENT_VAR"
			value := "concurrent_value"
			defaultVal := "default"
			
			os.Setenv(key, value)
			result := getEnv(key, defaultVal)
			
			if result != value && result != defaultVal {
				t.Errorf("Concurrent getEnv failed: got %q", result)
			}
			
			os.Unsetenv(key)
			done <- true
		}(i)
	}
	
	for i := 0; i < 100; i++ {
		<-done
	}
}

func TestConstants(t *testing.T) {
	if defaultPort != "8080" {
		t.Errorf("defaultPort should be '8080', got '%s'", defaultPort)
	}
	
	if defaultHost != "localhost" {
		t.Errorf("defaultHost should be 'localhost', got '%s'", defaultHost)
	}
}

func TestMainConstants(t *testing.T) {
	tests := []struct {
		constant string
		value    string
		name     string
	}{
		{defaultPort, "8080", "defaultPort"},
		{defaultHost, "localhost", "defaultHost"},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.constant != tt.value {
				t.Errorf("constant %s should be %q, got %q", tt.name, tt.value, tt.constant)
			}
		})
	}
}

func BenchmarkGetEnv(b *testing.B) {
	os.Setenv("BENCH_VAR", "bench_value")
	defer os.Unsetenv("BENCH_VAR")
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		getEnv("BENCH_VAR", "default")
	}
}

func BenchmarkGetEnvMissing(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		getEnv("NON_EXISTENT_BENCH_VAR", "default")
	}
}

func TestGetEnvEdgeCases(t *testing.T) {
	edgeCases := []struct {
		name         string
		key          string
		defaultValue string
		envValue     string
		expected     string
	}{
		{
			name:         "very long key",
			key:          "VERY_LONG_ENVIRONMENT_VARIABLE_KEY_THAT_EXCEEDS_NORMAL_LENGTH_LIMITS_AND_CONTINUES_FOR_A_VERY_LONG_TIME",
			defaultValue: "default",
			envValue:     "long_key_value",
			expected:     "long_key_value",
		},
		{
			name:         "very long value",
			key:          "LONG_VALUE_VAR",
			defaultValue: "default",
			envValue:     "this_is_a_very_long_environment_variable_value_that_contains_lots_of_text_and_continues_for_a_very_long_time_to_test_edge_cases",
			expected:     "this_is_a_very_long_environment_variable_value_that_contains_lots_of_text_and_continues_for_a_very_long_time_to_test_edge_cases",
		},
		{
			name:         "numeric value",
			key:          "NUMERIC_VAR",
			defaultValue: "default",
			envValue:     "12345",
			expected:     "12345",
		},
		{
			name:         "boolean-like value",
			key:          "BOOL_VAR",
			defaultValue: "default",
			envValue:     "true",
			expected:     "true",
		},
		{
			name:         "json-like value",
			key:          "JSON_VAR",
			defaultValue: "default",
			envValue:     `{"key":"value","number":123}`,
			expected:     `{"key":"value","number":123}`,
		},
	}

	for _, tt := range edgeCases {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv(tt.key, tt.envValue)
			defer os.Unsetenv(tt.key)

			result := getEnv(tt.key, tt.defaultValue)
			if result != tt.expected {
				t.Errorf("getEnv edge case %s failed: got %q, want %q", tt.name, result, tt.expected)
			}
		})
	}
}