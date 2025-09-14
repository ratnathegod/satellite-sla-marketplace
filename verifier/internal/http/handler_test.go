package http

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		expectedStatus int
		expectedBody   *HealthResponse
	}{
		{
			name:           "GET request returns 200 OK",
			method:         http.MethodGet,
			expectedStatus: http.StatusOK,
			expectedBody: &HealthResponse{
				Status:  "ok",
				Message: "Verifier service is healthy",
			},
		},
		{
			name:           "POST request returns 405 Method Not Allowed",
			method:         http.MethodPost,
			expectedStatus: http.StatusMethodNotAllowed,
			expectedBody:   nil,
		},
		{
			name:           "PUT request returns 405 Method Not Allowed",
			method:         http.MethodPut,
			expectedStatus: http.StatusMethodNotAllowed,
			expectedBody:   nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/healthz", nil)
			w := httptest.NewRecorder()

			HealthHandler(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if tt.expectedBody != nil {
				var response HealthResponse
				if err := json.NewDecoder(w.Body).Decode(&response); err != nil {
					t.Fatalf("Failed to decode response: %v", err)
				}

				if response.Status != tt.expectedBody.Status {
					t.Errorf("Expected status %s, got %s", tt.expectedBody.Status, response.Status)
				}

				if response.Message != tt.expectedBody.Message {
					t.Errorf("Expected message %s, got %s", tt.expectedBody.Message, response.Message)
				}

				contentType := w.Header().Get("Content-Type")
				if contentType != "application/json" {
					t.Errorf("Expected Content-Type application/json, got %s", contentType)
				}
			}
		})
	}
}