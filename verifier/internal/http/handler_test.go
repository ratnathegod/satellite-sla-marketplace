package http

import (
	"bytes"
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

func TestVerifyProofHandler(t *testing.T) {
	// Method not allowed
	t.Run("method not allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/verifyProof", nil)
		w := httptest.NewRecorder()
		VerifyProofHandler(w, req)
		if w.Code != http.StatusMethodNotAllowed {
			t.Fatalf("expected 405, got %d", w.Code)
		}
	})

	// Happy path
	t.Run("happy path", func(t *testing.T) {
		body := bytes.NewBufferString(`{"artifactCid":"QmA","manifestCid":"QmB","artifactHash":"0xabc","manifestHash":"0xdef","taskId":"1"}`)
		req := httptest.NewRequest(http.MethodPost, "/verifyProof", body)
		w := httptest.NewRecorder()
		VerifyProofHandler(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		var resp VerifyResponse
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("decode: %v", err)
		}
		if !resp.Valid || resp.AttestationID == "" {
			t.Fatalf("unexpected resp: %+v", resp)
		}
	})
}