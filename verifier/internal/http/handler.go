package http

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
)

const verifierMode = "deterministic-demo"

var bytes32Pattern = regexp.MustCompile(`^0x[0-9a-fA-F]{64}$`)

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

// VerifyRequest represents the request payload for local demo proof verification.
type VerifyRequest struct {
	TaskID        string `json:"taskId"`
	ProofCid      string `json:"proofCid"`
	ArtifactCid   string `json:"artifactCid,omitempty"` // Backward-compatible alias for proofCid.
	ManifestCid   string `json:"manifestCid"`
	Operator      string `json:"operator,omitempty"`
	Requester     string `json:"requester,omitempty"`
	ProofFileName string `json:"proofFileName,omitempty"`
	ProofFileSize int64  `json:"proofFileSize,omitempty"`
	ProofFileType string `json:"proofFileType,omitempty"`
	CreatedAt     string `json:"createdAt,omitempty"`
	VerifierMode  string `json:"verifierMode,omitempty"`
}

// VerifyResponse represents the deterministic local demo verification result.
type VerifyResponse struct {
	Valid           bool     `json:"valid"`
	Mode            string   `json:"mode"`
	ArtifactHash    string   `json:"artifactHash"`
	ManifestHash    string   `json:"manifestHash"`
	AttestationID   string   `json:"attestationId"`
	ProofHash       string   `json:"proofHash"`
	ResultHash      string   `json:"resultHash"`
	AttestationHash string   `json:"attestationHash"`
	Message         string   `json:"message"`
	Warnings        []string `json:"warnings,omitempty"`
}

// VerifyProofHandler handles local deterministic demo proof verification.
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

	req.ProofCid = strings.TrimSpace(req.ProofCid)
	if req.ProofCid == "" {
		req.ProofCid = strings.TrimSpace(req.ArtifactCid)
	}
	req.ManifestCid = strings.TrimSpace(req.ManifestCid)
	req.TaskID = strings.TrimSpace(req.TaskID)

	if req.TaskID == "" {
		http.Error(w, "taskId is required", http.StatusBadRequest)
		return
	}
	if req.ProofCid == "" {
		http.Error(w, "proofCid is required", http.StatusBadRequest)
		return
	}
	if req.ManifestCid == "" {
		http.Error(w, "manifestCid is required", http.StatusBadRequest)
		return
	}
	if req.ProofFileSize < 0 {
		http.Error(w, "proofFileSize cannot be negative", http.StatusBadRequest)
		return
	}

	canonical := canonicalProofInput(req)
	artifactHash := deterministicBytes32("artifact", canonical)
	manifestHash := deterministicBytes32("manifest", canonical)
	attestationID := deterministicBytes32("attestation", canonical)

	if !isBytes32(artifactHash) || !isBytes32(manifestHash) || !isBytes32(attestationID) {
		http.Error(w, "internal verifier hash error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(VerifyResponse{
		Valid:           true,
		Mode:            verifierMode,
		ArtifactHash:    artifactHash,
		ManifestHash:    manifestHash,
		AttestationID:   attestationID,
		ProofHash:       artifactHash,
		ResultHash:      manifestHash,
		AttestationHash: attestationID,
		Message:         "Deterministic demo verifier accepted the local proof manifest.",
		Warnings: []string{
			"deterministic-demo mode is not real satellite proof verification",
			"only hashes are submitted on-chain; CIDs remain in the local IPFS manifest flow",
		},
	})
}

func canonicalProofInput(req VerifyRequest) string {
	return strings.Join([]string{
		req.TaskID,
		req.ProofCid,
		req.ManifestCid,
		strings.ToLower(req.Operator),
		strings.ToLower(req.Requester),
		req.ProofFileName,
		fmt.Sprintf("%d", req.ProofFileSize),
		req.ProofFileType,
		req.CreatedAt,
		verifierMode,
	}, "|")
}

func deterministicBytes32(label string, input string) string {
	sum := sha256.Sum256([]byte(label + "\x00" + input))
	return "0x" + hex.EncodeToString(sum[:])
}

func isBytes32(value string) bool {
	return bytes32Pattern.MatchString(value) && value != "0x"+strings.Repeat("0", 64)
}
