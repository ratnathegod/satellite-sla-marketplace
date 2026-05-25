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
	t.Run("method not allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/verifyProof", nil)
		w := httptest.NewRecorder()
		VerifyProofHandler(w, req)
		if w.Code != http.StatusMethodNotAllowed {
			t.Fatalf("expected 405, got %d", w.Code)
		}
	})

	t.Run("malformed json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/verifyProof", bytes.NewBufferString(`{bad json`))
		w := httptest.NewRecorder()
		VerifyProofHandler(w, req)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})

	t.Run("missing required fields", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/verifyProof", bytes.NewBufferString(`{"taskId":"1"}`))
		w := httptest.NewRecorder()
		VerifyProofHandler(w, req)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})

	t.Run("valid request returns deterministic bytes32 fields", func(t *testing.T) {
		body := bytes.NewBufferString(`{
			"taskId":"1",
			"proofCid":"bafyproof",
			"manifestCid":"bafymanifest",
			"operator":"0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
			"requester":"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
			"proofFileName":"scene.tif",
			"proofFileSize":1234,
			"proofFileType":"image/tiff",
			"createdAt":"2026-05-24T00:00:00.000Z",
			"verifierMode":"deterministic-demo"
		}`)
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
		if !resp.Valid {
			t.Fatalf("unexpected resp: %+v", resp)
		}
		if resp.Mode != verifierMode {
			t.Fatalf("expected mode %s, got %s", verifierMode, resp.Mode)
		}
		assertBytes32(t, "artifactHash", resp.ArtifactHash)
		assertBytes32(t, "manifestHash", resp.ManifestHash)
		assertBytes32(t, "attestationId", resp.AttestationID)
		if resp.ProofHash != resp.ArtifactHash {
			t.Fatalf("proofHash alias mismatch")
		}
		if resp.ResultHash != resp.ManifestHash {
			t.Fatalf("resultHash alias mismatch")
		}
		if resp.AttestationHash != resp.AttestationID {
			t.Fatalf("attestationHash alias mismatch")
		}
	})

	t.Run("same request returns same hashes", func(t *testing.T) {
		payload := `{"taskId":"7","proofCid":"bafyproof","manifestCid":"bafymanifest","proofFileSize":9}`
		first := verifyForTest(t, payload)
		second := verifyForTest(t, payload)
		if first.ArtifactHash != second.ArtifactHash ||
			first.ManifestHash != second.ManifestHash ||
			first.AttestationID != second.AttestationID {
			t.Fatalf("expected deterministic response, got %+v and %+v", first, second)
		}
	})

	t.Run("changed request changes hashes", func(t *testing.T) {
		first := verifyForTest(t, `{"taskId":"7","proofCid":"bafyproof-a","manifestCid":"bafymanifest","proofFileSize":9}`)
		second := verifyForTest(t, `{"taskId":"7","proofCid":"bafyproof-b","manifestCid":"bafymanifest","proofFileSize":9}`)
		if first.ArtifactHash == second.ArtifactHash ||
			first.ManifestHash == second.ManifestHash ||
			first.AttestationID == second.AttestationID {
			t.Fatalf("expected changed request to change hashes, got %+v and %+v", first, second)
		}
	})
}

func verifyForTest(t *testing.T, payload string) VerifyResponse {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/verifyProof", bytes.NewBufferString(payload))
	w := httptest.NewRecorder()
	VerifyProofHandler(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var resp VerifyResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return resp
}

func assertBytes32(t *testing.T, name string, value string) {
	t.Helper()
	if !bytes32Pattern.MatchString(value) {
		t.Fatalf("%s is not bytes32: %s", name, value)
	}
	if value == "0x0000000000000000000000000000000000000000000000000000000000000000" {
		t.Fatalf("%s must be nonzero", name)
	}
}
