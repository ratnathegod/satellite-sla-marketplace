package http

import (
	"encoding/json"
	"net/http"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// HealthHandler handles health check requests
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	response := HealthResponse{
		Status:  "ok",
		Message: "Verifier service is healthy",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

// VerifyRequest represents the request payload for proof verification
type VerifyRequest struct {
	ArtifactCid  string `json:"artifactCid"`
	ManifestCid  string `json:"manifestCid"`
	ArtifactHash string `json:"artifactHash"`
	ManifestHash string `json:"manifestHash"`
	TaskID       string `json:"taskId"`
}

// VerifyResponse represents the verification result
type VerifyResponse struct {
	Valid         bool   `json:"valid"`
	AttestationID string `json:"attestationId"`
}

// VerifyProofHandler handles proof verification requests (stubbed MVP)
func VerifyProofHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req VerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	// MVP: always valid, deterministic pseudo attestation id
	att := pseudoAttestation(req.ArtifactHash, req.ManifestHash)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(VerifyResponse{ Valid: true, AttestationID: att })
}

// Simple deterministic hex-like "attestation id"
func pseudoAttestation(a, b string) string {
	if a == "" && b == "" { return "0x" + repeat("0", 64) }
	s := 0
	for _, c := range a + b { s = (s*33 + int(c)) & 0xFFFFFFFF }
	hex := "0x"
	const chars = "0123456789abcdef"
	for i := 0; i < 64; i++ { hex += string(chars[(s+i)&0xF]) }
	return hex
}

func repeat(ch string, n int) string { out := ""; for i:=0;i<n;i++{ out += ch }; return out }